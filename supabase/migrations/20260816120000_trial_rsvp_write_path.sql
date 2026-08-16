-- Give the trial RSVP / attendance-confirmation flow a write path that works.
--
-- The complete RLS policy set on trial_bookings is:
--   * INSERT  → anon, authenticated  (WITH CHECK true)
--   * SELECT  → anon, authenticated  (USING true)
--   * SELECT  → authenticated, own rows
--   * ALL     → admins
--
-- There is NO UPDATE policy for anon or for non-admin authenticated users. So
-- the update in /trial-confirm —
--
--   update trial_bookings
--      set status = 'confirmed_attendance', attendance_confirmed_at = now()
--    where id = :id and confirmation_token = :token
--
-- — is filtered out by RLS. PostgREST reports no error for an update that
-- matches zero rows, and the page only checks `if (error)`, so every student
-- who has ever clicked "confirm my attendance" in an email was shown
-- "Attendance Confirmed!" while nothing was written. That is why
-- attendance_confirmed_at and attendance_response are still null across the
-- table, and why the admin panel's RSVP column is always empty.
--
-- The fix is a SECURITY DEFINER function rather than a broader UPDATE policy:
-- anon needs to change exactly two columns on exactly one row it can prove it
-- owns by holding the unguessable confirmation_token — not general UPDATE
-- rights over the table.

-- ── Response timestamp ───────────────────────────────────────────────────────
-- attendance_response already exists (text, CHECK IN ('yes','no')) and is read
-- by the admin tables. It records WHAT the student said; this records WHEN, so
-- a later response can be distinguished from a backfill.
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS attendance_response_at timestamptz;

COMMENT ON COLUMN public.trial_bookings.attendance_response_at IS
  'When the student answered the RSVP. Written only by respond_to_trial_invite().';

-- ── The write path ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.respond_to_trial_invite(
  p_booking_id uuid,
  p_token      uuid,
  p_response   text
)
RETURNS TABLE (
  outcome     text,   -- 'recorded' | 'already' | 'invalid'
  trial_date  date,
  start_time  text,
  timezone    text,
  meeting_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.trial_bookings%ROWTYPE;
  v_outcome text;
  v_url     text;
BEGIN
  IF p_response IS NULL OR p_response NOT IN ('yes', 'no') THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::date, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- The token is the credential. Both halves must match.
  SELECT * INTO v_booking
    FROM public.trial_bookings
   WHERE id = p_booking_id
     AND confirmation_token = p_token
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::date, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- Idempotent: re-clicking the same link in the same email is a normal thing
  -- for a person to do and must not read as an error.
  IF v_booking.attendance_response IS DISTINCT FROM NULL
     AND v_booking.attendance_response = p_response THEN
    v_outcome := 'already';
  ELSE
    v_outcome := 'recorded';

    UPDATE public.trial_bookings
       SET attendance_response    = p_response,
           attendance_response_at = now(),
           -- A "yes" also advances the attendance status, but only from a
           -- state where that makes sense — never resurrect a cancelled row.
           status = CASE
                      WHEN p_response = 'yes'
                       AND status IN ('pending', 'date_selected', 'awaiting_attendance', 'confirmed')
                      THEN 'confirmed_attendance'
                      ELSE status
                    END,
           attendance_confirmed_at = CASE
                      WHEN p_response = 'yes' AND attendance_confirmed_at IS NULL
                      THEN now()
                      ELSE attendance_confirmed_at
                    END
     WHERE id = v_booking.id;

    -- Re-read so the returned row reflects what was actually stored.
    SELECT * INTO v_booking FROM public.trial_bookings WHERE id = v_booking.id;
  END IF;

  -- Best-effort meeting link for the "yes" screen. Matches the resolution order
  -- used elsewhere: exact dated slot first, then the recurring weekly one.
  SELECT s.meeting_url INTO v_url
    FROM public.trial_slots s
   WHERE s.trial_date = v_booking.trial_date
     AND s.start_time = v_booking.start_time
   LIMIT 1;

  IF v_url IS NULL THEN
    SELECT s.meeting_url INTO v_url
      FROM public.trial_slots s
     WHERE s.day_of_week = v_booking.day_of_week
       AND s.start_time = v_booking.start_time
       AND s.is_active
     LIMIT 1;
  END IF;

  RETURN QUERY
    SELECT v_outcome,
           v_booking.trial_date,
           v_booking.start_time::text,
           v_booking.timezone,
           v_url;
END;
$$;

COMMENT ON FUNCTION public.respond_to_trial_invite(uuid, uuid, text) IS
  'Records a trial RSVP from an emailed link. SECURITY DEFINER because anon has '
  'no UPDATE policy on trial_bookings by design — the unguessable '
  'confirmation_token is the credential. Idempotent; returns recorded/already/invalid.';

-- The token is the authorisation, so anon may call this.
REVOKE ALL ON FUNCTION public.respond_to_trial_invite(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_trial_invite(uuid, uuid, text) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
