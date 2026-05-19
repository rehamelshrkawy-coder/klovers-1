-- Add meeting_url to v_trial_slots_admin so the admin UI can display
-- and edit the class join link per slot. The column was added to trial_slots
-- on 2026-05-11 but the view was never updated to include it.
-- Also adds awaiting_attendance to booked_count so authenticated bookings count correctly.

CREATE OR REPLACE VIEW public.v_trial_slots_admin AS
WITH cfg AS (
  SELECT suggestion_weeks FROM public.trial_settings WHERE id = 1
),
occurrences AS (
  SELECT
    ts.id AS slot_id,
    ts.day_of_week,
    ts.start_time,
    ts.duration_min,
    ts.timezone,
    ts.capacity,
    ts.is_active,
    ts.lifecycle,
    ts.meeting_url,
    CURRENT_DATE
      + ((ts.day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7)
      + g.w * 7 AS occurrence_date
  FROM public.trial_slots ts
  CROSS JOIN LATERAL generate_series(0, (SELECT suggestion_weeks FROM cfg) - 1) g(w)
  WHERE ts.lifecycle = 'active' AND ts.is_active = true
)
SELECT
  o.slot_id,
  o.day_of_week,
  CASE o.day_of_week
    WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'   WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'  ELSE NULL
  END AS day_name,
  o.occurrence_date,
  o.start_time,
  o.duration_min,
  o.timezone,
  o.capacity,
  COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed','awaiting_attendance') AND tb.is_tba = false
                    THEN 1 ELSE 0 END), 0)::int AS booked_count,
  GREATEST(
    o.capacity - COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed','awaiting_attendance') AND tb.is_tba = false
                                    THEN 1 ELSE 0 END), 0)::int,
    0
  ) AS seats_left,
  (COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed','awaiting_attendance') AND tb.is_tba = false
                     THEN 1 ELSE 0 END), 0) >= o.capacity) AS is_full,
  o.lifecycle,
  o.meeting_url
FROM occurrences o
LEFT JOIN public.trial_bookings tb
  ON tb.day_of_week = o.day_of_week
 AND tb.start_time  = o.start_time
 AND tb.trial_date  = o.occurrence_date
GROUP BY o.slot_id, o.day_of_week, o.occurrence_date, o.start_time,
         o.duration_min, o.timezone, o.capacity, o.lifecycle, o.meeting_url
ORDER BY o.occurrence_date, o.start_time;
