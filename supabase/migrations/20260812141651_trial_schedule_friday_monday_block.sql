-- ============================================================
-- Fix monthly trial-day generation: always the Friday-Saturday-Sunday-
-- Monday block of each month, computed from the real calendar — not a
-- day-of-month range.
-- ------------------------------------------------------------
-- The window_start_day/window_end_day approach from the previous migration
-- (20260812120000) is NOT equivalent to "always Fri-Sat-Sun-Mon of the
-- first week": traced against the real calendar, November 2026's block is
-- Fri Nov 6 - Mon Nov 9, but Nov 8/9 fall outside day-of-month 1-7. Under
-- the old advance_trial_slots(), the Sunday row would skip all of November
-- and land in December, and the Monday row would land on Nov 2 — a
-- different, disconnected Monday, not paired with Nov 6/7/8. September and
-- October 2026 happen to fall entirely within days 1-7, which is why this
-- wasn't caught immediately.
--
-- This migration touches ONLY the generation functions, not data — the
-- current live September 2026 rows (Fri 9/4 - Mon 9/7) are already correct
-- and untouched by this: advance_trial_slots() only acts on rows whose
-- occurrence has already passed, and none have as of this migration.
--
-- Booking, capacity, attendance, confirmation, waitlist, follow-up, and
-- rollover logic are all untouched.
-- ============================================================

-- ── 1. Configurable block definition (not hard-coded) ──────────────────────
ALTER TABLE public.trial_settings
  ADD COLUMN IF NOT EXISTS trial_block_start_dow integer NOT NULL DEFAULT 5 CHECK (trial_block_start_dow BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS trial_block_days integer NOT NULL DEFAULT 4 CHECK (trial_block_days BETWEEN 1 AND 7);

COMMENT ON COLUMN public.trial_settings.trial_block_start_dow IS
  'Day-of-week (0=Sunday..6=Saturday, same convention as trial_slots.day_of_week) that starts each month''s trial block. Default 5 = Friday.';
COMMENT ON COLUMN public.trial_settings.trial_block_days IS
  'Number of consecutive days in the trial block starting at trial_block_start_dow. Default 4 = Friday through Monday.';

-- ── 2. fn_first_trial_block_date(): first occurrence of the configured
--     start-of-block weekday on/after the 1st of the given month ──────────
CREATE OR REPLACE FUNCTION public.fn_first_trial_block_date(p_month date)
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('month', p_month)::date
    + (
        (
          (SELECT trial_block_start_dow FROM public.trial_settings WHERE id = 1)
          - EXTRACT(DOW FROM date_trunc('month', p_month))::int
          + 7
        ) % 7
      );
$$;

-- ── 3. advance_trial_slots(): roll each row to next month's block ──────────
-- Replaces the +7-day/day-of-month-window loop with a direct computation:
-- next month's block start, then this row's own weekday offset within it.
-- Keeps all sessions of a trial weekend correctly grouped every month,
-- regardless of which day-of-month numbers result.
CREATE OR REPLACE FUNCTION public.advance_trial_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  slot RECORD;
  new_date date;
  target_month date;
  block_start date;
  dow_offset int;
BEGIN
  FOR slot IN
    SELECT id, trial_date, start_time, timezone, day_of_week
    FROM public.trial_slots
    WHERE is_active = true
      AND lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Ho_Chi_Minh') <= now()
  LOOP
    target_month := date_trunc('month', slot.trial_date)::date;
    LOOP
      target_month := (target_month + interval '1 month')::date;
      block_start := public.fn_first_trial_block_date(target_month);
      dow_offset := ((slot.day_of_week - EXTRACT(DOW FROM block_start)::int) + 7) % 7;
      new_date := block_start + dow_offset;
      EXIT WHEN (new_date + slot.start_time::time) AT TIME ZONE COALESCE(slot.timezone, 'Asia/Ho_Chi_Minh') > now();
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

-- ── 4. get_trial_availability(): drop the day-of-month window filter ───────
-- It's now redundant (the block is enforced by generation, not by an
-- availability filter) and was actively wrong for months like November
-- 2026, where it would have hidden a correctly-computed Nov 9 Monday slot.
-- Return type is unchanged from the previous migration, so CREATE OR
-- REPLACE is sufficient here (no DROP needed).
CREATE OR REPLACE FUNCTION public.get_trial_availability(p_language text DEFAULT NULL::text)
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
  WHERE ts.is_active = true
    AND ts.lifecycle  = 'active'
    AND ts.trial_date IS NOT NULL
    AND (ts.trial_date + ts.start_time::time) AT TIME ZONE COALESCE(ts.timezone, 'Asia/Ho_Chi_Minh') > now()
    AND (p_language IS NULL OR ts.class_language IS NULL OR ts.class_language = p_language)
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone, ts.trial_date, ts.class_language, ts.session_period
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.trial_date, ts.start_time;
$function$;
