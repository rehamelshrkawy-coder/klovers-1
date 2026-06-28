-- Capture schema objects already required by the application but previously
-- absent from the migration history. All statements are idempotent so this is
-- safe for projects where the objects were created manually.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS course_level_key text,
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.profiles.course_level_key IS
  'Canonical course key (hangul, l1-l6). profiles.level remains the free-form self-assessment value.';

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

CREATE TABLE IF NOT EXISTS public.student_nps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 10),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.student_nps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own NPS response" ON public.student_nps;
CREATE POLICY "Users manage own NPS response"
  ON public.student_nps FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.book_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  available_from timestamptz NOT NULL DEFAULT now(),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by text NOT NULL,
  notes text,
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_book_assignments_user_id
  ON public.book_assignments (user_id);

CREATE INDEX IF NOT EXISTS idx_book_assignments_available_from
  ON public.book_assignments (available_from);

ALTER TABLE public.book_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own book assignments" ON public.book_assignments;
CREATE POLICY "Users can view own book assignments"
  ON public.book_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage book assignments" ON public.book_assignments;
CREATE POLICY "Admins manage book assignments"
  ON public.book_assignments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.trial_invite_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text NOT NULL,
  campaign text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  email_opened_at timestamptz,
  attendance_response text CHECK (attendance_response IN ('yes', 'no')),
  attendance_responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_trial_invite_sends_campaign_sent_at
  ON public.trial_invite_sends (campaign, sent_at DESC);

ALTER TABLE public.trial_invite_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view trial invite sends" ON public.trial_invite_sends;
CREATE POLICY "Admins view trial invite sends"
  ON public.trial_invite_sends
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.fn_set_trial_program_start_date(p_date date)
RETURNS public.trial_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.trial_settings;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'permission_denied: admin only' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.trial_settings (id, program_start_date, updated_at)
  VALUES (1, p_date, now())
  ON CONFLICT (id) DO UPDATE
    SET program_start_date = EXCLUDED.program_start_date,
        updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_create_trial_slot(
  p_day_of_week integer,
  p_start_time text,
  p_duration_min integer DEFAULT NULL,
  p_capacity integer DEFAULT 8,
  p_timezone text DEFAULT 'Africa/Cairo'
)
RETURNS public.trial_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.trial_slots;
  resolved_duration integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'permission_denied: admin only' USING ERRCODE = '42501';
  END IF;
  IF p_day_of_week NOT BETWEEN 0 AND 6 THEN
    RAISE EXCEPTION 'day_of_week must be between 0 and 6';
  END IF;
  IF p_start_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'start_time must use HH:MM format';
  END IF;
  IF p_capacity < 1 THEN
    RAISE EXCEPTION 'capacity must be positive';
  END IF;

  SELECT COALESCE(p_duration_min, default_duration_min)
    INTO resolved_duration
    FROM public.trial_settings
    WHERE id = 1;

  INSERT INTO public.trial_slots (
    day_of_week, start_time, duration_min, timezone, capacity,
    is_active, lifecycle
  ) VALUES (
    p_day_of_week, p_start_time, COALESCE(resolved_duration, 30),
    COALESCE(p_timezone, 'Africa/Cairo'), p_capacity, true, 'active'
  )
  RETURNING * INTO result;

  RETURN result;
END;
$$;
