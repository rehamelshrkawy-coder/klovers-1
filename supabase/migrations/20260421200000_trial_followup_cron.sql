-- Post-trial follow-up sequence
-- Bridges the biggest conversion leak: users who book a trial then ghost.
-- Three touchpoints driven by an hourly pg_cron job:
--   prep   — 24h BEFORE the trial   → primes attendance, links placement test
--   day1   — 24h AFTER the trial    → asks how it went, points at pricing
--   day3   — 72h AFTER the trial    → final nudge + WhatsApp escape hatch
--
-- Dedup: each row tracks which stages have been sent. Rows where the user
-- already has an APPROVED enrollment are skipped entirely (they converted).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Dedup columns ──────────────────────────────────────────────────────────
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS followup_prep_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS followup_day1_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS followup_day3_sent_at  timestamptz;

-- Partial indexes so the cron lookup stays cheap as the table grows.
CREATE INDEX IF NOT EXISTS idx_trial_bookings_followup_prep_pending
  ON public.trial_bookings (trial_date)
  WHERE followup_prep_sent_at IS NULL AND is_tba IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_trial_bookings_followup_day1_pending
  ON public.trial_bookings (trial_date)
  WHERE followup_day1_sent_at IS NULL AND is_tba IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_trial_bookings_followup_day3_pending
  ON public.trial_bookings (trial_date)
  WHERE followup_day3_sent_at IS NULL AND is_tba IS NOT TRUE;

-- ── Trigger: call edge function ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_trial_followups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text := current_setting('app.supabase_service_role_key', true);
BEGIN
  IF v_key IS NULL OR v_key = '' THEN
    RAISE LOG 'trigger_trial_followups: service key not set, skipping';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-trial-followups',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body    := '{}'::jsonb
  );
  RAISE LOG 'trigger_trial_followups fired at %', now();
END;
$$;

-- ── Schedule: hourly at :15 (offset from other jobs to spread load) ────────
SELECT cron.unschedule('trial-followups-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'trial-followups-hourly'
);
SELECT cron.schedule(
  'trial-followups-hourly',
  '15 * * * *',
  'SELECT public.trigger_trial_followups()'
);
