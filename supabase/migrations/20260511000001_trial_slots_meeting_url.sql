-- Add meeting_url to trial_slots so each slot can carry its own Google Meet / Zoom link.
-- The link is shown as a "Join the Class" button in booking confirmation emails.
ALTER TABLE trial_slots ADD COLUMN IF NOT EXISTS meeting_url TEXT;
