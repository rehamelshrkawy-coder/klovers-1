-- ============================================================
-- Trial capacity monitoring + DB-backed rate limits (2026-04-27)
--   1. v_trial_slot_fill_rate   — per-occurrence fill % for ops dashboards
--   2. fn_trial_capacity_alert  — returns slots at or above 80% fill (16/20)
--   3. trial_rate_limits        — DB-backed per-IP rate limiter for book-trial
-- ============================================================

-- ── 1. Per-occurrence fill-rate view ─────────────────────────────────────────
-- Re-uses the same "next occurrence" date logic as get_trial_availability().
-- Provides fill_pct and alert_threshold (>= 80%) for easy monitoring queries.
CREATE OR REPLACE VIEW public.v_trial_slot_fill_rate AS
WITH next_dates AS (
  SELECT
    ts.id,
    ts.day_of_week,
    ts.start_time,
    ts.capacity,
    ts.duration_min,
    ts.timezone,
    (CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::date
      + CASE
          WHEN ts.day_of_week > EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::int
          THEN ts.day_of_week - EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::int
          ELSE ts.day_of_week - EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Africa/Cairo')::int + 7
        END AS next_date
  FROM public.trial_slots ts
  WHERE ts.is_active = true
    AND (ts.lifecycle IS NULL OR ts.lifecycle = 'active')
)
SELECT
  nd.day_of_week,
  nd.start_time,
  nd.capacity,
  nd.next_date AS next_trial_date,
  COALESCE(COUNT(tb.id), 0)::int                          AS booked_count,
  ROUND(COALESCE(COUNT(tb.id), 0)::numeric / NULLIF(nd.capacity, 0) * 100, 1) AS fill_pct,
  (COALESCE(COUNT(tb.id), 0)::numeric / NULLIF(nd.capacity, 0)) >= 0.8        AS near_capacity
FROM next_dates nd
LEFT JOIN public.trial_bookings tb
  ON  tb.day_of_week = nd.day_of_week
  AND tb.start_time  = nd.start_time
  AND tb.trial_date  = nd.next_date
  AND tb.status NOT IN ('cancelled')
GROUP BY nd.id, nd.day_of_week, nd.start_time, nd.capacity, nd.duration_min, nd.timezone, nd.next_date
ORDER BY nd.next_date, nd.start_time;

-- Admins read the view; anonymous users should not access it.
GRANT SELECT ON public.v_trial_slot_fill_rate TO authenticated;

COMMENT ON VIEW public.v_trial_slot_fill_rate IS
  'Per-occurrence fill rate for each active trial slot. '
  'near_capacity=true when booked_count >= 80% of capacity. '
  'Use for ops monitoring and auto-alert queries.';

-- ── 2. Near-capacity alert helper function ────────────────────────────────────
-- Returns only the slots that have hit or exceeded the 80% fill threshold.
-- Callable from pg_cron or an admin webhook to trigger Slack/WhatsApp alerts.
CREATE OR REPLACE FUNCTION public.get_near_capacity_trial_slots()
RETURNS TABLE (
  day_of_week    int,
  start_time     text,
  next_trial_date date,
  capacity       int,
  booked_count   int,
  fill_pct       numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT day_of_week, start_time, next_trial_date, capacity, booked_count, fill_pct
  FROM public.v_trial_slot_fill_rate
  WHERE near_capacity = true
  ORDER BY fill_pct DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_near_capacity_trial_slots() TO authenticated;

COMMENT ON FUNCTION public.get_near_capacity_trial_slots() IS
  'Returns trial slots at ≥ 80% capacity for the next occurrence. '
  'Intended for monitoring hooks — admins can poll this to get near-full alerts.';

-- ── 3. DB-backed rate limit table for book-trial Edge Function ────────────────
-- Replaces the in-memory Map that resets on cold starts.
-- Key is (identifier, window_start) — identifier can be IP or user_id.
CREATE TABLE IF NOT EXISTS public.trial_rate_limits (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier     text        NOT NULL,               -- hashed IP or user_id
  action         text        NOT NULL DEFAULT 'book', -- 'book' | 'guest_book' etc.
  window_start   timestamptz NOT NULL,               -- truncated to 1-hour buckets
  attempt_count  int         NOT NULL DEFAULT 1,
  last_attempt   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identifier, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_trial_rate_limits_lookup
  ON public.trial_rate_limits (identifier, action, window_start);

-- Auto-purge rows older than 24 hours (keeps the table lean)
CREATE INDEX IF NOT EXISTS idx_trial_rate_limits_window
  ON public.trial_rate_limits (window_start);

ALTER TABLE public.trial_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Functions) can write; no user-facing access.
CREATE POLICY "Service role manages rate limits"
  ON public.trial_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.trial_rate_limits IS
  'DB-backed rate limit counters for the book-trial Edge Function. '
  'One row per (identifier, action, 1-hour window). '
  'Survives Edge Function cold starts. Auto-purged after 24 h via pg_cron.';

-- ── 4. Upsert helper called by the Edge Function ─────────────────────────────
-- Returns TRUE if the caller is rate-limited (attempt_count > p_max_attempts),
-- FALSE if they are within limits (and increments the counter).
CREATE OR REPLACE FUNCTION public.upsert_trial_rate_limit(
  p_identifier   text,
  p_action       text,
  p_window_start timestamptz,
  p_max_attempts int DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.trial_rate_limits (identifier, action, window_start, attempt_count, last_attempt)
  VALUES (p_identifier, p_action, p_window_start, 1, now())
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET
    attempt_count = trial_rate_limits.attempt_count + 1,
    last_attempt  = now()
  RETURNING attempt_count INTO v_count;

  RETURN v_count > p_max_attempts;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_trial_rate_limit(text, text, timestamptz, int) TO service_role;

COMMENT ON FUNCTION public.upsert_trial_rate_limit IS
  'Atomically increments the rate-limit counter for (identifier, action, window). '
  'Returns TRUE if the caller has exceeded p_max_attempts this window.';

-- ── 5. pg_cron: purge stale rate limit rows hourly ──────────────────────────
-- Requires pg_cron extension (already enabled on Supabase).
SELECT cron.schedule(
  'purge-trial-rate-limits',
  '15 * * * *',   -- 15 min past every hour
  $$DELETE FROM public.trial_rate_limits WHERE window_start < now() - interval '24 hours'$$
);
