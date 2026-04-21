-- Trial scheduling hardening:
--   #4  pg_cron aging job: make the date comparison timezone-aware (Africa/Cairo)
--       so rows don't age prematurely or too late for Cairo-local students.
--   #2  Replace TBA magic values (start_time='TBA', trial_date='2099-12-31') with
--       a real `is_tba` boolean column. Existing sentinel values stay in place
--       (NOT NULL on start_time/trial_date forces placeholder values), but the
--       column becomes the source of truth. App code no longer needs to know
--       the sentinels.
--   #3  Cross-table conflict detection: prevent a user from having a pending/
--       confirmed trial booking that overlaps a pkg_group_session they're
--       already attending.

BEGIN;

-- ─── #2: is_tba column ────────────────────────────────────────────────────────
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS is_tba boolean NOT NULL DEFAULT false;

-- Backfill from legacy sentinels.
UPDATE public.trial_bookings
   SET is_tba = true
 WHERE is_tba = false
   AND (start_time = 'TBA' OR trial_date = DATE '2099-12-31');

-- Keep the column coherent with the sentinels automatically. Callers don't
-- need to know about is_tba; they write start_time/trial_date as before and
-- the trigger derives is_tba. Avoids a deployment-order trap where code that
-- sets is_tba explicitly would break if shipped before the column existed.
CREATE OR REPLACE FUNCTION public.trial_bookings_sync_is_tba()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_tba := (NEW.start_time = 'TBA' OR NEW.trial_date = DATE '2099-12-31');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_bookings_sync_is_tba ON public.trial_bookings;

CREATE TRIGGER trg_trial_bookings_sync_is_tba
  BEFORE INSERT OR UPDATE OF start_time, trial_date, is_tba
  ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trial_bookings_sync_is_tba();

CREATE INDEX IF NOT EXISTS idx_trial_bookings_is_tba
  ON public.trial_bookings (is_tba)
  WHERE is_tba = true AND status IN ('pending','confirmed');


-- ─── #3: conflict detection trigger ───────────────────────────────────────────
-- Rejects a trial booking that would overlap an existing pkg_group_session
-- for the same user on the same date at the same start time.
CREATE OR REPLACE FUNCTION public.trial_bookings_check_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count int;
BEGIN
  -- Only enforce on rows that represent a real scheduled trial.
  IF NEW.is_tba OR NEW.user_id IS NULL
     OR NEW.status NOT IN ('pending','confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.pkg_group_sessions s
    JOIN public.pkg_groups        g ON g.id = s.group_id
    JOIN public.schedule_packages p ON p.id = g.package_id
    JOIN public.pkg_group_members m ON m.group_id = g.id AND m.user_id = NEW.user_id
   WHERE s.session_date = NEW.trial_date
     AND m.member_status = 'active'
     -- Exact-start match is the common collision; expand to overlap window
     -- if we ever let trials run longer than packages.
     AND to_char(p.start_time, 'HH24:MI') = NEW.start_time;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'trial_booking_conflict: user % already has a scheduled class at % on %',
      NEW.user_id, NEW.start_time, NEW.trial_date
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_bookings_check_conflict ON public.trial_bookings;

CREATE TRIGGER trg_trial_bookings_check_conflict
  BEFORE INSERT OR UPDATE OF day_of_week, start_time, trial_date, status, user_id, is_tba
  ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trial_bookings_check_conflict();

COMMIT;


-- ─── #4: cron aging job, Cairo-local ──────────────────────────────────────────
-- pg_cron runs on UTC. Previous job compared to CURRENT_DATE, which is server
-- (UTC) date — so a booking in Cairo's "today" could flip to no_show 2-3 hours
-- before Cairo local midnight during DST. Fix: make the predicate evaluate the
-- current date in Africa/Cairo, and run at 02:00 UTC (≈ 04:00-05:00 Cairo) so
-- the job fires safely after Cairo midnight regardless of DST.
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
           AND trial_date < (now() AT TIME ZONE 'Africa/Cairo')::date$cmd$
);
