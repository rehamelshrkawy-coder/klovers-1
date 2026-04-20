-- Track when an admin sent a "please rebook your trial" email to an unscheduled
-- (TBA) booking, so the UI can show "email sent N days ago" and stop spamming.
--
-- rebook_email_sent_at is set when the admin clicks "Send rebook email" in the
-- Trial Classes panel. When a student subsequently chooses a real slot the
-- admin moves their row and the timestamp is cleared (or simply ignored once
-- the row is no longer in the TBA group).

ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS rebook_email_sent_at timestamptz;
