-- Atomic approval: update enrollment + add credits in a single transaction.
-- Replaces the two-step frontend pattern that left enrollments APPROVED with
-- no credits when the add_credits call failed.

CREATE OR REPLACE FUNCTION public.approve_enrollment(
  _enrollment_id uuid,
  _admin_id      uuid,
  _unit_price    numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _enrollment RECORD;
  _new_payment_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Lock the row to prevent concurrent double-approval
  SELECT * INTO _enrollment
    FROM public.enrollments
    WHERE id = _enrollment_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', _enrollment_id;
  END IF;

  IF _enrollment.approval_status = 'APPROVED' THEN
    RAISE EXCEPTION 'Enrollment % is already approved', _enrollment_id;
  END IF;

  -- Manual/Egypt payments become PAID on approval
  _new_payment_status := CASE
    WHEN _enrollment.payment_provider IN ('manual', 'egypt_manual') THEN 'PAID'
    ELSE _enrollment.payment_status
  END;

  UPDATE public.enrollments
    SET status          = 'APPROVED',
        approval_status = 'APPROVED',
        payment_status  = _new_payment_status,
        reviewed_at     = NOW(),
        reviewed_by     = _admin_id,
        unit_price      = COALESCE(_unit_price, unit_price)
    WHERE id = _enrollment_id;

  -- Add credits in the same transaction — if this fails, the UPDATE above rolls back too
  PERFORM public.add_credits(_enrollment.user_id, _enrollment.classes_included);
END;
$$;
