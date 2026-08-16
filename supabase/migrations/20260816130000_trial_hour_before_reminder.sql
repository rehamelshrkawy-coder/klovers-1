-- Track the hour-before trial reminder.
--
-- send-trial-followups already covers prep (the day before), day1, day3 and
-- day7. There was nothing on the day itself: send-class-reminders does 24h/1h
-- but reads get_sessions_for_reminder_*, which cover enrolled group sessions
-- only — trial bookings were never in scope. So a student booked a free class,
-- got an email the day before, and then heard nothing until it started.
--
-- Idempotency for the new stage works the same way as the existing ones: a
-- nullable timestamp, stamped on send, checked on query.
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS followup_hour_before_sent_at timestamptz;

COMMENT ON COLUMN public.trial_bookings.followup_hour_before_sent_at IS
  'Stamped when the hour-before reminder goes out. Null means not yet sent; '
  'the cron uses it to avoid re-sending on the next hourly run.';

-- The stage queries by trial_date and filters unsent rows, which is the same
-- access pattern the other stages use.
CREATE INDEX IF NOT EXISTS idx_trial_bookings_hour_before_pending
  ON public.trial_bookings (trial_date)
  WHERE followup_hour_before_sent_at IS NULL;

NOTIFY pgrst, 'reload schema';
