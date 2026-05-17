-- Expand status values (keep 'confirmed' for backward compat with existing rows)
ALTER TABLE public.trial_bookings DROP CONSTRAINT trial_bookings_status_check;
ALTER TABLE public.trial_bookings ADD CONSTRAINT trial_bookings_status_check
  CHECK (status = ANY (ARRAY['pending'::text,'date_selected'::text,'awaiting_attendance'::text,'confirmed_attendance'::text,'confirmed'::text,'completed'::text,'no_show'::text,'cancelled'::text]));

-- Add attendance tracking columns
ALTER TABLE public.trial_bookings
  ADD COLUMN IF NOT EXISTS attendance_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_token uuid DEFAULT gen_random_uuid();

-- Backfill confirmation_token for existing rows
UPDATE public.trial_bookings SET confirmation_token = gen_random_uuid() WHERE confirmation_token IS NULL;
