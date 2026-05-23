-- Track student/admin changes and cancellations for trial bookings.

BEGIN;

ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

UPDATE public.trial_bookings
   SET cancelled_at = COALESCE(cancelled_at, created_at)
 WHERE status = 'cancelled'
   AND cancelled_at IS NULL;

CREATE OR REPLACE FUNCTION public.trial_bookings_track_change_cancel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (
      OLD.trial_date IS DISTINCT FROM NEW.trial_date OR
      OLD.start_time IS DISTINCT FROM NEW.start_time OR
      OLD.day_of_week IS DISTINCT FROM NEW.day_of_week
    ) AND NEW.changed_at IS NOT DISTINCT FROM OLD.changed_at THEN
      NEW.changed_at := now();
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status
       AND NEW.status = 'cancelled'
       AND NEW.cancelled_at IS NOT DISTINCT FROM OLD.cancelled_at THEN
      NEW.cancelled_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_bookings_track_change_cancel ON public.trial_bookings;

CREATE TRIGGER trg_trial_bookings_track_change_cancel
  BEFORE UPDATE OF day_of_week, start_time, trial_date, status, changed_at, cancelled_at
  ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trial_bookings_track_change_cancel();

CREATE INDEX IF NOT EXISTS idx_trial_bookings_changed_at
  ON public.trial_bookings (changed_at)
  WHERE changed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_bookings_cancelled_at
  ON public.trial_bookings (cancelled_at)
  WHERE cancelled_at IS NOT NULL;

COMMENT ON COLUMN public.trial_bookings.changed_at IS
  'When the selected trial date/time was last changed or moved back to rebooking.';

COMMENT ON COLUMN public.trial_bookings.cancelled_at IS
  'When the trial booking was cancelled by a student or admin.';

COMMENT ON COLUMN public.trial_bookings.cancel_reason IS
  'Machine-readable cancellation source, e.g. student_cancel, student_reschedule, admin_reject.';

COMMIT;
