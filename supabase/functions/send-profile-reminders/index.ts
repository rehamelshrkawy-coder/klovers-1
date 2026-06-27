import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
const SITE_URL = "https://statuesque-dusk-8db757.netlify.app";

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

interface MissingField {
  label_en: string;
  label_ar: string;
  param: string; // query param key
}

function buildReminderEmail(name: string, missing: MissingField[], lang: string, profile_email: string) {
  const isAr = lang === "ar";

  const missingItems = missing
    .map((f) => `<li style="margin: 4px 0;">${isAr ? f.label_ar : f.label_en}</li>`)
    .join("");

  const missingBox = `
    <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #92400e; font-weight: bold; margin: 0 0 8px 0;">⚠️ ${isAr ? "بيانات ناقصة:" : "Missing information:"}</p>
      <ul style="color: #78350f; margin: 0; padding-${isAr ? "right" : "left"}: 20px;">${missingItems}</ul>
    </div>`;

  const ctaBtnStyle = `display: inline-block; background: #FFFF00; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;`;

  const profileUrl = `${SITE_URL}/complete-profile?email=${encodeURIComponent(profile_email)}`;
  const ctaBtn = `<a href="${profileUrl}" style="${ctaBtnStyle}">${isAr ? "أكمل بياناتك الآن" : "Complete My Profile Now"}</a>`;

  const emailHeader = `
    <div style="background: #1a1a00; padding: 20px 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <span style="color: #FFFF00; font-size: 22px; font-weight: 900; letter-spacing: 1px;">K-LOVERS</span>
      <p style="color: #ffffff99; font-size: 11px; margin: 2px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">Korean Language Academy</p>
    </div>`;

  if (isAr) {
    return {
      subject: "KLovers — أكمل بياناتك لبدء الدروس 📝",
      html: `
        <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          ${emailHeader}
          <div style="padding: 32px 28px; direction: rtl; text-align: right;">
            <h2 style="color: #111; font-size: 22px; margin: 0 0 8px 0;">مرحباً ${name || ""}! 👋</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.7; margin: 12px 0;">ملفك الشخصي ببعض البيانات الناقصة. أكملها حتى نتمكن من مطابقتك مع فصل اللغة الكورية المناسب لمستواك وجدولك.</p>
            ${missingBox}
            <p style="color: #444; font-size: 14px; line-height: 1.6; margin: 16px 0;">يستغرق الأمر دقيقتين فقط — وبمجرد الاكتمال، ستكون خطوة واحدة أقرب لبدء رحلتك الكورية! 🇰🇷</p>
            <div style="text-align: center; margin: 28px 0;">
              ${ctaBtn}
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">— فريق KLovers</p>
          </div>
        </div>`,
    };
  }

  return {
    subject: "KLovers — Complete your profile to start classes 📝",
    html: `
      <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${emailHeader}
        <div style="padding: 32px 28px;">
          <h2 style="color: #111; font-size: 22px; margin: 0 0 8px 0;">Hi ${name || "there"}! 👋</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.7; margin: 12px 0;">Your KLovers profile is missing a few details. Fill them in so we can match you with the right Korean class for your level and schedule.</p>
          ${missingBox}
          <p style="color: #444; font-size: 14px; line-height: 1.6; margin: 16px 0;">It only takes 2 minutes — and once complete, you're one step closer to starting your Korean journey! 🇰🇷</p>
          <div style="text-align: center; margin: 28px 0;">
            ${ctaBtn}
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;"><span translate="no" class="notranslate">— The KLovers Team</span></p>
        </div>
      </div>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: enrollments, error: eErr } = await supabase
      .from("enrollments")
      .select("id, user_id, preferred_days, timezone")
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID");

    if (eErr) throw eErr;

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, name, email, level, country");

    if (pErr) throw pErr;

    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

    let sent = 0;
    let skipped = 0;

    for (const enrollment of enrollments || []) {
      const profile = profileMap.get(enrollment.user_id) as any;
      if (!profile?.email) { skipped++; continue; }

      const missing: MissingField[] = [];

      if (!profile.name || profile.name.trim() === "") {
        missing.push({ label_en: "Full Name", label_ar: "الاسم الكامل", param: "name" });
      }
      if (!profile.level || profile.level.trim() === "") {
        missing.push({ label_en: "Korean Level", label_ar: "مستوى اللغة الكورية", param: "level" });
      }
      if (!profile.country || profile.country.trim() === "") {
        missing.push({ label_en: "Country", label_ar: "البلد", param: "country" });
      }
      if (!enrollment.timezone || enrollment.timezone.trim() === "") {
        missing.push({ label_en: "Timezone", label_ar: "المنطقة الزمنية", param: "timezone" });
      }
      if (!enrollment.preferred_days || enrollment.preferred_days.length === 0) {
        missing.push({ label_en: "Preferred Class Days", label_ar: "أيام الحصص المفضلة", param: "days" });
      }

      if (missing.length === 0) { skipped++; continue; }

      const lang = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات", "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"]
        .some(c => (profile.country || "").toLowerCase().includes(c)) ? "ar" : "en";

      const { subject, html } = buildReminderEmail(profile.name, missing, lang, profile.email);

      try {
        await sendEmail(profile.email, subject, html);
        sent++;
        await new Promise((r) => setTimeout(r, 1000));
      } catch (emailErr) {
        console.error(`Failed to send to ${profile.email}:`, emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Profile reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
