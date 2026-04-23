-- Add received_broadcast flag to lead_funnel view.
-- Fires whenever source_type='email' and cta_label='trial_broadcast_sent'
-- which is logged server-side by send-trial-broadcast for each email sent.

CREATE OR REPLACE VIEW public.lead_funnel AS
WITH ranked AS (
  SELECT
    e.*,
    row_number() OVER (PARTITION BY e.session_id ORDER BY e.created_at ASC)  AS rn_asc,
    row_number() OVER (PARTITION BY e.session_id ORDER BY e.created_at DESC) AS rn_desc
  FROM public.lead_events e
),
firsts AS (
  SELECT session_id, source_type AS first_source, source_page AS entry_page
  FROM ranked WHERE rn_asc = 1
),
lasts AS (
  SELECT session_id, source_type AS last_source
  FROM ranked WHERE rn_desc = 1
),
first_utm AS (
  SELECT DISTINCT ON (session_id)
    session_id,
    utm_source    AS first_utm_source,
    utm_medium    AS first_utm_medium,
    campaign      AS first_utm_campaign,
    referrer      AS first_referrer
  FROM public.lead_events
  WHERE utm_source IS NOT NULL
     OR utm_medium IS NOT NULL
     OR campaign   IS NOT NULL
     OR referrer   IS NOT NULL
  ORDER BY session_id, created_at ASC
)
SELECT
  e.session_id,
  min(e.created_at) AS first_seen,
  max(e.created_at) AS last_seen,
  count(*)          AS event_count,
  array_agg(DISTINCT e.source_type) AS touchpoints,
  bool_or(e.source_type = 'whatsapp')       AS clicked_whatsapp,
  bool_or(e.source_type = 'free_trial')     AS clicked_free_trial,
  bool_or(e.source_type = 'placement_test') AS started_placement,
  bool_or(e.source_type = 'pricing')        AS viewed_pricing_cta,
  bool_or(e.source_type = 'email' AND e.cta_label = 'trial_broadcast_sent') AS received_broadcast,
  (array_agg(e.user_id) FILTER (WHERE e.user_id IS NOT NULL))[1] AS user_id,
  bool_or(e.user_id IS NOT NULL)            AS signup_completed,
  f.first_source,
  l.last_source,
  f.entry_page,
  u.first_utm_source,
  u.first_utm_medium,
  u.first_utm_campaign,
  u.first_referrer
FROM public.lead_events e
LEFT JOIN firsts    f ON f.session_id = e.session_id
LEFT JOIN lasts     l ON l.session_id = e.session_id
LEFT JOIN first_utm u ON u.session_id = e.session_id
GROUP BY
  e.session_id,
  f.first_source, l.last_source, f.entry_page,
  u.first_utm_source, u.first_utm_medium, u.first_utm_campaign, u.first_referrer;

COMMENT ON VIEW public.lead_funnel IS
  'Session-level rollup of lead_events with first/last-touch attribution. '
  'received_broadcast=true for sessions where a trial broadcast email was sent. '
  'first_source = entry touchpoint, last_source = exit touchpoint.';
