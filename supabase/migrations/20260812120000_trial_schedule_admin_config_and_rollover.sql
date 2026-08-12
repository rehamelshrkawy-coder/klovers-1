-- ============================================================
-- Trial schedule admin-configurability + minimum-group-size rollover
-- ------------------------------------------------------------
-- Everything here is additive: no existing column, function, or table is
-- removed, and get_trial_availability()/advance_trial_slots() keep their
-- existing shape — only the previously-hardcoded "day 1-7 of month" window
-- becomes a trial_settings-driven (and optional) check.
--
-- 1. trial_settings gains min_group_size + a configurable monthly window.
-- 2. trial_slots gains min_to_run / min_run_checked_at / session_period —
--    the admin can now fully edit a slot (date, time, language, period,
--    timezone, capacity, min-to-run, open/close) via fn_update_trial_slot.
-- 3. trial_bookings gains rollover_status / rollover_notified_at /
--    next_trial_month — additive side-channel, `status` itself is never
--    touched, so conversion tracking / trial_status_events / existing
--    dashboards are unaffected.
-- 4. New atomic claim_trial_min_run_check() (same shape as the existing
--    claim_trial_capacity_alert()) + run_trial_min_group_checks() wrapper,
--    invoked by a new daily pure-SQL pg_cron job — no net.http_post, same
--    pattern as advance_trial_slots()/age-stale-trial-bookings.
-- 5. v_trial_slots_admin is fixed to read ts.trial_date directly instead of
--    re-projecting fake weekly occurrences from day_of_week (that logic
--    predates the 20260512 switch to dated slots and was never updated —
--    it was showing admins fabricated dates for real dated slots. Fixing
--    it is required for the new schedule-management UI to show correct
--    dates, so it's in-scope here rather than a separate cleanup).
-- 6. Seeds the confirmed initial schedule (Fri/Sat/Sun full 4 sessions,
--    Monday 3 sessions — no Vietnam-morning slot on Monday, see book-trial
--    comments) as ordinary editable rows, not hardcoded logic.
-- ============================================================

-- ── 1. trial_settings: min group size + configurable window ────────────────
ALTER TABLE public.trial_settings
  ADD COLUMN IF NOT EXISTS min_group_size integer NOT NULL DEFAULT 3 CHECK (min_group_size > 0),
  ADD COLUMN IF NOT EXISTS window_start_day integer CHECK (window_start_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS window_end_day integer CHECK (window_end_day BETWEEN 1 AND 31);

COMMENT ON COLUMN public.trial_settings.min_group_size IS
  'Default minimum confirmed students for a trial group to run (per-slot override: trial_slots.min_to_run).';
COMMENT ON COLUMN public.trial_settings.window_start_day IS
  'Day-of-month a trial occurrence must fall on/after to be bookable. NULL (with window_end_day also NULL) = no restriction.';
COMMENT ON COLUMN public.trial_settings.window_end_day IS
  'Day-of-month a trial occurrence must fall on/before to be bookable. NULL (with window_start_day also NULL) = no restriction.';

-- Preserve current behavior (first week of month) as the starting, editable
-- config rather than leaving it hardcoded in SQL.
UPDATE public.trial_settings
SET min_group_size = 3, window_start_day = 1, window_end_day = 7
WHERE id = 1;

-- ── 2. trial_slots: per-slot min-to-run, claim marker, period label ────────
ALTER TABLE public.trial_slots
  ADD COLUMN IF NOT EXISTS min_to_run integer CHECK (min_to_run > 0),
  ADD COLUMN IF NOT EXISTS min_run_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_period text CHECK (session_period IN ('morning', 'evening', 'daytime'));

COMMENT ON COLUMN public.trial_slots.min_to_run IS
  'Per-slot override for minimum confirmed students to run. NULL = use trial_settings.min_group_size.';
COMMENT ON COLUMN public.trial_slots.min_run_checked_at IS
  'Set once run_trial_min_group_checks() has evaluated this occurrence (after its start time passed). Reset to NULL by advance_trial_slots() when the slot rolls to a new occurrence.';
COMMENT ON COLUMN public.trial_slots.session_period IS
  'Admin-facing label for the slot''s local time-of-day (Vietnam time) — informational only, not used by any booking logic.';

-- ── 3. trial_bookings: rollover side-channel (status itself is untouched) ──
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS rollover_status text CHECK (rollover_status IN ('pending_notification', 'notified')),
  ADD COLUMN IF NOT EXISTS rollover_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_trial_month date;

COMMENT ON COLUMN public.trial_bookings.rollover_status IS
  'Set when this booking''s trial group did not reach the minimum to run. NULL = not a rollover case. status column is never changed for rollover bookings.';
COMMENT ON COLUMN public.trial_bookings.rollover_notified_at IS
  'Dedupe guard — set once the trial_rollover email has actually been sent for this booking.';
COMMENT ON COLUMN public.trial_bookings.next_trial_month IS
  'First-of-month date of the schedule the student was pointed to when notified, for admin visibility/reporting.';

-- ── 4. get_trial_availability(): window from trial_settings, not hardcoded ─
-- Return type is changing (added session_period), so CREATE OR REPLACE isn't
-- enough — Postgres requires an explicit drop of the OUT-parameter signature.
DROP FUNCTION IF EXISTS public.get_trial_availability(text);

CREATE FUNCTION public.get_trial_availability(p_language text DEFAULT NULL::text)
RETURNS TABLE(day_of_week integer, start_time text, booked_count bigint, capacity integer, duration_min integer, timezone text, next_trial_date date, class_language text, session_period text)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    ts.trial_date AS next_trial_date,
    ts.class_language,
    ts.session_period
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON  tb.day_of_week = ts.day_of_week
   AND tb.start_time   = ts.start_time
   AND tb.trial_date   = ts.trial_date
   AND tb.status NOT IN ('cancelled','rejected')
   AND tb.is_tba = false
  CROSS JOIN LATERAL (
    SELECT window_start_day, window_end_day FROM public.trial_settings WHERE id = 1
  ) cfg
  WHERE ts.is_active = true
    AND ts.lifecycle  = 'active'
    AND ts.trial_date IS NOT NULL
    AND (ts.trial_date + ts.start_time::time) AT TIME ZONE COALESCE(ts.timezone, 'Asia/Ho_Chi_Minh') > now()
    AND (
      (cfg.window_start_day IS NULL AND cfg.window_end_day IS NULL)
      OR EXTRACT(DAY FROM ts.trial_date) BETWEEN cfg.window_start_day AND cfg.window_end_day
    )
    AND (p_language IS NULL OR ts.class_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language, ts.session_period
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$function$;

-- ── 5. advance_trial_slots(): same window, driven by trial_settings ────────
CREATE OR REPLACE FUNCTION public.advance_trial_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  slot RECORD;
  new_date date;
  v_window_start int;
  v_window_end int;
BEGIN
  SELECT window_start_day, window_end_day INTO v_window_start, v_window_end
  FROM public.trial_settings WHERE id = 1;

  FOR slot IN
    SELECT id, trial_date, start_time, timezone
    FROM public.trial_slots
    WHERE is_active = true
      AND lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND (
        (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Ho_Chi_Minh') <= now()
        OR (
          v_window_start IS NOT NULL AND v_window_end IS NOT NULL
          AND EXTRACT(DAY FROM trial_date) NOT BETWEEN v_window_start AND v_window_end
        )
      )
  LOOP
    new_date := slot.trial_date;
    WHILE (
      (new_date + slot.start_time::time) AT TIME ZONE COALESCE(slot.timezone, 'Asia/Ho_Chi_Minh') <= now()
      OR (
        v_window_start IS NOT NULL AND v_window_end IS NOT NULL
        AND EXTRACT(DAY FROM new_date) NOT BETWEEN v_window_start AND v_window_end
      )
    ) LOOP
      new_date := new_date + 7;
    END LOOP;

    UPDATE public.trial_slots
      SET trial_date = new_date,
          updated_at = now(),
          enrollment_alert_sent_at = CASE WHEN new_date <> slot.trial_date THEN NULL ELSE enrollment_alert_sent_at END,
          min_run_checked_at       = CASE WHEN new_date <> slot.trial_date THEN NULL ELSE min_run_checked_at END
      WHERE id = slot.id;
  END LOOP;
END;
$$;

-- ── 6. fn_update_trial_slot(): the admin "edit a slot" RPC ─────────────────
CREATE OR REPLACE FUNCTION public.fn_update_trial_slot(
  p_slot_id       uuid,
  p_trial_date    date DEFAULT NULL,
  p_start_time    text DEFAULT NULL,
  p_duration_min  integer DEFAULT NULL,
  p_capacity      integer DEFAULT NULL,
  p_min_to_run    integer DEFAULT NULL,
  p_class_language text DEFAULT NULL,
  p_session_period text DEFAULT NULL,
  p_timezone      text DEFAULT NULL,
  p_meeting_url   text DEFAULT NULL,
  p_lifecycle     text DEFAULT NULL,
  p_clear_min_to_run boolean DEFAULT false,
  p_clear_meeting_url boolean DEFAULT false
)
RETURNS public.trial_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.trial_slots;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'permission_denied: admin only' USING ERRCODE = '42501';
  END IF;
  IF p_start_time IS NOT NULL AND p_start_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'start_time must use HH:MM format';
  END IF;
  IF p_capacity IS NOT NULL AND p_capacity < 1 THEN
    RAISE EXCEPTION 'capacity must be positive';
  END IF;
  IF p_min_to_run IS NOT NULL AND p_min_to_run < 1 THEN
    RAISE EXCEPTION 'min_to_run must be positive';
  END IF;
  IF p_class_language IS NOT NULL AND p_class_language NOT IN ('arabic', 'english') THEN
    RAISE EXCEPTION 'class_language must be arabic or english';
  END IF;
  IF p_session_period IS NOT NULL AND p_session_period NOT IN ('morning', 'evening', 'daytime') THEN
    RAISE EXCEPTION 'session_period must be morning, evening, or daytime';
  END IF;
  IF p_lifecycle IS NOT NULL AND p_lifecycle NOT IN ('active', 'archived', 'retired') THEN
    RAISE EXCEPTION 'invalid_lifecycle: %', p_lifecycle;
  END IF;

  UPDATE public.trial_slots SET
    trial_date      = COALESCE(p_trial_date, trial_date),
    start_time      = COALESCE(p_start_time, start_time),
    day_of_week     = COALESCE(EXTRACT(DOW FROM p_trial_date)::int, day_of_week),
    duration_min    = COALESCE(p_duration_min, duration_min),
    capacity        = COALESCE(p_capacity, capacity),
    min_to_run      = CASE WHEN p_clear_min_to_run THEN NULL ELSE COALESCE(p_min_to_run, min_to_run) END,
    class_language  = COALESCE(p_class_language, class_language),
    session_period  = COALESCE(p_session_period, session_period),
    timezone        = COALESCE(p_timezone, timezone),
    meeting_url     = CASE WHEN p_clear_meeting_url THEN NULL ELSE COALESCE(p_meeting_url, meeting_url) END,
    lifecycle       = COALESCE(p_lifecycle, lifecycle),
    is_active       = CASE WHEN p_lifecycle IS NOT NULL THEN (p_lifecycle = 'active') ELSE is_active END,
    archived_at     = CASE WHEN p_lifecycle IS NOT NULL AND p_lifecycle <> 'active' THEN now()
                            WHEN p_lifecycle = 'active' THEN NULL
                            ELSE archived_at END,
    updated_at      = now()
  WHERE id = p_slot_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'trial slot not found: %', p_slot_id;
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_update_trial_slot FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_update_trial_slot TO authenticated;

-- ── 7. claim_trial_min_run_check(): atomic min-group-size claim ────────────
-- Same shape as claim_trial_capacity_alert(): row-locks the slot, claims
-- once via min_run_checked_at, and — only when the group under-filled —
-- marks the affected bookings as rollover candidates in the SAME
-- transaction (also suppressing their day1/day3/day7 follow-up emails,
-- since that class never actually happened).
CREATE OR REPLACE FUNCTION public.claim_trial_min_run_check(
  p_trial_date date,
  p_start_time text
)
RETURNS TABLE (
  should_rollover boolean,
  confirmed_count int,
  min_required int,
  affected_bookings int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_slot_id uuid;
  v_min_to_run int;
  v_default_min int;
  v_already_checked timestamptz;
  v_count int;
  v_affected int;
BEGIN
  SELECT id, min_to_run, min_run_checked_at
    INTO v_slot_id, v_min_to_run, v_already_checked
  FROM public.trial_slots
  WHERE trial_date = p_trial_date AND start_time = p_start_time
  FOR UPDATE;

  IF v_slot_id IS NULL OR v_already_checked IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::int, NULL::int, 0;
    RETURN;
  END IF;

  SELECT min_group_size INTO v_default_min FROM public.trial_settings WHERE id = 1;
  v_min_to_run := COALESCE(v_min_to_run, v_default_min, 3);

  SELECT COUNT(*) INTO v_count
  FROM public.trial_bookings
  WHERE trial_date = p_trial_date AND start_time = p_start_time
    AND status IN ('confirmed', 'confirmed_attendance') AND is_tba = false;

  UPDATE public.trial_slots SET min_run_checked_at = now() WHERE id = v_slot_id;

  IF v_count = 0 OR v_count >= v_min_to_run THEN
    RETURN QUERY SELECT false, v_count, v_min_to_run, 0;
    RETURN;
  END IF;

  UPDATE public.trial_bookings
  SET rollover_status = 'pending_notification',
      -- Suppress "how was your trial" nurture emails for a class that never
      -- ran — these columns are otherwise only ever set once an email is
      -- actually sent (see send-trial-followups), so this is a deliberate
      -- reuse of that idempotency convention to mean "does not apply".
      followup_day1_sent_at = COALESCE(followup_day1_sent_at, now()),
      followup_day3_sent_at = COALESCE(followup_day3_sent_at, now()),
      followup_day7_sent_at = COALESCE(followup_day7_sent_at, now())
  WHERE trial_date = p_trial_date AND start_time = p_start_time
    AND status IN ('confirmed', 'confirmed_attendance') AND is_tba = false
    AND rollover_status IS NULL;
  GET DIAGNOSTICS v_affected = ROW_COUNT;

  RETURN QUERY SELECT true, v_count, v_min_to_run, v_affected;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trial_min_run_check FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_trial_min_run_check TO service_role;

-- ── 8. run_trial_min_group_checks(): cron wrapper, pure SQL (no net.http_post) ─
CREATE OR REPLACE FUNCTION public.run_trial_min_group_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  slot RECORD;
BEGIN
  FOR slot IN
    SELECT trial_date, start_time
    FROM public.trial_slots
    WHERE lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND min_run_checked_at IS NULL
      AND (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Ho_Chi_Minh') <= now()
  LOOP
    PERFORM public.claim_trial_min_run_check(slot.trial_date, slot.start_time);
  END LOOP;
END;
$$;

-- ── 9. Cron: daily min-group-size check (pure SQL, same pattern as
--     advance_trial_slots / age-stale-trial-bookings) + hourly rollover
--     notification dispatcher (net.http_post, x-cron-secret, same pattern
--     as trial-followups-hourly) ────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-trial-min-group-size') THEN
    PERFORM cron.unschedule('check-trial-min-group-size');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trial-rollover-notifications-hourly') THEN
    PERFORM cron.unschedule('trial-rollover-notifications-hourly');
  END IF;
END $$;

SELECT cron.schedule(
  'check-trial-min-group-size',
  '0 3 * * *',  -- daily 03:00 UTC, after age-stale-trial-bookings (02:00)
  $$SELECT public.run_trial_min_group_checks()$$
);

SELECT cron.schedule(
  'trial-rollover-notifications-hourly',
  '35 * * * *',
  $cmd$
  SELECT net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-trial-rollover-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $cmd$
);

-- Extend the existing cron health monitor to also watch the two new jobs.
CREATE OR REPLACE FUNCTION public.check_trial_cron_health()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_failed record;
BEGIN
  FOR v_failed IN
    SELECT j.jobname, count(*) AS failures, max(d.start_time) AS last_failure
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE j.jobname IN (
      'trial-followups-hourly', 'trial-recover-silent-weekly',
      'age-stale-trial-bookings', 'purge-trial-rate-limits',
      'check-trial-min-group-size', 'trial-rollover-notifications-hourly'
    )
    AND d.status = 'failed'
    AND d.start_time > now() - interval '25 hours'
    GROUP BY j.jobname
  LOOP
    INSERT INTO public.admin_notifications (message, type)
    VALUES (
      format('Cron job "%s" failed %s time(s) in the last 25h (last: %s)',
        v_failed.jobname, v_failed.failures, v_failed.last_failure),
      'trial_cron_failure'
    );
  END LOOP;
END;
$$;

-- ── 10. Fix v_trial_slots_admin: read ts.trial_date directly ───────────────
-- The previous version (20260528000001) still re-projected fake weekly
-- occurrences from day_of_week via generate_series — a leftover from the
-- pre-20260512 weekly-recurring model, never updated after trial_slots
-- switched to one-off dated rows. It was showing admins fabricated dates
-- instead of the real trial_date. Fixing this is required for the new
-- schedule-editor UI to display correct dates.
-- Column set/order is changing from the previous definition (new columns
-- inserted mid-list, not appended), which CREATE OR REPLACE VIEW disallows —
-- drop and recreate instead.
DROP VIEW IF EXISTS public.v_trial_slots_admin;

CREATE VIEW public.v_trial_slots_admin AS
SELECT
  ts.id AS slot_id,
  ts.day_of_week,
  CASE ts.day_of_week
    WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'   WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'  ELSE NULL
  END AS day_name,
  ts.trial_date AS occurrence_date,
  ts.start_time,
  ts.duration_min,
  ts.timezone,
  ts.capacity,
  ts.min_to_run,
  ts.session_period,
  COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed','awaiting_attendance','confirmed_attendance') AND tb.is_tba = false
                    THEN 1 ELSE 0 END), 0)::int AS booked_count,
  GREATEST(
    ts.capacity - COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed','awaiting_attendance','confirmed_attendance') AND tb.is_tba = false
                                    THEN 1 ELSE 0 END), 0)::int,
    0
  ) AS seats_left,
  (COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed','awaiting_attendance','confirmed_attendance') AND tb.is_tba = false
                     THEN 1 ELSE 0 END), 0) >= ts.capacity) AS is_full,
  ts.lifecycle,
  ts.is_active,
  ts.meeting_url,
  ts.class_language
FROM public.trial_slots ts
LEFT JOIN public.trial_bookings tb
  ON tb.trial_date = ts.trial_date
 AND tb.start_time  = ts.start_time
WHERE ts.trial_date IS NOT NULL
GROUP BY ts.id, ts.day_of_week, ts.trial_date, ts.start_time, ts.duration_min,
         ts.timezone, ts.capacity, ts.min_to_run, ts.session_period,
         ts.lifecycle, ts.is_active, ts.meeting_url, ts.class_language
ORDER BY ts.trial_date, ts.start_time;

-- ── 11. Add rollover columns to v_trial_bookings_admin (additive only) ─────
CREATE OR REPLACE VIEW public.v_trial_bookings_admin AS
WITH cfg AS (
  SELECT program_start_date FROM public.trial_settings WHERE id = 1
)
SELECT
  tb.id, tb.name, tb.email, tb.phone, tb.level, tb.goal, tb.day_of_week,
  CASE tb.day_of_week
    WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'   WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'  ELSE NULL
  END AS day_name,
  tb.trial_date, tb.start_time, tb.status, tb.confirmed_at, tb.created_at,
  tb.user_id, tb.timezone,
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
  tb.is_tba, tb.email_sent_at, tb.email_opened_at, tb.attendance_response,
  tb.attendance_responded_at, tb.class_language,
  tb.rollover_status, tb.rollover_notified_at, tb.next_trial_month
FROM public.trial_bookings tb
LEFT JOIN public.trial_slots ts
  ON ts.day_of_week = tb.day_of_week
 AND ts.start_time  = tb.start_time;

-- ── 12. Seed the confirmed initial schedule ─────────────────────────────────
-- Retire the previous single-session-per-day rows (existing bookings are
-- matched by trial_date+start_time value, not a FK, so retiring these rows
-- does not affect any booking already made against them).
UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired', archived_at = now()
WHERE lifecycle = 'active';

-- Friday / Saturday / Sunday: all 4 sessions. Monday: 3 sessions (no
-- Vietnam-morning slot — see book-trial's nextDateForDay comment for why).
-- capacity/timezone match current live convention; min_to_run left NULL
-- (uses trial_settings.min_group_size); session_period is Vietnam-local
-- time-of-day, informational only.
INSERT INTO public.trial_slots
  (trial_date, start_time, day_of_week, duration_min, capacity, is_active, lifecycle, timezone, class_language, session_period)
VALUES
  -- Friday 2026-09-04
  ('2026-09-04', '08:00', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'morning'),
  ('2026-09-04', '14:00', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'daytime'),
  ('2026-09-04', '21:00', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-04', '22:30', 5, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'evening'),
  -- Saturday 2026-09-05
  ('2026-09-05', '08:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'morning'),
  ('2026-09-05', '14:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'daytime'),
  ('2026-09-05', '21:00', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-05', '22:30', 6, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'evening'),
  -- Sunday 2026-09-06
  ('2026-09-06', '08:00', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'morning'),
  ('2026-09-06', '14:00', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'daytime'),
  ('2026-09-06', '21:00', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-06', '22:30', 0, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'evening'),
  -- Monday 2026-09-07 — no English AM (no valid Vietnam-morning time exists
  -- outside the 09:00-18:00 workday on a working day)
  ('2026-09-07', '18:30', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'evening'),
  ('2026-09-07', '21:00', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'english', 'evening'),
  ('2026-09-07', '22:30', 1, 30, 10, true, 'active', 'Asia/Ho_Chi_Minh', 'arabic',  'evening')
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
