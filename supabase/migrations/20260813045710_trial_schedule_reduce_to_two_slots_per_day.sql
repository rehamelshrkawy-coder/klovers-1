-- ============================================================
-- Reduce each trial day from 4 time slots to 2. Keeps the language-
-- dedicated day split from 20260812140000 (Fri+Sat Arabic, Sun+Mon
-- English) unchanged — only trims which specific times are offered.
--
-- Arabic days (Fri, Sat): keep 14:00 and 22:30, drop 17:00 and 20:00.
-- English days (Sun, Mon): keep 19:00 and 22:00, drop 20:30 and 23:30.
--
-- Retiring rather than deleting preserves any historical booking data
-- matched against these rows. No booking, capacity, attendance,
-- confirmation, waitlist, follow-up, or rollover logic is touched.
-- ============================================================

UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired', archived_at = now()
WHERE lifecycle = 'active'
  AND start_time IN ('17:00', '20:00', '20:30', '23:30');
