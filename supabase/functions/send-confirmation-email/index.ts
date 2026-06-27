import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  email: string;
  name: string;
  plan_type?: string;
  duration?: number;
  sessions_total?: number;
  amount?: number;
  language?: string;
  template?: "welcome" | "enrollment" | "group_match" | "slot_confirmed" | "approval" | "pending_review" | "payment_confirmed" | "class_link" | "payment_method_reminder" | "rejection" | "trial_confirmed" | "trial_rebook_request" | "trial_prep" | "trial_followup_day1" | "trial_followup_day3" | "group_forming" | "receipt_nudge" | "group_forming_escalation" | "rejection_followup" | "pre_class_reminder" | "class_feedback" | "trial_attendance_confirmation";
  class_link_url?: string;
  tx_ref?: string;
  payment_date?: string;
  slot_day?: string;
  slot_time?: string;
  slot_timezone?: string;
  first_class_date?: string;
  alert_items?: Array<{ name: string; email: string; days_waiting: number }>;
  unsubscribe_token?: string;
  rebook_url?: string;
  available_slots?: Array<{ day_of_week: number; start_time: string; timezone?: string; date?: string }>;
  enrollment_id?: string;
  rejection_reason?: "payment_not_received" | "time_slots_unavailable" | "other";
  rejection_note?: string;
  resubmit_link?: string;
  group_name?: string;
  group_days?: string;
  group_members?: string[];
  group_time?: string;
  group_timezone?: string;
  group_level?: string;
  custom_message?: string;
  slot_level?: string;
  preferred_day?: string;
  preferred_time?: string;
  timezone?: string;
  level?: string;
  currency?: string;
  trial_date?: string;
  trial_time?: string;
  trial_timezone?: string;
  trial_duration_min?: number;
  calendar_url?: string;
  booking_id?: string;
  confirmation_token?: string;
  meeting_url?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";

// ── Brand constants ──
const BRAND_BLACK = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK = "#1a1a1a";
const BRAND_GRAY = "#f5f5f5";
const BRAND_TEXT = "#333333";
const BRAND_MUTED = "#666666";
const LOGO_URL = "https://kloversegy.com/klovers-logo.jpg";
const SITE_URL = "https://kloversegy.com";

const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";

function unsubscribeFooter(token: string | undefined, isAr: boolean): string {
  // Always include an unsubscribe link — required by CAN-SPAM / PDPL.
  // If no token is available (guest booking), fall back to a contact-based unsubscribe page.
  const url = token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;
  return isAr
    ? `<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">لا تريد استلام هذه الرسائل؟ <a href="${url}" style="color:#999">إلغاء الاشتراك</a></p>`
    : `<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">Don't want these emails? <a href="${url}" style="color:#999">Unsubscribe</a></p>`;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function logEmail(opts: {
  template: string;
  toEmail: string;
  toName?: string;
  status: "sent" | "failed";
  resendId?: string;
  error?: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        template: opts.template,
        to_email: opts.toEmail,
        to_name: opts.toName,
        status: opts.status,
        resend_id: opts.resendId,
        error: opts.error,
      }),
    });
  } catch {
    // never throw from logging
  }
}

function brandWrapper(content: string, isRtl: boolean) {
  const dir = isRtl ? 'direction: rtl; text-align: right;' : '';
  return `
  <div translate="no" class="notranslate" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: ${BRAND_BLACK}; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="KLovers" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${BRAND_YELLOW};" />
      <h2 translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; margin: 12px 0 0; font-size: 22px; letter-spacing: 1px;">KLovers</h2>
      <p style="color: #cccccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
    </div>
    <!-- Body -->
    <div style="padding: 28px 24px; ${dir} color: ${BRAND_TEXT};">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;">— The KLovers Team</p>
      <a href="https://kloversegy.com" style="color: #cccccc; font-size: 11px; text-decoration: none;">kloversegy.com</a>
    </div>
  </div>`;
}

function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
}

function brandTable(rows: [string, string][]) {
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: ${BRAND_MUTED}; font-size: 13px; width: 40%;">${label}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${BRAND_DARK}; font-size: 14px;">${value}</td>
      </tr>`).join("")}
  </table>`;
}

function generateICS(opts: {
  summary: string;
  description: string;
  dtstart: string;
  durationMinutes: number;
  url?: string;
}): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(opts.dtstart);
  const end = new Date(start.getTime() + opts.durationMinutes * 60000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KLovers//Korean Class//EN",
    "BEGIN:VEVENT",
    `UID:klovers-${start.getTime()}@kloversegy.com`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${opts.summary}`,
    `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}`,
    opts.url ? `URL:${opts.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

// Convert a local date+time string to UTC ISO, given an IANA timezone.
function localToUTCISO(dateStr: string, timeStr: string, tz: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const [hStr, mStr] = timeStr.split(":");
  const h = pad(parseInt(hStr ?? "0", 10));
  const m = pad(parseInt(mStr ?? "0", 10));
  // Treat the desired local time as UTC first, then measure the offset.
  const fakeUTC = new Date(`${dateStr}T${h}:${m}:00Z`);
  if (isNaN(fakeUTC.getTime())) return new Date().toISOString();
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(fakeUTC).replace(", ", "T").replace("T24:", "T00:");
  const localTime = new Date(formatted + "Z");
  const offsetMs = localTime.getTime() - fakeUTC.getTime();
  return new Date(fakeUTC.getTime() - offsetMs).toISOString();
}

async function sendEmail(
  to: string, subject: string, html: string,
  attachments?: Array<{ filename: string; content: string; content_type?: string }>
) {
  const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], subject, html };
  if (attachments?.length) body.attachments = attachments;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

// ── Templates ──

function buildWelcomeEmail(name: string, lang: string) {
  const isAr = lang === "ar";
  if (isAr) {
    return {
      subject: "مرحباً بك في KLovers! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${name}! 🎉</h1>
        <p>تم تسجيلك بنجاح في KLovers!</p>
        <p>يمكنك الآن:</p>
        <ul style="padding-right: 20px; line-height: 2;">
          <li>📖 قراءة مقالاتنا عن اللغة الكورية</li>
          <li>📚 التسجيل في دوراتنا الجماعية أو الخاصة</li>
          <li>🎯 بدء رحلتك في تعلم اللغة الكورية</li>
        </ul>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اقرأ المدونة", "https://kloversegy.com/blog")}
          &nbsp;&nbsp;
          ${brandButton("سجّل الآن", "https://kloversegy.com/enroll-now")}
        </div>
      `, true),
    };
  }
  return {
    subject: "Welcome to KLovers! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome ${name}! 🎉</h1>
      <p>You've successfully registered with KLovers!</p>
      <p>You can now:</p>
      <ul style="line-height: 2;">
        <li>📖 Read our blog articles about Korean language & culture</li>
        <li>📚 Enroll in our Group or Private Korean classes</li>
        <li>🎯 Start your Korean learning journey</li>
      </ul>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Read the Blog", "https://kloversegy.com/blog")}
        &nbsp;&nbsp;
        ${brandButton("Enroll Now", "https://kloversegy.com/enroll-now")}
      </div>
    `, false),
  };
}

function buildEnrollmentEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد التسجيل! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً بك في KLovers، ${p.name}!</h1>
        <p>تم تأكيد تسجيلك. إليك التفاصيل:</p>
        ${brandTable([
          ["الخطة", p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة"],
          ["المدة", `${p.duration} ${p.duration === 1 ? "شهر" : "أشهر"}`],
          ["الحصص", `${p.sessions_total} حصة`],
          ["المبلغ المدفوع", amountStr],
        ])}
        <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لإدارة حصصك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Enrollment Confirmed! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome to KLovers, ${p.name}!</h1>
      <p>Your enrollment has been confirmed. Here are your details:</p>
      ${brandTable([
        ["Plan", `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
        ["Duration", `${p.duration} ${p.duration === 1 ? "Month" : "Months"}`],
        ["Sessions", `${p.sessions_total} classes`],
        ["Amount Paid", amountStr],
      ])}
      <p>You can now log in to your Student Dashboard to manage your sessions.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

function buildGroupMatchEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const levelLabel = p.group_level ? (isAr ? `📚 المستوى: ${p.group_level}` : `📚 Level: ${p.group_level}`) : "";
  const timeLabel = p.group_time ? `🕐 ${p.group_time}${p.group_timezone ? ` (${p.group_timezone.replace(/_/g, " ")})` : ""}` : "";
  const membersHtml = (p.group_members && p.group_members.length > 0)
    ? `<div style="margin: 12px 0 0;">
        <p style="margin: 0 0 6px; font-weight: bold; color: ${BRAND_MUTED};">${isAr ? "زملاؤك:" : "Your classmates:"}</p>
        <ul style="margin: 0; padding-${isAr ? "right" : "left"}: 18px; color: ${BRAND_TEXT};">
          ${p.group_members.slice(0, 8).map(n => `<li>${n}</li>`).join("")}
          ${p.group_members.length > 8 ? `<li style="color:${BRAND_MUTED};">+${p.group_members.length - 8} ${isAr ? "آخرين" : "more"}</li>` : ""}
        </ul>
      </div>` : "";
  const customHtml = p.custom_message
    ? `<div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: ${BRAND_TEXT};">
        <p style="margin: 0; white-space: pre-wrap;">${p.custom_message}</p>
      </div>` : "";

  if (isAr) {
    return {
      subject: "KLovers — تم تكوين مجموعتك! 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أخبار رائعة يا ${p.name}! 🎉</h1>
        <p>تم تكوين مجموعتك الدراسية!</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
          <p style="margin: 0; font-weight: bold;">📚 المجموعة: ${p.group_name}</p>
          <p style="margin: 8px 0 0;">📅 الأيام: ${p.group_days}</p>
          ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
          ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
          ${membersHtml}
        </div>
        ${customHtml}
        <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Group is Formed! 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Great news, ${p.name}! 🎉</h1>
      <p>Your study group has been formed!</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; font-weight: bold;">📚 Group: ${p.group_name}</p>
        <p style="margin: 8px 0 0;">📅 Days: ${p.group_days}</p>
        ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
        ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
        ${membersHtml}
      </div>
      ${customHtml}
      <p>We'll contact you shortly with details about your first class.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

function buildSlotConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد مجموعتك! 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أخبار رائعة يا ${p.name}! 🎉</h1>
        <p>تم تأكيد مجموعتك الدراسية!</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
          <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} - ${p.slot_time}</p>
          <p style="margin: 8px 0 0;">🌍 ${p.slot_timezone || "Africa/Cairo"}</p>
          <p style="margin: 8px 0 0;">📚 المستوى: ${p.slot_level}</p>
        </div>
        <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Group is Confirmed! 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Great news, ${p.name}! 🎉</h1>
      <p>Your study group has been confirmed and is ready to start!</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} at ${p.slot_time}</p>
        <p style="margin: 8px 0 0;">🌍 ${(p.slot_timezone || "Africa/Cairo").replace(/_/g, " ")}</p>
        <p style="margin: 8px 0 0;">📚 Level: ${p.slot_level}</p>
      </div>
      <p>We'll contact you shortly with details about your first class.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

function buildApprovalEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const dayLabel = p.preferred_day || "";
  const timeLabel = p.preferred_time || "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "classes"}`],
    [isAr ? "المبلغ" : "Amount", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  if (dayLabel) rows.push([isAr ? "اليوم المفضل" : "Preferred Day", dayLabel]);
  if (timeLabel) rows.push([isAr ? "الوقت المفضل" : "Preferred Time", timeLabel]);
  rows.push([isAr ? "المنطقة الزمنية" : "Timezone", tzLabel]);

  if (isAr) {
    return {
      subject: "KLovers — تمت الموافقة على تسجيلك! ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">تهانينا يا ${p.name}! ✅</h1>
        <p>تمت الموافقة على تسجيلك وتفعيل حسابك بنجاح!</p>
        ${brandTable(rows)}
        <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لمتابعة حصصك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px; text-align: center;">انضم إلى أكثر من 200 طالب عربي يتعلمون الكورية مع KLovers 🌟</p>
        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0; padding-top: 16px;">🎁 <strong>بتحب KLovers؟</strong> ادعُ صديقاً وتحصلوا كلاكما على حصة مجانية. <a href="https://wa.me/201010003084?text=أهلاً%2C+بدي+أعرف+أكثر+عن+KLovers+الكورية" style="color: ${BRAND_DARK}; font-weight: bold;">شارك رابطك ←</a></p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Enrollment is Approved! ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Congratulations, ${p.name}! ✅</h1>
      <p>Your enrollment has been approved and your account is now active!</p>
      ${brandTable(rows)}
      <p>You can now log in to your Student Dashboard to track your classes.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px; text-align: center;">Join 200+ Arabic speakers learning Korean with KLovers 🌟</p>
      <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0; padding-top: 16px;">🎁 <strong>Loving KLovers?</strong> Refer a friend and you both get a free class. <a href="https://wa.me/201010003084?text=Hi%2C+I%27d+love+to+learn+more+about+KLovers+Korean+classes" style="color: ${BRAND_DARK}; font-weight: bold;">Share your link →</a></p>
    `, false),
  };
}

function buildPendingReviewEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "Classes"}`],
    [isAr ? "المبلغ" : "Amount", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  rows.push([isAr ? "المنطقة الزمنية" : "Timezone", tzLabel]);

  if (isAr) {
    return {
      subject: "KLovers — تم استلام طلبك! ⏳",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">شكراً لطلبك يا ${p.name}! ⏳</h1>
        <p>لقد استلمنا طلب تسجيلك بنجاح.</p>
        <p>طلبك قيد المراجعة حالياً بينما نقوم بمطابقتك مع المعلم المناسب ومجموعة الدراسة بناءً على مستواك وجدولك.</p>
        <h3 style="color: ${BRAND_DARK}; border-bottom: 3px solid ${BRAND_YELLOW}; display: inline-block; padding-bottom: 4px;">تفاصيل الخطة المختارة</h3>
        ${brandTable(rows)}
        <p>بمجرد الانتهاء من الجدولة وتأكيد الحصة، ستتلقى بريداً إلكترونياً بتفاصيل حصتك ورابط الانضمام.</p>
        <p>يرجى مراقبة بريدك الوارد لرسالة التأكيد.</p>
        <p style="color: ${BRAND_MUTED};">إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — We've Received Your Request! ⏳",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Thank you for your request, ${p.name}! ⏳</h1>
      <p>We have received your enrollment request successfully.</p>
      <p>Your request is currently under review while we match you with the appropriate teacher and class group based on your level and schedule.</p>
      <h3 style="color: ${BRAND_DARK}; border-bottom: 3px solid ${BRAND_YELLOW}; display: inline-block; padding-bottom: 4px;">Selected Plan Details</h3>
      ${brandTable(rows)}
      <p>Once the scheduling is finalized and the class is confirmed, you will receive a confirmation email with your class details and the link to join your lessons.</p>
      <p>Please keep an eye on your inbox for the confirmation message.</p>
      <p style="color: ${BRAND_MUTED};">If you have any questions, feel free to contact us.</p>
    `, false),
  };
}

function buildRejectionEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const reason = p.rejection_reason ?? "other";

  let bodyEn = "";
  let bodyAr = "";
  let subjectEn = "KLovers — Enrollment Update";
  let subjectAr = "KLovers — تحديث حول تسجيلك";

  if (reason === "payment_not_received") {
    subjectEn = "KLovers — Enrollment Rejected: Payment Not Confirmed";
    subjectAr = "KLovers — تم رفض التسجيل: لم يتم تأكيد الدفع";
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We're sorry, but your enrollment has been <strong>rejected</strong> because we were unable to confirm that the payment was received.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 13px;">💳 <strong>Reason:</strong> Payment transfer could not be confirmed.</p>
      </div>
      <p>Please re-enroll and make sure to transfer the correct amount and upload a clear receipt.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Re-Enroll Now", "https://kloversegy.com/enroll-now")}
      </div>
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>Note from admin:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help? Contact us on WhatsApp.</p>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>نأسف لإبلاغك بأنه تم <strong>رفض</strong> طلب تسجيلك لعدم تمكننا من تأكيد استلام الدفعة.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 13px;">💳 <strong>السبب:</strong> لم يتم التحقق من تحويل الدفعة.</p>
      </div>
      <p>يرجى إعادة التسجيل مع التأكد من تحويل المبلغ الصحيح ورفع إيصال واضح.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("إعادة التسجيل", "https://kloversegy.com/enroll-now")}
      </div>
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>ملاحظة:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">تواصل معنا عبر واتساب إذا احتجت مساعدة.</p>
    `;
  } else if (reason === "time_slots_unavailable") {
    subjectEn = "KLovers — No Available Time Slots — Choose a New Time";
    subjectAr = "KLovers — لا توجد مواعيد متاحة — اختر موعداً جديداً";
    const ctaBtn = p.resubmit_link ? brandButton(isAr ? "اختر موعدك المناسب" : "Choose Your Preferred Slot", p.resubmit_link) : "";
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Unfortunately, there are currently <strong>no available time slots</strong> that match your preferred schedule.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">📅 Please use the button below to view available slots and select a new time that works for you.</p>
      </div>
      ${ctaBtn ? `<div style="margin: 24px 0; text-align: center;">${ctaBtn}</div>` : ""}
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>Note:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">The link expires in 48 hours. Need help? Contact us on WhatsApp.</p>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>للأسف، <strong>لا توجد مواعيد متاحة</strong> حالياً تتناسب مع جدولك المفضل.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">📅 يرجى استخدام الزر أدناه لعرض المواعيد المتاحة واختيار وقت يناسبك.</p>
      </div>
      ${ctaBtn ? `<div style="margin: 24px 0; text-align: center;">${ctaBtn}</div>` : ""}
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>ملاحظة:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">الرابط صالح لمدة 48 ساعة. تواصل معنا عبر واتساب إذا احتجت مساعدة.</p>
    `;
  } else {
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We're sorry, but your enrollment has been <strong>rejected</strong>.</p>
      ${p.rejection_note ? `<div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><p style="margin: 0; color: ${BRAND_TEXT};">${p.rejection_note}</p></div>` : ""}
      <p>Please contact us if you have any questions.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Contact Us on WhatsApp", "https://wa.me/201010003084")}
      </div>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>نأسف لإبلاغك بأنه تم <strong>رفض</strong> طلب تسجيلك.</p>
      ${p.rejection_note ? `<div style="background: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><p style="margin: 0; color: ${BRAND_TEXT};">${p.rejection_note}</p></div>` : ""}
      <p>تواصل معنا إذا كان لديك أي استفسار.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("تواصل معنا عبر واتساب", "https://wa.me/201010003084")}
      </div>
    `;
  }

  return {
    subject: isAr ? subjectAr : subjectEn,
    html: brandWrapper(isAr ? bodyAr : bodyEn, isAr),
  };
}

function buildPaymentMethodReminderEmail(name: string, enrollmentId: string, lang: string) {
  const isAr = lang === "ar";
  const payUrl = `https://kloversegy.com/pay/${enrollmentId}`;
  if (isAr) {
    return {
      subject: "مطلوب: تأكيد طريقة الدفع الخاصة بك ⚠️",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${name}!</h1>
        <p>لاحظنا أنك أرسلت إيصال الدفع، لكن لم يتم تحديد <strong>طريقة الدفع</strong> بعد.</p>
        <p>يرجى زيارة صفحة الدفع الخاصة بك لإكمال هذه الخطوة حتى يتمكن فريقنا من مراجعة طلبك والموافقة عليه.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ لن يتم الموافقة على تسجيلك حتى يتم تأكيد طريقة الدفع.</p>
        </div>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("تأكيد طريقة الدفع", payUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">إذا كنت بحاجة إلى مساعدة، تواصل معنا عبر واتساب.</p>
      `, true),
    };
  }
  return {
    subject: "Action Required: Confirm your payment method ⚠️",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${name}!</h1>
      <p>We noticed you submitted a payment receipt, but your <strong>payment method</strong> wasn't confirmed.</p>
      <p>Please visit your payment page to complete this step so our team can review and approve your enrollment.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ Your enrollment won't be approved until the payment method is confirmed.</p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Confirm Payment Method", payUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help? Contact us on WhatsApp.</p>
    `, false),
  };
}

function buildTrialConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const tz = (p.trial_timezone || "Africa/Cairo").replace(/_/g, " ");
  const tzIana = p.trial_timezone || "Africa/Cairo";
  const durationMin = p.trial_duration_min || 30;

  // Generate ICS attachment when we have enough data
  let icsAttachment: { filename: string; content: string; content_type: string } | undefined;
  if (p.trial_date && p.trial_time) {
    try {
      const dtUTC = localToUTCISO(p.trial_date, p.trial_time, tzIana);
      const icsText = generateICS({
        summary: isAr ? "حصة كورية تجريبية مجانية — KLovers" : "Free Korean Trial Class — Klovers Egypt",
        description: isAr
          ? `حصتك التجريبية المجانية في اللغة الكورية مع KLovers.\nالمستوى: ${p.level || "مبتدئ"}\n\nhttps://kloversegy.com`
          : `Your free ${durationMin}-min trial Korean class with Klovers Egypt.\nLevel: ${p.level || "Beginner"}\n\nhttps://kloversegy.com`,
        dtstart: dtUTC,
        durationMinutes: durationMin,
        url: p.class_link_url || "https://kloversegy.com",
      });
      icsAttachment = {
        filename: "klovers-trial-class.ics",
        content: btoa(unescape(encodeURIComponent(icsText))),
        content_type: "text/calendar",
      };
    } catch { /* skip if date parse fails */ }
  }

  const calSection = icsAttachment
    ? `<div style="margin: 16px 0; text-align: center;">
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 13px;">📎 ${isAr ? "ملف التقويم (.ics) مرفق بهذا الإيميل — افتحه لإضافة الحصة لأي تطبيق تقويم (Google, Apple, Outlook)" : "A calendar file (.ics) is attached — open it to add your class to Google Calendar, Apple Calendar, or Outlook"}</p>
        ${p.calendar_url ? `<a href="${p.calendar_url}" style="display: inline-block; background: #4285f4; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">📅 ${isAr ? "أضف إلى Google Calendar" : "Add to Google Calendar"}</a>` : ""}
       </div>`
    : (p.calendar_url
        ? `<div style="margin: 16px 0; text-align: center;">
            <a href="${p.calendar_url}" style="display: inline-block; background: #4285f4; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">📅 ${isAr ? "أضف إلى تقويم Google" : "Add to Google Calendar"}</a>
           </div>`
        : "");

  const joinBtn = p.class_link_url
    ? `<div style="margin: 20px 0; text-align: center;">
        <a href="${p.class_link_url}" style="display:inline-block;background:${BRAND_BLACK};color:${BRAND_YELLOW};padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">🎓 ${isAr ? "انضم للحصة" : "Join the Class"}</a>
       </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: ${isAr ? "right" : "left"};">${isAr ? "سيتم إرسال رابط الحصة إليك قبل الموعد مباشرة. تابع بريدك الإلكتروني! 📩" : "The class link will be sent to you before the session. Keep an eye on your inbox! 📩"}</p>`;

  // ── ENGLISH VERSION ──────────────────────────────────────────────────────
  if (!isAr) {
    return {
      subject: "🎉 You're in! Your free Korean trial class is confirmed — KLovers",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 24px; margin-bottom: 4px;">Hi ${p.name}! 👋</h1>
        <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-bottom: 20px;">
          We're so excited to have you! Your <strong>free trial Korean class</strong> is officially confirmed.
          Get ready for a fun, relaxed session — no pressure, just great energy. 🌟
        </p>

        <!-- Details card -->
        <div style="background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
          <div style="background: ${BRAND_BLACK}; padding: 10px 18px;">
            <p style="margin: 0; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">📅 Class Details</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; width: 90px;">🗓️ Date</td>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${p.trial_date || ""}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">⏰ Time</td>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${p.trial_time || ""}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">🌍 Timezone</td>
              <td style="padding: 11px 18px; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${tz}</td>
            </tr>
          </table>
        </div>

        ${calSection}
        ${joinBtn}

        <!-- What to expect -->
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; margin: 24px 0 12px;">✨ What happens in this session?</h3>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">This is <strong>not</strong> a regular lesson — it's a friendly intro session where we get to know you! Here's what we'll do:</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">👋</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Introductions</strong> — meet your teacher and the rest of the group
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">💬</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Why Korean?</strong> — everyone shares their story and motivation
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">🗺️</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>How the course works</strong> — structure, schedule, and what to expect
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">📊</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Korean levels explained</strong> — we'll help you find where you fit in
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">🎯</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Your goals</strong> — what do you want to achieve with Korean?
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">❓</span>
            </td>
            <td style="padding: 9px 0 9px 10px; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Q&amp;A</strong> — ask us anything, no question is too small!
            </td>
          </tr>
        </table>

        <!-- Tip box -->
        <div style="background: #fffff0; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 6px; padding: 13px 16px; margin: 22px 0;">
          <p style="margin: 0; color: ${BRAND_DARK}; font-size: 13.5px;">💡 <strong>Quick tip:</strong> Join 5 minutes early, find a quiet spot, and bring your smile — that's all you need! 🇰🇷</p>
        </div>

        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 8px; text-align: center;">Questions? Just reply to this email or reach us on WhatsApp anytime.</p>
      `, false),
      icsAttachment,
    };
  }

  // ── ARABIC VERSION ───────────────────────────────────────────────────────
  return {
    subject: "🎉 تم تأكيد حصتك التجريبية المجانية في الكورية — KLovers",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 24px; margin-bottom: 4px;">أهلاً ${p.name}! 👋</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-bottom: 20px;">
        يسعدنا جداً انضمامك! تم تأكيد مكانك في <strong>الحصة التجريبية المجانية</strong> بنجاح.
        استعد لجلسة ممتعة وخالية من أي ضغط — طاقة إيجابية وأصدقاء جدد! 🌟
      </p>

      <!-- Details card -->
      <div style="background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
        <div style="background: ${BRAND_BLACK}; padding: 10px 18px; text-align: right;">
          <p style="margin: 0; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; letter-spacing: 1px;">تفاصيل الحصة 📅</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; direction: rtl;">
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; width: 90px;">🗓️ التاريخ</td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${p.trial_date || ""}</td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600;">⏰ الوقت</td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${p.trial_time || ""}</td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; color: #888; font-size: 12px; font-weight: 600;">🌍 التوقيت</td>
            <td style="padding: 11px 18px; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${tz}</td>
          </tr>
        </table>
      </div>

      ${calBtn}
      ${joinBtn}

      <!-- What to expect -->
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; margin: 24px 0 12px; text-align: right;">✨ إيه اللي هيحصل في الحصة دي؟</h3>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px; text-align: right;">مش حصة دراسية — ده لقاء تعارف ودردشة ممتعة! هنعمل مع بعض:</p>

      <table style="width: 100%; border-collapse: collapse; direction: rtl;">
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; width: 36px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">👋</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>تعارف</strong> — هنتعرف على المدرس وعلى بعض
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">💬</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>ليه الكورية؟</strong> — كل واحد يشارك قصته وسبب اهتمامه باللغة
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">🗺️</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>إزاي الكورس بيشتغل؟</strong> — هنشرح المحتوى والجداول وكل التفاصيل
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">📊</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>مستويات اللغة الكورية</strong> — هتعرف إنت على أي مستوى وتبدأ منين
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">🎯</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>أهدافك</strong> — عايز تحقق إيه من تعلم الكورية؟
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">❓</span>
          </td>
          <td style="padding: 9px 10px 9px 0; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>أسئلة وأجوبة</strong> — اسأل أي حاجة، ما فيش سؤال صغير!
          </td>
        </tr>
      </table>

      <!-- Tip box -->
      <div style="background: #fffff0; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 6px; padding: 13px 16px; margin: 22px 0; text-align: right;">
        <p style="margin: 0; color: ${BRAND_DARK}; font-size: 13.5px;">💡 <strong>نصيحة سريعة:</strong> انضم قبل الحصة بـ 5 دقايق، دور على مكان هادي، وجيب معاك ابتسامتك — ده كل اللي محتاجه! 🇰🇷</p>
      </div>

      <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 8px; text-align: center;">عندك أسئلة؟ رد على الإيميل ده أو راسلنا واتساب في أي وقت.</p>
    `, true),
    icsAttachment,
  };
}

function buildTrialRebookEmail(p: EmailPayload) {
  const isAr = false; // always send in English
  const url = p.rebook_url || `${SITE_URL}/free-trial`;

  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const formatTime12 = (t: string, ar: boolean) => {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return t || "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? (ar ? "م" : "PM") : (ar ? "ص" : "AM");
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const slots = (p.available_slots || []).slice().sort((a, b) =>
    a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
  );

  const slotCards = slots.length
    ? slots.map((s) => {
        const day = isAr ? dayNamesAr[s.day_of_week] : dayNamesEn[s.day_of_week];
        const tz = (s.timezone || "Africa/Cairo").replace(/_/g, " ");
        const dateLabel = s.date
          ? new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })
          : "";
        const dayPart = dateLabel ? `${day}, ${dateLabel}` : day;
        return `<div style="background: ${BRAND_GRAY}; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; margin: 8px 0; ${isAr ? "text-align: right;" : ""}">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📅 ${dayPart}</p>
          <p style="margin: 4px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">⏰ ${formatTime12(s.start_time, isAr)} (${tz})</p>
        </div>`;
      }).join("")
    : "";

  const meetLinkSection = p.class_link_url
    ? (isAr
        ? `<div style="background: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 رابط Google Meet (احفظه لو سمحت!)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">انضم للكلاس</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">ملاحظة: هذا الرابط شخصي — لا تشاركه مع أحد.</p>
          </div>`
        : `<div style="background: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 Your Google Meet link (save it for class day!)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">Note: This link is personal — please don't share it.</p>
          </div>`)
    : "";

  const chooseBtn = `<div style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
      ${isAr ? "اختر موعدك الآن" : "Choose My Date"}
    </a>
  </div>`;

  if (isAr) {
    return {
      subject: "اختر موعد حصتك التجريبية في Klovers 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 👋</h1>
        <p>مواعيد جديدة متاحة الآن — اختر الموعد الذي يناسبك:</p>
        ${slotCards}
        ${chooseBtn}
        ${meetLinkSection}
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">إذا واجهت أي مشكلة، راسلنا على واتساب أو رد على هذا الإيميل.</p>
      `, true),
    };
  }
  return {
    subject: "Choose your new trial class date at Klovers 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>New trial dates are now available — choose one that works for you.</p>
      ${slotCards}
      ${chooseBtn}
      ${meetLinkSection}
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any trouble? Just reply to this email or message us on WhatsApp.</p>
    `, false),
  };
}

function buildTrialAttendanceConfirmationEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const confirmUrl = `https://kloversegy.com/trial-confirm?id=${p.booking_id || ""}&token=${p.confirmation_token || ""}`;
  const classLink = p.class_link_url || p.meeting_url || null;
  const tzIana = p.trial_timezone || "Africa/Cairo";
  const durationMin = p.trial_duration_min || 30;

  let icsAttachment: { filename: string; content: string; content_type: string } | undefined;
  if (p.trial_date && p.trial_time) {
    try {
      const dtUTC = localToUTCISO(p.trial_date, p.trial_time, tzIana);
      const icsText = generateICS({
        summary: isAr ? "حصة كورية تجريبية مجانية — KLovers" : "Free Korean Trial Class — Klovers Egypt",
        description: isAr
          ? `حصتك التجريبية المجانية في اللغة الكورية مع KLovers.\nhttps://kloversegy.com`
          : `Your free ${durationMin}-min trial Korean class with Klovers Egypt.\nhttps://kloversegy.com`,
        dtstart: dtUTC,
        durationMinutes: durationMin,
        url: classLink || "https://kloversegy.com",
      });
      icsAttachment = {
        filename: "klovers-trial-class.ics",
        content: btoa(unescape(encodeURIComponent(icsText))),
        content_type: "text/calendar",
      };
    } catch { /* skip */ }
  }

  const meetSection = classLink
    ? (isAr
        ? `<div style="background: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 رابط Google Meet الخاص بك</p>
            <a href="${classLink}" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">انضم للكلاس</a>
          </div>`
        : `<div style="background: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 Your Google Meet link</p>
            <a href="${classLink}" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
          </div>`)
    : (isAr
        ? `<div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">🕐 سيتم إرسال رابط الحصة إليك بالبريد الإلكتروني قبل ٢٤ ساعة من الموعد</p>
          </div>`
        : `<div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">🕐 Your class link will be sent to you 24 hours before your session</p>
          </div>`);

  const breakdownAr = `
    <h2 style="color: ${BRAND_DARK}; font-size: 18px; margin: 28px 0 8px;">✨ ماذا سيحدث في هذه الحصة؟</h2>
    <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 16px;">هذه مش حصة دراسة عادية — دي جلسة تعارف ممتعة عشان نتعرف عليك! إليك ما سنفعله:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${[
        ["👋", "تعارف", "تتعرف على معلمك وبقية المجموعة"],
        ["💬", "ليه الكورية؟", "كل واحد يشارك قصته وسبب اهتمامه"],
        ["🗺️", "كيف يعمل الكورس؟", "شرح منهج وطريقة التدريس"],
        ["📊", "مستويات الكورية", "تعرف مستواك وين في رحلة التعلم"],
        ["🎯", "أهدافك", "نناقش ما تريد تحقيقه"],
        ["❓", "أسئلة وأجوبة", "اسأل أي شيء في بالك"],
      ].map(([icon, title, desc]) => `
        <tr>
          <td width="48" style="padding: 10px 8px; vertical-align: top; text-align: center;">
            <span style="display: inline-block; width: 36px; height: 36px; background: ${BRAND_YELLOW}; border-radius: 50%; line-height: 36px; text-align: center; font-size: 18px;">${icon}</span>
          </td>
          <td style="padding: 10px 8px; vertical-align: top;">
            <strong style="color: ${BRAND_DARK};">${title}</strong>
            <span style="color: ${BRAND_MUTED}; font-size: 13px;"> — ${desc}</span>
          </td>
        </tr>`).join("")}
    </table>
    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">💡 <strong>نصيحة سريعة:</strong> انضم قبل ٥ دقائق، اختر مكاناً هادئاً، وابتسم 😊</p>
    </div>`;

  const breakdownEn = `
    <h2 style="color: ${BRAND_DARK}; font-size: 18px; margin: 28px 0 8px;">✨ What happens in this session?</h2>
    <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 16px;">This is <strong>not</strong> a regular lesson — it's a friendly intro session where we get to know you! Here's what we'll do:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${[
        ["👋", "Introductions", "meet your teacher and the rest of the group"],
        ["💬", "Why Korean?", "everyone shares their story and motivation"],
        ["🗺️", "How the course works", "we walk you through the curriculum and teaching style"],
        ["📊", "Korean levels explained", "understand where you are in the learning journey"],
        ["🎯", "Your goals", "we discuss what you want to achieve"],
        ["❓", "Q&A", "ask us anything on your mind"],
      ].map(([icon, title, desc]) => `
        <tr>
          <td width="48" style="padding: 10px 8px; vertical-align: top; text-align: center;">
            <span style="display: inline-block; width: 36px; height: 36px; background: ${BRAND_YELLOW}; border-radius: 50%; line-height: 36px; text-align: center; font-size: 18px;">${icon}</span>
          </td>
          <td style="padding: 10px 8px; vertical-align: top;">
            <strong style="color: ${BRAND_DARK};">${title}</strong>
            <span style="color: ${BRAND_MUTED}; font-size: 13px;"> — ${desc}</span>
          </td>
        </tr>`).join("")}
    </table>
    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">💡 <strong>Quick tip:</strong> Join 5 minutes early, find a quiet spot, and bring your smile 😊</p>
    </div>`;

  if (isAr) {
    return {
      subject: "KLovers — أكّد حضورك لحصتك التجريبية ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 🎉</h1>
        <p>تم تأكيد حصتك التجريبية في اللغة الكورية!</p>
        ${brandTable([
          ["📅 التاريخ", p.trial_date || ""],
          ["⏰ الوقت", p.trial_time || ""],
        ])}
        <div style="margin: 24px 0; text-align: center;">
          <a href="${confirmUrl}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; border: 2px solid ${BRAND_BLACK};">✅ أكّد حضوري</a>
        </div>
        ${meetSection}
        ${breakdownAr}
        <div style="margin: 28px 0 8px; text-align: center;">
          <p style="color: ${BRAND_DARK}; font-weight: bold; font-size: 15px; margin: 0 0 16px;">استعد للحصة — ابدأ بهذين الخطوتين</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="padding: 0 8px 0 0; text-align: center;">
              <a href="${SITE_URL}/placement-test" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">🎯 اختبر مستواك</a>
            </td>
            <td style="padding: 0 0 0 8px; text-align: center;">
              <a href="${SITE_URL}/pricing" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">💰 شوف الأسعار</a>
            </td>
          </tr></table>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">تأكيد الحضور يساعدنا في حجز مقعدك والتحضير لك. شكراً!</p>
        ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">📎 ملف التقويم (.ics) مرفق — افتحه لإضافة الحصة لتقويمك</p>` : ""}
      `, true),
      icsAttachment,
    };
  }
  return {
    subject: "Please confirm your attendance for your Klovers trial class ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 🎉</h1>
      <p>Your trial class is confirmed! Please confirm your attendance so we can reserve your seat and prepare for you.</p>
      ${brandTable([
        ["📅 Date", p.trial_date || ""],
        ["⏰ Time", p.trial_time || ""],
      ])}
      <div style="margin: 24px 0; text-align: center;">
        <a href="${confirmUrl}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; border: 2px solid ${BRAND_BLACK};">✅ Confirm My Attendance</a>
      </div>
      ${meetSection}
      ${breakdownEn}
      <div style="margin: 28px 0 8px; text-align: center;">
        <p style="color: ${BRAND_DARK}; font-weight: bold; font-size: 15px; margin: 0 0 16px;">Get ready — start with these two steps</p>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding: 0 8px 0 0; text-align: center;">
            <a href="${SITE_URL}/placement-test" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">🎯 Take the Placement Test</a>
          </td>
          <td style="padding: 0 0 0 8px; text-align: center;">
            <a href="${SITE_URL}/pricing" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">💰 See Class Prices</a>
          </td>
        </tr></table>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Confirming attendance helps us reserve your seat and prepare for you.</p>
      ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">📎 A calendar file (.ics) is attached — open it to add your class to any calendar app</p>` : ""}
    `, false),
    icsAttachment,
  };
}

// Post-trial nurture sequence. Three stages, shared shell.
function buildTrialPrepEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const placementUrl = `${SITE_URL}/placement-test`;
  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية غداً 🎯",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 👋</h1>
        <p>حصتك التجريبية المجانية <strong>غداً</strong>. إليك كيف تستفيد منها للأقصى:</p>
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">✅ اختبر مستواك قبل الحصة (دقيقتان)</p>
          <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 13px;">هنطابقك مع المعلم المناسب من أول دقيقة. مجاني وبدون تسجيل.</p>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("ابدأ اختبار المستوى", placementUrl)}
        </div>
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">نصائح سريعة:</h3>
        <ul style="color: ${BRAND_TEXT}; padding-right: 20px; line-height: 1.8;">
          <li>🎧 جهّز سماعات وجرّب الكاميرا قبل الحصة</li>
          <li>📝 اكتب 2–3 أسباب ليه بتتعلم كوري (هيساعد المعلم)</li>
          <li>☕ خذ حاجة تشربها — الحصة 45 دقيقة</li>
        </ul>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">في أي سؤال؟ رد على الإيميل ده أو راسلنا واتساب.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your trial is tomorrow 🎯",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Your free trial class is <strong>tomorrow</strong>. Here's how to get the most out of it:</p>
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">✅ Find your level before class (2 min)</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 13px;">So your teacher is ready for you from minute one. Free, no sign-up.</p>
      </div>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("Take the placement test", placementUrl)}
      </div>
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">Quick tips:</h3>
      <ul style="color: ${BRAND_TEXT}; padding-left: 20px; line-height: 1.8;">
        <li>🎧 Test your headphones + camera beforehand</li>
        <li>📝 Jot down 2–3 reasons you're learning Korean (helps your teacher)</li>
        <li>☕ Grab a drink — it's a 45-minute session</li>
      </ul>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email or message us on WhatsApp.</p>
    `, false),
  };
}

function buildTrialFollowupDay1Email(p: EmailPayload) {
  const isAr = p.language === "ar";
  const pricingUrl = `${SITE_URL}/pricing`;
  if (isAr) {
    return {
      subject: "KLovers — ازاي كانت حصتك التجريبية؟ 💭",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 🌱</h1>
        <p>ازاي كانت حصتك التجريبية أمس؟ نتمنى تكون حبيتها.</p>
        <p>لو جاهز تكمل رحلة الكورية، شوف خططنا — فيه <strong>حصص جماعية تبدأ من 25$</strong> وحصص خاصة لو بتفضّل الاهتمام الشخصي.</p>
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">✨ ليه يسجّل الطلاب معانا:</p>
          <ul style="margin: 6px 0 0; padding-right: 20px; color: ${BRAND_TEXT}; line-height: 1.7;">
            <li>مجموعات صغيرة (4–8 طلاب)</li>
            <li>معلمين أصليين بخبرة TOPIK</li>
            <li>استرداد كامل بعد أول حصة مدفوعة لو مش حبّيت</li>
          </ul>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("شوف الخطط", pricingUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">عندك أسئلة أو استفسارات عن أنسب خطة؟ رد على الإيميل ده أو راسلنا واتساب وهنساعدك تختار.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — how was your trial class? 💭",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 🌱</h1>
      <p>How was your trial class yesterday? We hope you loved it.</p>
      <p>If you're ready to keep going, here are our plans — <strong>group classes from just $25</strong> and private 1-on-1 if you want dedicated attention.</p>
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">✨ Why students stay with us:</p>
        <ul style="margin: 6px 0 0; padding-left: 20px; color: ${BRAND_TEXT}; line-height: 1.7;">
          <li>Small groups (4–8 students)</li>
          <li>Native teachers with TOPIK experience</li>
          <li>Full refund after your first paid class if you don't love it</li>
        </ul>
      </div>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("See the plans", pricingUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Questions, or want help picking a plan? Reply to this email or message us on WhatsApp — we'll help you choose.</p>
    `, false),
  };
}

function buildTrialFollowupDay3Email(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084?text=" + encodeURIComponent("Hi! I just finished my free trial and I'd like help picking a plan.");
  const pricingUrl = `${SITE_URL}/pricing`;
  if (isAr) {
    return {
      subject: "KLovers — محتاج مساعدة نختار خطة؟ 🤝",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}!</h1>
        <p>مرّت كام يوم على حصتك التجريبية — أحياناً اختيار الخطة المناسبة بياخد وقت.</p>
        <p>لو عندك أي سؤال عن الأسعار أو المجموعات أو الجدول، <strong>كلمنا على واتساب</strong> وهنساعدك في دقايق.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">💬 كلمنا على واتساب</a>
        </div>
        <p style="text-align: center; color: ${BRAND_MUTED}; font-size: 13px;">أو <a href="${pricingUrl}" style="color: ${BRAND_DARK};">شوف الخطط بنفسك</a></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">ده آخر تذكير — مش هنبعتلك إيميلات متابعة تانية بعد كده.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — need help picking a plan? 🤝",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>It's been a few days since your trial — picking the right plan can take some thought.</p>
      <p>If you've got any question on pricing, groups, or schedule, <strong>message us on WhatsApp</strong> and we'll sort it out in minutes.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">💬 Chat on WhatsApp</a>
      </div>
      <p style="text-align: center; color: ${BRAND_MUTED}; font-size: 13px;">Or <a href="${pricingUrl}" style="color: ${BRAND_DARK};">browse the plans yourself</a></p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
      <p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">This is our last nudge — we won't keep emailing you after this.</p>
    `, false),
  };
}

function buildPaymentConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "classes"}`],
    [isAr ? "المبلغ المدفوع" : "Amount Paid", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  if (p.tx_ref) rows.push([isAr ? "رقم المرجع" : "Reference #", p.tx_ref]);
  if (p.payment_date) rows.push([isAr ? "تاريخ الدفع" : "Payment Date", p.payment_date]);

  const timelineEn = `
    <div style="margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 14px; color: ${BRAND_DARK}; font-size: 15px;">What happens next:</p>
      <div style="border-left: 3px solid ${BRAND_YELLOW}; padding-left: 16px;">
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">✅ Payment received</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">Your seat is reserved — we've got you.</p>
        </div>
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">⏳ Group forming — 2–5 business days</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">We'll match you with the right group and schedule.</p>
        </div>
        <div>
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📧 Class link sent to you</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">You'll get an email with your meeting link before the first class.</p>
        </div>
      </div>
    </div>`;

  const timelineAr = `
    <div style="margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 14px; color: ${BRAND_DARK}; font-size: 15px;">ما الذي سيحدث بعد ذلك:</p>
      <div style="border-right: 3px solid ${BRAND_YELLOW}; padding-right: 16px;">
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">✅ تم استلام الدفع</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">مقعدك محجوز — نحن معك.</p>
        </div>
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">⏳ تشكيل المجموعة — من 2 إلى 5 أيام عمل</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">سنقوم بمطابقتك مع المجموعة المناسبة والجدول الزمني.</p>
        </div>
        <div>
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📧 إرسال رابط الحصة</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">ستتلقى بريداً إلكترونياً يتضمن رابط الاجتماع قبل الحصة الأولى.</p>
        </div>
      </div>
    </div>`;

  if (isAr) {
    return {
      subject: "KLovers — تم استلام دفعتك! مقعدك محجوز ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! ✅</h1>
        <p>تم استلام دفعتك بنجاح وتأكيد حجز مقعدك. مجموعتك تتشكل الآن — نقوم بمطابقتك مع طلاب على نفس مستواك.</p>
        ${brandTable(rows)}
        ${timelineAr}
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">احتفظ بهذا البريد الإلكتروني كإيصال للدفع.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">لا يلزمك اتخاذ أي إجراء الآن. سنتواصل معك قريباً.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">انضم إلى أكثر من 200 طالب عربي يتعلمون الكورية مع KLovers 🌟</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Payment Received! Your Seat is Reserved ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! ✅</h1>
      <p>We've confirmed your payment and your seat is reserved. Your group is forming now — we're matching you with students at the same level.</p>
      ${brandTable(rows)}
      ${timelineEn}
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">Save this email as your payment receipt.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">No action is required from you right now. We'll be in touch soon.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">Join 200+ Arabic speakers learning Korean with KLovers 🌟</p>
    `, false),
  };
}

function buildGroupFormingEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";

  if (isAr) {
    return {
      subject: "KLovers — مجموعتك في طريقها إليك! ⏳",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 👋</h1>
        <p>أردنا فقط التأكد من أن كل شيء على ما يرام.</p>
        <p>لا يزال فريقنا يعمل على تشكيل مجموعتك الدراسية — نحرص على إيجاد أفضل جدول ومعلم مناسب لك.</p>
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;">📧 بمجرد تجهيز مجموعتك، ستتلقى بريداً إلكترونياً فوراً يتضمن رابط الانضمام.</p>
        </div>
        <p>شكراً لصبرك — نقدّره كثيراً!</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">عندك أسئلة؟ تواصل معنا عبر واتساب.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        <div style="background: ${BRAND_GRAY}; border-radius: 6px; padding: 14px 18px; margin-top: 16px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: ${BRAND_DARK};">📚 ابدأ قبل ما تيجي الحصة الأولى</p>
          <p style="margin: 0; font-size: 13px; color: ${BRAND_MUTED};">تعلم الأبجدية الكورية (هانغول) في 30 دقيقة — <a href="https://www.youtube.com/watch?v=s5aobqyEaMQ" style="color: ${BRAND_DARK}; font-weight: bold;">شاهد على يوتيوب ←</a></p>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Your group is almost ready! ⏳",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Just a quick update from the team.</p>
      <p>We're still putting together your class group — making sure you get the best schedule and the right teacher match.</p>
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px;">📧 Once your group is ready, you'll receive an email immediately with your class meeting link.</p>
      </div>
      <p>Thank you for your patience — we really appreciate it!</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      <div style="background: ${BRAND_GRAY}; border-radius: 6px; padding: 14px 18px; margin-top: 16px;">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: ${BRAND_DARK};">📚 Start before your first class</p>
        <p style="margin: 0; font-size: 13px; color: ${BRAND_MUTED};">Learn the Korean alphabet (Hangul) in 30 minutes — <a href="https://www.youtube.com/watch?v=s5aobqyEaMQ" style="color: ${BRAND_DARK}; font-weight: bold;">Watch on YouTube →</a></p>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

function buildReceiptNudgeEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const dashboardUrl = "https://kloversegy.com/dashboard";

  if (isAr) {
    return {
      subject: "KLovers — مطلوب: رفع إيصال الدفع لتفعيل حسابك ⚠️",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! ⚠️</h1>
        <p>لاحظنا أن تسجيلك لا يزال معلقاً لأننا لم نتلقَّ إيصال الدفع بعد.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;"><strong>المطلوب:</strong> قم برفع إيصال التحويل البنكي أو Vodafone Cash أو InstaPay من خلال لوحة التحكم الخاصة بك.</p>
        </div>
        <p>بمجرد التحقق من الدفع، سيتم قبول تسجيلك وتفعيل حسابك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("رفع الإيصال الآن", dashboardUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">إذا قمت بالدفع بالفعل، تأكد من رفع صورة واضحة للإيصال.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Action Required: Upload your payment receipt ⚠️",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! ⚠️</h1>
      <p>Your enrollment is still pending because we haven't received your payment receipt yet.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;"><strong>Action needed:</strong> Upload your bank transfer, Vodafone Cash, or InstaPay receipt from your dashboard.</p>
      </div>
      <p>Once your payment is verified, your enrollment will be approved and your account activated.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Upload Receipt Now", dashboardUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">If you've already paid, make sure to upload a clear photo of your receipt.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

function buildClassLinkEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const linkUrl = p.class_link_url || "#";
  const tz = (p.slot_timezone || "Africa/Cairo").replace(/_/g, " ");

  // ICS calendar invite — only when first_class_date is known
  let icsAttachment: { filename: string; content: string; content_type: string } | undefined;
  if (p.first_class_date) {
    try {
      const icsText = generateICS({
        summary: "Korean Class — KLovers",
        description: `Join your KLovers Korean class here: ${linkUrl}`,
        dtstart: p.first_class_date,
        durationMinutes: 90,
        url: linkUrl,
      });
      icsAttachment = {
        filename: "korean-class.ics",
        content: btoa(unescape(encodeURIComponent(icsText))),
        content_type: "text/calendar",
      };
    } catch { /* skip if date parse fails */ }
  }

  const scheduleBlock = p.slot_day
    ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0;">
        <p style="margin: 0; font-size: 14px;">📅 <strong>${p.slot_day}</strong>${p.slot_time ? ` at ${p.slot_time}` : ""} <span style="color: ${BRAND_MUTED}; font-size: 12px;">(${tz})</span></p>
      </div>`
    : "";

  const scheduleBlockAr = p.slot_day
    ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0;">
        <p style="margin: 0; font-size: 14px;">📅 <strong>${p.slot_day}</strong>${p.slot_time ? ` الساعة ${p.slot_time}` : ""} <span style="color: ${BRAND_MUTED}; font-size: 12px;">(${tz})</span></p>
      </div>`
    : "";

  if (isAr) {
    return {
      subject: "KLovers — حصتك جاهزة! إليك رابط الانضمام 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">حصتك جاهزة يا ${p.name}! 🎓</h1>
        <p>تم تشكيل مجموعتك الدراسية بالكامل وحصتك مجدولة ومستعدة للبدء.</p>
        ${scheduleBlockAr}
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW}; text-align: center;">
          <p style="margin: 0 0 12px; font-weight: bold; font-size: 15px;">رابط الانضمام لحصتك:</p>
          ${brandButton("انضم للحصة الآن", linkUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">احتفظ بهذا الرابط — ستستخدمه للانضمام لجميع حصصك.</p>
        ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">📅 تم إرفاق دعوة التقويم بهذا البريد — افتحها لإضافة الحصة لتقويمك.</p>` : ""}
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">في حالة أي استفسار، تواصل معنا على واتساب.</p>
      `, true),
      icsAttachment,
    };
  }
  return {
    subject: "KLovers — Your Class is Ready! Here's Your Meeting Link 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Your class is ready, ${p.name}! 🎓</h1>
      <p>Your study group is fully formed and your class is scheduled and ready to start.</p>
      ${scheduleBlock}
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW}; text-align: center;">
        <p style="margin: 0 0 12px; font-weight: bold; font-size: 15px;">Your class meeting link:</p>
        ${brandButton("Join Your Class", linkUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">Save this link — you'll use it to join all your classes.</p>
      ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">📅 A calendar invite is attached — open it to add your class to your calendar.</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
    `, false),
    icsAttachment,
  };
}

function buildGroupFormingEscalationEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";
  if (isAr) {
    return {
      subject: "KLovers — نعتذر عن الانتظار — مجموعتك قادمة قريباً 🙏",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>نعلم أن الانتظار قد يكون صعباً، ونقدّر صبرك الكبير.</p>
        <p>ما زلنا نعمل على إتمام تشكيل مجموعتك — نريد التأكد من حصولك على أفضل معلم وجدول يناسبك تماماً.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⚡ ستتلقى بريداً إلكترونياً يتضمن رابط حصتك فور اكتمال تشكيل المجموعة.</p>
        </div>
        <p>لو عندك أي سؤال أو قلق، كلمنا مباشرة على واتساب:</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Sorry for the wait — your group is almost there 🙏",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We know waiting isn't fun, and we really appreciate your patience.</p>
      <p>We're still working on forming your class group — we want to make sure you get the best teacher match and schedule for you.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">⚡ You'll receive your class meeting link the moment your group is complete.</p>
      </div>
      <p>If you have any questions or concerns, message us directly on WhatsApp:</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

function buildRejectionFollowupEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const enrollUrl = "https://kloversegy.com/enroll-now";
  if (isAr) {
    return {
      subject: "KLovers — لا تفوّت فرصتك — اختر موعدك الآن 📅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>لاحظنا أنك لم تختر موعداً جديداً بعد.</p>
        <p>لا يزال بإمكانك إعادة التسجيل واختيار وقت يناسبك — لدينا مواعيد متاحة وطلابنا ينتظرونك في المجموعة!</p>
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;">📅 اختر موعدك الجديد وسنقوم بمطابقتك مع المجموعة المناسبة.</p>
        </div>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اختر موعدك الآن", enrollUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">هذه آخر رسالة متابعة — بعدها القرار بيدك دائماً.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Don't miss your spot — pick a new time 📅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We noticed you haven't picked a new time slot yet.</p>
      <p>You can still re-enroll and choose a schedule that works for you — we have availability and your future classmates are waiting!</p>
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px;">📅 Pick your new slot and we'll match you with the right group.</p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Pick Your Time Now", enrollUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">This is our last follow-up — the door is always open for you.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

function buildPreClassReminderEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";
  const dateStr = p.first_class_date || "";
  if (isAr) {
    return {
      subject: "KLovers — حصتك الأولى غداً! 🎯 استعد الآن",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">يا ${p.name}، حصتك الأولى غداً! 🎯</h1>
        ${dateStr ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;"><p style="margin: 0; font-size: 16px; font-weight: bold;">📅 ${dateStr} (القاهرة)</p></div>` : ""}
        <p>إليك كيف تستفيد من حصتك للأقصى:</p>
        <ul style="color: ${BRAND_TEXT}; padding-right: 20px; line-height: 2;">
          <li>🎧 جرّب الكاميرا والميكروفون قبل الحصة بـ 10 دقائق</li>
          <li>📝 اكتب 2–3 أشياء تريد تعلمها في الكورية</li>
          <li>☕ خذ مشروباً — الحصة ممتعة وستمر سريعاً</li>
          <li>🔗 الرابط وصلك في إيميل سابق — ابحث عن "رابط الحصة"</li>
        </ul>
        <p>متحمس لبداية رحلتك! 🚀</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">أي سؤال؟ كلمنا على واتساب.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Your first class is tomorrow! 🎯 Get ready",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Your first class is tomorrow, ${p.name}! 🎯</h1>
      ${dateStr ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;"><p style="margin: 0; font-size: 16px; font-weight: bold;">📅 ${dateStr} (Cairo time)</p></div>` : ""}
      <p>Here's how to make the most of your first class:</p>
      <ul style="color: ${BRAND_TEXT}; padding-left: 20px; line-height: 2;">
        <li>🎧 Test your camera and microphone 10 minutes before class</li>
        <li>📝 Write down 2–3 things you want to learn in Korean</li>
        <li>☕ Grab a drink — it's going to be fun and fly by</li>
        <li>🔗 Your class link was sent in a previous email — search for "class meeting link"</li>
      </ul>
      <p>So excited for you to start this journey! 🚀</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

function buildClassFeedbackEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";

  if (isAr) {
    return {
      subject: "KLovers — كيف كانت حصتك الأولى؟ 🌟",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! كيف كانت الحصة الأولى؟ 🌟</h1>
        <p>نتمنى أن تكون حصتك الأولى قد أعجبتك!</p>
        <p>رأيك يهمنا كثيراً — شاركنا تجربتك حتى نتمكن من تحسين تجربة كل الطلاب.</p>
        <div style="background: ${BRAND_GRAY}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 12px; font-size: 15px; font-weight: bold; color: ${BRAND_DARK};">كيف تقيّم حصتك الأولى؟</p>
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <a href="${waUrl}?text=تقييمي+للحصة+الأولى%3A+ممتازة+⭐⭐⭐⭐⭐" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐⭐ ممتازة</a>
            <a href="${waUrl}?text=تقييمي+للحصة+الأولى%3A+جيدة+⭐⭐⭐⭐" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐ جيدة</a>
            <a href="${waUrl}?text=تقييمي+للحصة+الأولى%3A+تحتاج+تحسين" style="display: inline-block; background: #e0e0e0; color: ${BRAND_DARK}; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">تحتاج تحسين</a>
          </div>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">أو تكلم معنا مباشرة على واتساب — أي سؤال أو ملاحظة نحن هنا.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">شكراً لانضمامك لعائلة KLovers — رحلتك الكورية بدأت للتو! 🇰🇷</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — How was your first class? 🌟",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! How was your first class? 🌟</h1>
      <p>We hope your first class was amazing!</p>
      <p>Your feedback means everything to us — it helps us improve the experience for every student.</p>
      <div style="background: ${BRAND_GRAY}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 12px; font-size: 15px; font-weight: bold; color: ${BRAND_DARK};">How would you rate your first class?</p>
        <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
          <a href="${waUrl}?text=My+first+class+rating%3A+Excellent+%E2%AD%90%E2%AD%90%E2%AD%90%E2%AD%90%E2%AD%90" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐⭐ Excellent</a>
          <a href="${waUrl}?text=My+first+class+rating%3A+Good+%E2%AD%90%E2%AD%90%E2%AD%90%E2%AD%90" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐ Good</a>
          <a href="${waUrl}?text=My+first+class+rating%3A+Needs+improvement" style="display: inline-block; background: #e0e0e0; color: ${BRAND_DARK}; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">Needs improvement</a>
        </div>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Or message us directly on WhatsApp — any questions or feedback, we're here.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">Thank you for joining the KLovers family — your Korean journey has just begun! 🇰🇷</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    let payload: EmailPayload = {} as EmailPayload;
    payload = await req.json();
    const { email, name, language, template } = payload;

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Missing email or name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields per template
    if (template === "class_link" && (!payload.class_link_url || payload.class_link_url.trim() === "")) {
      return new Response(JSON.stringify({ error: "class_link_url is required for the class_link template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (template === "payment_method_reminder" && !payload.enrollment_id) {
      return new Response(JSON.stringify({ error: "enrollment_id is required for the payment_method_reminder template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject: string;
    let html: string;
    let emailAttachments: Array<{ filename: string; content: string; content_type?: string }> | undefined;

    switch (template) {
      case "welcome":
        ({ subject, html } = buildWelcomeEmail(name, language || "en"));
        break;
      case "group_match":
        ({ subject, html } = buildGroupMatchEmail(payload));
        break;
      case "slot_confirmed":
        ({ subject, html } = buildSlotConfirmedEmail(payload));
        break;
      case "approval":
        ({ subject, html } = buildApprovalEmail(payload));
        break;
      case "pending_review":
        ({ subject, html } = buildPendingReviewEmail(payload));
        break;
      case "payment_confirmed":
        ({ subject, html } = buildPaymentConfirmedEmail(payload));
        break;
      case "class_link": {
        const classLinkResult = buildClassLinkEmail(payload);
        subject = classLinkResult.subject;
        html = classLinkResult.html;
        if (classLinkResult.icsAttachment) emailAttachments = [classLinkResult.icsAttachment];
        break;
      }
      case "payment_method_reminder":
        ({ subject, html } = buildPaymentMethodReminderEmail(name, payload.enrollment_id!, language || "en"));
        break;
      case "rejection":
        ({ subject, html } = buildRejectionEmail(payload));
        break;
      case "trial_confirmed": {
        const trialResult = buildTrialConfirmedEmail(payload);
        subject = trialResult.subject;
        html = trialResult.html;
        if (trialResult.icsAttachment) emailAttachments = [trialResult.icsAttachment];
        break;
      }
      case "trial_rebook_request":
        ({ subject, html } = buildTrialRebookEmail(payload));
        break;
      case "trial_prep":
        ({ subject, html } = buildTrialPrepEmail(payload));
        break;
      case "trial_followup_day1":
        ({ subject, html } = buildTrialFollowupDay1Email(payload));
        break;
      case "trial_followup_day3":
        ({ subject, html } = buildTrialFollowupDay3Email(payload));
        break;
      case "group_forming":
        ({ subject, html } = buildGroupFormingEmail(payload));
        break;
      case "receipt_nudge":
        ({ subject, html } = buildReceiptNudgeEmail(payload));
        break;
      case "group_forming_escalation":
        ({ subject, html } = buildGroupFormingEscalationEmail(payload));
        break;
      case "rejection_followup":
        ({ subject, html } = buildRejectionFollowupEmail(payload));
        break;
      case "pre_class_reminder":
        ({ subject, html } = buildPreClassReminderEmail(payload));
        break;
      case "class_feedback":
        ({ subject, html } = buildClassFeedbackEmail(payload));
        break;
      case "trial_attendance_confirmation": {
        const attendResult = buildTrialAttendanceConfirmationEmail(payload);
        subject = attendResult.subject;
        html = attendResult.html;
        if (attendResult.icsAttachment) emailAttachments = [attendResult.icsAttachment];
        break;
      }
      case "enrollment":
      default:
        ({ subject, html } = buildEnrollmentEmail(payload));
        break;
    }

    const result = await sendEmail(email, subject, html, emailAttachments);
    console.log(`Email sent to ${email} (${template || "enrollment"}):`, result);
    await logEmail({ template: template || "enrollment", toEmail: email, toName: name, status: "sent", resendId: result.id });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Email error:", msg);
    // best-effort log — payload may be undefined if error happened during req.json()
    try {
      if (typeof payload !== "undefined") {
        await logEmail({ template: payload.template || "unknown", toEmail: payload.email || "unknown", toName: payload.name, status: "failed", error: msg });
      }
    } catch { /* ignore */ }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
