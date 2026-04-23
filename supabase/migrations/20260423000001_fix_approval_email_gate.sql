-- Fix: approval email must not fire until student is placed into a real class slot.
--
-- Root cause: email_student_on_approval() fired on approval_status+payment_status
-- alone with no check for actual matcher placement. This caused students to receive
-- "Your Enrollment is Approved" emails before being assigned to any class.
--
-- Strategy:
--   1. Add approval_email_sent_at to enrollments for reliable one-shot dedup.
--   2. Gate the email trigger on NEW.matched_at IS NOT NULL.
--   3. Gate student sync (sync_student_on_approval) on matched_at too.
--   4. Make match_enrollment_to_slot set matched_at on the enrollment row
--      (for private plans, which skip assign_student_to_group_from_slot).
--   5. Make assign_student_to_group_from_slot set matched_at on the enrollment row
--      (for group plans), which re-fires the trigger after Stripe-auto-approve.
--
-- Resulting flows:
--   Manual payment:  INSERT(PENDING) → matcher runs → matched_at set → admin approves
--                    → trigger fires: APPROVED+PAID+matched_at ✓ → email sent.
--   Stripe payment:  INSERT(APPROVED+PAID) → matcher runs → matched_at set via UPDATE
--                    → trigger fires: APPROVED+PAID+matched_at ✓ → email sent.
--   Early approval:  Admin approves before matcher → trigger fires but matched_at IS NULL
--                    → email blocked. Matcher runs later → matched_at set → trigger
--                    re-fires → email sent.

-- ── 1. Add approval_email_sent_at column ────────────────────────────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS approval_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Fix email_student_on_approval ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.email_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- Dedup: email already sent for this enrollment
  IF NEW.approval_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Guard: only fire when fully approved, paid, AND placed
  IF NEW.approval_status <> 'APPROVED'
     OR NEW.payment_status <> 'PAID'
     OR NEW.matched_at IS NULL
  THEN
    RETURN NEW;
  END IF;

  -- Get student profile
  SELECT name, email INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL THEN RETURN NEW; END IF;

  -- Send approval email
  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
    ),
    body := jsonb_build_object(
      'template',       'approval',
      'email',          _profile.email,
      'name',           _profile.name,
      'plan_type',      NEW.plan_type,
      'duration',       NEW.duration,
      'sessions_total', NEW.sessions_total,
      'amount',         NEW.amount,
      'preferred_day',  COALESCE(NEW.preferred_day, ''),
      'preferred_time', COALESCE(NEW.preferred_time, ''),
      'timezone',       COALESCE(NEW.timezone, 'Africa/Cairo'),
      'level',          COALESCE(NEW.level, ''),
      'currency',       COALESCE(NEW.currency, 'EGP'),
      'language',       CASE
                          WHEN COALESCE(NEW.timezone,'') NOT LIKE 'Asia/%'
                           AND COALESCE(NEW.timezone,'') NOT LIKE 'Europe/%'
                           AND COALESCE(NEW.timezone,'') NOT LIKE 'America/%'
                          THEN 'ar'
                          ELSE 'en'
                        END
    )
  );

  -- Mark as sent; this UPDATE will re-fire the trigger but the dedup guard at
  -- the top will catch it immediately, so recursion depth is at most 2.
  UPDATE public.enrollments
    SET approval_email_sent_at = NOW()
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- ── 3. Fix sync_student_on_approval to also require placement ────────────────
CREATE OR REPLACE FUNCTION public.sync_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  -- Only sync when fully approved, paid, AND placed
  IF NEW.approval_status <> 'APPROVED'
     OR NEW.payment_status <> 'PAID'
     OR NEW.matched_at IS NULL
  THEN
    RETURN NEW;
  END IF;

  SELECT name, email, country INTO _profile
    FROM public.profiles
    WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.students (
    full_name, email, country, status,
    course_type, package_name,
    total_classes, used_classes,
    total_paid, price_per_class,
    payment_status, notes
  ) VALUES (
    _profile.name,
    _profile.email,
    COALESCE(_profile.country, ''),
    'student',
    NEW.plan_type,
    NEW.plan_type || ' ' || NEW.duration || 'mo',
    NEW.classes_included,
    0,
    NEW.amount,
    NEW.unit_price,
    'paid',
    'Auto-created from enrollment ' || NEW.id::text
  )
  ON CONFLICT (email) DO UPDATE SET
    status        = 'student',
    course_type   = EXCLUDED.course_type,
    package_name  = EXCLUDED.package_name,
    total_classes = public.students.total_classes + EXCLUDED.total_classes,
    total_paid    = public.students.total_paid + EXCLUDED.total_paid,
    price_per_class = EXCLUDED.price_per_class,
    payment_status  = 'paid',
    notes = public.students.notes || E'\n' || EXCLUDED.notes;

  RETURN NEW;
END;
$$;

-- ── 4. Update match_enrollment_to_slot to set matched_at for private plans ───
-- Group plans go through assign_student_to_group_from_slot which sets matched_at.
-- Private plans end here, so we stamp matched_at from this function.
CREATE OR REPLACE FUNCTION public.match_enrollment_to_slot(_enrollment_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _enrollment RECORD;
  _level TEXT;
  _best_slot_id UUID;
  _slot RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock enrollment row to prevent concurrent matching
  SELECT e.id, e.user_id, e.preferred_days, e.preferred_time, e.plan_type
    INTO _enrollment
    FROM public.enrollments e
    WHERE e.id = _enrollment_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  -- Get student's level from profile
  SELECT p.level INTO _level
    FROM public.profiles p
    WHERE p.user_id = _enrollment.user_id;

  IF _level IS NULL OR _level = '' THEN
    RETURN NULL;
  END IF;

  -- Find best-fit slot: matching level, not full, preferring student's preferred days
  FOR _slot IN
    SELECT ms.*,
      CASE WHEN _enrollment.preferred_days IS NOT NULL AND ms.day = ANY(_enrollment.preferred_days) THEN 1 ELSE 0 END AS day_match
    FROM public.matching_slots ms
    WHERE ms.course_level = _level
      AND ms.status != 'full'
      AND ms.current_count < ms.max_students
    ORDER BY
      CASE WHEN _enrollment.preferred_days IS NOT NULL AND ms.day = ANY(_enrollment.preferred_days) THEN 0 ELSE 1 END,
      ms.current_count DESC
    FOR UPDATE
  LOOP
    _best_slot_id := _slot.id;
    EXIT;
  END LOOP;

  IF _best_slot_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create or update student_slot_preferences
  INSERT INTO public.student_slot_preferences (user_id, enrollment_id, selected_level, slot_1_id, assigned_slot_id, match_status)
  VALUES (_enrollment.user_id, _enrollment_id, _level, _best_slot_id, _best_slot_id, 'matched')
  ON CONFLICT ON CONSTRAINT student_slot_preferences_enrollment_id_key
  DO UPDATE SET assigned_slot_id = _best_slot_id, match_status = 'matched', slot_1_id = _best_slot_id;

  -- Increment slot count
  UPDATE public.matching_slots
    SET current_count = current_count + 1
    WHERE id = _best_slot_id;

  -- For private plans: stamp matched_at here (group plans stamp it in assign_student_to_group_from_slot).
  -- This UPDATE fires the email/sync triggers, which check APPROVED+PAID+matched_at.
  IF _enrollment.plan_type = 'private' THEN
    UPDATE public.enrollments
      SET matched_at = NOW()
      WHERE id = _enrollment_id;
  END IF;

  RETURN _best_slot_id;
END;
$$;

-- ── 5. Update assign_student_to_group_from_slot to set matched_at ────────────
CREATE OR REPLACE FUNCTION public.assign_student_to_group_from_slot(
  _slot_id uuid,
  _user_id uuid,
  _enrollment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _slot RECORD;
  _package RECORD;
  _group RECORD;
  _day_num int;
  _existing_group_id uuid;
  _result_status text;
  _day_map jsonb := '{"Sunday":0,"Monday":1,"Tuesday":2,"Wednesday":3,"Thursday":4,"Friday":5,"Saturday":6}'::jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1) Fetch the matching_slot
  SELECT * INTO _slot FROM public.matching_slots WHERE id = _slot_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'slot_not_found');
  END IF;

  -- 2) Map slot day name to day_of_week number
  _day_num := (_day_map ->> _slot.day)::int;
  IF _day_num IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid_day', 'day', _slot.day);
  END IF;

  -- 3) Resolve schedule_package: match level + day_of_week + active
  SELECT * INTO _package
    FROM public.schedule_packages
    WHERE level = lower(replace(_slot.course_level, ' ', '_'))
      AND day_of_week = _day_num
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_package_match', 'level', _slot.course_level, 'day', _slot.day);
  END IF;

  -- 4) Idempotency: check if user already in ANY group for this package
  SELECT pg.id, pg.name INTO _existing_group_id, _result_status
    FROM public.pkg_group_members pgm
    JOIN public.pkg_groups pg ON pg.id = pgm.group_id
    WHERE pgm.user_id = _user_id
      AND pg.package_id = _package.id;

  IF FOUND THEN
    -- Already assigned — still stamp matched_at so triggers can fire
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments SET matched_at = COALESCE(matched_at, NOW()) WHERE id = _enrollment_id;
    END IF;
    RETURN jsonb_build_object(
      'status', 'already_assigned',
      'package_id', _package.id,
      'group_id', _existing_group_id,
      'group_name', _result_status
    );
  END IF;

  -- 5) Ensure at least 1 active group exists
  IF NOT EXISTS (
    SELECT 1 FROM public.pkg_groups WHERE package_id = _package.id AND is_active = true
  ) THEN
    INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
    VALUES (
      _package.id,
      initcap(replace(_package.level, '_', ' ')) || ' — ' ||
        CASE _package.day_of_week
          WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday' ELSE 'Unknown'
        END || ' ' || to_char(_package.start_time, 'HH12:MI AM'),
      _package.capacity,
      true
    );
  END IF;

  -- 6) Pick best group with seats_left > 0 (fewest active members first)
  SELECT g.id, g.name, g.capacity, COUNT(m.user_id) AS active_count
    INTO _group
    FROM public.pkg_groups g
    LEFT JOIN public.pkg_group_members m ON m.group_id = g.id AND m.member_status = 'active'
    WHERE g.package_id = _package.id AND g.is_active = true
    GROUP BY g.id, g.name, g.capacity
    HAVING COUNT(m.user_id) < g.capacity
    ORDER BY COUNT(m.user_id) ASC
    LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'active', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO UPDATE SET member_status = 'active', enrollment_id = _enrollment_id;

    -- Stamp matched_at on enrollment to signal placement is complete.
    -- This UPDATE re-fires email/sync triggers; they check APPROVED+PAID+matched_at.
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments SET matched_at = NOW() WHERE id = _enrollment_id;
    END IF;

    RETURN jsonb_build_object(
      'status', 'assigned',
      'package_id', _package.id,
      'group_id', _group.id,
      'group_name', _group.name
    );
  ELSE
    -- All groups full → waitlist
    SELECT g.id, g.name INTO _group
      FROM public.pkg_groups g
      WHERE g.package_id = _package.id AND g.is_active = true
      ORDER BY g.created_at ASC
      LIMIT 1;

    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    INSERT INTO public.admin_notifications (message, type, related_group_id)
    VALUES (
      'Student waitlisted in "' || _group.name || '" — all groups for ' ||
        initcap(replace(_package.level, '_', ' ')) || ' on ' ||
        CASE _package.day_of_week
          WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday' ELSE 'Unknown'
        END || ' are full. Consider adding another group.',
      'suggest_add_group',
      _group.id
    );

    -- Waitlisted students are considered placed; stamp matched_at so email can send.
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments SET matched_at = NOW() WHERE id = _enrollment_id;
    END IF;

    RETURN jsonb_build_object(
      'status', 'waitlisted',
      'package_id', _package.id,
      'group_id', _group.id,
      'group_name', _group.name
    );
  END IF;
END;
$$;
