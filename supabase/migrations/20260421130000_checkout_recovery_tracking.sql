-- Checkout recovery email tracking: opens, clicks, and per-lead tracker view.
-- Updated by the `resend-recovery-webhook` edge function when Resend fires
-- email.opened / email.clicked events.

ALTER TABLE public.checkout_recovery_emails
  ADD COLUMN IF NOT EXISTS opened_at  timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_checkout_recovery_emails_provider_message_id
  ON public.checkout_recovery_emails (provider_message_id);

-- ── Refresh KPI view with opens / clicks / booked ────────────────────────
CREATE OR REPLACE VIEW public.checkout_recovery_kpi AS
SELECT
  COUNT(*)                FILTER (WHERE send_status = 'sent')        AS total_sent,
  COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent')        AS leads_emailed,
  COUNT(DISTINCT lead_id) FILTER (WHERE opened_at IS NOT NULL)       AS leads_opened,
  COUNT(DISTINCT lead_id) FILTER (WHERE clicked_at IS NOT NULL)      AS leads_clicked,
  COUNT(DISTINCT lead_id) FILTER (WHERE converted_at IS NOT NULL)    AS leads_converted,
  CASE
    WHEN COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent') = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(DISTINCT lead_id) FILTER (WHERE opened_at  IS NOT NULL)
               / COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent'), 2)
  END AS open_rate_pct,
  CASE
    WHEN COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent') = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(DISTINCT lead_id) FILTER (WHERE clicked_at IS NOT NULL)
               / COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent'), 2)
  END AS click_rate_pct,
  CASE
    WHEN COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent') = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(DISTINCT lead_id) FILTER (WHERE converted_at IS NOT NULL)
               / COUNT(DISTINCT lead_id) FILTER (WHERE send_status = 'sent'), 2)
  END AS recovery_rate_pct
FROM public.checkout_recovery_emails;

GRANT SELECT ON public.checkout_recovery_kpi TO authenticated;

-- ── Per-lead tracker view ────────────────────────────────────────────────
-- One row per lead, summarising stages sent + latest engagement + conversion.
CREATE OR REPLACE VIEW public.checkout_recovery_tracker AS
SELECT
  l.id                               AS lead_id,
  l.name,
  l.email,
  l.plan_type,
  l.created_at                       AS lead_created_at,
  COUNT(cre.id) FILTER (WHERE cre.send_status = 'sent')     AS emails_sent,
  MAX(cre.stage) FILTER (WHERE cre.send_status = 'sent')    AS last_stage_sent,
  MAX(cre.sent_at)                                          AS last_sent_at,
  MAX(cre.opened_at)                                        AS last_opened_at,
  MAX(cre.clicked_at)                                       AS last_clicked_at,
  MAX(cre.converted_at)                                     AS converted_at,
  BOOL_OR(cre.unsubscribed_at IS NOT NULL)                  AS unsubscribed
FROM public.leads l
JOIN public.checkout_recovery_emails cre ON cre.lead_id = l.id
GROUP BY l.id, l.name, l.email, l.plan_type, l.created_at;

GRANT SELECT ON public.checkout_recovery_tracker TO authenticated;
