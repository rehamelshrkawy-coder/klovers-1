-- Trial scheduling cleanup round 2:
--   #1 Capture prod-only admin views/functions (v_trial_bookings_admin,
--      v_trial_slots_admin, fn_suggest_trial_slots, fn_retire_trial_slot,
--      fn_trial_slot_conflicts, _trial_time_to_minutes, get_trial_availability)
--      in git so a fresh clone can rebuild the admin UI.
--   #2 Retire TBA sentinel values ('TBA' / '2099-12-31'). Make start_time and
--      trial_date nullable; is_tba now derives from NULL-ness. Normalises
--      existing sentinel rows.
--   #3 Re-scope email uniqueness: one TBA placeholder per email, plus
--      one real active booking per (email, slot). Drops the blanket
--      lifetime-unique index.
--   #4 Widen conflict trigger to true duration overlap instead of exact
--      start_time match.
--   #5 get_trial_availability already queries trial_slots on prod; capture
--      its current definition here so git matches reality.

BEGIN;

-- Prod originally received these objects manually. Capture the prerequisites
-- before any views/functions reference them so a fresh migration run works.
ALTER TABLE public.trial_slots
  ADD COLUMN IF NOT EXISTS lifecycle text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS trial_date date;

CREATE TABLE IF NOT EXISTS public.trial_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  program_start_date date,
  default_duration_min integer NOT NULL DEFAULT 30 CHECK (default_duration_min > 0),
  suggestion_weeks integer NOT NULL DEFAULT 8 CHECK (suggestion_weeks BETWEEN 1 AND 52),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.trial_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage trial settings" ON public.trial_settings;
CREATE POLICY "Admins manage trial settings"
  ON public.trial_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ─── #2: retire sentinels ─────────────────────────────────────────────────────
ALTER TABLE public.trial_bookings
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE public.trial_bookings
  ALTER COLUMN trial_date DROP NOT NULL;

-- Drop conflict trigger temporarily so the normalisation update doesn't trip
-- on it. (It only fires on INSERT/UPDATE OF specific columns but is_tba rows
-- are exempt anyway, so this is just defensive.)
DROP TRIGGER IF EXISTS trg_trial_bookings_check_conflict ON public.trial_bookings;
DROP TRIGGER IF EXISTS trg_trial_bookings_sync_is_tba ON public.trial_bookings;

-- Normalise legacy sentinel rows to NULL.
UPDATE public.trial_bookings
   SET start_time = NULL,
       trial_date = NULL
 WHERE start_time = 'TBA' OR trial_date = DATE '2099-12-31';

-- New sync rule: is_tba is true iff start_time or trial_date is NULL.
-- Callers don't need to set is_tba directly.
CREATE OR REPLACE FUNCTION public.trial_bookings_sync_is_tba()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_tba := (NEW.start_time IS NULL OR NEW.trial_date IS NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trial_bookings_sync_is_tba
  BEFORE INSERT OR UPDATE OF start_time, trial_date, is_tba
  ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trial_bookings_sync_is_tba();


-- ─── #3: re-scope email uniqueness ────────────────────────────────────────────
-- Drop the blanket lifetime-unique and any older active-unique indexes.
DROP INDEX IF EXISTS public.idx_trial_bookings_unique_email;
DROP INDEX IF EXISTS public.idx_trial_bookings_unique_active;

-- One TBA placeholder per email (prevents admin from double-creating).
CREATE UNIQUE INDEX idx_trial_bookings_one_tba_per_email
  ON public.trial_bookings ((lower(email)))
  WHERE is_tba = true;

-- One real active booking per (email, slot). Re-books after cancel/no_show
-- are allowed; re-booking the exact same slot twice is not.
CREATE UNIQUE INDEX idx_trial_bookings_unique_active
  ON public.trial_bookings ((lower(email)), trial_date, start_time)
  WHERE is_tba = false AND status IN ('pending', 'confirmed');


-- ─── #4: widen conflict trigger to duration overlap ───────────────────────────
CREATE OR REPLACE FUNCTION public.trial_bookings_check_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trial_start_min int;
  v_trial_end_min   int;
  v_trial_dur_min   int;
  v_conflict_count  int;
BEGIN
  IF NEW.is_tba OR NEW.user_id IS NULL
     OR NEW.status NOT IN ('pending','confirmed')
     OR NEW.trial_date IS NULL OR NEW.start_time IS NULL THEN
    RETURN NEW;
  END IF;

  v_trial_dur_min := COALESCE(
    (SELECT ts.duration_min
       FROM public.trial_slots ts
      WHERE ts.day_of_week = NEW.day_of_week
        AND ts.start_time  = NEW.start_time
        AND ts.is_active   = true
      LIMIT 1),
    (SELECT default_duration_min FROM public.trial_settings WHERE id = 1),
    30
  );

  v_trial_start_min := public._trial_time_to_minutes(NEW.start_time);
  v_trial_end_min   := v_trial_start_min + v_trial_dur_min;

  -- Overlap with a group class the user is actively enrolled in on this date.
  SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.pkg_group_sessions s
    JOIN public.pkg_groups        g ON g.id = s.group_id
    JOIN public.schedule_packages p ON p.id = g.package_id
    JOIN public.pkg_group_members m ON m.group_id = g.id AND m.user_id = NEW.user_id
   WHERE s.session_date = NEW.trial_date
     AND m.member_status = 'active'
     AND NOT (
       v_trial_end_min   <= (EXTRACT(HOUR FROM p.start_time)::int * 60
                             + EXTRACT(MINUTE FROM p.start_time)::int)
       OR v_trial_start_min >= (EXTRACT(HOUR FROM p.start_time)::int * 60
                                + EXTRACT(MINUTE FROM p.start_time)::int
                                + p.duration_min)
     );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION
      'trial_booking_conflict: user % has an overlapping class at % on %',
      NEW.user_id, NEW.start_time, NEW.trial_date
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trial_bookings_check_conflict
  BEFORE INSERT OR UPDATE OF day_of_week, start_time, trial_date, status, user_id, is_tba
  ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trial_bookings_check_conflict();


-- ─── #1: capture prod-only admin views/functions ──────────────────────────────
-- (These already exist in production; CREATE OR REPLACE is idempotent. Having
-- them in migrations means a fresh clone can rebuild the admin surface.)

CREATE OR REPLACE FUNCTION public._trial_time_to_minutes(t text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN t IS NULL OR t = '' THEN NULL
    ELSE (split_part(t, ':', 1))::int * 60 + (split_part(t, ':', 2))::int
  END
$$;

CREATE OR REPLACE FUNCTION public.fn_trial_slot_conflicts(
  p_day_of_week integer,
  p_start_text  text,
  p_duration_min integer DEFAULT NULL
)
RETURNS TABLE(source text, detail text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start int := public._trial_time_to_minutes(p_start_text);
  v_dur   int := COALESCE(p_duration_min,
                          (SELECT default_duration_min FROM public.trial_settings WHERE id = 1),
                          30);
  v_end   int;
BEGIN
  IF v_start IS NULL THEN RETURN; END IF;
  v_end := v_start + v_dur;

  RETURN QUERY
  SELECT 'schedule_package'::text,
         format('Group class on day %s at %s for %s min',
                sp.day_of_week, sp.start_time, sp.duration_min)
  FROM public.schedule_packages sp
  WHERE sp.is_active = true
    AND sp.day_of_week = p_day_of_week
    AND NOT (
      v_end   <= (EXTRACT(HOUR FROM sp.start_time)::int * 60
                  + EXTRACT(MINUTE FROM sp.start_time)::int)
      OR v_start >= (EXTRACT(HOUR FROM sp.start_time)::int * 60
                     + EXTRACT(MINUTE FROM sp.start_time)::int
                     + sp.duration_min)
    );

  RETURN QUERY
  SELECT 'matching_slot'::text,
         format('Matching slot %s %s %s', ms.course_level, ms.day, ms.time)
  FROM public.matching_slots ms
  WHERE ms.status IN ('open','confirmed','full')
    AND CASE lower(ms.day)
          WHEN 'sunday' THEN 0 WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6 ELSE -1 END = p_day_of_week
    AND NOT (
      v_end   <= public._trial_time_to_minutes(ms.time)
      OR v_start >= public._trial_time_to_minutes(ms.time) + 90
    );

  RETURN QUERY
  SELECT 'trial_slot'::text,
         format('Existing trial slot on day %s at %s',
                ts.day_of_week, ts.start_time)
  FROM public.trial_slots ts
  WHERE ts.lifecycle = 'active' AND ts.is_active = true
    AND ts.day_of_week = p_day_of_week
    AND NOT (
      v_end   <= public._trial_time_to_minutes(ts.start_time)
      OR v_start >= public._trial_time_to_minutes(ts.start_time) + ts.duration_min
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_retire_trial_slot(
  p_slot_id uuid,
  p_new_lifecycle text DEFAULT 'retired'
)
RETURNS public.trial_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  );
  v_row public.trial_slots;
BEGIN
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'permission_denied: admin only' USING ERRCODE = '42501';
  END IF;
  IF p_new_lifecycle NOT IN ('active','archived','retired') THEN
    RAISE EXCEPTION 'invalid_lifecycle: %', p_new_lifecycle;
  END IF;

  UPDATE public.trial_slots
     SET lifecycle   = p_new_lifecycle,
         is_active   = (p_new_lifecycle = 'active'),
         archived_at = CASE WHEN p_new_lifecycle <> 'active' THEN now() ELSE NULL END,
         updated_at  = now()
   WHERE id = p_slot_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Availability RPC — already replaced on prod to query trial_slots; capture
-- it here so the migration file matches reality.
CREATE OR REPLACE FUNCTION public.get_trial_availability()
RETURNS TABLE(
  day_of_week  integer,
  start_time   text,
  booked_count bigint,
  capacity     integer,
  duration_min integer,
  timezone     text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ts.day_of_week,
    ts.start_time,
    COALESCE(COUNT(tb.id), 0) AS booked_count,
    ts.capacity,
    ts.duration_min,
    ts.timezone
  FROM public.trial_slots ts
  LEFT JOIN public.trial_bookings tb
    ON tb.day_of_week = ts.day_of_week
   AND tb.start_time  = ts.start_time
   AND tb.trial_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
   AND tb.status NOT IN ('cancelled')
   AND tb.is_tba = false
  WHERE ts.is_active = true AND ts.lifecycle = 'active'
  GROUP BY ts.id, ts.day_of_week, ts.start_time, ts.capacity, ts.duration_min, ts.timezone
  HAVING COALESCE(COUNT(tb.id), 0) < ts.capacity
  ORDER BY ts.day_of_week, ts.start_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_trial_availability() TO anon, authenticated;

-- Admin views — is_tba-aware, NULL-safe. Drop first: CREATE OR REPLACE
-- cannot reorder or insert columns, and we're adding is_tba at the end.
DROP VIEW IF EXISTS public.v_trial_slots_admin;
DROP VIEW IF EXISTS public.v_trial_bookings_admin;

CREATE VIEW public.v_trial_bookings_admin AS
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
  tb.is_tba
FROM public.trial_bookings tb
LEFT JOIN public.trial_slots ts
  ON ts.day_of_week = tb.day_of_week
 AND ts.start_time  = tb.start_time;

CREATE VIEW public.v_trial_slots_admin AS
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
  COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed') AND tb.is_tba = false
                    THEN 1 ELSE 0 END), 0)::int AS booked_count,
  GREATEST(
    o.capacity - COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed') AND tb.is_tba = false
                                    THEN 1 ELSE 0 END), 0)::int,
    0
  ) AS seats_left,
  (COALESCE(SUM(CASE WHEN tb.status IN ('pending','confirmed') AND tb.is_tba = false
                     THEN 1 ELSE 0 END), 0) >= o.capacity) AS is_full,
  o.lifecycle
FROM occurrences o
LEFT JOIN public.trial_bookings tb
  ON tb.day_of_week = o.day_of_week
 AND tb.start_time  = o.start_time
 AND tb.trial_date  = o.occurrence_date
GROUP BY o.slot_id, o.day_of_week, o.occurrence_date, o.start_time,
         o.duration_min, o.timezone, o.capacity, o.lifecycle
ORDER BY o.occurrence_date, o.start_time;

CREATE OR REPLACE FUNCTION public.fn_suggest_trial_slots()
RETURNS TABLE(
  day_of_week integer,
  day_name text,
  start_time text,
  duration_min integer,
  timezone text,
  source text,
  score integer,
  reasons text[],
  is_reasonable_hour boolean,
  has_historical_demand boolean,
  would_replace_full_slot boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_dur int := COALESCE(
    (SELECT default_duration_min FROM public.trial_settings WHERE id = 1), 30);
  v_tz text := 'Africa/Cairo';
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT DISTINCT
      ta.day_of_week AS c_dow,
      ta.start_time  AS c_start,
      v_default_dur  AS c_dur,
      v_tz           AS c_tz,
      'teacher_availability'::text AS c_src
    FROM public.teacher_availability ta
    WHERE COALESCE(ta.is_available, true)
  ),
  filtered AS (
    SELECT c.*
    FROM candidates c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.trial_slots ts
      WHERE ts.lifecycle = 'active' AND ts.is_active = true
        AND ts.day_of_week = c.c_dow
        AND ts.start_time  = c.c_start
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.fn_trial_slot_conflicts(c.c_dow, c.c_start, c.c_dur)
    )
  ),
  demand AS (
    SELECT tb.day_of_week AS d_dow, tb.start_time AS d_start, COUNT(*) AS past_attempts
    FROM public.trial_bookings tb
    WHERE tb.is_tba = false AND tb.start_time IS NOT NULL
    GROUP BY tb.day_of_week, tb.start_time
  ),
  full_active AS (
    SELECT DISTINCT 1 AS has_full FROM public.v_trial_slots_admin v WHERE v.is_full = true
  ),
  scored AS (
    SELECT
      f.c_dow AS r_dow,
      CASE f.c_dow
        WHEN 0 THEN 'Sunday'    WHEN 1 THEN 'Monday'   WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END AS r_day_name,
      f.c_start AS r_start,
      f.c_dur   AS r_dur,
      f.c_tz    AS r_tz,
      f.c_src   AS r_src,
      (
        100
        + CASE
            WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (9*60)  AND (22*60) THEN  20
            WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (22*60) AND (24*60)
              OR public._trial_time_to_minutes(f.c_start) < (2*60)                     THEN -30
            ELSE 0
          END
        + CASE WHEN d.past_attempts IS NOT NULL AND d.past_attempts >= 1 THEN 15 ELSE 0 END
        + CASE WHEN EXISTS (SELECT 1 FROM full_active) THEN 10 ELSE 0 END
      ) AS r_score,
      ARRAY_REMOVE(ARRAY[
        'Matches teacher availability window',
        CASE WHEN public._trial_time_to_minutes(f.c_start) BETWEEN (9*60) AND (22*60)
             THEN 'Student-friendly hour (09:00-22:00 Cairo)' ELSE NULL END,
        CASE WHEN d.past_attempts IS NOT NULL AND d.past_attempts >= 1
             THEN format('Demonstrated demand (%s past booking attempt(s))', d.past_attempts)
             ELSE NULL END,
        CASE WHEN EXISTS (SELECT 1 FROM full_active)
             THEN 'Helps absorb overflow from a full existing slot' ELSE NULL END,
        'No clash with group classes, matching slots, or other trial slots'
      ], NULL) AS r_reasons,
      (public._trial_time_to_minutes(f.c_start) BETWEEN (9*60) AND (22*60)) AS r_reasonable,
      (d.past_attempts IS NOT NULL AND d.past_attempts >= 1) AS r_demand,
      EXISTS (SELECT 1 FROM full_active) AS r_overflow
    FROM filtered f
    LEFT JOIN demand d ON d.d_dow = f.c_dow AND d.d_start = f.c_start
  )
  SELECT s.r_dow, s.r_day_name, s.r_start, s.r_dur, s.r_tz, s.r_src,
         s.r_score, s.r_reasons, s.r_reasonable, s.r_demand, s.r_overflow
  FROM scored s
  ORDER BY s.r_score DESC, s.r_dow, s.r_start;
END
$$;

COMMIT;
