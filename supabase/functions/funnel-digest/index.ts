// Daily funnel digest — replaces ad-hoc SQL querying with an automated
// 8am Cairo email summarising yesterday's conversion health.
//
// Sections:
//   - Sessions, signups, multi-touch %
//   - Conversion by entry point (first_source)
//   - Trial form step abandonment
//   - Booking failures (with reasons)
//   - Cron health (followups sent)
//   - Top concerns (auto-flagged thresholds)
//
// Triggered hourly by pg_cron with a guard so it only sends once per day
// at the 8am Cairo (06:00 UTC) tick.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("FUNNEL_DIGEST_TO") ?? "learnkorean@kloversegy.com";
const FROM_EMAIL = "KLovers Funnel <noreply@kloversegy.com>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RowEntry { first_source: string | null; sessions: number; signups: number; booked: number; paid: number; conv_pct: number; paid_pct: number }
interface FunnelStep { label: string; sessions: number }
interface Failure { reason: string; sessions: number }

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((100 * n) / d)}%`;
}

function buildHtml(data: {
  yesterday: string;
  sessions: number;
  signups: number;
  multiTouch: number;
  byEntry: RowEntry[];
  trialFunnel: FunnelStep[];
  failures: Failure[];
  prepSent: number;
  day1Sent: number;
  day3Sent: number;
  prepWindowTomorrow: number;
  flags: string[];
}): string {
  const sigPct = pct(data.signups, data.sessions);
  const mtPct = pct(data.multiTouch, data.sessions);

  const entryRows = data.byEntry.map((r) =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${r.first_source ?? "(direct)"}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${r.sessions}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${r.signups}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:#666;">${r.booked}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#070;">${r.paid}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${r.paid_pct}%</td></tr>`
  ).join("");

  const funnelRows = data.trialFunnel.map((s, i, arr) => {
    const dropPct = i === 0 ? "" : pct(arr[i].sessions, arr[i - 1].sessions);
    return `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.label}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${s.sessions}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:#666;font-size:12px;">${dropPct}</td></tr>`;
  }).join("");

  const failureRows = data.failures.length === 0
    ? `<tr><td colspan="2" style="padding:10px;color:#666;text-align:center;">No booking failures yesterday ✓</td></tr>`
    : data.failures.map(f =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#a00;">${f.reason}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${f.sessions}</td></tr>`
      ).join("");

  const flagsHtml = data.flags.length === 0
    ? `<p style="color:#070;margin:0;">✓ No concerns flagged</p>`
    : `<ul style="margin:0;padding-left:18px;color:#a00;">${data.flags.map(f => `<li>${f}</li>`).join("")}</ul>`;

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f5f5f5;padding:20px;">
<table width="640" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ddd;">
  <tr><td style="background:#000;padding:18px 24px;color:#FFFF00;font-weight:bold;font-size:16px;">📊 Klovers Funnel Digest — ${data.yesterday}</td></tr>
  <tr><td style="padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#fafafa;border-radius:8px;">
      <tr>
        <td style="padding:16px;text-align:center;border-right:1px solid #eee;"><div style="font-size:11px;color:#666;text-transform:uppercase;">Sessions</div><div style="font-size:24px;font-weight:bold;">${data.sessions}</div></td>
        <td style="padding:16px;text-align:center;border-right:1px solid #eee;"><div style="font-size:11px;color:#666;text-transform:uppercase;">Signups</div><div style="font-size:24px;font-weight:bold;">${data.signups}</div><div style="font-size:11px;color:#666;">${sigPct}</div></td>
        <td style="padding:16px;text-align:center;"><div style="font-size:11px;color:#666;text-transform:uppercase;">Multi-Touch</div><div style="font-size:24px;font-weight:bold;">${mtPct}</div></td>
      </tr>
    </table>

    <h3 style="margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;">Conversion by entry point</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px;">
      <tr style="background:#fafafa;"><th style="padding:6px 10px;text-align:left;">Source</th><th style="padding:6px 10px;text-align:right;">Sessions</th><th style="padding:6px 10px;text-align:right;">Signups</th><th style="padding:6px 10px;text-align:right;">Booked</th><th style="padding:6px 10px;text-align:right;">Paid</th><th style="padding:6px 10px;text-align:right;">Paid %</th></tr>
      ${entryRows || `<tr><td colspan="6" style="padding:10px;color:#666;text-align:center;">No sessions yesterday</td></tr>`}
    </table>

    <h3 style="margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;">Trial form funnel</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px;">
      <tr style="background:#fafafa;"><th style="padding:6px 10px;text-align:left;">Step</th><th style="padding:6px 10px;text-align:right;">Sessions</th><th style="padding:6px 10px;text-align:right;">% of prev</th></tr>
      ${funnelRows}
    </table>

    <h3 style="margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;">Booking failures</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:24px;">
      ${failureRows}
    </table>

    <h3 style="margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;">Follow-up cron health</h3>
    <p style="font-size:13px;margin:0 0 6px;">Yesterday: <strong>${data.prepSent}</strong> prep · <strong>${data.day1Sent}</strong> day1 · <strong>${data.day3Sent}</strong> day3</p>
    <p style="font-size:13px;margin:0 0 24px;color:#666;">Tomorrow's prep window: <strong>${data.prepWindowTomorrow}</strong> trials</p>

    <h3 style="margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;">Flags</h3>
    <div style="font-size:13px;">${flagsHtml}</div>
  </td></tr>
  <tr><td style="background:#000;padding:14px 24px;color:#999;font-size:11px;">Auto-generated · <a href="https://kloversegy.com/admin" style="color:#FFFF00;">Open admin</a></td></tr>
</table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("missing env (SUPABASE_URL / SERVICE_ROLE_KEY / RESEND_API_KEY)");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Cron fires hourly; only proceed at 06:00 UTC = 08:00 Cairo (one digest/day).
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const utcHour = new Date().getUTCHours();
    if (!force && utcHour !== 6) {
      return new Response(JSON.stringify({ ok: true, skipped: true, utcHour }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Yesterday in Cairo (UTC+2, no DST since 2011)
    const nowCairo = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const yest = new Date(nowCairo.getTime() - 86400000);
    const yLabel = yest.toISOString().slice(0, 10);

    // ── Headline numbers ────────────────────────────────────────────────────
    const { data: hdr } = await supabase.rpc("exec_funnel_digest_headline_v1", {}).select();
    void hdr; // best-effort RPC; fall back to inline counts below

    const since = new Date(yest.getTime()).toISOString();
    const until = new Date(yest.getTime() + 86400000).toISOString();

    const { data: lf } = await supabase
      .from("lead_funnel")
      .select("session_id, first_source, signup_completed, touchpoints, booked_trial, enrolled_paid")
      .gte("first_seen", since)
      .lt("first_seen", until);
    const sessions = lf?.length ?? 0;
    const signups = lf?.filter(r => r.signup_completed).length ?? 0;
    const multiTouch = lf?.filter(r => Array.isArray(r.touchpoints) && r.touchpoints.length >= 2).length ?? 0;

    const byEntryMap = new Map<string, { sessions: number; signups: number; booked: number; paid: number }>();
    for (const r of (lf ?? [])) {
      const k = (r.first_source as string | null) ?? "(direct)";
      const e = byEntryMap.get(k) ?? { sessions: 0, signups: 0, booked: 0, paid: 0 };
      e.sessions++;
      if (r.signup_completed) e.signups++;
      if ((r as { booked_trial?: boolean }).booked_trial) e.booked++;
      if ((r as { enrolled_paid?: boolean }).enrolled_paid) e.paid++;
      byEntryMap.set(k, e);
    }
    const byEntry: RowEntry[] = [...byEntryMap.entries()]
      .map(([k, v]) => ({
        first_source: k,
        sessions: v.sessions,
        signups: v.signups,
        booked: v.booked,
        paid: v.paid,
        conv_pct: v.sessions ? Math.round(100 * v.signups / v.sessions) : 0,
        paid_pct: v.sessions ? Math.round(100 * v.paid / v.sessions) : 0,
      }))
      .sort((a, b) => b.paid - a.paid || b.sessions - a.sessions);

    // ── Trial funnel ────────────────────────────────────────────────────────
    const labelOrder: { key: string[]; label: string }[] = [
      { key: ["landing_viewed"], label: "1. Trial landing viewed" },
      { key: ["homepage_hero_free_trial", "free_trial_landing_primary"], label: "2. Trial CTA clicked" },
      { key: ["slot_page_viewed"], label: "3. Slot page viewed" },
      { key: ["trial_booking_confirm"], label: "4. Booking confirmed" },
    ];
    const trialFunnel: FunnelStep[] = [];
    for (const step of labelOrder) {
      const { data } = await supabase
        .from("lead_events")
        .select("session_id", { count: "exact", head: false })
        .in("cta_label", step.key)
        .gte("created_at", since)
        .lt("created_at", until);
      const uniq = new Set((data ?? []).map((d: any) => d.session_id));
      trialFunnel.push({ label: step.label, sessions: uniq.size });
    }

    // ── Booking failures ────────────────────────────────────────────────────
    const { data: failEvents } = await supabase
      .from("lead_events")
      .select("session_id, metadata")
      .eq("cta_label", "booking_failed")
      .gte("created_at", since)
      .lt("created_at", until);
    const failMap = new Map<string, Set<string>>();
    for (const f of (failEvents ?? [])) {
      const r = ((f.metadata as { reason?: string } | null)?.reason) ?? "(unknown)";
      const set = failMap.get(r) ?? new Set();
      set.add(f.session_id as string);
      failMap.set(r, set);
    }
    const failures: Failure[] = [...failMap.entries()].map(([reason, s]) => ({ reason, sessions: s.size })).sort((a, b) => b.sessions - a.sessions);

    // ── Cron health ─────────────────────────────────────────────────────────
    const { data: cronStats } = await supabase
      .from("trial_bookings")
      .select("followup_prep_sent_at, followup_day1_sent_at, followup_day3_sent_at, trial_date, is_tba");
    const yesterdayPrefix = yLabel; // yyyy-mm-dd
    const todayCairo = nowCairo.toISOString().slice(0, 10);
    const tomorrowCairo = new Date(nowCairo.getTime() + 86400000).toISOString().slice(0, 10);
    let prepSent = 0, day1Sent = 0, day3Sent = 0, prepWindowTomorrow = 0;
    for (const r of (cronStats ?? [])) {
      if (r.followup_prep_sent_at && (r.followup_prep_sent_at as string).startsWith(yesterdayPrefix)) prepSent++;
      if (r.followup_day1_sent_at && (r.followup_day1_sent_at as string).startsWith(yesterdayPrefix)) day1Sent++;
      if (r.followup_day3_sent_at && (r.followup_day3_sent_at as string).startsWith(yesterdayPrefix)) day3Sent++;
      if (r.trial_date === tomorrowCairo && r.is_tba !== true) prepWindowTomorrow++;
    }
    void todayCairo;

    // ── Auto-flagged concerns ───────────────────────────────────────────────
    const flags: string[] = [];
    if (sessions > 0 && signups === 0) flags.push("Zero signups yesterday despite traffic");
    if (sessions >= 10 && (multiTouch / sessions) < 0.10) flags.push(`Multi-touch under 10% (${multiTouch}/${sessions})`);
    const pricingEntry = byEntry.find(r => r.first_source === "pricing");
    if (pricingEntry && pricingEntry.sessions >= 5 && pricingEntry.conv_pct < 5) flags.push(`/pricing entry conv under 5% (${pricingEntry.signups}/${pricingEntry.sessions})`);
    if (failures.some(f => f.reason.includes("non-2xx"))) flags.push("book-trial 500 errors detected");
    const formStart = trialFunnel.find(s => s.label.startsWith("1."))?.sessions ?? 0;
    const formEnd = trialFunnel.find(s => s.label.startsWith("4."))?.sessions ?? 0;
    if (formStart >= 5 && (formEnd / formStart) < 0.20) flags.push(`Trial form completion under 20% (${formEnd}/${formStart})`);

    // Book-to-paid leak: bookings yesterday vs APPROVED enrollments same/next-day.
    // Forensic showed ~5% trial-to-paid which is the biggest unfixed leak — the
    // operations layer needs to know about this every day.
    const totalBooked = byEntry.reduce((s, r) => s + r.booked, 0);
    const totalPaid = byEntry.reduce((s, r) => s + r.paid, 0);
    if (totalBooked >= 3 && (totalPaid / totalBooked) < 0.10) {
      flags.push(`Book-to-paid under 10% (${totalPaid}/${totalBooked} bookings) — sales follow-up needed`);
    }

    const html = buildHtml({
      yesterday: yLabel,
      sessions, signups, multiTouch,
      byEntry, trialFunnel, failures,
      prepSent, day1Sent, day3Sent, prepWindowTomorrow,
      flags,
    });

    const subject = `📊 Klovers funnel — ${yLabel} · ${signups}/${sessions} signups · ${flags.length} flags`;
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [ADMIN_EMAIL], subject, html }),
    });
    if (!sent.ok) {
      const errText = await sent.text();
      throw new Error(`Resend ${sent.status}: ${errText}`);
    }

    return new Response(JSON.stringify({ ok: true, sent: true, sessions, signups, flags }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("funnel-digest error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
