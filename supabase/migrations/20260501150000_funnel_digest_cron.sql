-- Daily funnel digest at 06:00 UTC (08:00 Cairo). The function self-guards
-- to only send at hour 6, so we schedule hourly and let it pick its slot.

CREATE OR REPLACE FUNCTION public.trigger_funnel_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_key text := current_setting('app.supabase_service_role_key', true);
BEGIN
  IF v_key IS NULL OR v_key = '' THEN
    RAISE LOG 'trigger_funnel_digest: service key not set, skipping';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/funnel-digest',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$fn$;

-- Run hourly at :05 (offset from other crons). Function only sends at 06:00 UTC.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'funnel-digest-hourly') THEN
    PERFORM cron.unschedule('funnel-digest-hourly');
  END IF;
END $$;

SELECT cron.schedule(
  'funnel-digest-hourly',
  '5 * * * *',
  'SELECT public.trigger_funnel_digest()'
);
