-- ============================================================
-- Final trial schedule shape: one session per day, spreading each
-- language's 2 time options across its 2 dedicated days instead of
-- offering both times on both days.
--
-- Friday   2026-09-04 — Arabic  14:00 only (22:30 retired)
-- Saturday 2026-09-05 — Arabic  22:30 only (14:00 retired)
-- Sunday   2026-09-06 — English 19:00 only (22:00 retired)
-- Monday   2026-09-07 — English 22:00 only (19:00 retired)
--
-- All 4 trial days stay active — only the per-day session count changes
-- from 2 to 1. Retiring (not deleting) preserves any booking history
-- matched against these rows. No booking, capacity, attendance,
-- confirmation, waitlist, follow-up, or rollover logic is touched.
-- ============================================================

UPDATE public.trial_slots
SET is_active = false, lifecycle = 'retired', archived_at = now()
WHERE lifecycle = 'active'
  AND (
    (trial_date = '2026-09-04' AND start_time = '22:30') OR
    (trial_date = '2026-09-05' AND start_time = '14:00') OR
    (trial_date = '2026-09-06' AND start_time = '22:00') OR
    (trial_date = '2026-09-07' AND start_time = '19:00')
  );
