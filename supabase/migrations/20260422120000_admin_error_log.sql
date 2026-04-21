-- Lightweight observability sink for admin UI tab crashes.
-- Only service_role / authenticated admin users insert rows; nobody reads
-- except admins via the Supabase dashboard. Keep payload sizes bounded in
-- the application layer (TabErrorBoundary.componentDidCatch already caps).

CREATE TABLE IF NOT EXISTS public.admin_error_log (
  id              bigserial PRIMARY KEY,
  tab             text NOT NULL,
  message         text NOT NULL,
  stack           text,
  component_stack text,
  user_agent      text,
  url             text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_error_log_created_at_idx
  ON public.admin_error_log (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_error_log_tab_idx
  ON public.admin_error_log (tab, created_at DESC);

ALTER TABLE public.admin_error_log ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert (the app already gates the admin UI
-- behind ProtectedRoute; non-admin sessions wouldn't reach the boundary).
DROP POLICY IF EXISTS admin_error_log_insert ON public.admin_error_log;
CREATE POLICY admin_error_log_insert
  ON public.admin_error_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reads restricted to service_role (inspect via Supabase dashboard).
-- No SELECT policy for anon / authenticated → effectively read-deny.
