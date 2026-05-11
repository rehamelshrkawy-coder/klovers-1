-- Move all active trial bookings to TBA so students can be re-assigned
-- to the new June 2026 dates (Jun 4 English, Jun 5 + Jun 7 Arabic).
UPDATE public.trial_bookings
SET
  trial_date = NULL,
  start_time = NULL,
  is_tba     = true
WHERE status IN ('confirmed', 'pending')
  AND is_tba = false;

-- Add class_language to trial_slots so booking page can filter by language.
ALTER TABLE public.trial_slots ADD COLUMN IF NOT EXISTS class_language TEXT DEFAULT 'arabic';

-- Thursday Jun 4 7 PM Cairo → English
UPDATE public.trial_slots SET class_language = 'english' WHERE trial_date = '2026-06-04';

-- Friday Jun 5 7 PM Cairo → Arabic
UPDATE public.trial_slots SET class_language = 'arabic'  WHERE trial_date = '2026-06-05';

-- Sunday Jun 7 6 PM Cairo → Arabic
UPDATE public.trial_slots SET class_language = 'arabic'  WHERE trial_date = '2026-06-07';
