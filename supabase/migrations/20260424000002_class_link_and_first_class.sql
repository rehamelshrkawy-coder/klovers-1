-- Track when class links are sent and when the student's first class is scheduled.
-- Admin UI stamps these columns when sending the class link email.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS class_link_sent_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS first_class_date TIMESTAMPTZ DEFAULT NULL;
