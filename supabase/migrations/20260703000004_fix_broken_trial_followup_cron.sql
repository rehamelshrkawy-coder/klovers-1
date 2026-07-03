-- CRITICAL FIX: the post-trial follow-up cron pipeline has never actually
-- run. Two jobs were scheduled to call send-trial-followups:
--   * trial-followups-hourly    -> trigger_trial_followups() -> reads GUC
--     app.supabase_service_role_key, which was never set. The function
--     no-ops (RAISE LOG ... RETURN) every single run.
--   * trigger-trial-followups   -> inline net.http_post sending
--     "Authorization: Bearer <app.cron_secret>", but (a) app.cron_secret
--     was also never set, AND (b) even if it were, send-trial-followups'
--     isAuthorised() only accepts a shared secret via the `x-cron-secret`
--     header, not as a Bearer token — so this job was doubly broken.
--
-- Net effect: "Bridges the biggest conversion leak" (per
-- 20260421200000_trial_followup_cron.sql's own comment) has been dead on
-- arrival since deployment. recover-silent-trials exists as a manual patch
-- for exactly this symptom, without the root cause ever having been fixed.
--
-- Fix: drop both broken jobs, generate a real shared secret in Supabase
-- Vault, expose it as the `app.cron_secret` GUC, and reschedule ONE job that
-- sends it via the header the Edge Function actually checks for.

-- ── 1. Remove the two broken jobs ────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trial-followups-hourly') THEN
    PERFORM cron.unschedule('trial-followups-hourly');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trigger-trial-followups') THEN
    PERFORM cron.unschedule('trigger-trial-followups');
  END IF;
END $$;

-- ── 2. Generate + store a real shared secret (idempotent) ──────────────────
-- Only creates one if CRON_SECRET doesn't already exist in Vault.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'CRON_SECRET') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'CRON_SECRET',
      'Shared secret pg_cron sends as the x-cron-secret header when calling '
      'trial-related Edge Functions (send-trial-followups, recover-silent-trials). '
      'Must match the CRON_SECRET Edge Function secret (set via Supabase dashboard).'
    );
  END IF;
END $$;

-- Expose it as a database-level GUC so cron job bodies can read it without
-- a second Vault round-trip per call.
ALTER DATABASE postgres SET app.cron_secret = (
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET'
);

-- ── 3. Reschedule send-trial-followups correctly ────────────────────────────
SELECT cron.schedule(
  'trial-followups-hourly',
  '5 * * * *',
  $cmd$
  SELECT net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-trial-followups',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $cmd$
);

-- ── 4. Weekly safety net: recover-silent-trials in live mode ───────────────
-- Idempotent (stamps followup_day3_sent_at), so a weekly catch-all run is
-- safe even though the hourly job above should now handle new bookings.
SELECT cron.schedule(
  'trial-recover-silent-weekly',
  '30 3 * * 1',  -- Monday 03:30 UTC
  $cmd$
  SELECT net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/recover-silent-trials',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{"mode":"live","days":30}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $cmd$
);

-- ── 5. Cron health monitor ──────────────────────────────────────────────────
-- Alerts admin_notifications if any trial-related cron job has failed runs
-- in the last 25 hours, so a future auth/config break gets noticed instead
-- of silently no-oping like this one did.
CREATE OR REPLACE FUNCTION public.check_trial_cron_health()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_failed record;
BEGIN
  FOR v_failed IN
    SELECT j.jobname, count(*) AS failures, max(d.start_time) AS last_failure
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE j.jobname IN (
      'trial-followups-hourly', 'trial-recover-silent-weekly',
      'age-stale-trial-bookings', 'purge-trial-rate-limits'
    )
    AND d.status = 'failed'
    AND d.start_time > now() - interval '25 hours'
    GROUP BY j.jobname
  LOOP
    INSERT INTO public.admin_notifications (message, type)
    VALUES (
      format('Cron job "%s" failed %s time(s) in the last 25h (last: %s)',
        v_failed.jobname, v_failed.failures, v_failed.last_failure),
      'trial_cron_failure'
    );
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'check-trial-cron-health',
  '0 12 * * *',  -- daily at noon UTC
  $$SELECT public.check_trial_cron_health()$$
);
