-- ============================================================
-- Teacher schedule — hand-entered empty (free) and busy slots
-- ------------------------------------------------------------
-- The existing `teacher_availability` table models a *recurring weekly*
-- boolean grid (day_of_week + start_time + is_available). It has no concept
-- of a concrete date, no end time, and no way to say "this particular
-- Tuesday 18:00 is taken". This migration adds the dated, hand-managed
-- schedule alongside it — nothing in `teacher_availability` is touched, so
-- TeacherAvailabilityManager / scheduleAutomation keep working unchanged.
--
-- 1. `teacher_schedule_slots` — one row per concrete (date, start, end)
--    block, each marked `empty` (teacher is free) or `busy` (teacher is
--    taken). A GiST exclusion constraint makes it physically impossible to
--    store two overlapping blocks for the same teacher.
-- 2. Validation trigger — end after start, real IANA timezone, one timezone
--    per teacher/day (the overlap guard compares wall-clock times, so mixing
--    timezones on one day would silently defeat it), and no student linked
--    to an `empty` block.
-- 3. RLS — admins manage every teacher's schedule, a teacher manages their
--    own. There is deliberately no public SELECT policy: outside callers go
--    through `get_teacher_open_slots()`, which returns only the safe columns
--    (no label, no notes, no student).
-- 4. RPCs for hand entry: add one, add many (weekday x time grid over a date
--    range), flip empty <-> busy, move/resize, delete one, clear a range,
--    and read the schedule back.
-- ============================================================

-- btree_gist gives GiST an equality operator class for uuid, which the
-- exclusion constraint below needs alongside the built-in tsrange overlap.
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- ── 1. Table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_schedule_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date   date NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  timezone    text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  status      text NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'busy')),
  label       text,
  notes       text,
  student_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source      text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'system')),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT teacher_schedule_slots_time_order CHECK (end_time > start_time),

  -- Two blocks for the same teacher can never share a minute, whatever their
  -- status. Enforced by the index, so concurrent inserts cannot race past it.
  CONSTRAINT teacher_schedule_slots_no_overlap EXCLUDE USING gist (
    teacher_id WITH =,
    (tsrange(slot_date + start_time, slot_date + end_time, '[)')) WITH &&
  )
);

COMMENT ON TABLE public.teacher_schedule_slots IS
  'Hand-managed dated teacher schedule: each row is one concrete time block marked empty (free) or busy (taken). Complements the recurring weekly teacher_availability grid; does not replace it.';
COMMENT ON COLUMN public.teacher_schedule_slots.slot_date IS
  'Calendar date of the block, as wall-clock in this row''s timezone.';
COMMENT ON COLUMN public.teacher_schedule_slots.start_time IS
  'Wall-clock start in this row''s timezone (not UTC).';
COMMENT ON COLUMN public.teacher_schedule_slots.end_time IS
  'Wall-clock end in this row''s timezone. Must be after start_time — a block cannot cross midnight; enter two blocks instead.';
COMMENT ON COLUMN public.teacher_schedule_slots.timezone IS
  'IANA timezone the date/times are expressed in. Must be identical across all of one teacher''s blocks on a given date, otherwise the wall-clock overlap guard would not hold.';
COMMENT ON COLUMN public.teacher_schedule_slots.status IS
  'empty = teacher is free and this block can be offered; busy = teacher is taken (class, admin work, personal time).';
COMMENT ON COLUMN public.teacher_schedule_slots.label IS
  'Short admin-facing reason shown on the calendar, e.g. "Korean 1 – Ahmed" or "Doctor". Never exposed by get_teacher_open_slots().';
COMMENT ON COLUMN public.teacher_schedule_slots.notes IS
  'Longer private note. Never exposed by get_teacher_open_slots().';
COMMENT ON COLUMN public.teacher_schedule_slots.student_id IS
  'Optional auth.users id of the student occupying a busy block. Must be NULL when status = empty.';
COMMENT ON COLUMN public.teacher_schedule_slots.source IS
  'manual = entered by hand (the normal case); system = written by automation, reserved for a future booking integration.';

CREATE INDEX IF NOT EXISTS idx_teacher_schedule_slots_teacher_date
  ON public.teacher_schedule_slots (teacher_id, slot_date, start_time);

CREATE INDEX IF NOT EXISTS idx_teacher_schedule_slots_open
  ON public.teacher_schedule_slots (slot_date, start_time)
  WHERE status = 'empty';

CREATE INDEX IF NOT EXISTS idx_teacher_schedule_slots_student
  ON public.teacher_schedule_slots (student_id)
  WHERE student_id IS NOT NULL;

-- ── 2. Validation + updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_teacher_schedule_slots_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_other_tz text;
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'End time (%) must be after start time (%). A block cannot cross midnight — enter two blocks.',
      NEW.end_time, NEW.start_time
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'Unknown timezone "%". Use an IANA name such as Asia/Kuala_Lumpur.', NEW.timezone
      USING ERRCODE = '22023';
  END IF;

  IF NEW.status = 'empty' AND NEW.student_id IS NOT NULL THEN
    RAISE EXCEPTION 'An empty slot cannot be linked to a student. Mark the slot busy first.'
      USING ERRCODE = '23514';
  END IF;

  -- One timezone per teacher per day: the exclusion constraint compares
  -- wall-clock ranges, so a second timezone on the same date could hide a
  -- real overlap.
  SELECT s.timezone INTO v_other_tz
  FROM public.teacher_schedule_slots s
  WHERE s.teacher_id = NEW.teacher_id
    AND s.slot_date = NEW.slot_date
    AND s.id <> NEW.id
  LIMIT 1;

  IF v_other_tz IS NOT NULL AND v_other_tz <> NEW.timezone THEN
    RAISE EXCEPTION 'Slots on % are already stored in %; "%" cannot be mixed into the same day.',
      NEW.slot_date, v_other_tz, NEW.timezone
      USING ERRCODE = '23514';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teacher_schedule_slots_validate ON public.teacher_schedule_slots;
CREATE TRIGGER trg_teacher_schedule_slots_validate
  BEFORE INSERT OR UPDATE ON public.teacher_schedule_slots
  FOR EACH ROW EXECUTE FUNCTION public.tg_teacher_schedule_slots_validate();

-- ── 3. Access helper + RLS ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_manage_teacher_schedule(p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() = p_teacher_id);
$$;

COMMENT ON FUNCTION public.can_manage_teacher_schedule(uuid) IS
  'True when the caller is an admin (any teacher''s schedule) or is the teacher themselves.';

ALTER TABLE public.teacher_schedule_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own or any teacher schedule" ON public.teacher_schedule_slots;
CREATE POLICY "Manage own or any teacher schedule"
  ON public.teacher_schedule_slots
  FOR ALL
  TO authenticated
  USING (public.can_manage_teacher_schedule(teacher_id))
  WITH CHECK (public.can_manage_teacher_schedule(teacher_id));

DROP POLICY IF EXISTS "Students see the busy slots that are theirs" ON public.teacher_schedule_slots;
CREATE POLICY "Students see the busy slots that are theirs"
  ON public.teacher_schedule_slots
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- No anon/public SELECT policy on purpose: label and notes are private.
-- Public reads go through get_teacher_open_slots() below.

-- ── 4. Admin view ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_teacher_schedule_admin;
CREATE VIEW public.v_teacher_schedule_admin
WITH (security_invoker = on)
AS
SELECT
  s.id,
  s.teacher_id,
  s.slot_date,
  EXTRACT(DOW FROM s.slot_date)::int              AS day_of_week,
  trim(to_char(s.slot_date, 'Day'))               AS day_name,
  s.start_time,
  s.end_time,
  s.timezone,
  (EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60)::int AS duration_minutes,
  ((s.slot_date + s.start_time) AT TIME ZONE s.timezone)      AS starts_at,
  ((s.slot_date + s.end_time)   AT TIME ZONE s.timezone)      AS ends_at,
  (((s.slot_date + s.end_time) AT TIME ZONE s.timezone) < now()) AS is_past,
  s.status,
  s.label,
  s.notes,
  s.student_id,
  p.name  AS student_name,
  p.email AS student_email,
  s.source,
  s.created_by,
  s.created_at,
  s.updated_at
FROM public.teacher_schedule_slots s
LEFT JOIN public.profiles p ON p.user_id = s.student_id;

COMMENT ON VIEW public.v_teacher_schedule_admin IS
  'teacher_schedule_slots with the derived fields the admin calendar needs (weekday, duration, absolute start/end, is_past) plus the linked student''s name. Respects RLS.';

GRANT SELECT ON public.v_teacher_schedule_admin TO authenticated;

-- ── 5. RPCs for hand entry ─────────────────────────────────────────────────
-- All mutating RPCs are SECURITY INVOKER: RLS remains the real gate, and the
-- explicit checks below only exist to return a readable message instead of a
-- bare policy violation.

CREATE OR REPLACE FUNCTION public.fn_add_teacher_slot(
  p_slot_date        date,
  p_start_time       time,
  p_end_time         time    DEFAULT NULL,
  p_duration_minutes int     DEFAULT 60,
  p_status           text    DEFAULT 'empty',
  p_label            text    DEFAULT NULL,
  p_notes            text    DEFAULT NULL,
  p_student_id       uuid    DEFAULT NULL,
  p_teacher_id       uuid    DEFAULT NULL,
  p_timezone         text    DEFAULT 'Asia/Kuala_Lumpur'
)
RETURNS public.teacher_schedule_slots
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid := COALESCE(p_teacher_id, auth.uid());
  v_end        time;
  v_row        public.teacher_schedule_slots;
BEGIN
  IF NOT public.can_manage_teacher_schedule(v_teacher_id) THEN
    RAISE EXCEPTION 'Not allowed to edit this teacher''s schedule.' USING ERRCODE = '42501';
  END IF;

  IF p_end_time IS NULL AND (p_duration_minutes IS NULL OR p_duration_minutes <= 0) THEN
    RAISE EXCEPTION 'Give either an end time or a positive duration in minutes.' USING ERRCODE = '22023';
  END IF;

  v_end := COALESCE(p_end_time, p_start_time + make_interval(mins => p_duration_minutes));

  BEGIN
    INSERT INTO public.teacher_schedule_slots
      (teacher_id, slot_date, start_time, end_time, timezone, status, label, notes, student_id, created_by)
    VALUES
      (v_teacher_id, p_slot_date, p_start_time, v_end, COALESCE(p_timezone, 'Asia/Kuala_Lumpur'),
       p_status, p_label, p_notes, p_student_id, auth.uid())
    RETURNING * INTO v_row;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION '% %–% overlaps a slot that is already on the schedule.',
      p_slot_date, p_start_time, v_end
      USING ERRCODE = '23P01';
  END;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.fn_add_teacher_slot(date, time, time, int, text, text, text, uuid, uuid, text) IS
  'Add one hand-entered schedule block. Pass p_end_time, or leave it NULL to derive the end from p_duration_minutes.';


CREATE OR REPLACE FUNCTION public.fn_add_teacher_slots_bulk(
  p_from             date,
  p_to               date,
  p_weekdays         int[],
  p_start_times      time[],
  p_duration_minutes int     DEFAULT 60,
  p_status           text    DEFAULT 'empty',
  p_label            text    DEFAULT NULL,
  p_skip_conflicts   boolean DEFAULT true,
  p_teacher_id       uuid    DEFAULT NULL,
  p_timezone         text    DEFAULT 'Asia/Kuala_Lumpur'
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid := COALESCE(p_teacher_id, auth.uid());
  v_candidates int;
  v_inserted   int;
  v_wrapping   int;
BEGIN
  IF NOT public.can_manage_teacher_schedule(v_teacher_id) THEN
    RAISE EXCEPTION 'Not allowed to edit this teacher''s schedule.' USING ERRCODE = '42501';
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from THEN
    RAISE EXCEPTION 'p_to (%) must be on or after p_from (%).', p_to, p_from USING ERRCODE = '22023';
  END IF;

  IF p_to - p_from > 366 THEN
    RAISE EXCEPTION 'Date range is longer than a year — split it into smaller batches.' USING ERRCODE = '22023';
  END IF;

  IF p_weekdays IS NULL OR cardinality(p_weekdays) = 0
     OR p_start_times IS NULL OR cardinality(p_start_times) = 0 THEN
    RAISE EXCEPTION 'Give at least one weekday (0=Sun..6=Sat) and one start time.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM unnest(p_weekdays) w WHERE w < 0 OR w > 6) THEN
    RAISE EXCEPTION 'Weekdays must be 0 (Sunday) through 6 (Saturday).' USING ERRCODE = '22023';
  END IF;

  IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'p_duration_minutes must be positive.' USING ERRCODE = '22023';
  END IF;

  -- Start times so late that start + duration wraps past midnight cannot be
  -- stored (end_time > start_time); report them instead of silently dropping.
  SELECT count(*) INTO v_wrapping
  FROM unnest(p_start_times) t
  WHERE t + make_interval(mins => p_duration_minutes) <= t;

  IF v_wrapping > 0 THEN
    RAISE EXCEPTION '% start time(s) plus % minutes run past midnight. Shorten the duration or drop those times.',
      v_wrapping, p_duration_minutes
      USING ERRCODE = '22023';
  END IF;

  CREATE TEMP TABLE _tss_candidates ON COMMIT DROP AS
  SELECT d::date AS slot_date,
         t       AS start_time,
         (t + make_interval(mins => p_duration_minutes))::time AS end_time
  FROM generate_series(p_from, p_to, interval '1 day') d
  CROSS JOIN unnest(p_start_times) t
  WHERE EXTRACT(DOW FROM d)::int = ANY (p_weekdays);

  SELECT count(*) INTO v_candidates FROM _tss_candidates;

  WITH ins AS (
    INSERT INTO public.teacher_schedule_slots
      (teacher_id, slot_date, start_time, end_time, timezone, status, label, created_by)
    SELECT v_teacher_id, c.slot_date, c.start_time, c.end_time,
           COALESCE(p_timezone, 'Asia/Kuala_Lumpur'), p_status, p_label, auth.uid()
    FROM _tss_candidates c
    ORDER BY c.slot_date, c.start_time
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  DROP TABLE _tss_candidates;

  IF NOT p_skip_conflicts AND v_inserted < v_candidates THEN
    RAISE EXCEPTION '% of % blocks overlap slots already on the schedule. Re-run with p_skip_conflicts => true to add the rest.',
      v_candidates - v_inserted, v_candidates
      USING ERRCODE = '23P01';
  END IF;

  RETURN jsonb_build_object(
    'teacher_id', v_teacher_id,
    'candidates', v_candidates,
    'inserted',   v_inserted,
    'skipped',    v_candidates - v_inserted,
    'status',     p_status,
    'from',       p_from,
    'to',         p_to
  );
END;
$$;

COMMENT ON FUNCTION public.fn_add_teacher_slots_bulk(date, date, int[], time[], int, text, text, boolean, uuid, text) IS
  'Fill a date range with a weekday x start-time grid of blocks in one call — e.g. every Mon/Wed 18:00 and 19:00 for the next month. Overlapping blocks are skipped by default and reported in the returned JSON.';


CREATE OR REPLACE FUNCTION public.fn_set_teacher_slot_status(
  p_slot_id    uuid,
  p_status     text,
  p_label      text DEFAULT NULL,
  p_notes      text DEFAULT NULL,
  p_student_id uuid DEFAULT NULL
)
RETURNS public.teacher_schedule_slots
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row public.teacher_schedule_slots;
BEGIN
  IF p_status NOT IN ('empty', 'busy') THEN
    RAISE EXCEPTION 'Status must be "empty" or "busy", got "%".', p_status USING ERRCODE = '22023';
  END IF;

  -- label / notes / student_id are always written, so passing NULL clears them.
  UPDATE public.teacher_schedule_slots
  SET status     = p_status,
      label      = p_label,
      notes      = p_notes,
      student_id = CASE WHEN p_status = 'empty' THEN NULL ELSE p_student_id END
  WHERE id = p_slot_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot % not found, or not yours to edit.', p_slot_id USING ERRCODE = 'P0002';
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.fn_set_teacher_slot_status(uuid, text, text, text, uuid) IS
  'Flip a block between empty and busy. label/notes/student_id are overwritten with whatever is passed, so omitting them clears them; student_id is forced to NULL when marking a block empty.';


CREATE OR REPLACE FUNCTION public.fn_update_teacher_slot(
  p_slot_id    uuid,
  p_slot_date  date DEFAULT NULL,
  p_start_time time DEFAULT NULL,
  p_end_time   time DEFAULT NULL,
  p_timezone   text DEFAULT NULL
)
RETURNS public.teacher_schedule_slots
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row public.teacher_schedule_slots;
BEGIN
  BEGIN
    UPDATE public.teacher_schedule_slots
    SET slot_date  = COALESCE(p_slot_date, slot_date),
        start_time = COALESCE(p_start_time, start_time),
        end_time   = COALESCE(p_end_time, end_time),
        timezone   = COALESCE(p_timezone, timezone)
    WHERE id = p_slot_id
    RETURNING * INTO v_row;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Moving that slot would overlap another block on the schedule.' USING ERRCODE = '23P01';
  END;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Slot % not found, or not yours to edit.', p_slot_id USING ERRCODE = 'P0002';
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.fn_update_teacher_slot(uuid, date, time, time, text) IS
  'Move or resize a block. NULL arguments leave that field unchanged. Use fn_set_teacher_slot_status to change empty/busy.';


CREATE OR REPLACE FUNCTION public.fn_delete_teacher_slot(p_slot_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM public.teacher_schedule_slots WHERE id = p_slot_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'Slot % not found, or not yours to delete.', p_slot_id USING ERRCODE = 'P0002';
  END IF;

  RETURN true;
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_clear_teacher_slots(
  p_from       date,
  p_to         date,
  p_status     text DEFAULT NULL,
  p_teacher_id uuid DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid := COALESCE(p_teacher_id, auth.uid());
  v_deleted    int;
BEGIN
  IF NOT public.can_manage_teacher_schedule(v_teacher_id) THEN
    RAISE EXCEPTION 'Not allowed to edit this teacher''s schedule.' USING ERRCODE = '42501';
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from THEN
    RAISE EXCEPTION 'p_to (%) must be on or after p_from (%).', p_to, p_from USING ERRCODE = '22023';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('empty', 'busy') THEN
    RAISE EXCEPTION 'Status filter must be "empty", "busy", or NULL for both.' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.teacher_schedule_slots
  WHERE teacher_id = v_teacher_id
    AND slot_date BETWEEN p_from AND p_to
    AND (p_status IS NULL OR status = p_status);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.fn_clear_teacher_slots(date, date, text, uuid) IS
  'Bulk-delete blocks in a date range, optionally only the empty or only the busy ones. Returns how many rows went.';


CREATE OR REPLACE FUNCTION public.get_teacher_schedule(
  p_from       date DEFAULT NULL,
  p_to         date DEFAULT NULL,
  p_teacher_id uuid DEFAULT NULL,
  p_status     text DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  teacher_id       uuid,
  slot_date        date,
  day_of_week      int,
  start_time       time,
  end_time         time,
  timezone         text,
  duration_minutes int,
  starts_at        timestamptz,
  ends_at          timestamptz,
  is_past          boolean,
  status           text,
  label            text,
  notes            text,
  student_id       uuid,
  student_name     text,
  source           text,
  created_at       timestamptz,
  updated_at       timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT v.id, v.teacher_id, v.slot_date, v.day_of_week, v.start_time, v.end_time,
         v.timezone, v.duration_minutes, v.starts_at, v.ends_at, v.is_past,
         v.status, v.label, v.notes, v.student_id, v.student_name, v.source,
         v.created_at, v.updated_at
  FROM public.v_teacher_schedule_admin v
  WHERE v.teacher_id = COALESCE(p_teacher_id, auth.uid())
    AND v.slot_date >= COALESCE(p_from, CURRENT_DATE)
    AND v.slot_date <= COALESCE(p_to, COALESCE(p_from, CURRENT_DATE) + 30)
    AND (p_status IS NULL OR v.status = p_status)
  ORDER BY v.slot_date, v.start_time;
$$;

COMMENT ON FUNCTION public.get_teacher_schedule(date, date, uuid, text) IS
  'Read one teacher''s schedule for a date range (defaults to the next 30 days). Runs as the caller, so RLS applies.';


CREATE OR REPLACE FUNCTION public.get_teacher_open_slots(
  p_from       date DEFAULT NULL,
  p_to         date DEFAULT NULL,
  p_teacher_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  teacher_id  uuid,
  slot_date   date,
  day_of_week int,
  start_time  time,
  end_time    time,
  timezone    text,
  starts_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         s.teacher_id,
         s.slot_date,
         EXTRACT(DOW FROM s.slot_date)::int,
         s.start_time,
         s.end_time,
         s.timezone,
         ((s.slot_date + s.start_time) AT TIME ZONE s.timezone)
  FROM public.teacher_schedule_slots s
  WHERE s.status = 'empty'
    AND s.slot_date >= COALESCE(p_from, CURRENT_DATE)
    AND s.slot_date <= COALESCE(p_to, COALESCE(p_from, CURRENT_DATE) + 60)
    AND ((s.slot_date + s.start_time) AT TIME ZONE s.timezone) > now()
    AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
  ORDER BY s.slot_date, s.start_time;
$$;

COMMENT ON FUNCTION public.get_teacher_open_slots(date, date, uuid) IS
  'Public-safe list of still-upcoming empty blocks. SECURITY DEFINER so unauthenticated visitors can see free times, but it deliberately returns no label, notes, or student.';

-- ── 6. Grants ──────────────────────────────────────────────────────────────
-- Supabase's default privileges hand `anon` full rights on every new table and
-- function in `public`. RLS already denies anon every row here, and the RPCs
-- re-check the caller, but strip the grants anyway so nothing rests on one
-- layer alone. `get_teacher_open_slots` is the single deliberate exception.
REVOKE ALL ON TABLE public.teacher_schedule_slots FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teacher_schedule_slots TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_add_teacher_slot(date, time, time, int, text, text, text, uuid, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_add_teacher_slots_bulk(date, date, int[], time[], int, text, text, boolean, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_set_teacher_slot_status(uuid, text, text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_update_teacher_slot(uuid, date, time, time, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_delete_teacher_slot(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_clear_teacher_slots(date, date, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_schedule(date, date, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_teacher_open_slots(date, date, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_add_teacher_slot(date, time, time, int, text, text, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_add_teacher_slots_bulk(date, date, int[], time[], int, text, text, boolean, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_set_teacher_slot_status(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_teacher_slot(uuid, date, time, time, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_delete_teacher_slot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_clear_teacher_slots(date, date, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_schedule(date, date, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_open_slots(date, date, uuid) TO anon, authenticated;
