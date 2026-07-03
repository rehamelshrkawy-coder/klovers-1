-- Fix: waitlisted students should receive a waitlist_confirmed email, not the
-- approval email. Previously assign_student_to_group_from_slot stamped matched_at
-- for waitlisted students, which fired email_student_on_approval.
--
-- Strategy: add a waitlisted boolean to enrollments. The approval trigger checks it
-- and sends waitlist_confirmed instead of approval when true.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS is_waitlisted BOOLEAN DEFAULT FALSE;

-- Update assign_student_to_group_from_slot to mark waitlisted enrollments
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

  SELECT * INTO _slot FROM public.matching_slots WHERE id = _slot_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'slot_not_found');
  END IF;

  _day_num := (_day_map ->> _slot.day)::int;
  IF _day_num IS NULL THEN
    RETURN jsonb_build_object('status', 'invalid_day', 'day', _slot.day);
  END IF;

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

  SELECT pg.id, pg.name INTO _existing_group_id, _result_status
    FROM public.pkg_group_members pgm
    JOIN public.pkg_groups pg ON pg.id = pgm.group_id
    WHERE pgm.user_id = _user_id AND pg.package_id = _package.id;

  IF FOUND THEN
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments SET matched_at = COALESCE(matched_at, NOW()) WHERE id = _enrollment_id;
    END IF;
    RETURN jsonb_build_object('status', 'already_assigned', 'package_id', _package.id, 'group_id', _existing_group_id, 'group_name', _result_status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.pkg_groups WHERE package_id = _package.id AND is_active = true) THEN
    INSERT INTO public.pkg_groups (package_id, name, capacity, is_active)
    VALUES (
      _package.id,
      initcap(replace(_package.level, '_', ' ')) || ' — ' ||
        CASE _package.day_of_week WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday' ELSE 'Unknown' END
        || ' ' || to_char(_package.start_time, 'HH12:MI AM'),
      _package.capacity, true
    );
  END IF;

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

    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments SET matched_at = NOW(), is_waitlisted = FALSE WHERE id = _enrollment_id;
    END IF;

    RETURN jsonb_build_object('status', 'assigned', 'package_id', _package.id, 'group_id', _group.id, 'group_name', _group.name);
  ELSE
    SELECT g.id, g.name INTO _group
      FROM public.pkg_groups g
      WHERE g.package_id = _package.id AND g.is_active = true
      ORDER BY g.created_at ASC LIMIT 1;

    INSERT INTO public.pkg_group_members (group_id, user_id, member_status, enrollment_id)
    VALUES (_group.id, _user_id, 'waitlist', _enrollment_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    INSERT INTO public.admin_notifications (message, type, related_group_id)
    VALUES (
      'Student waitlisted in "' || _group.name || '" — all groups for ' ||
        initcap(replace(_package.level, '_', ' ')) || ' on ' ||
        CASE _package.day_of_week WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday' ELSE 'Unknown' END
        || ' are full. Consider adding another group.',
      'suggest_add_group', _group.id
    );

    -- Mark as waitlisted AND stamp matched_at so email trigger fires,
    -- but the trigger will send waitlist_confirmed instead of approval.
    IF _enrollment_id IS NOT NULL THEN
      UPDATE public.enrollments SET matched_at = NOW(), is_waitlisted = TRUE WHERE id = _enrollment_id;
    END IF;

    RETURN jsonb_build_object('status', 'waitlisted', 'package_id', _package.id, 'group_id', _group.id, 'group_name', _group.name);
  END IF;
END;
$$;

-- Update email_student_on_approval to send waitlist_confirmed when is_waitlisted = TRUE
CREATE OR REPLACE FUNCTION public.email_student_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
  _lang    TEXT;
  _tz      TEXT;
  _tmpl    TEXT;
BEGIN
  IF NEW.approval_email_sent_at IS NOT NULL THEN RETURN NEW; END IF;

  IF NEW.approval_status <> 'APPROVED'
     OR NEW.payment_status <> 'PAID'
     OR NEW.matched_at IS NULL
  THEN RETURN NEW; END IF;

  SELECT name, email, unsubscribe_token,
         COALESCE(email_unsubscribed, FALSE) AS email_unsubscribed
    INTO _profile
    FROM public.profiles WHERE user_id = NEW.user_id;

  IF _profile.email IS NULL OR _profile.email_unsubscribed THEN RETURN NEW; END IF;

  _tz := COALESCE(NEW.timezone, '');
  _lang := CASE
    WHEN _tz LIKE 'Africa/%'
      OR _tz IN ('Asia/Riyadh','Asia/Dubai','Asia/Kuwait','Asia/Bahrain','Asia/Qatar',
                 'Asia/Muscat','Asia/Baghdad','Asia/Amman','Asia/Beirut','Asia/Damascus',
                 'Asia/Aden','Asia/Gaza','Asia/Hebron')
      OR _tz = ''
    THEN 'ar' ELSE 'en'
  END;

  -- Send different template based on whether student is waitlisted
  _tmpl := CASE WHEN COALESCE(NEW.is_waitlisted, FALSE) THEN 'waitlist_confirmed' ELSE 'approval' END;

  PERFORM net.http_post(
    url     := 'https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1/send-confirmation-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dGRncGJ5YmtjZW9rZm9oaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mzg4NzAsImV4cCI6MjA4OTUxNDg3MH0.KPKgPrhms2frDi09sdNChScBrHS00O7UhX2k8SArTxs'
    ),
    body := jsonb_build_object(
      'template',           _tmpl,
      'email',              _profile.email,
      'name',               _profile.name,
      'language',           _lang,
      'unsubscribe_token',  _profile.unsubscribe_token,
      'plan_type',          NEW.plan_type,
      'duration',           NEW.duration,
      'sessions_total',     COALESCE(NEW.sessions_total, NEW.classes_included),
      'amount',             NEW.amount,
      'preferred_day',      COALESCE(NEW.preferred_day, ''),
      'preferred_time',     COALESCE(NEW.preferred_time, ''),
      'timezone',           COALESCE(NEW.timezone, 'Africa/Cairo'),
      'level',              COALESCE(NEW.level, ''),
      'currency',           COALESCE(NEW.currency, 'EGP')
    )
  );

  UPDATE public.enrollments SET approval_email_sent_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
