-- Audit trail and data integrity fixes for enrollments.
--
-- Adds:
--   1. deleted_at / deleted_by soft-delete columns on enrollments.
--   2. Trigger that logs to admin_audit_log on DELETE (so we can always answer
--      "who deleted this enrollment and when").
--   3. Trigger that logs approval_status / payment_status changes to admin_audit_log.
--   4. Data fix: REJECTED+PAID+active rows → enrollment_status = 'cancelled'.

-- ── 1. Soft-delete columns ───────────────────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID        DEFAULT NULL;

-- ── 2. Log enrollment deletions ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_enrollment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_id,
    enrollment_id,
    action,
    field,
    old_value,
    new_value
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    OLD.id,
    'enrollment_deleted',
    'approval_status',
    OLD.approval_status || '|' || OLD.payment_status || '|' || OLD.enrollment_status,
    NULL
  );
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  -- Never let audit log failure block an actual delete
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_enrollment_delete ON public.enrollments;
CREATE TRIGGER trg_log_enrollment_delete
  BEFORE DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_enrollment_delete();

-- ── 3. Log approval_status / payment_status changes ─────────────────────────
CREATE OR REPLACE FUNCTION public.log_enrollment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log approval_status change
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    INSERT INTO public.admin_audit_log (
      admin_id, enrollment_id, action, field, old_value, new_value
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.id,
      'status_change',
      'approval_status',
      OLD.approval_status,
      NEW.approval_status
    );
  END IF;

  -- Log payment_status change
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    INSERT INTO public.admin_audit_log (
      admin_id, enrollment_id, action, field, old_value, new_value
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.id,
      'status_change',
      'payment_status',
      OLD.payment_status,
      NEW.payment_status
    );
  END IF;

  -- Log matched_at being set (placement confirmed)
  IF NEW.matched_at IS NOT NULL AND OLD.matched_at IS NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_id, enrollment_id, action, field, old_value, new_value
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.id,
      'placement_confirmed',
      'matched_at',
      NULL,
      NEW.matched_at::text
    );
  END IF;

  -- Log approval email sent
  IF NEW.approval_email_sent_at IS NOT NULL AND OLD.approval_email_sent_at IS NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_id, enrollment_id, action, field, old_value, new_value
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.id,
      'approval_email_sent',
      'approval_email_sent_at',
      NULL,
      NEW.approval_email_sent_at::text
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_enrollment_status_change ON public.enrollments;
CREATE TRIGGER trg_log_enrollment_status_change
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_enrollment_status_change();

-- ── 4. Data fix: REJECTED+PAID+active rows should be cancelled ───────────────
-- 5 rows were found in this broken state (paid but rejected, still showing active).
UPDATE public.enrollments
  SET enrollment_status = 'cancelled'
  WHERE approval_status = 'REJECTED'
    AND payment_status   = 'PAID'
    AND enrollment_status = 'active';
