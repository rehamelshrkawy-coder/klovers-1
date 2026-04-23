-- Pre-class reminder: notify approved students 24h before their first class.
-- Runs hourly so no student misses the window regardless of when first_class_date
-- is stamped by admin. Uses a 26-hour upper bound to tolerate a missed hourly run.

-- ── 1. New dedup column ───────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS pre_class_reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Cron function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_pre_class_reminders()
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
       AND e.first_class_date > NOW()
       AND e.first_class_date < NOW() + INTERVAL '26 hours'
       AND e.pre_class_reminder_sent_at IS NULL
       AND e.approval_status = 'APPROVED'
  LOOP
    SELECT name, email, COALESCE(language, 'ar') AS language
      INTO _profile
      FROM public.profiles
      WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL;

    -- Stamp first to prevent double-send if function is called concurrently
    UPDATE public.enrollments
      SET pre_class_reminder_sent_at = NOW()
      WHERE id = _rec.id
        AND pre_class_reminder_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',        'pre_class_reminder',
          'email',           _profile.email,
          'name',            _profile.name,
          'language',        _profile.language,
          'first_class_date', TO_CHAR(
                                _rec.first_class_date AT TIME ZONE 'Africa/Cairo',
                                'DD Mon YYYY HH24:MI'
                              )
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── 3. Schedule: run every hour ───────────────────────────────────────────────
SELECT cron.schedule(
  'send-pre-class-reminders',
  '0 * * * *',
  $$SELECT public.send_pre_class_reminders()$$
);
