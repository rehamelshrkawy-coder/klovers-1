-- Fix: email_student_on_approval and send_rejection_followup_emails must
-- respect profiles.email_unsubscribed. Previously they fetched email/name
-- but ignored the opt-out flag.

CREATE OR REPLACE FUNCTION public.email_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _lang    TEXT;
  _tz      TEXT;
BEGIN
  -- Dedup guard
  IF NEW.approval_email_sent_at IS NOT NULL THEN RETURN NEW; END IF;

  -- Only fire when fully approved, paid, AND placed
  IF NEW.approval_status <> 'APPROVED'
     OR NEW.payment_status <> 'PAID'
     OR NEW.matched_at IS NULL
  THEN RETURN NEW; END IF;

  SELECT name, email, unsubscribe_token,
         COALESCE(email_unsubscribed, FALSE) AS email_unsubscribed
    INTO _profile
    FROM public.profiles WHERE user_id = NEW.user_id;

  -- Skip missing email or opted-out users
  IF _profile.email IS NULL OR _profile.email_unsubscribed THEN RETURN NEW; END IF;

  _tz := COALESCE(NEW.timezone, '');
  _lang := CASE
    WHEN _tz LIKE 'Africa/%'
      OR _tz IN (
        'Asia/Riyadh','Asia/Dubai','Asia/Kuwait','Asia/Bahrain','Asia/Qatar',
        'Asia/Muscat','Asia/Baghdad','Asia/Amman','Asia/Beirut','Asia/Damascus',
        'Asia/Aden','Asia/Gaza','Asia/Hebron'
      )
      OR _tz = ''
    THEN 'ar'
    ELSE 'en'
  END;

  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
    ),
    body := jsonb_build_object(
      'template',           'approval',
      'email',              _profile.email,
      'name',               _profile.name,
      'language',           _lang,
      'unsubscribe_token',  _profile.unsubscribe_token,
      'plan_type',          NEW.plan_type,
      'duration',           NEW.duration,
      'sessions_total',     COALESCE(NEW.sessions_total, NEW.classes_included),
      'amount',             NEW.amount,
      'preferred_day',      COALESCE(NEW.preferred_day, ''),
      'preferred_time',     COALESCE(NEW.preferred_time, ''),
      'timezone',           COALESCE(NEW.timezone, 'Africa/Cairo'),
      'level',              COALESCE(NEW.level, ''),
      'currency',           COALESCE(NEW.currency, 'EGP')
    )
  );

  UPDATE public.enrollments SET approval_email_sent_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Fix send_rejection_followup_emails to check email_unsubscribed and pass unsubscribe_token
CREATE OR REPLACE FUNCTION public.send_rejection_followup_emails()
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
     WHERE e.approval_status = 'REJECTED'
       AND e.rejection_followup_sent_at IS NULL
       AND e.updated_at < NOW() - INTERVAL '2 days'
  LOOP
    SELECT name, email, COALESCE(language, 'ar') AS language,
           unsubscribe_token,
           COALESCE(email_unsubscribed, FALSE) AS email_unsubscribed
      INTO _profile
      FROM public.profiles WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL OR _profile.email_unsubscribed;

    UPDATE public.enrollments
      SET rejection_followup_sent_at = NOW()
      WHERE id = _rec.id AND rejection_followup_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template',          'rejection_followup',
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
