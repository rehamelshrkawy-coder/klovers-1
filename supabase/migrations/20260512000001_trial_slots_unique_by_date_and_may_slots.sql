-- Swap unique constraint from (day_of_week, start_time, timezone) to
-- (trial_date, start_time) since slots are now specific-dated, not recurring weekly.
ALTER TABLE public.trial_slots
  DROP CONSTRAINT trial_slots_day_of_week_start_time_timezone_key;

ALTER TABLE public.trial_slots
  ADD CONSTRAINT trial_slots_trial_date_start_time_key UNIQUE (trial_date, start_time);

-- May English slots
INSERT INTO public.trial_slots (trial_date, start_time, day_of_week, capacity, is_active, lifecycle, timezone, class_language)
VALUES
  ('2026-05-21', '19:00', 4, 20, true, 'active', 'Africa/Cairo', 'english'),
  ('2026-05-23', '17:00', 6, 20, true, 'active', 'Africa/Cairo', 'english')
ON CONFLICT (trial_date, start_time) DO NOTHING;

-- May Arabic slots
INSERT INTO public.trial_slots (trial_date, start_time, day_of_week, capacity, is_active, lifecycle, timezone, class_language)
VALUES
  ('2026-05-22', '19:00', 5, 20, true, 'active', 'Africa/Cairo', 'arabic'),
  ('2026-05-24', '18:00', 0, 20, true, 'active', 'Africa/Cairo', 'arabic')
ON CONFLICT (trial_date, start_time) DO NOTHING;
