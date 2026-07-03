-- Trial → paid conversion tracking:
-- acquisition_source told us THAT a paid enrollment came from a trial, but not
-- WHICH trial_bookings row. Add a direct FK so conversion time, slot, teacher,
-- and cohort can be queried instead of just inferred.

-- ── 1. enrollments.trial_booking_id ──────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS trial_booking_id uuid REFERENCES public.trial_bookings(id);

CREATE INDEX IF NOT EXISTS idx_enrollments_trial_booking_id
  ON public.enrollments (trial_booking_id);

COMMENT ON COLUMN public.enrollments.trial_booking_id IS
  'The specific trial_bookings row that preceded this enrollment, set by '
  'tg_enrollments_set_acquisition_source. NULL if the student enrolled without '
  'ever booking a trial. Use this (not acquisition_source alone) to join back '
  'to slot/date/teacher for cohort and time-to-convert analysis.';

-- Backfill: link to the student's most recent trial booking.
UPDATE public.enrollments e
   SET trial_booking_id = tb.id
  FROM (
    SELECT DISTINCT ON (user_id) id, user_id
    FROM public.trial_bookings
    WHERE user_id IS NOT NULL
    ORDER BY user_id, created_at DESC
  ) tb
 WHERE tb.user_id = e.user_id
   AND e.trial_booking_id IS NULL
   AND e.acquisition_source = 'trial_booking';

-- ── 2. Extend the acquisition trigger to also set trial_booking_id ──────────
CREATE OR REPLACE FUNCTION public.tg_enrollments_set_acquisition_source()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_trial_id uuid;
BEGIN
  IF NEW.user_id IS NOT NULL AND (NEW.acquisition_source IS NULL OR NEW.trial_booking_id IS NULL) THEN
    SELECT id INTO v_trial_id
      FROM public.trial_bookings
     WHERE user_id = NEW.user_id
     ORDER BY created_at DESC
     LIMIT 1;

    IF v_trial_id IS NOT NULL THEN
      IF NEW.acquisition_source IS NULL THEN
        NEW.acquisition_source := 'trial_booking';
      END IF;
      IF NEW.trial_booking_id IS NULL THEN
        NEW.trial_booking_id := v_trial_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

COMMENT ON TRIGGER trg_enrollments_acquisition_source ON public.enrollments IS
  'Auto-sets acquisition_source=trial_booking and trial_booking_id when the '
  'enrolling user had a prior trial booking.';
