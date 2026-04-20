-- Enforce: each email can book a trial class only once, ever.
--
-- The previous index (idx_trial_bookings_unique_active) only covered
-- (email, trial_date, start_time) WHERE status IN ('pending','confirmed') —
-- that allowed the same email to appear on multiple slots or on cancelled
-- rows. We now want an absolute per-email cap.
--
-- An admin who wants to let a previously-cancelled student rebook must first
-- delete the stale row.

BEGIN;

DROP INDEX IF EXISTS public.idx_trial_bookings_unique_active;
DROP INDEX IF EXISTS public.idx_trial_bookings_unique_email;

CREATE UNIQUE INDEX idx_trial_bookings_unique_email
  ON public.trial_bookings (lower(email));

COMMIT;
