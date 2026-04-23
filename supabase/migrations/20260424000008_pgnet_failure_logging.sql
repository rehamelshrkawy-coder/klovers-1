-- pg_net failure logging: scan net._http_response for failed calls to the
-- send-confirmation-email function and insert them into email_logs.
-- Runs daily; uses a 25-hour look-back so no failures are missed.

CREATE OR REPLACE FUNCTION public.log_pgnet_email_failures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
BEGIN
  INSERT INTO public.email_logs (template, to_email, status, error, created_at)
  SELECT
    COALESCE(
      (r.request_headers->>'X-Template')::text,
      'unknown_pgnet'
    )                             AS template,
    COALESCE(
      (r.request_body::jsonb->>'email')::text,
      'unknown'
    )                             AS to_email,
    'failed'                      AS status,
    CASE
      WHEN r.error_msg IS NOT NULL THEN r.error_msg
      ELSE 'HTTP ' || r.status_code::text
    END                           AS error,
    r.created                     AS created_at
  FROM net._http_response r
  WHERE r.url LIKE '%/functions/v1/send-confirmation-email'
    AND (r.status_code >= 400 OR r.error_msg IS NOT NULL)
    AND r.created > NOW() - INTERVAL '25 hours'
    -- skip rows already logged (match on url + created timestamp)
    AND NOT EXISTS (
      SELECT 1
        FROM public.email_logs el
       WHERE el.error LIKE 'pgnet:%' || r.id::text
    );

  -- Mark logged rows so the EXISTS check stays fast
  UPDATE net._http_response
     SET error_msg = COALESCE(error_msg, '') || ' pgnet:' || id::text
   WHERE url LIKE '%/functions/v1/send-confirmation-email'
     AND (status_code >= 400 OR error_msg IS NOT NULL)
     AND created > NOW() - INTERVAL '25 hours'
     AND error_msg NOT LIKE '%pgnet:%';
END;
$$;

-- ── Schedule: run daily at 11:00 UTC ─────────────────────────────────────────
SELECT cron.schedule(
  'log-pgnet-email-failures',
  '0 11 * * *',
  $$SELECT public.log_pgnet_email_failures()$$
);
