-- Central log table for every email attempted (sent or failed) by edge functions
-- and trigger/cron functions. Enables admin visibility and resend support.

-- ── 1. Create email_logs table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  template      TEXT        NOT NULL,
  to_email      TEXT        NOT NULL,
  to_name       TEXT,
  enrollment_id UUID        REFERENCES public.enrollments(id) ON DELETE SET NULL,
  status        TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_id     TEXT,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Enable Row Level Security ──────────────────────────────────────────────
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- ── 3. Admin read policy ──────────────────────────────────────────────────────
CREATE POLICY "admins can select email_logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
