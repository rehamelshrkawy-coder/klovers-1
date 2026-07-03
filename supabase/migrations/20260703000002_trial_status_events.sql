-- Discrete lifecycle events for trial_bookings.status transitions.
--
-- Today the only record of a trial's journey (pending -> confirmed ->
-- completed/no_show/cancelled) is whatever the *current* row + timestamp
-- columns show — there's no event log, so funnel/cohort queries (e.g. "what
-- % of Tuesday-slot trials went pending -> no_show last month") require
-- diffing timestamp columns after the fact instead of querying an event
-- stream. This table gives every transition its own row.

CREATE TABLE IF NOT EXISTS public.trial_status_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_booking_id  uuid        NOT NULL REFERENCES public.trial_bookings(id) ON DELETE CASCADE,
  user_id           uuid,
  email             text,
  old_status        text,
  new_status        text        NOT NULL,
  changed_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_status_events_booking
  ON public.trial_status_events (trial_booking_id, changed_at);

CREATE INDEX IF NOT EXISTS idx_trial_status_events_status
  ON public.trial_status_events (new_status, changed_at);

ALTER TABLE public.trial_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read trial_status_events"
  ON public.trial_status_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.trial_status_events IS
  'Append-only log of trial_bookings.status transitions, written by '
  'trg_trial_bookings_log_status_change. One row per transition (or per '
  'booking created, with old_status NULL). Admin-read only; written only by '
  'the SECURITY DEFINER trigger function, never directly by clients.';

CREATE OR REPLACE FUNCTION public.trial_bookings_log_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.trial_status_events (trial_booking_id, user_id, email, old_status, new_status)
    VALUES (
      NEW.id,
      NEW.user_id,
      NEW.email,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_bookings_log_status_change ON public.trial_bookings;

CREATE TRIGGER trg_trial_bookings_log_status_change
  AFTER INSERT OR UPDATE OF status ON public.trial_bookings
  FOR EACH ROW EXECUTE FUNCTION public.trial_bookings_log_status_change();

-- Backfill one synthetic "created" event per existing booking so historical
-- rows have at least a starting point in the event stream.
INSERT INTO public.trial_status_events (trial_booking_id, user_id, email, old_status, new_status, changed_at)
SELECT id, user_id, email, NULL, status, COALESCE(created_at, now())
FROM public.trial_bookings
WHERE NOT EXISTS (
  SELECT 1 FROM public.trial_status_events tse WHERE tse.trial_booking_id = trial_bookings.id
);
