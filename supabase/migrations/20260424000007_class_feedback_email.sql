-- Post-first-class feedback: send a feedback request ~24h after first_class_date.
-- Fires hourly; 20h–28h window tolerates missed runs.

-- ── 1. New dedup column ───────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS class_feedback_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Cron function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_class_feedback_emails()
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
     WHERE e.first_class_date IS NOT NULL
       AND e.first_class_date < NOW() - INTERVAL '20 hours'
       AND e.first_class_date > NOW() - INTERVAL '28 hours'
       AND e.class_feedback_sent_at IS NULL
       AND e.approval_status = 'APPROVED'
  LOOP
    SELECT name, email, COALESCE(language, 'ar') AS language
      INTO _profile
      FROM public.profiles
      WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL;

    -- Stamp first to prevent double-send if function is called concurrently
    UPDATE public.enrollments
      SET class_feedback_sent_at = NOW()
      WHERE id = _rec.id
        AND class_feedback_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',  'class_feedback',
          'email',     _profile.email,
          'name',      _profile.name,
          'language',  _profile.language
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── 3. Schedule: run every hour ───────────────────────────────────────────────
SELECT cron.schedule(
  'send-class-feedback-emails',
  '30 * * * *',
  $$SELECT public.send_class_feedback_emails()$$
);
