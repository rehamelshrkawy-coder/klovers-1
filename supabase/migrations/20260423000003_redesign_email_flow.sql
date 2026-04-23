-- Redesign student email flow to a clean 2-stage model.
--
-- Stage 1 — Payment Confirmed (fires when payment_status becomes PAID):
--   "We received your payment. Your seat is reserved. We are forming your class."
--   Dedup column: payment_email_sent_at
--
-- Stage 2 — Class Confirmed (fires when APPROVED + PAID + matched_at IS NOT NULL):
--   "You are officially placed in a class." (already implemented in migration 000001)
--   Dedup column: approval_email_sent_at
--
-- Stage 3 — Class Link (manual admin action, no trigger):
--   Admin pastes meeting link → sends to student / whole group.
--
-- Changes:
--   1. Add payment_email_sent_at column.
--   2. Drop trg_email_student_on_enrollment (was sending pending_review on INSERT,
--      which fired before any payment — wrong timing).
--   3. Create email_student_on_payment() + trg_email_student_on_payment
--      (INSERT + UPDATE, fires when payment_status transitions to PAID).

-- ── 1. New dedup column ──────────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payment_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Drop the old pre-payment enrollment email trigger ─────────────────────
DROP TRIGGER IF EXISTS trg_email_student_on_enrollment ON public.enrollments;
-- Keep the function in case it is referenced elsewhere; it is now a no-op.
-- It is safe to drop it too, but dropping the trigger is sufficient.

-- ── 3. Payment confirmation trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.email_student_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- Dedup: already sent
  IF NEW.payment_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Only when payment just became PAID
  IF NEW.payment_status <> 'PAID' THEN
    RETURN NEW;
  END IF;

  -- On UPDATE: only fire on the PAID transition, not on every update
  IF TG_OP = 'UPDATE' AND OLD.payment_status = 'PAID' THEN
    RETURN NEW;
  END IF;

  -- Don't send Stage 1 if Stage 2 (full class confirmation) was somehow already sent
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
      'language',       CASE
                          WHEN COALESCE(NEW.timezone,'') NOT LIKE 'Asia/%'
                           AND COALESCE(NEW.timezone,'') NOT LIKE 'Europe/%'
                           AND COALESCE(NEW.timezone,'') NOT LIKE 'America/%'
                          THEN 'ar'
                          ELSE 'en'
                        END
    )
  );

  -- Stamp dedup column; the recursive UPDATE re-fires this trigger but is
  -- caught immediately by the guard at the top.
  UPDATE public.enrollments
    SET payment_email_sent_at = NOW()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_student_on_payment ON public.enrollments;
CREATE TRIGGER trg_email_student_on_payment
  AFTER INSERT OR UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.email_student_on_payment();

-- ── 4. Backfill: mark existing PAID rows so they don't get Stage 1 retroactively
-- These students already received some email (or are too old to re-notify).
UPDATE public.enrollments
  SET payment_email_sent_at = COALESCE(reviewed_at, created_at)
  WHERE payment_status = 'PAID'
    AND payment_email_sent_at IS NULL;
