-- Capture upsert_trial_booking RPC + supporting DB objects that were created
-- directly in Supabase (missing from prior migration files).

-- ── RPC: atomic delete + insert for trial bookings ──────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_trial_booking(
  p_delete_id   uuid,
  p_name        text,
  p_email       text,
  p_phone       text,
  p_level       text,
  p_goal        text,
  p_day_of_week integer,
  p_start_time  text,
  p_trial_date  date,
  p_timezone    text,
  p_language    text,
  p_user_id     uuid,
  p_status      text
) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_delete_id IS NOT NULL THEN
    DELETE FROM trial_bookings WHERE id = p_delete_id;
  END IF;

  INSERT INTO trial_bookings (
    name, email, phone, level, goal,
    day_of_week, start_time, trial_date, timezone,
    class_language, user_id, status, confirmed_at
  ) VALUES (
    p_name, p_email, p_phone, p_level, p_goal,
    p_day_of_week, p_start_time, p_trial_date, p_timezone,
    p_language, p_user_id, p_status, now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_trial_booking(uuid,text,text,text,text,text,integer,text,date,text,text,uuid,text) TO service_role;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trial_bookings_trial_date_status
  ON public.trial_bookings (trial_date, status);

CREATE INDEX IF NOT EXISTS idx_trial_bookings_email
  ON public.trial_bookings (email);

-- ── Slot capacity trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_trial_slot_capacity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_capacity  int;
  v_booked    int;
  v_slot_id   uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT id, capacity INTO v_slot_id, v_capacity
  FROM trial_slots
  WHERE day_of_week = NEW.day_of_week
    AND start_time   = NEW.start_time
    AND is_active    = true
  LIMIT 1;

  IF v_slot_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_booked
  FROM trial_bookings
  WHERE trial_date  = NEW.trial_date
    AND day_of_week = NEW.day_of_week
    AND start_time  = NEW.start_time
    AND status      != 'cancelled'
    AND id          != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'trial_slot_full: slot is at capacity (% / %)', v_booked, v_capacity
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_slot_capacity ON public.trial_bookings;
CREATE TRIGGER trg_trial_slot_capacity
  BEFORE INSERT OR UPDATE ON public.trial_bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_trial_slot_capacity();
