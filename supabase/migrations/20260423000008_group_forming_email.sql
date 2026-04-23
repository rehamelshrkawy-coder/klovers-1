-- Mid-wait "group forming" reassurance email sent 48h after payment_email_sent_at
-- if the student still has no matched_at (not yet placed in a class slot).
-- Also updates the payment trigger to pass tx_ref + payment_date for invoice display.

-- ── 1. New dedup column ──────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS forming_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Update payment trigger to pass tx_ref + payment_date ─────────────────
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

  SELECT name, email INTO _profile
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
      'language',       CASE
                          WHEN COALESCE(NEW.timezone,'') NOT LIKE 'Asia/%'
                           AND COALESCE(NEW.timezone,'') NOT LIKE 'Europe/%'
                           AND COALESCE(NEW.timezone,'') NOT LIKE 'America/%'
                          THEN 'ar'
                          ELSE 'en'
                        END
    )
  );

  UPDATE public.enrollments
    SET payment_email_sent_at = NOW()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- ── 3. Cron function: send group_forming emails at 48h mark ─────────────────
CREATE OR REPLACE FUNCTION public.send_forming_group_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rec    RECORD;
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
    SELECT name, email INTO _profile
      FROM public.profiles
      WHERE user_id = _rec.user_id;

    CONTINUE WHEN _profile.email IS NULL;

    -- Stamp first to prevent double-send if function is called concurrently
    UPDATE public.enrollments
      SET forming_email_sent_at = NOW()
      WHERE id = _rec.id
        AND forming_email_sent_at IS NULL;

    -- Only send if we won the update race
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

-- ── 4. Schedule: run daily at 08:00 UTC ─────────────────────────────────────
SELECT cron.schedule(
  'send-forming-group-emails',
  '0 8 * * *',
  $$SELECT public.send_forming_group_emails()$$
);
