import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

function buildBroadcastEmail(name: string): { subject: string; html: string } {
  const displayName = name?.trim() || "طالب عزيز";

  return {
    subject: "🎓 كلاس تجريبي مجاني — احجز مكانك الآن!",
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#000000;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 8px;color:#FFFF00;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">KLovers Academy</p>
      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">
        🎓 كلاس تجريبي مجاني — أماكن محدودة!
      </h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:36px 40px;">

      <p style="color:#374151;font-size:17px;line-height:1.8;margin:0 0 20px;">
        أهلاً <strong>${displayName}</strong>،
      </p>

      <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">
        عندنا أخبار حلوة! 🌟<br>
        بنفتح <strong>كلاسات تجريبية مجانية</strong> في اللغة الكورية — وأنت مدعو/ة تحجز مكانك دلوقتي.
      </p>

      <!-- Trial dates box -->
      <div style="background:#fafafa;border:2px solid #FFFF00;border-radius:10px;padding:24px 28px;margin:24px 0;">
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">📅 مواعيد الكلاسات التجريبية:</p>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:18px;">🗓️</span>
              <strong style="color:#111827;font-size:15px;margin-right:8px;">السبت</strong>
              <span style="color:#6b7280;font-size:15px;">الساعة 4:00 مساءً (توقيت القاهرة)</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:18px;">🗓️</span>
              <strong style="color:#111827;font-size:15px;margin-right:8px;">الأحد</strong>
              <span style="color:#6b7280;font-size:15px;">الساعة 6:30 مساءً (توقيت القاهرة)</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <span style="font-size:18px;">🗓️</span>
              <strong style="color:#111827;font-size:15px;margin-right:8px;">الأربعاء</strong>
              <span style="color:#6b7280;font-size:15px;">الساعة 5:30 مساءً (توقيت القاهرة)</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Deadline notice -->
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          ⏰ <strong>آخر موعد للحجز:</strong> يوم واحد قبل الكلاس — لا تأخرش!
        </p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 28px;">
        الأماكن محدودة في كل كلاس، وبتتملي بسرعة. اضغط/ي على الزرار دلوقتي واحجز/احجزي مكانك! 🚀
      </p>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:8px 0 28px;">
          <a href="https://kloversegy.com/trial-booking"
             style="background:#FFFF00;color:#000000;text-decoration:none;padding:16px 44px;border-radius:8px;font-size:17px;font-weight:700;display:inline-block;letter-spacing:0.3px;">
            احجز كلاسك المجاني الآن ←
          </a>
        </td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0 24px;">

      <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0;text-align:center;">
        لو عندك أي سؤال، ابعت لنا على واتساب أو رد على الإيميل ده.<br>
        ✨ <strong style="color:#111827;">فريق KLovers</strong>
      </p>

    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false; // default: true (safe)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all profiles with email, excluding unsubscribed
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("name, email, email_unsubscribed")
      .not("email", "is", null)
      .neq("email_unsubscribed", true);

    if (error) throw error;
    if (!profiles?.length) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0, dry_run }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; status: "sent" | "skipped" | "error"; error?: string }[] = [];

    for (const profile of profiles) {
      if (!profile.email) {
        results.push({ email: "(no email)", status: "skipped" });
        continue;
      }

      if (dry_run) {
        results.push({ email: profile.email, status: "skipped" });
        continue;
      }

      try {
        const { subject, html } = buildBroadcastEmail(profile.name);
        await sendEmail(profile.email, subject, html);
        results.push({ email: profile.email, status: "sent" });
        // Respect Resend rate limits
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[trial-broadcast] Failed for ${profile.email}:`, msg);
        results.push({ email: profile.email, status: "error", error: msg });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    console.log(`[trial-broadcast] dry_run=${dry_run} sent=${sent} skipped=${skipped} errors=${errors}`);

    return new Response(
      JSON.stringify({ dry_run, sent, skipped, errors, total: profiles.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trial-broadcast] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
