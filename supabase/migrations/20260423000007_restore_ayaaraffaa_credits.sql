-- Restore ayaaraffaa@gmail.com credits to 20 — confirmed paid by admin (markus).
-- The extra 16 credits above her 4-class enrollment were from a separate
-- arrangement recorded outside the enrollments table.

ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_fields_trigger;

UPDATE public.profiles SET credits = 20
WHERE user_id = '846805ef-fe6e-4670-8f7c-88f2a4b232f7';

ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_fields_trigger;
