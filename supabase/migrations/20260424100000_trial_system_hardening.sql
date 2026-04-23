-- ============================================================
-- Trial system hardening (2026-04-24)
--   1. get_trial_availability: true per-occurrence capacity
--      Returns next_trial_date so the UI can show the exact date.
--      Counts only bookings for that specific date (not a rolling window).
--   2. enrollments: add acquisition_source (Retention expert fix)
--   3. trial_broadcasts: idempotency table (DevOps expert fix)
-- ============================================================

-- ── 1. True per-occurrence capacity ──────────────────────────────────────────
-- Computes the NEXT occurrence date for each active slot, then counts
-- confirmed bookings only for that specific date. This prevents a fully-booked
-- May 3 session from blocking bookings for May 10.

CREATE OR REPLACE FUNCTION public.get_trial_availability()
RETURNS TABLE (
  day_of_week    int,
  start_time     text,
  booked_count   bigint,
  capacity       int,
  duration_min   int,
  timezone       text,
  next_trial_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH next_dates AS (
  -- For each active slot compute the next calendar date (Cairo UTC+2, no DST).
  SELECT
    ts.id,
    ts.day_of_week,
    ts.start_time,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    -- next occurrence: today + ((target_dow - today_dow + 7) % 7) days
    -- min 1 day ahead so same-day never appears (booking closes 1 day before).
    (CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::date
      + CASE
          WHEN ts.day_of_week > EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::int
          THEN ts.day_of_week - EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::int
          ELSE ts.day_of_week - EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::int + 7
        END AS next_date
  FROM public.trial_slots ts
  WHERE ts.is_active = true
    AND (ts.lifecycle IS NULL OR ts.lifecycle = 'active')
)
SELECT
  nd.day_of_week,
  nd.start_time,
  COALESCE(COUNT(tb.id), 0) AS booked_count,
  nd.capacity,
  nd.duration_min,
  nd.timezone,
  nd.next_date AS next_trial_date
FROM next_dates nd
LEFT JOIN public.trial_bookings tb
  ON  tb.day_of_week = nd.day_of_week
  AND tb.start_time  = nd.start_time
  AND tb.trial_date  = nd.next_date
  AND tb.status NOT IN ('cancelled')
GROUP BY nd.id, nd.day_of_week, nd.start_time, nd.capacity, nd.duration_min, nd.timezone, nd.next_date
HAVING COALESCE(COUNT(tb.id), 0) < nd.capacity
ORDER BY nd.next_date, nd.start_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_trial_availability() TO anon, authenticated;

COMMENT ON FUNCTION public.get_trial_availability() IS
  'Returns bookable trial slots for each slot''s NEXT occurrence date. '
  'booked_count reflects that specific date only — not all-time or rolling window. '
  'Full slots (booked_count >= capacity) are filtered server-side.';

-- ── 2. enrollments.acquisition_source ────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS acquisition_source text;

COMMENT ON COLUMN public.enrollments.acquisition_source IS
  'Where the student came from before enrolling: trial_booking, organic, referral, broadcast_email, etc.';

-- Backfill existing enrollments that have a matching trial booking
UPDATE public.enrollments e
   SET acquisition_source = 'trial_booking'
  FROM public.trial_bookings tb
 WHERE tb.user_id = e.user_id
   AND e.acquisition_source IS NULL;

-- ── 3. trial_broadcasts idempotency table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_broadcasts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_key text NOT NULL UNIQUE,   -- e.g. 'trial_broadcast_2026-04-24'
  sent_count    int  NOT NULL DEFAULT 0,
  error_count   int  NOT NULL DEFAULT 0,
  triggered_by  uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage trial_broadcasts"
  ON public.trial_broadcasts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.trial_broadcasts IS
  'Idempotency log for send-trial-broadcast. '
  'Prevents duplicate mass sends within the same broadcast_key window.';

-- ── 4. trial_bookings.followup_day7_sent_at ──────────────────────────────────
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS followup_day7_sent_at timestamptz;

COMMENT ON COLUMN public.trial_bookings.followup_day7_sent_at IS
  'When the day-7 qualitative check-in + referral email was sent.';

-- ── 5. Auto-set acquisition_source on new enrollments ────────────────────────
CREATE OR REPLACE FUNCTION public.tg_enrollments_set_acquisition_source()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.acquisition_source IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Check if the user had a trial booking
    IF EXISTS (
      SELECT 1 FROM public.trial_bookings
      WHERE user_id = NEW.user_id LIMIT 1
    ) THEN
      NEW.acquisition_source := 'trial_booking';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enrollments_acquisition_source ON public.enrollments;
CREATE TRIGGER trg_enrollments_acquisition_source
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.tg_enrollments_set_acquisition_source();

COMMENT ON TRIGGER trg_enrollments_acquisition_source ON public.enrollments IS
  'Auto-sets acquisition_source=trial_booking when the enrolling user had a prior trial booking.';
