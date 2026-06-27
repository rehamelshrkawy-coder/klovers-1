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
const DASHBOARD_URL = "https://kloversegy.com/dashboard";

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
}

function buildEmail(name: string, missing: MissingField[], lang: string, planType: string) {
  const isAr = lang === "ar";
  const isGroup = planType === "group";

  const missingItems = missing
    .map((f) => `<li style="margin: 4px 0;">${isAr ? f.label_ar : f.label_en}</li>`)
    .join("");

  const missingBox = `
    <div style="background: #1a1a00; border: 2px solid #FFFF00; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #FFFF00; font-weight: bold; margin: 0 0 8px 0;">&#9888;&#65039; ${isAr ? "بيانات ناقصة:" : "Missing information:"}</p>
      <ul style="color: #ffffff; margin: 0; padding-${isAr ? "right" : "left"}: 20px;">${missingItems}</ul>
    </div>`;

  const ctaLink = `${DASHBOARD_URL}?tab=settings`;
  const ctaBtnStyle = `display: inline-block; background: #FFFF00; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;`;
  const ctaBtn = `<a href="${ctaLink}" style="${ctaBtnStyle}">${isAr ? "أكمل بياناتك الآن" : "Complete Your Info Now"}</a>`;

  const planLabel = isGroup
    ? (isAr ? "حصص المجموعة" : "group classes")
    : (isAr ? "الحصص الخاصة" : "private classes");

  const subjectAr = isGroup
    ? "KLovers — أكمل بياناتك لبدء حصص المجموعة 📝"
    : "KLovers — أكمل بياناتك لبدء حصصك الخاصة 📝";
  const subjectEn = isGroup
    ? "KLovers — Complete your info to join group classes 📝"
    : "KLovers — Complete your info to start private classes 📝";

  const headerLine = `
    <div style="background: #FFFF00; padding: 18px 24px; border-radius: 8px 8px 0 0; margin: -32px -20px 24px -20px;">
      <span style="font-size: 22px; font-weight: 900; color: #000; letter-spacing: -0.5px;">K-Lovers</span>
    </div>`;

  const footer = `<p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;"><span translate="no" class="notranslate">— The KLovers Team</span> · <a href="https://kloversegy.com" style="color: #999;">kloversegy.com</a></p>`;
  const footerAr = `<p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">— فريق KLovers · <a href="https://kloversegy.com" style="color: #999;">kloversegy.com</a></p>`;

  if (isAr) {
    return {
      subject: subjectAr,
      html: `
        <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff; direction: rtl; text-align: right;">
          ${headerLine}
          <h1 style="color: #000000; font-size: 26px; margin-bottom: 8px;">مرحباً ${name && name !== "Unknown" ? name : ""}!</h1>
          <p style="color: #333; font-size: 15px; line-height: 1.7;">تم تأكيد دفعك بنجاح! &#127881; لبدء ترتيب ${planLabel}، نحتاج منك إكمال بعض البيانات الناقصة.</p>
          ${missingBox}
          <p style="color: #333; font-size: 15px; line-height: 1.7;">اضغط على الزر أدناه لتسجيل الدخول وإكمال ملفك الشخصي:</p>
          <div style="text-align: center; margin: 28px 0;">${ctaBtn}</div>
          ${footerAr}
        </div>`,
    };
  }

  return {
    subject: subjectEn,
    html: `
      <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff;">
        ${headerLine}
        <h1 style="color: #000000; font-size: 26px; margin-bottom: 8px;">Hi ${name && name !== "Unknown" ? name : "there"}!</h1>
        <p style="color: #333; font-size: 15px; line-height: 1.7;">Your payment is confirmed! &#127881; To arrange your ${planLabel}, we need a few more details from you.</p>
        ${missingBox}
        <p style="color: #333; font-size: 15px; line-height: 1.7;">Log in and complete your profile to get started:</p>
        <div style="text-align: center; margin: 28px 0;">${ctaBtn}</div>
        ${footer}
      </div>`,
  };
}

const ARAB_COUNTRIES = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات", "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    // Accept either user_ids or enrollment_ids (enrollment_ids takes precedence)
    const targetUserIds: string[] | undefined = body.user_ids;
    const targetEnrollmentIds: string[] | undefined = body.enrollment_ids;
    // plan_types filter: default ["private", "group"]
    const planTypes: string[] = body.plan_types || ["private", "group"];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch unmatched enrollments for both plan types
    let query = supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_days, preferred_day, preferred_time, timezone, level, receipt_url")
      .eq("approval_status", "APPROVED")
      .in("plan_type", planTypes)
      .is("matched_at", null);

    if (targetEnrollmentIds && targetEnrollmentIds.length > 0) {
      query = query.in("id", targetEnrollmentIds);
    } else if (targetUserIds && targetUserIds.length > 0) {
      query = query.in("user_id", targetUserIds);
    }

    const { data: enrollments, error: eErr } = await query;
    if (eErr) throw eErr;

    const userIds = [...new Set((enrollments || []).map((e: any) => e.user_id))];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, name, email, level, country")
      .in("user_id", userIds);
    if (pErr) throw pErr;

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    let sent = 0;
    let skipped = 0;
    const sentDetails: { email: string; missing: string[] }[] = [];

    for (const enrollment of enrollments || []) {
      const profile = profileMap.get(enrollment.user_id) as any;
      if (!profile?.email) { skipped++; continue; }

      const missing: MissingField[] = [];

      // Missing name
      if (!profile.name || profile.name.trim() === "" || profile.name === "Unknown") {
        missing.push({ label_en: "Full Name", label_ar: "الاسم الكامل" });
      }

      // Missing level
      const enrollLevel = enrollment.level || profile.level;
      if (!enrollLevel || enrollLevel.trim() === "") {
        missing.push({ label_en: "Korean Level (take placement test)", label_ar: "مستوى اللغة الكورية (قم باختبار تحديد المستوى)" });
      }

      // Missing country (only for private — for group it's optional)
      if (enrollment.plan_type === "private" && (!profile.country || profile.country.trim() === "")) {
        missing.push({ label_en: "Country", label_ar: "البلد" });
      }

      // Missing timezone
      if (!enrollment.timezone || enrollment.timezone.trim() === "") {
        missing.push({ label_en: "Timezone", label_ar: "المنطقة الزمنية" });
      }

      // Missing preferred days/time (private only — group uses packages)
      if (enrollment.plan_type === "private") {
        if ((!enrollment.preferred_days || enrollment.preferred_days.length === 0) && !enrollment.preferred_day) {
          missing.push({ label_en: "Preferred Class Days", label_ar: "أيام الحصص المفضلة" });
        }
        if (!enrollment.preferred_time || enrollment.preferred_time.trim() === "") {
          missing.push({ label_en: "Preferred Class Time", label_ar: "وقت الحصة المفضل" });
        }
      }

      if (missing.length === 0) { skipped++; continue; }

      const lang = ARAB_COUNTRIES.some(c => (profile.country || "").toLowerCase().includes(c)) ? "ar" : "en";
      const { subject, html } = buildEmail(profile.name, missing, lang, enrollment.plan_type);

      try {
        await sendEmail(profile.email, subject, html);
        sent++;
        sentDetails.push({ email: profile.email, missing: missing.map(m => m.label_en) });
        await new Promise((r) => setTimeout(r, 800)); // rate limit
      } catch (emailErr) {
        console.error(`Failed to send to ${profile.email}:`, emailErr);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, details: sentDetails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Private reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
