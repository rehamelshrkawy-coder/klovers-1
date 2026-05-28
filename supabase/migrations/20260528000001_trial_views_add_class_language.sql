-- Expose class_language in both admin views so the admin dashboard can
-- determine what language (arabic / english) each booking and slot uses.
--
-- trial_bookings.class_language already exists (set at booking time from the
-- portal the student used). v_trial_bookings_admin was just missing it.
-- trial_slots.class_language also exists; v_trial_slots_admin was missing it.

-- ── v_trial_bookings_admin ────────────────────────────────────────────────────
-- Adds tb.class_language at the end of the SELECT (safe for CREATE OR REPLACE).
CREATE OR REPLACE VIEW public.v_trial_bookings_admin AS
WITH cfg AS (
  SELECT program_start_date FROM public.trial_settings WHERE id = 1
)
SELECT
  tb.id,
  tb.name,
  tb.email,
  tb.phone,
  tb.level,
  tb.goal,
  tb.day_of_week,
  CASE tb.day_of_week
    WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'   WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'  ELSE NULL
  END AS day_name,
  tb.trial_date,
  tb.start_time,
  tb.status,
  tb.confirmed_at,
  tb.created_at,
  tb.user_id,
  tb.timezone,
  ts.id        AS slot_id,
  ts.lifecycle AS slot_lifecycle,
  ts.is_active AS slot_is_active,
  ts.capacity  AS slot_capacity,
  ts.duration_min AS slot_duration_min,
  (ts.id IS NOT NULL) AS slot_exists,
  CASE
    WHEN tb.is_tba THEN 'tba'
    WHEN tb.trial_date >= CURRENT_DATE THEN 'upcoming'
    ELSE 'past'
  END AS time_bucket,
  CASE
    WHEN (SELECT program_start_date FROM cfg) IS NULL THEN 'pre_launch'
    WHEN tb.trial_date IS NULL THEN 'pre_launch'
    WHEN tb.trial_date < (SELECT program_start_date FROM cfg) THEN 'pre_launch'
    ELSE 'active_program'
  END AS program_phase,
  tb.is_tba,
  tb.email_sent_at,
  tb.email_opened_at,
  tb.attendance_response,
  tb.attendance_responded_at,
  tb.class_language
FROM public.trial_bookings tb
LEFT JOIN public.trial_slots ts
  ON ts.day_of_week = tb.day_of_week
 AND ts.start_time  = tb.start_time;

-- ── v_trial_slots_admin ───────────────────────────────────────────────────────
-- Adds ts.class_language to occurrences CTE and the main SELECT / GROUP BY.
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
    ts.class_language,
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
  o.meeting_url,
  o.class_language
FROM occurrences o
LEFT JOIN public.trial_bookings tb
  ON tb.day_of_week = o.day_of_week
 AND tb.start_time  = o.start_time
 AND tb.trial_date  = o.occurrence_date
GROUP BY o.slot_id, o.day_of_week, o.occurrence_date, o.start_time,
         o.duration_min, o.timezone, o.capacity, o.lifecycle, o.meeting_url,
         o.class_language
ORDER BY o.occurrence_date, o.start_time;
