-- ============================================================
-- Trial schedule overhaul (2026-08-01)
--   1. Trials move from weekly-recurring to monthly: bookable only within
--      the first calendar week (days 1-7) of each month.
--   2. Retire all previously-active trial_slots (Africa/Cairo /
--      Asia/Kuala_Lumpur) and replace with 4 new Asia/Ho_Chi_Minh slots.
--   3. New "capacity reached" alert: the first time a given trial
--      slot/date reaches >=4 confirmed registrations, email the teacher
--      and the confirming student — exactly once per occurrence.
-- ============================================================

-- ── 1. Schema additions ──────────────────────────────────────────────────
ALTER TABLE public.trial_slots
  ADD COLUMN IF NOT EXISTS enrollment_alert_sent_at timestamptz;

COMMENT ON COLUMN public.trial_slots.enrollment_alert_sent_at IS
  'Set the first time this occurrence (trial_date + start_time) reaches its '
  '4-confirmed-registration capacity alert. Reset to NULL by advance_trial_slots() '
  'whenever the slot rolls to its next occurrence, so the alert can fire again.';

ALTER TABLE public.trial_slots
  ALTER COLUMN timezone SET DEFAULT 'Asia/Ho_Chi_Minh';

-- ── 2. Retire all currently-active trial_slots ───────────────────────────
-- (the old Africa/Cairo / Asia/Kuala_Lumpur weekly slots) so they stop
-- accepting bookings.
UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired', archived_at = now()
WHERE lifecycle = 'active';

-- ── 3. Insert the 4 new Vietnam-anchored slots ───────────────────────────
-- Seed trial_date values just need to be "close" — the advance_trial_slots()
-- call at the end of this migration rolls each one forward (if needed) to
-- the next date that is both in the future and inside the first 7 days of
-- a month, so the exact seed doesn't need to be re-verified against whenever
-- this migration actually applies.
INSERT INTO public.trial_slots
  (trial_date, start_time, day_of_week, duration_min, capacity, is_active, lifecycle, timezone, class_language)
VALUES
  ('2026-08-07', '20:30', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic'),   -- Arabic,  Friday   20:30
  ('2026-08-01', '13:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic'),   -- Arabic,  Saturday 13:00
  ('2026-08-03', '20:30', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english'),  -- English, Monday   20:30
  ('2026-08-02', '12:00', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english')   -- English, Sunday   12:00
ON CONFLICT (trial_date, start_time) DO UPDATE
  SET day_of_week              = EXCLUDED.day_of_week,
      duration_min             = EXCLUDED.duration_min,
      capacity                 = EXCLUDED.capacity,
      is_active                = true,
      lifecycle                = 'active',
      archived_at              = NULL,
      timezone                 = EXCLUDED.timezone,
      class_language           = EXCLUDED.class_language,
      enrollment_alert_sent_at = NULL;

-- ── 4. Monthly-window advance function (replaces weekly-only rollover) ──
-- Trials now run only in the first calendar week (days 1-7) of each month.
-- Rolls trial_date forward in +7-day increments until the resulting date is
-- BOTH in the future AND within days 1-7 of its month. Also clears
-- enrollment_alert_sent_at whenever the date actually moves, so the capacity
-- alert can fire again for the slot's next occurrence instead of only ever
-- once in its lifetime.
CREATE OR REPLACE FUNCTION public.advance_trial_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  slot RECORD;
  new_date date;
BEGIN
  FOR slot IN
    SELECT id, trial_date, start_time, timezone
    FROM public.trial_slots
    WHERE is_active = true
      AND lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND (
        (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Ho_Chi_Minh') <= now()
        OR EXTRACT(DAY FROM trial_date) NOT BETWEEN 1 AND 7
      )
  LOOP
    new_date := slot.trial_date;
    WHILE (
      (new_date + slot.start_time::time) AT TIME ZONE COALESCE(slot.timezone, 'Asia/Ho_Chi_Minh') <= now()
      OR EXTRACT(DAY FROM new_date) NOT BETWEEN 1 AND 7
    ) LOOP
      new_date := new_date + 7;
    END LOOP;

    UPDATE public.trial_slots
      SET trial_date = new_date,
          updated_at = now(),
          enrollment_alert_sent_at = CASE
            WHEN new_date <> slot.trial_date THEN NULL
            ELSE enrollment_alert_sent_at
          END
      WHERE id = slot.id;
  END LOOP;
END;
$$;
-- Grants persist across CREATE OR REPLACE (signature unchanged): still
-- REVOKE ALL FROM PUBLIC/anon/authenticated, GRANT EXECUTE TO service_role
-- from the 20260704210000 migration.

-- Run once now so the placeholder dates inserted above self-correct
-- immediately to their real first-week-of-month occurrence.
SELECT public.advance_trial_slots();

-- ── 5. get_trial_availability: enforce the first-week-of-month window ───
CREATE OR REPLACE FUNCTION public.get_trial_availability(p_language text DEFAULT NULL::text)
RETURNS TABLE(day_of_week integer, start_time text, booked_count bigint, capacity integer, duration_min integer, timezone text, next_trial_date date, class_language text)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    ts.trial_date AS next_trial_date,
    ts.class_language
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON  tb.day_of_week = ts.day_of_week
   AND tb.start_time   = ts.start_time
   AND tb.trial_date   = ts.trial_date
   AND tb.status NOT IN ('cancelled','rejected')
   AND tb.is_tba = false
  WHERE ts.is_active = true
    AND ts.lifecycle  = 'active'
    AND ts.trial_date IS NOT NULL
    AND (ts.trial_date + ts.start_time::time) AT TIME ZONE COALESCE(ts.timezone, 'Asia/Ho_Chi_Minh') > now()
    AND EXTRACT(DAY FROM ts.trial_date) BETWEEN 1 AND 7
    AND (p_language IS NULL OR ts.class_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$function$;

-- ── 6. Capacity-reached alert: atomic "fires once, threshold >=4" claim ──
-- Counting + claiming happens here (inside a row lock) so concurrent
-- confirmations can't double-fire the alert. The actual emails are sent
-- from edge-function code that holds a real service-role key (see
-- supabase/functions/_shared/trialCapacityAlert.ts) — NOT from a trigger,
-- because this project's Postgres session has no
-- app.supabase_service_role_key / app.supabase_url GUC and an empty
-- vault.decrypted_secrets, so the trigger-calls-net.http_post pattern used
-- elsewhere in this codebase (trigger_trial_followups, etc.) silently never
-- fires in production — verified live against cron.job_run_details, where
-- name-collection-email-daily fails every run with exactly
-- `unrecognized configuration parameter "app.supabase_url"`. Do not copy
-- that pattern for new features.
--
-- Threshold uses >= 4 rather than strictly = 4: two near-simultaneous
-- confirmations could both commit before either caller checks, so the
-- count could jump straight from 3 to 5 with no caller ever observing
-- exactly 4. >= 4 combined with the one-time claim below still satisfies
-- "fires once per slot/date, not on every registration after."
CREATE OR REPLACE FUNCTION public.claim_trial_capacity_alert(
  p_trial_date  date,
  p_start_time  text
)
RETURNS TABLE (
  should_send      boolean,
  day_of_week      int,
  class_language   text,
  timezone         text,
  capacity         int,
  confirmed_count  int,
  fourth_email     text,
  fourth_name      text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_slot_id        uuid;
  v_day_of_week    int;
  v_class_language text;
  v_timezone       text;
  v_capacity       int;
  v_already_sent   timestamptz;
  v_count          int;
  v_fourth_email   text;
  v_fourth_name    text;
BEGIN
  SELECT id, day_of_week, class_language, timezone, capacity, enrollment_alert_sent_at
    INTO v_slot_id, v_day_of_week, v_class_language, v_timezone, v_capacity, v_already_sent
  FROM public.trial_slots
  WHERE trial_date = p_trial_date AND start_time = p_start_time
  FOR UPDATE;

  IF v_slot_id IS NULL OR v_already_sent IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::int, NULL::text, NULL::text, NULL::int, NULL::int, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.trial_bookings
  WHERE trial_date = p_trial_date
    AND start_time = p_start_time
    AND status IN ('confirmed', 'confirmed_attendance')
    AND is_tba = false;

  IF v_count < 4 THEN
    RETURN QUERY SELECT false, NULL::int, NULL::text, NULL::text, NULL::int, NULL::int, NULL::text, NULL::text;
    RETURN;
  END IF;

  UPDATE public.trial_slots SET enrollment_alert_sent_at = now() WHERE id = v_slot_id;

  -- The registrant who completed the group: prefer attendance-confirmation
  -- time (authenticated flow) over insert-time confirmed_at, since
  -- authenticated bookings are inserted as 'awaiting_attendance' and only
  -- become a real confirmed registration once attendance_confirmed_at is set.
  SELECT tb.email, tb.name INTO v_fourth_email, v_fourth_name
  FROM public.trial_bookings tb
  WHERE tb.trial_date = p_trial_date
    AND tb.start_time = p_start_time
    AND tb.status IN ('confirmed', 'confirmed_attendance')
    AND tb.is_tba = false
  ORDER BY COALESCE(tb.attendance_confirmed_at, tb.confirmed_at, tb.created_at) DESC
  LIMIT 1;

  RETURN QUERY SELECT true, v_day_of_week, v_class_language, v_timezone, v_capacity, v_count, v_fourth_email, v_fourth_name;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trial_capacity_alert(date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_trial_capacity_alert(date, text) TO service_role;

COMMENT ON FUNCTION public.claim_trial_capacity_alert IS
  'Atomically checks whether a trial slot/date has reached >=4 confirmed '
  'registrations and, if so and not already alerted, claims it (sets '
  'enrollment_alert_sent_at) and returns the details needed to email the '
  'teacher + the completing student. Service-role only — callers are '
  'edge functions with a real service-role key, never a DB trigger.';
