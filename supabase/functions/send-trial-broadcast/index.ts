import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
const SITE_URL = "https://kloversegy.com";

// Resend batch API — sends up to 100 emails per call (well within our 59-user list)
async function sendBatch(emails: { to: string; subject: string; html: string; text: string; unsubscribeUrl: string }[]) {
  const payload = emails.map((e) => ({
    from: FROM_EMAIL,
    to: [e.to],
    subject: e.subject,
    html: e.html,
    text: e.text,
    headers: {
      // RFC 8058 one-click unsubscribe — required by Gmail/Yahoo bulk sender guidelines
      "List-Unsubscribe": `<${e.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }));
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend batch error: ${await res.text()}`);
  return await res.json();
}

function buildBroadcastEmail(
  name: string,
  unsubscribeToken: string | null,
): { subject: string; html: string; text: string } {
  const displayName = name?.trim() || "Student";
  const unsubUrl = unsubscribeToken
    ? `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`
    : `${SITE_URL}/unsubscribe`;

  const subject = "Free Korean Class — احجز مجاناً 🎓";

  // Plain-text version (deliverability + accessibility)
  const text = `Hi ${displayName},

We're opening FREE trial Korean classes and you're invited! 🌟

TRIAL SCHEDULE (Cairo Time):
• Saturday   — 4:00 PM
• Sunday     — 6:30 PM
• Wednesday  — 5:30 PM

⏰ Booking closes 1 day before each class.

Book now → ${SITE_URL}/trial-booking?utm_source=email&utm_medium=broadcast&utm_campaign=trial_broadcast

---
أهلاً ${displayName}،

بنفتح كلاسات تجريبية مجانية في اللغة الكورية — وأنت مدعو/ة تحجز مكانك دلوقتي!

المواعيد (توقيت القاهرة):
• السبت    — 4:00 مساءً
• الأحد    — 6:30 مساءً
• الأربعاء — 5:30 مساءً

الأماكن محدودة وبتتملي بسرعة.
احجز: ${SITE_URL}/trial-booking?utm_source=email&utm_medium=broadcast&utm_campaign=trial_broadcast

---
To unsubscribe: ${unsubUrl}
KLovers Academy — kloversegy.com`;

  const html = `
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-body { padding: 24px 20px !important; }
      .cta-btn { padding: 14px 28px !important; font-size: 15px !important; }
      .slot-table td { font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">
<!-- Preheader: shown in inbox preview, hidden in email body -->
<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Book a free live Korean class — limited spots, no credit card. احجز كلاسك المجاني الآن! 🎓
</div>
<table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#000000;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 8px;color:#FFFF00;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">KLovers Academy</p>
      <h1 style="margin:0;color:#ffffff;font-size:23px;font-weight:700;line-height:1.4;">
        🎓 Free Trial Class — Limited Spots!<br>
        <span style="font-size:19px;color:#e5e5e5;">كلاس تجريبي مجاني — أماكن محدودة!</span>
      </h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td class="email-body" style="padding:36px 40px;">

      <!-- English -->
      <p style="color:#374151;font-size:17px;line-height:1.8;margin:0 0 10px;">
        Hi <strong>${displayName}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 6px;">
        We're opening <strong>free trial Korean classes</strong> and you're invited to book your spot! 🌟
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">
        Spots are limited — first come, first served.
      </p>

      <hr style="border:none;border-top:1px dashed #e5e7eb;margin:0 0 24px;">

      <!-- Arabic -->
      <div dir="rtl" style="text-align:right;">
        <p style="color:#374151;font-size:17px;line-height:1.8;margin:0 0 10px;">
          أهلاً <strong>${displayName}</strong>،
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 6px;">
          بنفتح <strong>كلاسات تجريبية مجانية</strong> في اللغة الكورية — وأنت مدعو/ة تحجز مكانك دلوقتي! 🌟
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">
          الأماكن محدودة وبتتملي بسرعة.
        </p>
      </div>

      <!-- Schedule box -->
      <div style="background:#fafafa;border:2px solid #FFFF00;border-radius:10px;padding:22px 26px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">📅 Trial Schedule / مواعيد الكلاسات</p>
        <p style="margin:0 0 16px;font-size:12px;color:#6b7280;">Cairo Time / توقيت القاهرة</p>
        <table class="slot-table" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:15px;">
              🗓️ <strong style="color:#111827;">Saturday / السبت</strong>
              <span style="color:#6b7280;"> — 4:00 PM</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:15px;">
              🗓️ <strong style="color:#111827;">Sunday / الأحد</strong>
              <span style="color:#6b7280;"> — 6:30 PM</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:15px;">
              🗓️ <strong style="color:#111827;">Wednesday / الأربعاء</strong>
              <span style="color:#6b7280;"> — 5:30 PM</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Deadline -->
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:13px 18px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          ⏰ <strong>Booking closes 1 day before each class</strong><br>
          <span dir="rtl">آخر موعد للحجز: يوم واحد قبل الكلاس — لا تأخرش!</span>
        </p>
      </div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 28px;">
          <a href="${SITE_URL}/trial-booking?utm_source=email&utm_medium=broadcast&utm_campaign=trial_broadcast"
             class="cta-btn"
             style="background:#FFFF00;color:#000000;text-decoration:none;padding:16px 44px;border-radius:8px;font-size:17px;font-weight:700;display:inline-block;">
            Book My Free Class ← احجز الآن
          </a>
        </td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 18px;">

      <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0 0 10px;text-align:center;">
        Questions? Reply to this email or reach us on WhatsApp.<br>
        <span dir="rtl">عندك سؤال؟ رد على الإيميل ده أو تواصل معنا على واتساب.</span><br><br>
        ✨ <strong style="color:#111827;">The KLovers Team / فريق KLovers</strong>
      </p>

      <!-- Unsubscribe -->
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin:12px 0 0;">
        <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe / إلغاء الاشتراك</a>
        &nbsp;·&nbsp; KLovers Academy, Egypt
      </p>

    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = (data: unknown) =>
    new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // ── Admin auth guard ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return err("Unauthorized — admin JWT required", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return err("Unauthorized", 401);

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return err("Forbidden — admin role required", 403);

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const dry_run: boolean = body.dry_run !== false;
    // broadcast_key defaults to today's date so the same admin can't fire twice in a day
    const broadcast_key: string = body.broadcast_key ?? `trial_broadcast_${new Date().toISOString().slice(0, 10)}`;
    // Optional level segmentation: only send to profiles with this level value.
    // E.g. body.level_filter = "beginner" targets only beginners.
    const level_filter: string | null = body.level_filter ?? null;

    // ── Idempotency check ─────────────────────────────────────────────────────
    if (!dry_run) {
      const { data: existing } = await supabase
        .from("trial_broadcasts")
        .select("id, sent_count, created_at")
        .eq("broadcast_key", broadcast_key)
        .maybeSingle();

      if (existing) {
        return err(
          `Broadcast '${broadcast_key}' already sent (${existing.sent_count} emails on ${existing.created_at}). ` +
          `Pass a different broadcast_key to send again.`,
          409
        );
      }
    }

    // ── Fetch profiles ────────────────────────────────────────────────────────
    let profilesQuery = supabase
      .from("profiles")
      .select("user_id, name, email, email_unsubscribed, unsubscribe_token, level")
      .not("email", "is", null)
      .neq("email_unsubscribed", true);

    // Apply level segmentation filter if provided
    if (level_filter) {
      profilesQuery = profilesQuery.eq("level", level_filter);
    }

    const { data: profiles, error: profileErr } = await profilesQuery;

    if (profileErr) throw profileErr;
    if (!profiles?.length) return ok({ dry_run, sent: 0, skipped: 0, total: 0, level_filter });

    // ── Dry run ───────────────────────────────────────────────────────────────
    if (dry_run) {
      return ok({
        dry_run: true,
        sent: 0,
        skipped: profiles.length,
        total: profiles.length,
        level_filter,
        preview_subject: buildBroadcastEmail("Student", null).subject,
        recipients: profiles.map((p) => p.email),
      });
    }

    // ── Build Resend batch payload ────────────────────────────────────────────
    const BATCH_SIZE = 100; // Resend batch limit
    let totalSent = 0;
    let totalErrors = 0;
    const errorLog: string[] = [];

    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const chunk = profiles.slice(i, i + BATCH_SIZE);
      const emails = chunk
        .filter((p) => p.email)
        .map((p) => {
          const unsubscribeUrl = p.unsubscribe_token
            ? `${SITE_URL}/unsubscribe?token=${p.unsubscribe_token}`
            : `${SITE_URL}/unsubscribe`;
          const { subject, html, text } = buildBroadcastEmail(p.name, p.unsubscribe_token);
          return { to: p.email as string, subject, html, text, unsubscribeUrl };
        });

      try {
        await sendBatch(emails);
        totalSent += emails.length;

        // Log lead_events for funnel tracking (non-blocking)
        const events = chunk
          .filter((p) => p.email)
          .map((p) => ({
            session_id: crypto.randomUUID(),
            user_id: p.user_id ?? null,
            source_type: "email",
            source_page: "/email/trial-broadcast",
            cta_label: "trial_broadcast_sent",
            campaign: "trial_broadcast",
            utm_source: "email",
            utm_medium: "broadcast",
          }));
        await supabase.from("lead_events").insert(events).catch((e: unknown) =>
          console.warn("lead_events insert failed:", e)
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[trial-broadcast] Batch ${i}-${i + BATCH_SIZE} failed:`, msg);
        totalErrors += emails.length;
        errorLog.push(msg);
      }
    }

    // ── Record broadcast for idempotency ──────────────────────────────────────
    await supabase.from("trial_broadcasts").insert({
      broadcast_key,
      sent_count: totalSent,
      error_count: totalErrors,
      triggered_by: user.id,
    }).catch((e: unknown) => console.warn("trial_broadcasts insert failed:", e));

    console.log(`[trial-broadcast] key=${broadcast_key} sent=${totalSent} errors=${totalErrors}`);

    return ok({ dry_run: false, broadcast_key, sent: totalSent, errors: totalErrors, total: profiles.length, errorLog });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[trial-broadcast] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
