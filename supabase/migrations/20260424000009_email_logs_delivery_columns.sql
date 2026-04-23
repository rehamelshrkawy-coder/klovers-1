-- Extend email_logs to track actual delivery events from Resend webhooks.
-- status CHECK updated to allow 'delivered', 'bounced', 'complained'.

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bounced_at    TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ DEFAULT NULL;

-- Drop the old check and add the extended one
ALTER TABLE public.email_logs
  DROP CONSTRAINT IF EXISTS email_logs_status_check;

ALTER TABLE public.email_logs
  ADD CONSTRAINT email_logs_status_check
  CHECK (status IN ('sent', 'failed', 'delivered', 'bounced', 'complained'));
