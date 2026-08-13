-- ============================================================
-- Restructure trial schedule: language-dedicated days instead of a
-- mixed-language day. Friday + Saturday become all-Arabic (4 sessions
-- each); Sunday + Monday become all-English (4 sessions each).
--
-- This is a data-only change — no function/algorithm changes. The
-- Friday-Monday block generation fixed in 20260812130000 is unaffected:
-- advance_trial_slots() rolls each row forward to next month's block by
-- day_of_week, independent of class_language.
--
-- Booking, capacity, attendance, confirmation, waitlist, follow-up, and
-- rollover logic are all untouched.
-- ============================================================

UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired', archived_at = now()
WHERE lifecycle = 'active';

INSERT INTO public.trial_slots
  (trial_date, start_time, day_of_week, duration_min, capacity, is_active, lifecycle, timezone, class_language, session_period)
VALUES
  -- Friday 2026-09-04 — Arabic, 4 sessions (Egypt morning through evening)
  ('2026-09-04', '14:00', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'daytime'),
  ('2026-09-04', '17:00', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'daytime'),
  ('2026-09-04', '20:00', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'evening'),
  ('2026-09-04', '22:30', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'evening'),
  -- Saturday 2026-09-05 — Arabic, same 4 times
  ('2026-09-05', '14:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'daytime'),
  ('2026-09-05', '17:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'daytime'),
  ('2026-09-05', '20:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'evening'),
  ('2026-09-05', '22:30', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic', 'evening'),
  -- Sunday 2026-09-06 — English, 4 sessions (all outside Mon-Thu work hours
  -- for consistency with Monday, spread across US Eastern-to-Pacific mornings)
  ('2026-09-06', '19:00', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-06', '20:30', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-06', '22:00', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-06', '23:30', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  -- Monday 2026-09-07 — English, same 4 times (all after 18:00 Vietnam,
  -- clear of the 09:00-18:00 Mon-Thu workday)
  ('2026-09-07', '19:00', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-07', '20:30', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-07', '22:00', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-07', '23:30', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening')
ON CONFLICT (trial_date, start_time) DO UPDATE
  SET day_of_week    = EXCLUDED.day_of_week,
      duration_min   = EXCLUDED.duration_min,
      capacity       = EXCLUDED.capacity,
      is_active      = true,
      lifecycle      = 'active',
      archived_at    = NULL,
      timezone       = EXCLUDED.timezone,
      class_language = EXCLUDED.class_language,
      session_period = EXCLUDED.session_period,
      enrollment_alert_sent_at = NULL,
      min_run_checked_at = NULL;
