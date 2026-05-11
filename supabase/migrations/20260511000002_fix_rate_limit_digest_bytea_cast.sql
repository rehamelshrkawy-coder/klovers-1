-- Fix: digest() in upsert_trial_rate_limit was called with text arg;
-- pgcrypto's digest() requires bytea. Cast the identifier before hashing.
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
  v_hashed := encode(digest(p_identifier::bytea, 'sha256'), 'hex');

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
