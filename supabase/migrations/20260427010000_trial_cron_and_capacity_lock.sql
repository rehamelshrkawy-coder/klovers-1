-- ============================================================
-- Trial system: cron job + atomic capacity lock + IP hashing (2026-04-27)
--   1. pg_cron hourly job for send-trial-followups
--   2. book_trial_check_capacity() — pessimistic lock prevents overbooking
--   3. upsert_trial_rate_limit updated to hash identifier (GDPR: no raw IPs)
-- ============================================================

-- ── 1. Hourly pg_cron for send-trial-followups ──────────────────────────────
-- Calls the Edge Function every hour at :05 past.
-- The function itself is idempotent (stage columns act as sent flags).
-- CRON_SECRET is passed so the function's auth guard accepts the call.
-- NOTE: replace <PROJECT_REF> and <CRON_SECRET_VALUE> in CI/CD or set via
-- Supabase Vault and reference it here as vault.decrypted_secrets.
SELECT cron.schedule(
  'trigger-trial-followups',
  '5 * * * *',   -- every hour at :05
  $$
  SELECT net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-trial-followups',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ── 2. Atomic capacity check + insert ──────────────────────────────────────
-- Replaces the naïve INSERT in book-trial with a transaction that:
--   a) counts non-cancelled bookings for the exact (day_of_week, start_time, trial_date)
--   b) if already at capacity, raises an exception (code P0002)
--   c) otherwise inserts and returns the new booking id
--
-- The Edge Function calls this RPC instead of a bare INSERT so concurrent
-- requests can never overbook — the count + insert are inside one txn.
CREATE OR REPLACE FUNCTION public.book_trial_with_capacity_check(
  p_name         text,
  p_email        text,
  p_phone        text,
  p_level        text,
  p_goal         text,
  p_day_of_week  int,
  p_start_time   text,
  p_trial_date   date,
  p_timezone     text,
  p_user_id      uuid DEFAULT NULL
)
RETURNS uuid        -- returns the new booking id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity    int;
  v_booked      int;
  v_booking_id  uuid;
BEGIN
  -- Look up capacity for this slot (lock the row for the duration of the txn)
  SELECT capacity INTO v_capacity
  FROM public.trial_slots
  WHERE day_of_week = p_day_of_week
    AND start_time  = p_start_time
    AND is_active   = true
    AND (lifecycle IS NULL OR lifecycle = 'active')
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'No active slot found for day_of_week=% start_time=%', p_day_of_week, p_start_time
      USING ERRCODE = 'P0001';
  END IF;

  -- Count existing non-cancelled bookings for this specific occurrence
  SELECT COUNT(*) INTO v_booked
  FROM public.trial_bookings
  WHERE day_of_week = p_day_of_week
    AND start_time  = p_start_time
    AND trial_date  = p_trial_date
    AND status NOT IN ('cancelled');

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'Session is full (% / % seats taken)', v_booked, v_capacity
      USING ERRCODE = 'P0002';
  END IF;

  -- Insert the booking
  INSERT INTO public.trial_bookings (
    name, email, phone, level, goal,
    day_of_week, start_time, trial_date, timezone,
    status, confirmed_at, user_id
  ) VALUES (
    p_name, lower(p_email), p_phone, p_level, p_goal,
    p_day_of_week, p_start_time, p_trial_date, p_timezone,
    'confirmed', now(), p_user_id
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_trial_with_capacity_check(
  text, text, text, text, text, int, text, date, text, uuid
) TO service_role;

COMMENT ON FUNCTION public.book_trial_with_capacity_check IS
  'Atomically checks capacity and inserts a trial booking in one transaction. '
  'Raises P0001 if no matching slot exists, P0002 if session is full. '
  'Replaces the bare INSERT in the book-trial Edge Function to prevent overbooking '
  'under concurrent load.';

-- ── 3. Update upsert_trial_rate_limit to hash the identifier ─────────────────
-- GDPR Article 4(1): IP addresses are personal data. We hash them with SHA-256
-- before storing so the DB never holds a raw IP. The hash is deterministic
-- within the 1-hour window so rate limiting still works correctly.
CREATE OR REPLACE FUNCTION public.upsert_trial_rate_limit(
  p_identifier   text,
  p_action       text,
  p_window_start timestamptz,
  p_max_attempts int DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  int;
  v_hashed text;
BEGIN
  -- Hash the identifier so raw IPs/user_ids are never stored in plaintext.
  -- encode(digest(x, 'sha256'), 'hex') requires pgcrypto (enabled on Supabase).
  v_hashed := encode(digest(p_identifier, 'sha256'), 'hex');

  INSERT INTO public.trial_rate_limits (identifier, action, window_start, attempt_count, last_attempt)
  VALUES (v_hashed, p_action, p_window_start, 1, now())
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET
    attempt_count = trial_rate_limits.attempt_count + 1,
    last_attempt  = now()
  RETURNING attempt_count INTO v_count;

  RETURN v_count > p_max_attempts;
END;
$$;

COMMENT ON FUNCTION public.upsert_trial_rate_limit IS
  'Atomically increments the rate-limit counter for (identifier, action, window). '
  'The identifier is SHA-256 hashed before storage — raw IPs are never persisted. '
  'Returns TRUE if the caller has exceeded p_max_attempts this window.';

-- ── 4. Set app.cron_secret GUC from Vault (run once after Vault setup) ───────
-- After storing CRON_SECRET in Supabase Vault, uncomment and run:
-- ALTER DATABASE postgres SET app.cron_secret = (
--   SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET'
-- );
