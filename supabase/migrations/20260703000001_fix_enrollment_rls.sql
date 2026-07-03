-- Fix critical RLS privacy leak: enrollments were readable by any authenticated user.
-- Students could query all other students' payment amounts, receipt URLs, and plan details.
-- Replace the blanket auth.uid() IS NOT NULL policy with proper row-level access.

-- Drop the old permissive policy (check both possible names)
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow authenticated users to view enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow auth users to view enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "authenticated_read_enrollments" ON public.enrollments;

-- Students may only see their own rows
CREATE POLICY "students_own_enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins have full access (INSERT/UPDATE/DELETE handled by existing admin policies or service role)
CREATE POLICY "admins_all_enrollments" ON public.enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
