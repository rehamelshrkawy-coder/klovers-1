-- One-time data fix: clear credits that were granted via the old broken approval
-- flow and never removed when enrollments were subsequently rejected.

ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_fields_trigger;

-- Zero credits for users whose ALL enrollments are REJECTED/cancelled
UPDATE public.profiles SET credits = 0
WHERE user_id IN (
  '19421967-7ddb-4b8e-ac96-f28df839ba1c', -- elshrkawyhossam@gmail.com  (24 orphaned)
  '576367df-83cf-4469-8fc0-fccafd8ce0e6', -- test@gmail.com              (12 orphaned)
  '8d482f71-2edf-4b42-b695-114a33f33a3c', -- abdotaweel1@gmail.com       (4 orphaned)
  'ecc0d7df-98d7-4266-be1c-0786c3e3afb6'  -- humanlifedone@gmail.com     (4 orphaned)
);

-- Fix ayaaraffaa: had 20 credits but only 4 classes_included / 4 sessions_remaining
UPDATE public.profiles SET credits = 4
WHERE user_id = '846805ef-fe6e-4670-8f7c-88f2a4b232f7';

ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_fields_trigger;
