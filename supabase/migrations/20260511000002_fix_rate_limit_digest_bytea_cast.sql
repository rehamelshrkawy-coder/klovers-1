-- Fix: digest() from pgcrypto lives in the 'extensions' schema on Supabase,
-- but this function has SET search_path TO 'public' so it can't find it.
-- Use md5() instead — it's a built-in Postgres function, no extension needed,
-- and cryptographic strength is not required for a rate-limit key.
CREATE OR REPLACE FUNCTION public.upsert_trial_rate_limit(
  p_identifier text,
  p_action text,
  p_window_start timestamp with time zone,
  p_max_attempts integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count  int;
  v_hashed text;
BEGIN
  v_hashed := md5(p_identifier);

  INSERT INTO public.trial_rate_limits (identifier, action, window_start, attempt_count, last_attempt)
  VALUES (v_hashed, p_action, p_window_start, 1, now())
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET
    attempt_count = trial_rate_limits.attempt_count + 1,
    last_attempt  = now()
  RETURNING attempt_count INTO v_count;

  RETURN v_count > p_max_attempts;
END;
$function$;
