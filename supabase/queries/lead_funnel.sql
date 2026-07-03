-- Lead funnel analytics queries.
-- Run in Supabase SQL editor against tables: lead_events, lead_funnel (view).

-- 1. WhatsApp clicks in the last 30 days
select count(*) as whatsapp_clicks_30d
from lead_events
where source_type = 'whatsapp'
  and created_at > now() - interval '30 days';

-- 2. WhatsApp clickers who later signed up
select count(*) as whatsapp_clickers_signed_up
from lead_funnel
where clicked_whatsapp and signup_completed;

-- 3. Signup conversion by first touchpoint
select touchpoints[1] as first_touch,
       count(*) filter (where signup_completed) as signups,
       count(*) as total,
       round(100.0 * count(*) filter (where signup_completed) / nullif(count(*), 0), 1) as pct
from lead_funnel
group by 1
order by total desc;

-- 4. Full funnel (all-time)
select
  count(*)                                          as sessions,
  count(*) filter (where clicked_whatsapp)          as whatsapp_clicks,
  count(*) filter (where started_placement)         as placement_starts,
  count(*) filter (where clicked_free_trial)        as free_trial_clicks,
  count(*) filter (where viewed_pricing_cta)        as pricing_views,
  count(*) filter (where signup_completed)          as signups,
  count(*) filter (where trial_booked)              as trial_bookings,
  count(*) filter (where enrollment_completed)      as paid_conversions,
  round(100.0 * count(*) filter (where enrollment_completed)
    / nullif(count(*) filter (where trial_booked), 0), 1) as trial_to_paid_pct
from lead_funnel;

-- 5. WhatsApp click breakdown by source page (which buttons get used)
select source_page, cta_label, count(*) as clicks
from lead_events
where source_type = 'whatsapp'
  and created_at > now() - interval '30 days'
group by source_page, cta_label
order by clicks desc;

-- 6. Top campaigns / utm_sources by signups
select coalesce(campaign, utm_source, 'direct') as source,
       count(distinct session_id) as sessions,
       count(distinct user_id) filter (where user_id is not null) as signups
from lead_events
group by 1
order by signups desc nulls last
limit 20;
