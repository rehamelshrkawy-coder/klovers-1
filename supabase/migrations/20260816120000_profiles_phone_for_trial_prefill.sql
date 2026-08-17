-- ─────────────────────────────────────────────────────────────────────────────
-- profiles.phone — so the trial booking form can prefill the WhatsApp number.
--
-- WhatsApp is the primary support channel and the admin trial table already
-- searches by phone, but the only place a number was ever stored was
-- trial_bookings.phone — per booking, never on the person. A student
-- rescheduling, or booking a second trial, had to retype a number we already
-- held.
--
-- Idempotent: safe to re-run, and safe if the column was added out-of-band.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.profiles.phone IS
  'WhatsApp / contact number, collected during trial booking. Prefills the booking form on return visits.';

-- Backfill from the most recent booking that carried a number, so existing
-- students get the prefill too rather than only new ones.
UPDATE public.profiles p
SET phone = b.phone
FROM (
  SELECT DISTINCT ON (user_id) user_id, phone
  FROM public.trial_bookings
  WHERE user_id IS NOT NULL
    AND phone IS NOT NULL
    AND btrim(phone) <> ''
  ORDER BY user_id, created_at DESC
) b
WHERE p.user_id = b.user_id
  AND (p.phone IS NULL OR btrim(p.phone) = '');
