-- Rejection follow-up: 48h after a time_slots_unavailable rejection, if the
-- student has a resubmission request token but hasn't been placed yet, send
-- a nudge to re-submit their schedule.

-- ── 1. New dedup column ───────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS rejection_followup_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Cron function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_rejection_followup_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT
      e.*,
      COALESCE(p.language, 'ar') AS lang,
      p.name  AS student_name,
      p.email AS student_email
    FROM public.schedule_resubmission_requests srr
    JOIN public.enrollments e  ON e.id       = srr.enrollment_id
    JOIN public.profiles    p  ON p.user_id  = e.user_id
   WHERE srr.created_at < NOW() - INTERVAL '48 hours'
     AND e.approval_status = 'REJECTED'
     AND e.rejection_followup_sent_at IS NULL
  LOOP
    CONTINUE WHEN _rec.student_email IS NULL;

    -- Stamp first to prevent double-send if function is called concurrently
    UPDATE public.enrollments
      SET rejection_followup_sent_at = NOW()
      WHERE id = _rec.id
        AND rejection_followup_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template', 'rejection_followup',
          'email',    _rec.student_email,
          'name',     _rec.student_name,
          'language', _rec.lang
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── 3. Schedule: run daily at 10:00 UTC ──────────────────────────────────────
SELECT cron.schedule(
  'send-rejection-followup-emails',
  '0 10 * * *',
  $$SELECT public.send_rejection_followup_emails()$$
);
