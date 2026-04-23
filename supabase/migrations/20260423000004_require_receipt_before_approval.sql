-- Enforce receipt presence at the database level before any manual/Egypt
-- enrollment can be approved.
--
-- The frontend already guards this, but a BEFORE UPDATE trigger ensures
-- no direct DB manipulation or future API path can bypass it.

CREATE OR REPLACE FUNCTION public.validate_receipt_before_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check when transitioning into APPROVED from a non-APPROVED state
  IF NEW.approval_status = 'APPROVED'
     AND (OLD.approval_status IS DISTINCT FROM 'APPROVED')
     AND NEW.payment_provider IN ('egypt_manual', 'manual')
     AND (
       NEW.receipt_url IS NULL
       OR trim(NEW.receipt_url) = ''
       OR NEW.receipt_url = 'manual'
     )
  THEN
    RAISE EXCEPTION
      'Cannot approve enrollment % — no payment receipt on file. '
      'The student must upload a receipt before approval.',
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_receipt_before_approval ON public.enrollments;
CREATE TRIGGER trg_validate_receipt_before_approval
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.validate_receipt_before_approval();
