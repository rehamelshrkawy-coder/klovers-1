-- All TBA bookings should be pending, not confirmed, until students
-- pick a new June date after receiving the rebook email.
UPDATE public.trial_bookings
SET status = 'pending'
WHERE is_tba = true
  AND status IN ('confirmed', 'pending');
