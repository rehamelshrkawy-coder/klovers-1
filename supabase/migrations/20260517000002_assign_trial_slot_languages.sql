-- Assign class_language to the 4 new MYT trial slots.
-- Arabic  → May 29, May 30
-- English → Jun 2, Jun 7
UPDATE public.trial_slots SET class_language = 'arabic'  WHERE trial_date = '2026-05-29' AND start_time = '01:00' AND timezone = 'Asia/Kuala_Lumpur';
UPDATE public.trial_slots SET class_language = 'arabic'  WHERE trial_date = '2026-05-30' AND start_time = '23:00' AND timezone = 'Asia/Kuala_Lumpur';
UPDATE public.trial_slots SET class_language = 'english' WHERE trial_date = '2026-06-02' AND start_time = '23:00' AND timezone = 'Asia/Kuala_Lumpur';
UPDATE public.trial_slots SET class_language = 'english' WHERE trial_date = '2026-06-07' AND start_time = '09:00' AND timezone = 'Asia/Kuala_Lumpur';
