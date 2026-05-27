import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
const SITE_URL = "https://kloversegy.com";

// ── Brand constants (copied from send-confirmation-email) ──
const BRAND_BLACK = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK = "#1a1a1a";
const BRAND_TEXT = "#333333";
const LOGO_URL = "https://kloversegy.com/klovers-logo.jpg";

function brandWrapper(content: string, isRtl: boolean) {
  const dir = isRtl ? "direction: rtl; text-align: right;" : "";
  return `
  <div translate="no" class="notranslate" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <div style="background: ${BRAND_BLACK}; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="KLovers" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${BRAND_YELLOW};" />
      <h2 translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; margin: 12px 0 0; font-size: 22px; letter-spacing: 1px;">KLovers</h2>
      <p style="color: #cccccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
    </div>
    <div style="padding: 28px 24px; ${dir} color: ${BRAND_TEXT};">
      ${content}
    </div>
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;"><span translate="no" class="notranslate">— The KLovers Team</span></p>
      <a href="https://kloversegy.com" style="color: #cccccc; font-size: 11px; text-decoration: none;">kloversegy.com</a>
    </div>
  </div>`;
}

function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
}

// ── Arabic-speaking countries ──
const ARABIC_COUNTRIES = [
  "egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات",
  "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب",
  "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا",
  "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا",
  "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين",
  "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت",
];

function detectLang(country: string): "ar" | "en" {
  const c = (country || "").toLowerCase().trim();
  if (!c || ARABIC_COUNTRIES.some((k) => c.includes(k))) return "ar";
  return "en";
}

function buildEmail(profileEmail: string, lang: "ar" | "en") {
  const isAr = lang === "ar";
  const ctaUrl = `${SITE_URL}/complete-profile?email=${encodeURIComponent(profileEmail)}`;

  const arContent = `
    <h2 style="color:${BRAND_DARK};font-size:20px;margin:0 0 16px;">
      مرحباً! 👋
    </h2>
    <p style="font-size:15px;line-height:1.8;margin:0 0 16px;">
      لاحظنا أن <strong>اسمك</strong> غير مكتمل في ملفك الشخصي على KLovers.
    </p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 20px;">
      نحتاج إلى اسمك لنتمكن من مخاطبتك بشكل صحيح وإعداد مكانك في الفصل الدراسي.
    </p>
    <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:0 0 28px;">
      <p style="color:#92400e;font-weight:bold;margin:0;font-size:14px;">
        ⚠️ الاسم الكامل مطلوب لاستكمال تسجيلك
      </p>
    </div>
    <div style="text-align:center;margin:0 0 28px;">
      ${brandButton("أكمل ملفك الشخصي الآن ←", ctaUrl)}
    </div>
    <p style="color:#999;font-size:12px;margin:0;">
      إذا كنت قد أضفت اسمك بالفعل، يمكنك تجاهل هذا البريد الإلكتروني.
    </p>`;

  const enContent = `
    <h2 style="color:${BRAND_DARK};font-size:20px;margin:0 0 16px;">
      Hi there! 👋
    </h2>
    <p style="font-size:15px;line-height:1.8;margin:0 0 16px;">
      We noticed your <strong>name</strong> is missing from your KLovers profile.
    </p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 20px;">
      We need your name to address you properly and prepare your class spot.
    </p>
    <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:0 0 28px;">
      <p style="color:#92400e;font-weight:bold;margin:0;font-size:14px;">
        ⚠️ Your full name is required to complete registration
      </p>
    </div>
    <div style="text-align:center;margin:0 0 28px;">
      ${brandButton("Complete My Profile →", ctaUrl)}
    </div>
    <p style="color:#999;font-size:12px;margin:0;">
      If you've already added your name, you can ignore this email.
    </p>`;

  return {
    subject: "أكمل ملفك الشخصي / Complete Your Profile — KLovers",
    html: brandWrapper(isAr ? arContent : enContent, isAr),
  };
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Query profiles with empty/null name that haven't been reminded in 7 days
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, email, country, name_reminder_sent_at")
      .or("name.is.null,name.eq.")
      .or(`name_reminder_sent_at.is.null,name_reminder_sent_at.lt.${sevenDaysAgo}`);

    if (error) throw error;

    let sent = 0;
    let skipped = 0;

    for (const profile of profiles ?? []) {
      if (!profile.email) {
        skipped++;
        continue;
      }

      const lang = detectLang(profile.country ?? "");
      const { subject, html } = buildEmail(profile.email, lang);

      try {
        await sendEmail(profile.email, subject, html);

        await supabase
          .from("profiles")
          .update({ name_reminder_sent_at: new Date().toISOString() })
          .eq("user_id", profile.user_id);

        sent++;
        console.log(`Sent name request to ${profile.email} (${lang})`);

        // 1s delay to stay within Resend rate limits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (emailErr) {
        console.error(`Failed to send to ${profile.email}:`, emailErr);
        skipped++;
      }
    }

    console.log(`Name collection emails complete: sent=${sent}, skipped=${skipped}`);

    return new Response(
      JSON.stringify({ success: true, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("send-name-collection-email error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
