-- Receipt nudge: remind manual-payment students who haven't uploaded a receipt
-- after 24h. Fires hourly via pg_cron. One nudge per enrollment (dedup column).

-- ── 1. New dedup column ──────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS receipt_nudge_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Cron function: send receipt_nudge emails ──────────────────────────────
CREATE OR REPLACE FUNCTION public.send_receipt_nudge_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec     RECORD;
  _profile RECORD;
BEGIN
  FOR _rec IN
    SELECT e.*
      FROM public.enrollments e
     WHERE e.payment_provider IN ('egypt_manual', 'manual')
       AND (e.receipt_url IS NULL OR e.receipt_url = '' OR e.receipt_url = 'manual')
       AND e.approval_status IN ('PENDING', 'UNDER_REVIEW', 'PENDING_PAYMENT')
       AND e.created_at < NOW() - INTERVAL '24 hours'
       AND e.receipt_nudge_sent_at IS NULL
  LOOP
    SELECT name, email INTO _profile
      FROM public.profiles
      WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL;

    UPDATE public.enrollments
      SET receipt_nudge_sent_at = NOW()
      WHERE id = _rec.id
        AND receipt_nudge_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template', 'receipt_nudge',
          'email',    _profile.email,
          'name',     _profile.name,
          'language', CASE
                        WHEN COALESCE(_rec.timezone,'') NOT LIKE 'Asia/%'
                         AND COALESCE(_rec.timezone,'') NOT LIKE 'Europe/%'
                         AND COALESCE(_rec.timezone,'') NOT LIKE 'America/%'
                        THEN 'ar'
                        ELSE 'en'
                      END
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── 3. Schedule: run every hour ──────────────────────────────────────────────
SELECT cron.schedule(
  'send-receipt-nudge-emails',
  '0 * * * *',
  $$SELECT public.send_receipt_nudge_emails()$$
);
