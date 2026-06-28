-- Enrollment UUIDs are identifiers, not authorization tokens. Restrict both
-- direct reads and the payment lookup RPC to the enrollment owner or an admin.

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE OR REPLACE FUNCTION public.get_enrollment_for_payment(p_enrollment_id uuid)
RETURNS TABLE (
  id uuid,
  plan_type text,
  class_type text,
  duration integer,
  amount numeric,
  currency text,
  approval_status text,
  due_at timestamptz,
  classes_included integer,
  receipt_url text,
  payment_method text,
  payment_date date,
  user_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    e.id,
    e.plan_type,
    e.class_type,
    e.duration,
    e.amount,
    e.currency,
    e.approval_status,
    e.due_at,
    e.classes_included,
    e.receipt_url,
    e.payment_method,
    e.payment_date,
    e.user_id
  FROM public.enrollments AS e
  WHERE e.id = p_enrollment_id
    AND auth.uid() IS NOT NULL
    AND (
      e.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.get_enrollment_for_payment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_enrollment_for_payment(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_enrollment_for_payment(uuid) TO authenticated;

-- SECURITY DEFINER routines must not resolve attacker-controlled objects and
-- cron-only helpers must not be callable through the public API.
ALTER FUNCTION public.increment_blog_view(text)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_search_engines_on_publish()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_sessions_for_reminder_24h()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_sessions_for_reminder_1h()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_class_reminder_24h()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_class_reminder_1h()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.auto_send_profile_reminders()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_abandoned_checkout_recovery()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_trial_followups()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_funnel_digest()
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.notify_search_engines_on_publish() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_sessions_for_reminder_24h() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_sessions_for_reminder_1h() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_class_reminder_24h() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_class_reminder_1h() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_send_profile_reminders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_abandoned_checkout_recovery() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_trial_followups() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_funnel_digest() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_sessions_for_reminder_24h() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_sessions_for_reminder_1h() TO service_role;
