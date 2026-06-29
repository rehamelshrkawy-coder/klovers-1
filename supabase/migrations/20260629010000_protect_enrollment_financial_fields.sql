-- Students may update their own schedule metadata, but financial and approval
-- state must only change through trusted backend routines or admin workflows.
CREATE OR REPLACE FUNCTION public.protect_enrollment_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin')
     AND NOT COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
     AND ROW(
       OLD.user_id,
       OLD.plan_type,
       OLD.class_type,
       OLD.duration,
       OLD.classes_included,
       OLD.amount,
       OLD.currency,
       OLD.unit_price,
       OLD.payment_status,
       OLD.approval_status,
       OLD.enrollment_status,
       OLD.status,
       OLD.sessions_remaining,
       OLD.sessions_total,
       OLD.stripe_payment_intent_id,
       OLD.tx_ref,
       OLD.payment_date,
       OLD.due_at,
       OLD.reviewed_at,
       OLD.reviewed_by
     ) IS DISTINCT FROM ROW(
       NEW.user_id,
       NEW.plan_type,
       NEW.class_type,
       NEW.duration,
       NEW.classes_included,
       NEW.amount,
       NEW.currency,
       NEW.unit_price,
       NEW.payment_status,
       NEW.approval_status,
       NEW.enrollment_status,
       NEW.status,
       NEW.sessions_remaining,
       NEW.sessions_total,
       NEW.stripe_payment_intent_id,
       NEW.tx_ref,
       NEW.payment_date,
       NEW.due_at,
       NEW.reviewed_at,
       NEW.reviewed_by
     )
  THEN
    RAISE EXCEPTION 'Enrollment financial and approval fields require a trusted backend operation'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_enrollment_sensitive_fields ON public.enrollments;
CREATE TRIGGER protect_enrollment_sensitive_fields
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.protect_enrollment_sensitive_fields();

REVOKE ALL ON FUNCTION public.submit_enrollment_with_preference(
  uuid, text, integer, integer, numeric, numeric, text, text, text, integer, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_enrollment_with_preference(
  uuid, text, integer, integer, numeric, numeric, text, text, text, integer, text
) TO service_role;
