-- Abandoned checkout recovery system
-- Tracks recovery emails sent to leads who reached checkout but didn't pay.
-- Pairs with edge function `abandoned-checkout-recovery` (invoked every 30 min).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Table ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkout_recovery_emails (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email                text NOT NULL,
  stage                smallint NOT NULL CHECK (stage IN (1, 2, 3)),
  scheduled_for        timestamptz,
  sent_at              timestamptz,
  converted_at         timestamptz,
  unsubscribed_at      timestamptz,
  send_status          text NOT NULL DEFAULT 'pending'
                         CHECK (send_status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id  text,
  error_message        text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkout_recovery_emails_lead_stage_uniq UNIQUE (lead_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_checkout_recovery_emails_email
  ON public.checkout_recovery_emails (lower(email));
CREATE INDEX IF NOT EXISTS idx_checkout_recovery_emails_sent_at
  ON public.checkout_recovery_emails (sent_at);
CREATE INDEX IF NOT EXISTS idx_checkout_recovery_emails_converted_at
  ON public.checkout_recovery_emails (converted_at);

-- Touch updated_at on row update
CREATE OR REPLACE FUNCTION public.touch_checkout_recovery_emails_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_checkout_recovery_emails_updated_at
  ON public.checkout_recovery_emails;
CREATE TRIGGER trg_checkout_recovery_emails_updated_at
  BEFORE UPDATE ON public.checkout_recovery_emails
  FOR EACH ROW EXECUTE FUNCTION public.touch_checkout_recovery_emails_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.checkout_recovery_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view checkout recovery" ON public.checkout_recovery_emails;
CREATE POLICY "Admins view checkout recovery"
  ON public.checkout_recovery_emails
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage checkout recovery" ON public.checkout_recovery_emails;
CREATE POLICY "Admins manage checkout recovery"
  ON public.checkout_recovery_emails
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Conversion trigger ────────────────────────────────────────────────────
-- When an enrollment becomes APPROVED (i.e. PAID & approved), mark any
-- matching recovery rows as converted. We match via the lead's user_id.
CREATE OR REPLACE FUNCTION public.mark_checkout_recovery_converted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'APPROVED'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN

    UPDATE public.checkout_recovery_emails cre
       SET converted_at = now()
     WHERE cre.converted_at IS NULL
       AND cre.lead_id IN (
         SELECT l.id FROM public.leads l WHERE l.user_id = NEW.user_id
       );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollments_mark_recovery_converted ON public.enrollments;
CREATE TRIGGER trg_enrollments_mark_recovery_converted
  AFTER INSERT OR UPDATE OF status ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.mark_checkout_recovery_converted();

-- ── KPI view (used by admin UI) ───────────────────────────────────────────
CREATE OR REPLACE VIEW public.checkout_recovery_kpi AS
SELECT
  COUNT(*) FILTER (WHERE send_status = 'sent')                    AS total_sent,
  COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent')     AS leads_emailed,
  COUNT(DISTINCT lead_id) FILTER (WHERE converted_at IS NOT NULL) AS leads_converted,
  CASE
    WHEN COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent') = 0 THEN 0
    ELSE ROUND(
      100.0
      * COUNT(DISTINCT lead_id) FILTER (WHERE converted_at IS NOT NULL)
      / COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent'),
      2
    )
  END AS recovery_rate_pct
FROM public.checkout_recovery_emails;

GRANT SELECT ON public.checkout_recovery_kpi TO authenticated;

-- ── Cron trigger function ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_abandoned_checkout_recovery()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text := current_setting('app.supabase_service_role_key', true);
BEGIN
  IF v_key IS NULL OR v_key = '' THEN
    RAISE LOG 'trigger_abandoned_checkout_recovery: service key not set, skipping';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/abandoned-checkout-recovery',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body    := '{}'::jsonb
  );
  RAISE LOG 'trigger_abandoned_checkout_recovery fired at %', now();
END;
$$;

-- ── Cron schedule (every 30 minutes) ──────────────────────────────────────
SELECT cron.unschedule('abandoned-checkout-recovery') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'abandoned-checkout-recovery'
);
SELECT cron.schedule(
  'abandoned-checkout-recovery',
  '*/30 * * * *',
  'SELECT public.trigger_abandoned_checkout_recovery()'
);
