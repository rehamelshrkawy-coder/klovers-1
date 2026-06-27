// Sends a bilingual (Arabic/English) trial interest confirmation email to
// students who registered interest but haven't attended a trial class yet.
//
// Usage — test mode (single recipient):
//   supabase functions invoke send-trial-interest-confirmation \
//     --body '{"test_email":"reham.elshrkawy@gmail.com","test_name":"Reham"}'
//
// Usage — send to all eligible (admin JWT required):
//   supabase functions invoke send-trial-interest-confirmation \
//     --body '{"send_all":true}'
//
// Join link is read from app_settings key "zoom_meeting_url".
// Set it via Admin → Settings before sending to all users.

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

// ── Email template ────────────────────────────────────────────────────────────

function buildEmail(
  name: string,
  joinLink: string,
  unsubscribeToken: string | null,
): { subject: string; html: string; text: string } {
  const displayName = name?.trim() || "طالب/ة";
  const unsubUrl = unsubscribeToken
    ? `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`
    : `${SITE_URL}/unsubscribe`;

  const subject = "هل لسا مهتم/ة تتعلم الكورية؟ 🇰🇷 | Still interested in Korean?";

  const text = `
أهلاً ${displayName}،

سجّلت اهتمامك بكلاسات الكورية معنا — ونفتكرك كويس!

بفتح كلاسات تجريبية مجانية قريباً، وعايزين نتأكد إنك لسا معانا.

المواعيد المتاحة (توقيت مصر):
• الخميس  4  يونيو 2026 — الساعة 7 مساءً
• الجمعة  5  يونيو 2026 — الساعة 7 مساءً
• الأحد   7  يونيو 2026 — الساعة 6 مساءً

انضم للكلاس: ${joinLink}

الأماكن محدودة — خد مكانك دلوقتي!

---

Hi ${displayName},

You signed up for KLovers Korean classes — and we haven't forgotten you! 🌟

We're holding FREE trial classes and we'd love to see you there.

TRIAL SCHEDULE (Egypt time):
• Thursday  4 June 2026 — 7:00 PM
• Friday    5 June 2026 — 7:00 PM
• Sunday    7 June 2026 — 6:00 PM

Join the class: ${joinLink}

Spots are limited — secure yours now!

Simply reply "YES" to confirm your attendance, or click the button above.

<span translate="no" class="notranslate">— The KLovers Team</span> 💛
---
To unsubscribe: ${unsubUrl}
KLovers Academy — kloversegy.com
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <style>
    @media only screen and (max-width:600px){
      .email-wrapper{padding:12px 6px !important;}
      .email-body{padding:24px 18px !important;}
      .cta-btn{padding:14px 24px !important;font-size:15px !important;}
      .schedule-cell{font-size:14px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">

<!-- Inbox preview text (hidden) -->
<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  عندنا مواعيد جديدة وعايزينك معانا 🎓 — New trial class dates, limited spots!
</div>

<table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#000000;padding:30px 40px;text-align:center;">
      <p style="margin:0 0 6px;color:#FFFF00;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">KLovers Academy</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.5;">
        🇰🇷 الكلاس التجريبي المجاني جاهز!<br>
        <span style="font-size:17px;color:#d1d5db;">Your Free Trial Class Is Ready</span>
      </h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td class="email-body" style="padding:36px 40px;">

      <!-- Arabic section (RTL) -->
      <div dir="rtl" style="text-align:right;">
        <p style="color:#111827;font-size:17px;font-weight:700;margin:0 0 8px;">
          أهلاً ${displayName}! 👋
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 6px;">
          سجّلت اهتمامك بتعلم الكورية معنا — ومنفتكرش! 💛
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">
          بفتح <strong>كلاسات تجريبية مجانية</strong> وعايزين نتأكد إنك لسا معانا.
          الأماكن محدودة، يعني كل يوم بيفرق.
        </p>
      </div>

      <hr style="border:none;border-top:1px dashed #e5e7eb;margin:0 0 22px;">

      <!-- English section -->
      <p style="color:#111827;font-size:17px;font-weight:700;margin:0 0 8px;">
        Hey ${displayName}! 👋
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 6px;">
        You signed up for Korean classes with KLovers — and we still have a spot with your name on it! 🌟
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">
        We're holding <strong>FREE live trial classes</strong> and we'd love to see you join. No experience needed — just curiosity!
      </p>

      <!-- Schedule box -->
      <div style="background:#fafafa;border:2px solid #FFFF00;border-radius:10px;padding:22px 26px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">📅 مواعيد الكلاسات / Trial Schedule</p>
        <p style="margin:0 0 16px;font-size:12px;color:#6b7280;">توقيت مصر / Egypt Time</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="schedule-cell" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:15px;">
              🗓️ <strong style="color:#111827;">الخميس / Thursday</strong>
              <span style="color:#6b7280;"> — 4 June 2026, 7:00 PM</span>
            </td>
          </tr>
          <tr>
            <td class="schedule-cell" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:15px;">
              🗓️ <strong style="color:#111827;">الجمعة / Friday</strong>
              <span style="color:#6b7280;"> — 5 June 2026, 7:00 PM</span>
            </td>
          </tr>
          <tr>
            <td class="schedule-cell" style="padding:10px 0;font-size:15px;">
              🗓️ <strong style="color:#111827;">الأحد / Sunday</strong>
              <span style="color:#6b7280;"> — 7 June 2026, 6:00 PM</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Urgency note -->
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:13px 18px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          ⚡ <strong>الأماكن محدودة — Spots are limited!</strong><br>
          <span dir="rtl" style="font-size:13px;">
            خد مكانك دلوقتي قبل ما يتملي.
          </span>
        </p>
      </div>

      <!-- CTA button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 22px;">
          <a href="${joinLink}"
             class="cta-btn"
             style="background:#FFFF00;color:#000000;text-decoration:none;padding:16px 44px;border-radius:8px;font-size:17px;font-weight:700;display:inline-block;">
            ✅ احجز مكانك — Join the Class
          </a>
        </td></tr>
      </table>

      <!-- Reply CTA -->
      <p style="color:#374151;font-size:14px;line-height:1.8;text-align:center;margin:0 0 20px;">
        أو ببساطة رد على الإيميل ده بـ <strong>"YES"</strong> وهنرسلك التفاصيل كاملة 💬<br>
        <span style="font-size:13px;color:#6b7280;">Or just reply <strong>"YES"</strong> to this email and we'll send you all the details!</span>
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 18px;">

      <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0 0 10px;text-align:center;">
        عندك سؤال؟ رد على الإيميل ده — احنا هنا! 😊<br>
        <span style="font-size:12px;">Questions? Just reply to this email — we're here for you!</span><br><br>
        💛 <strong style="color:#111827;">فريق KLovers / The KLovers Team</strong>
      </p>

      <p style="color:#9ca3af;font-size:11px;text-align:center;margin:12px 0 0;">
        <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe / إلغاء الاشتراك</a>
        &nbsp;·&nbsp; KLovers Academy, Egypt &nbsp;·&nbsp; kloversegy.com
      </p>

    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

// ── Send via Resend ───────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  unsubscribeUrl: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return await res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = (data: unknown) =>
    new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── Parse body first so we can allow unauthenticated test sends ──────────
    const body = await req.json().catch(() => ({}));
    const testEmail: string | null = body.test_email ?? null;
    const testName: string = body.test_name ?? "Reham";
    const sendAll: boolean = body.send_all === true;

    // ── Admin auth guard (required for bulk; skipped for test-only sends) ────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (sendAll) {
      if (!token) return err("Unauthorized — admin JWT required for bulk send", 401);
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return err("Unauthorized", 401);
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) return err("Forbidden — admin role required", 403);
    }

    // ── Fetch join link from app_settings ────────────────────────────────────
    const { data: linkSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zoom_meeting_url")
      .maybeSingle();

    const joinLink: string =
      (linkSetting as { value?: string } | null)?.value?.trim() ||
      `${SITE_URL}/trial-booking`;

    // ── TEST MODE: single email ───────────────────────────────────────────────
    if (testEmail && !sendAll) {
      const { subject, html, text } = buildEmail(testName, joinLink, null);
      const result = await sendEmail(
        testEmail,
        subject,
        html,
        text,
        `${SITE_URL}/unsubscribe`,
      );
      return ok({
        mode: "test",
        sent_to: testEmail,
        subject,
        join_link_used: joinLink,
        resend: result,
      });
    }

    // ── BULK MODE: send to all eligible profiles ──────────────────────────────
    if (!sendAll) {
      return err(
        "Provide test_email for a test send, or send_all:true for bulk (admin only).",
      );
    }

    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("user_id, name, email, email_unsubscribed, unsubscribe_token")
      .not("email", "is", null)
      .neq("email_unsubscribed", true);

    if (profileErr) throw profileErr;
    if (!profiles?.length) return ok({ mode: "bulk", sent: 0, total: 0 });

    let sent = 0;
    const errors: string[] = [];

    for (const p of profiles) {
      if (!p.email) continue;
      try {
        const unsubUrl = p.unsubscribe_token
          ? `${SITE_URL}/unsubscribe?token=${p.unsubscribe_token}`
          : `${SITE_URL}/unsubscribe`;
        const { subject, html, text } = buildEmail(
          p.name ?? "طالب/ة",
          joinLink,
          p.unsubscribe_token,
        );
        await sendEmail(p.email, subject, html, text, unsubUrl);
        sent++;
      } catch (e) {
        errors.push(`${p.email}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return ok({ mode: "bulk", sent, errors, total: profiles.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-trial-interest-confirmation] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
