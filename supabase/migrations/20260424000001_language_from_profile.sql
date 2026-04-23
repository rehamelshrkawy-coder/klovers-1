-- Store student language preference in profiles and use it everywhere instead
-- of the timezone heuristic in payment trigger and both cron functions.

-- ── 1. Add language column to profiles ───────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'ar';

-- ── 2. Recreate payment trigger function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.email_student_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  IF NEW.payment_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status <> 'PAID' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.payment_status = 'PAID' THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, email, COALESCE(language, 'ar') AS language
    INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
    ),
    body := jsonb_build_object(
      'template',       'payment_confirmed',
      'email',          _profile.email,
      'name',           _profile.name,
      'plan_type',      NEW.plan_type,
      'duration',       NEW.duration,
      'sessions_total', NEW.sessions_total,
      'amount',         NEW.amount,
      'currency',       COALESCE(NEW.currency, 'EGP'),
      'level',          COALESCE(NEW.level, ''),
      'tx_ref',         COALESCE(NEW.tx_ref, ''),
      'payment_date',   TO_CHAR(NOW(), 'DD Mon YYYY'),
      'language',       _profile.language
    )
  );

  UPDATE public.enrollments
    SET payment_email_sent_at = NOW()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- ── 3. Recreate forming group cron function ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_forming_group_emails()
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
       AND e.payment_email_sent_at < NOW() - INTERVAL '48 hours'
       AND e.matched_at IS NULL
       AND e.forming_email_sent_at IS NULL
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
      SET forming_email_sent_at = NOW()
      WHERE id = _rec.id
        AND forming_email_sent_at IS NULL;

    IF FOUND THEN
      PERFORM net.http_post(
        url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
        ),
        body := jsonb_build_object(
          'template', 'group_forming',
          'email',    _profile.email,
          'name',     _profile.name,
          'language', _profile.language
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── 4. Recreate receipt nudge cron function ───────────────────────────────────
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
    SELECT name, email, COALESCE(language, 'ar') AS language
      INTO _profile
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
          'language', _profile.language
        )
      );
    END IF;
  END LOOP;
END;
$$;
