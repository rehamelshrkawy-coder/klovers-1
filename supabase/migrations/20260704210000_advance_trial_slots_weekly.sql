-- Trial slots carry a fixed one-time trial_date, and get_trial_availability now
-- correctly hides a slot once its actual start time has passed (see
-- fix_trial_availability_same_day_expiry). But nothing ever moved trial_date
-- forward, so a weekly-recurring slot would just vanish from the booking page
-- after its first occurrence and require a manual date bump every week.
--
-- This rolls trial_date forward by 7-day increments (to the next future
-- occurrence of the same weekday/time) for any active slot whose session has
-- already started, so recurring slots keep reappearing automatically.
CREATE OR REPLACE FUNCTION public.advance_trial_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  slot RECORD;
  new_date date;
BEGIN
  FOR slot IN
    SELECT id, trial_date, start_time, timezone
    FROM public.trial_slots
    WHERE is_active = true
      AND lifecycle = 'active'
      AND trial_date IS NOT NULL
      AND (trial_date + start_time::time) AT TIME ZONE COALESCE(timezone, 'Asia/Kuala_Lumpur') <= now()
  LOOP
    new_date := slot.trial_date;
    WHILE (new_date + slot.start_time::time) AT TIME ZONE COALESCE(slot.timezone, 'Asia/Kuala_Lumpur') <= now() LOOP
      new_date := new_date + 7;
    END LOOP;

    UPDATE public.trial_slots
      SET trial_date = new_date, updated_at = now()
      WHERE id = slot.id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_trial_slots() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_trial_slots() TO service_role;

SELECT cron.schedule(
  'advance-trial-slots',
  '10 * * * *',  -- hourly at :10, offset from the other jobs' :05/:15/:30 ticks
  $$ SELECT public.advance_trial_slots(); $$
);
