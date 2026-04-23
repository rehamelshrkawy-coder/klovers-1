-- Day-5 escalation: send a more urgent "still forming" email 5 days after payment
-- if the student is still unplaced in a class slot.

-- ── 1. New dedup column ───────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS forming_escalation_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Cron function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_forming_escalation_emails()
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
     WHERE e.payment_email_sent_at IS NOT NULL
       AND e.payment_email_sent_at < NOW() - INTERVAL '5 days'
       AND e.matched_at IS NULL
       AND e.forming_escalation_sent_at IS NULL
       AND e.approval_status NOT IN ('REJECTED', 'CANCELLED')
       AND e.payment_status = 'PAID'
  LOOP
    SELECT name, email, COALESCE(language, 'ar') AS language
      INTO _profile
      FROM public.profiles
      WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL;

    -- Stamp first to prevent double-send if function is called concurrently
    UPDATE public.enrollments
      SET forming_escalation_sent_at = NOW()
      WHERE id = _rec.id
        AND forming_escalation_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template', 'group_forming_escalation',
          'email',    _profile.email,
          'name',     _profile.name,
          'language', _profile.language
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── 3. Schedule: run daily at 09:00 UTC ──────────────────────────────────────
SELECT cron.schedule(
  'send-forming-escalation-emails',
  '0 9 * * *',
  $$SELECT public.send_forming_escalation_emails()$$
);
