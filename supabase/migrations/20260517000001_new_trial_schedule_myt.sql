-- Replace all trial slots with 4 new official sessions.
-- Source timezone: Asia/Kuala_Lumpur (MYT, UTC+8).
-- Schedule:
--   1. 2026-05-29 01:00 MYT
--   2. 2026-05-30 23:00 MYT
--   3. 2026-06-02 23:00 MYT
--   4. 2026-06-07 09:00 MYT

-- Retire all existing active slots
UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired'
WHERE lifecycle = 'active';

-- Insert the 4 new MYT-anchored slots (class_language NULL = open to all)
INSERT INTO public.trial_slots (trial_date, start_time, day_of_week, capacity, is_active, lifecycle, timezone, class_language)
VALUES
  ('2026-05-29', '01:00', 5, 20, true, 'active', 'Asia/Kuala_Lumpur', NULL),
  ('2026-05-30', '23:00', 6, 20, true, 'active', 'Asia/Kuala_Lumpur', NULL),
  ('2026-06-02', '23:00', 2, 20, true, 'active', 'Asia/Kuala_Lumpur', NULL),
  ('2026-06-07', '09:00', 0, 20, true, 'active', 'Asia/Kuala_Lumpur', NULL)
ON CONFLICT (trial_date, start_time) DO UPDATE
  SET is_active  = true,
      lifecycle  = 'active',
      timezone   = 'Asia/Kuala_Lumpur',
      class_language = NULL;

-- Update the availability RPC:
--   • Use MYT as reference timezone for the cutoff date check
--   • Treat NULL class_language slots as universally available
CREATE OR REPLACE FUNCTION public.get_trial_availability(
  p_language text DEFAULT NULL
)
RETURNS TABLE (
  day_of_week    int,
  start_time     text,
  booked_count   bigint,
  capacity       int,
  duration_min   int,
  timezone       text,
  next_trial_date date,
  class_language text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    ts.trial_date AS next_trial_date,
    ts.class_language
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON  tb.day_of_week = ts.day_of_week
   AND tb.start_time   = ts.start_time
   AND tb.trial_date   = ts.trial_date
   AND tb.status NOT IN ('cancelled','rejected')
   AND tb.is_tba = false
  WHERE ts.is_active = true
    AND ts.lifecycle  = 'active'
    AND ts.trial_date IS NOT NULL
    AND ts.trial_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date
    AND (p_language IS NULL OR ts.class_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_trial_availability(text) TO anon, authenticated;
