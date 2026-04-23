-- Email unsubscribe: token column on profiles lets students opt out of
-- automated marketing/lifecycle emails without being logged in.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unsubscribe_token  UUID    DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT FALSE NOT NULL;

-- Cron functions respect email_unsubscribed by checking it in the profile JOIN.
-- All existing cron functions use: COALESCE(p.language, 'ar') — we piggyback
-- the check there. Each function is patched below.

CREATE OR REPLACE FUNCTION public.send_forming_group_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT e.*,
           COALESCE(p.language, 'ar') AS lang,
           p.name  AS student_name,
           p.email AS student_email,
           p.unsubscribe_token
      FROM public.enrollments e
      JOIN public.profiles p ON p.user_id = e.user_id
     WHERE e.payment_email_sent_at IS NOT NULL
       AND e.payment_email_sent_at < NOW() - INTERVAL '48 hours'
       AND e.matched_at IS NULL
       AND e.forming_email_sent_at IS NULL
       AND e.approval_status NOT IN ('REJECTED', 'CANCELLED')
       AND e.payment_status = 'PAID'
       AND (p.email_unsubscribed IS FALSE OR p.email_unsubscribed IS NULL)
  LOOP
    CONTINUE WHEN _rec.student_email IS NULL;

    UPDATE public.enrollments
      SET forming_email_sent_at = NOW()
      WHERE id = _rec.id AND forming_email_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',           'group_forming',
          'email',              _rec.student_email,
          'name',               _rec.student_name,
          'language',           _rec.lang,
          'unsubscribe_token',  _rec.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_receipt_nudge_emails()
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
      p.email AS student_email,
      p.unsubscribe_token
    FROM public.enrollments e
    JOIN public.profiles p ON p.user_id = e.user_id
   WHERE e.created_at < NOW() - INTERVAL '24 hours'
     AND e.receipt_url IS NULL
     AND e.receipt_nudge_sent_at IS NULL
     AND e.approval_status IN ('PENDING', 'UNDER_REVIEW')
     AND (p.email_unsubscribed IS FALSE OR p.email_unsubscribed IS NULL)
  LOOP
    CONTINUE WHEN _rec.student_email IS NULL;

    UPDATE public.enrollments
      SET receipt_nudge_sent_at = NOW()
      WHERE id = _rec.id AND receipt_nudge_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',          'receipt_nudge',
          'email',             _rec.student_email,
          'name',              _rec.student_name,
          'language',          _rec.lang,
          'unsubscribe_token', _rec.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$$;

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
    SELECT name, email, COALESCE(language, 'ar') AS language, unsubscribe_token,
           COALESCE(email_unsubscribed, FALSE) AS email_unsubscribed
      INTO _profile
      FROM public.profiles WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL OR _profile.email_unsubscribed;

    UPDATE public.enrollments
      SET forming_escalation_sent_at = NOW()
      WHERE id = _rec.id AND forming_escalation_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',          'group_forming_escalation',
          'email',             _profile.email,
          'name',              _profile.name,
          'language',          _profile.language,
          'unsubscribe_token', _profile.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$$;

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
    SELECT name, email, COALESCE(language, 'ar') AS language, unsubscribe_token,
           COALESCE(email_unsubscribed, FALSE) AS email_unsubscribed
      INTO _profile
      FROM public.profiles WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL OR _profile.email_unsubscribed;

    UPDATE public.enrollments
      SET pre_class_reminder_sent_at = NOW()
      WHERE id = _rec.id AND pre_class_reminder_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',          'pre_class_reminder',
          'email',             _profile.email,
          'name',              _profile.name,
          'language',          _profile.language,
          'first_class_date',  TO_CHAR(_rec.first_class_date AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY HH24:MI'),
          'unsubscribe_token', _profile.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$$;

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
    SELECT name, email, COALESCE(language, 'ar') AS language, unsubscribe_token,
           COALESCE(email_unsubscribed, FALSE) AS email_unsubscribed
      INTO _profile
      FROM public.profiles WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL OR _profile.email_unsubscribed;

    UPDATE public.enrollments
      SET class_feedback_sent_at = NOW()
      WHERE id = _rec.id AND class_feedback_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',          'class_feedback',
          'email',             _profile.email,
          'name',              _profile.name,
          'language',          _profile.language,
          'unsubscribe_token', _profile.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$$;
