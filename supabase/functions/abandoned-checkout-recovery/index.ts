// Abandoned checkout recovery — sends staged recovery emails (1h / 24h / 72h)
// to leads who started checkout but haven't paid. Runs every 30 min via pg_cron.
//
// Stage windows (based on lead.created_at, current age h):
//   Stage 1: 1h  ≤ age < 23h
//   Stage 2: 24h ≤ age < 71h
//   Stage 3: 72h ≤ age < 168h (7d)
//
// Only the single currently-eligible stage is sent per run. Earlier stages are
// NOT backfilled: if a lead is first evaluated at 30h, stage 1 is skipped.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
const SITE_URL = "https://kloversegy.com";
const CHECKOUT_URL = `${SITE_URL}/enroll-now`;
const UNSUBSCRIBE_BASE = `${SUPABASE_URL}/functions/v1/checkout-recovery-unsubscribe`;

// ── Brand constants (match send-confirmation-email) ──
const BRAND_BLACK  = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK   = "#1a1a1a";
const BRAND_TEXT   = "#333333";
const BRAND_MUTED  = "#666666";
const LOGO_URL = "https://kloversegy.com/klovers-logo.jpg";

function brandWrapper(content: string) {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <div style="background: ${BRAND_BLACK}; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="KLovers" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${BRAND_YELLOW};" />
      <h2 style="color: ${BRAND_YELLOW}; margin: 12px 0 0; font-size: 22px; letter-spacing: 1px;">KLovers</h2>
      <p style="color: #cccccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
    </div>
    <div style="padding: 28px 24px; color: ${BRAND_TEXT};">${content}</div>
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;">— The KLovers Team</p>
      <a href="${SITE_URL}" style="color: #cccccc; font-size: 11px; text-decoration: none;">kloversegy.com</a>
    </div>
  </div>`;
}

function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
}

function unsubFooter(token: string) {
  const url = `${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(token)}`;
  return `<p style="color: ${BRAND_MUTED}; font-size: 11px; margin-top: 24px; text-align: center;">
    Don't want to receive these reminders?
    <a href="${url}" style="color: ${BRAND_MUTED}; text-decoration: underline;">Unsubscribe</a>.
  </p>`;
}

interface StageEmail { subject: string; html: string; }

function stage1({ name, checkout, token }: { name: string; checkout: string; token: string; }): StageEmail {
  const first = (name || "there").split(" ")[0];
  return {
    subject: "Did something interrupt your enrollment?",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${first},</h1>
      <p>It looks like you started registering for a Korean course but didn't finish the checkout.</p>
      <p><strong>Your place is still available.</strong><br/>
      You can complete your enrollment in less than a minute here:</p>
      <div style="margin: 24px 0; text-align: center;">${brandButton("Complete my enrollment", checkout)}</div>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>– K-Lovers Team</p>
      ${unsubFooter(token)}
    `),
  };
}

function stage2({ name, checkout, token }: { name: string; checkout: string; token: string; }): StageEmail {
  const first = (name || "there").split(" ")[0];
  return {
    subject: "Your Korean class spot is still available",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${first},</h1>
      <p>Just a quick reminder that your Korean course registration is still waiting to be completed.</p>
      <p>Many students reserve their spots quickly, so if you still want to join the class, you can finish your enrollment here:</p>
      <div style="margin: 24px 0; text-align: center;">${brandButton("Finish enrollment", checkout)}</div>
      <p>We'd love to see you in the next class.</p>
      <p>– K-Lovers Team</p>
      ${unsubFooter(token)}
    `),
  };
}

function stage3({ name, checkout, token }: { name: string; checkout: string; token: string; }): StageEmail {
  const first = (name || "there").split(" ")[0];
  return {
    subject: "Last chance to complete your enrollment",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${first},</h1>
      <p>We noticed you started signing up for a Korean course but didn't finish the process.</p>
      <p>If you still want to join, you can complete your enrollment here:</p>
      <div style="margin: 24px 0; text-align: center;">${brandButton("Complete enrollment", checkout)}</div>
      <p>If you changed your mind, no problem — and if you need help choosing the right level, we're happy to help.</p>
      <p>– K-Lovers Team</p>
      ${unsubFooter(token)}
    `),
  };
}

function buildStage(n: 1 | 2 | 3, args: { name: string; checkout: string; token: string; }) {
  return n === 1 ? stage1(args) : n === 2 ? stage2(args) : stage3(args);
}

async function sendResend(to: string, subject: string, html: string): Promise<string> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${body}`);
  try { return JSON.parse(body)?.id ?? ""; } catch { return ""; }
}

function currentStage(ageHours: number): 1 | 2 | 3 | null {
  if (ageHours >= 1   && ageHours < 23)  return 1;
  if (ageHours >= 24  && ageHours < 71)  return 2;
  if (ageHours >= 72  && ageHours < 168) return 3;
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Candidate leads: reached checkout (plan_type + user_id), recent (≤7d),
    //    not marked enrolled. We filter out paid & unsubscribed in code below.
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id, name, email, plan_type, user_id, status, created_at")
      .not("plan_type", "is", null)
      .not("user_id",   "is", null)
      .neq("status", "enrolled")
      .gte("created_at", cutoff);

    if (leadsErr) throw new Error(`leads query: ${leadsErr.message}`);
    const candidates = leads ?? [];

    // 2. Approved (paid) enrollments — skip those user_ids.
    const userIds = [...new Set(candidates.map(l => l.user_id).filter(Boolean))];
    let paidUserIds = new Set<string>();
    if (userIds.length) {
      const { data: enrs } = await supabase
        .from("enrollments")
        .select("user_id")
        .in("user_id", userIds)
        .eq("status", "APPROVED");
      paidUserIds = new Set((enrs ?? []).map(e => e.user_id));
    }

    // 3. Existing recovery rows per lead.
    const leadIds = candidates.map(l => l.id);
    const existingByLead = new Map<string, { stage: number; unsubscribed_at: string | null; converted_at: string | null; }[]>();
    if (leadIds.length) {
      const { data: rows } = await supabase
        .from("checkout_recovery_emails")
        .select("id, lead_id, stage, unsubscribed_at, converted_at")
        .in("lead_id", leadIds);
      for (const r of rows ?? []) {
        const arr = existingByLead.get(r.lead_id) ?? [];
        arr.push(r);
        existingByLead.set(r.lead_id, arr);
      }
    }

    const result = { evaluated: candidates.length, sent: 0, skipped: 0, failed: 0, details: [] as any[] };

    for (const lead of candidates) {
      if (!lead.email || !lead.user_id) { result.skipped++; continue; }
      if (paidUserIds.has(lead.user_id)) { result.skipped++; continue; }

      const existing = existingByLead.get(lead.id) ?? [];
      if (existing.some(e => e.unsubscribed_at)) { result.skipped++; continue; }

      const ageHours = (Date.now() - new Date(lead.created_at).getTime()) / 3600000;
      const stage = currentStage(ageHours);
      if (!stage) { result.skipped++; continue; }

      // Only send current eligible stage — no backfill of earlier stages.
      if (existing.some(e => e.stage === stage)) { result.skipped++; continue; }

      // Insert a 'pending' row first (unique constraint prevents double-send race).
      const { data: inserted, error: insErr } = await supabase
        .from("checkout_recovery_emails")
        .insert({
          lead_id: lead.id,
          email: lead.email,
          stage,
          send_status: "pending",
          scheduled_for: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insErr) {
        // Most likely a race / uniqueness collision — treat as already handled.
        result.skipped++;
        result.details.push({ lead_id: lead.id, stage, skipped: insErr.message });
        continue;
      }

      const rowId = inserted!.id;
      const token = `${lead.id}.${rowId}`;
      const { subject, html } = buildStage(stage, {
        name: lead.name ?? "",
        checkout: CHECKOUT_URL,
        token,
      });

      try {
        const providerId = await sendResend(lead.email, subject, html);
        await supabase
          .from("checkout_recovery_emails")
          .update({
            send_status: "sent",
            sent_at: new Date().toISOString(),
            provider_message_id: providerId,
          })
          .eq("id", rowId);
        result.sent++;
        result.details.push({ lead_id: lead.id, stage, sent: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from("checkout_recovery_emails")
          .update({ send_status: "failed", error_message: msg })
          .eq("id", rowId);
        result.failed++;
        result.details.push({ lead_id: lead.id, stage, error: msg });
      }
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("abandoned-checkout-recovery error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
