-- Fix a latent timezone mismatch in the no-show aging cron.
--
-- 20260421100000_trial_scheduling_hardening.sql hardcoded the aging
-- comparison to Africa/Cairo. But 20260517000001_new_trial_schedule_myt.sql
-- later switched the live trial_slots to Asia/Kuala_Lumpur (MYT) — a
-- deliberate choice for the current cohort, not a bug — and stamps that same
-- timezone onto each trial_bookings row at booking time (see the `timezone`
-- column, set from the slot in book-trial/index.ts).
--
-- The aging cron never picked that up: it still ages bookings using Cairo's
-- calendar date regardless of which timezone the booking actually belongs to.
-- For a MYT booking (UTC+8) that's up to a 10-hour skew from Cairo (UTC+2/+3),
-- enough to flip a booking to no_show up to half a day early or late.
--
-- Fix: use each booking's own `timezone` column (already correct back to
-- 20260421100000_trial_scheduling_hardening.sql) with Africa/Cairo as the
-- fallback for older rows where it's null/empty.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'age-stale-trial-bookings') THEN
    PERFORM cron.unschedule('age-stale-trial-bookings');
  END IF;
END $$;

SELECT cron.schedule(
  'age-stale-trial-bookings',
  '0 2 * * *',
  $cmd$UPDATE public.trial_bookings
         SET status = 'no_show'
         WHERE status = 'pending'
           AND is_tba = false
           AND trial_date < (now() AT TIME ZONE COALESCE(NULLIF(timezone, ''), 'Africa/Cairo'))::date$cmd$
);
