-- Replace the trial schedule with a fixed weekly set of 4 slots:
--   Arabic  → Sunday 19:00 Africa/Cairo, Friday 19:00 Africa/Cairo
--   English → Monday 23:00 Asia/Kuala_Lumpur, Friday 23:00 Asia/Kuala_Lumpur
-- Students choose between the two slots for their language.

BEGIN;

UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired', archived_at = now()
WHERE lifecycle = 'active';

INSERT INTO public.trial_slots (
  trial_date, start_time, day_of_week, duration_min, capacity,
  is_active, lifecycle, timezone, class_language, meeting_url
)
VALUES
  ('2026-07-05', '19:00', 0, 30, 10, true, 'active', 'Africa/Cairo',        'arabic',  'https://meet.google.com/grx-pfhz-qzf'),
  ('2026-07-10', '19:00', 5, 30, 10, true, 'active', 'Africa/Cairo',        'arabic',  'https://meet.google.com/grx-pfhz-qzf'),
  ('2026-07-06', '23:00', 1, 30, 10, true, 'active', 'Asia/Kuala_Lumpur',   'english', 'https://meet.google.com/grx-pfhz-qzf'),
  ('2026-07-10', '23:00', 5, 30, 10, true, 'active', 'Asia/Kuala_Lumpur',   'english', 'https://meet.google.com/grx-pfhz-qzf')
ON CONFLICT (trial_date, start_time) DO UPDATE
  SET is_active      = true,
      lifecycle      = 'active',
      day_of_week    = EXCLUDED.day_of_week,
      duration_min   = EXCLUDED.duration_min,
      capacity       = EXCLUDED.capacity,
      timezone       = EXCLUDED.timezone,
      class_language = EXCLUDED.class_language,
      meeting_url    = EXCLUDED.meeting_url,
      archived_at    = NULL;

COMMIT;
