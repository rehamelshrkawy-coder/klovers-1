-- Fix: approval email language detection was sending English to Arabic-speaking
-- Gulf / Levant countries whose timezones start with Asia/ (Riyadh, Dubai, etc.).
-- The old heuristic treated all Asia/* as English; this migration expands the
-- Arabic set to include known Arabic-speaking Asia/* cities.

CREATE OR REPLACE FUNCTION public.email_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _tz      TEXT;
  _lang    TEXT;
BEGIN
  -- Dedup: email already sent for this enrollment
  IF NEW.approval_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Guard: only fire when fully approved, paid, AND placed
  IF NEW.approval_status <> 'APPROVED'
     OR NEW.payment_status <> 'PAID'
     OR NEW.matched_at IS NULL
  THEN
    RETURN NEW;
  END IF;

  -- Get student profile
  SELECT name, email INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL THEN RETURN NEW; END IF;

  _tz := COALESCE(NEW.timezone, '');

  -- Arabic if Africa/* or a known Arabic-speaking Asia/* city; English otherwise.
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

  -- Send approval email
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
    ),
    body := jsonb_build_object(
      'template',       'approval',
      'email',          _profile.email,
      'name',           _profile.name,
      'plan_type',      NEW.plan_type,
      'duration',       NEW.duration,
      'sessions_total', COALESCE(NEW.sessions_total, NEW.classes_included),
      'amount',         NEW.amount,
      'preferred_day',  COALESCE(NEW.preferred_day, ''),
      'preferred_time', COALESCE(NEW.preferred_time, ''),
      'timezone',       COALESCE(NULLIF(_tz, ''), 'Africa/Cairo'),
      'level',          COALESCE(NEW.level, ''),
      'currency',       COALESCE(NEW.currency, 'EGP'),
      'language',       _lang
    )
  );

  -- Mark as sent; trigger re-fires but dedup guard at the top catches it.
  UPDATE public.enrollments
    SET approval_email_sent_at = NOW()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
