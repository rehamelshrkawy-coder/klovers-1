-- Add optional language filter to get_trial_availability so the slot picker
-- only shows English slots when classLanguage='english' and Arabic slots when
-- classLanguage='arabic'. Also return class_language in the result set.
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
    AND ts.lifecycle = 'active'
    AND ts.trial_date IS NOT NULL
    AND ts.trial_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Cairo')::date
    AND (p_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$$;
