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
  template?: "welcome" | "enrollment" | "group_match" | "slot_confirmed" | "approval" | "pending_review" | "payment_confirmed" | "class_link" | "payment_method_reminder" | "rejection" | "trial_confirmed" | "trial_rebook_request" | "trial_prep" | "trial_followup_day1" | "trial_followup_day3";
  class_link_url?: string;
  rebook_url?: string;
  available_slots?: Array<{ day_of_week: number; start_time: string; timezone?: string }>;
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
  slot_day?: string;
  slot_time?: string;
  slot_timezone?: string;
  slot_level?: string;
  preferred_day?: string;
  preferred_time?: string;
  timezone?: string;
  level?: string;
  currency?: string;
  trial_date?: string;
  trial_time?: string;
  trial_timezone?: string;
  calendar_url?: string;
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

function brandWrapper(content: string, isRtl: boolean) {
  const dir = isRtl ? 'direction: rtl; text-align: right;' : '';
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: ${BRAND_BLACK}; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="KLovers" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${BRAND_YELLOW};" />
      <h2 style="color: ${BRAND_YELLOW}; margin: 12px 0 0; font-size: 22px; letter-spacing: 1px;">KLovers</h2>
      <p style="color: #cccccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
    </div>
    <!-- Body -->
    <div style="padding: 28px 24px; ${dir} color: ${BRAND_TEXT};">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;">— The KLovers Team</p>
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
  const calBtn = p.calendar_url
    ? `<div style="margin: 20px 0; text-align: center;">
        <a href="${p.calendar_url}" style="display: inline-block; background: #4285f4; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">📅 ${isAr ? "أضف إلى تقويم جوجل" : "Add to Google Calendar"}</a>
       </div>`
    : "";

  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد حصتك التجريبية المجانية! ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 🎉</h1>
        <p>تم تأكيد حصتك التجريبية المجانية في الكورية!</p>
        ${brandTable([
          ["📅 التاريخ", p.trial_date || ""],
          ["⏰ الوقت", p.trial_time || ""],
          ["🌍 المنطقة الزمنية", tz],
          ["📚 المستوى", p.level || "مبتدئ"],
          ["⏱ المدة", "45 دقيقة"],
        ])}
        ${calBtn}
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">ماذا تتوقع:</h3>
        <ul style="color: ${BRAND_TEXT}; padding-right: 20px;">
          <li>حصة مباشرة مع مدرس حقيقي</li>
          <li>تقييم شخصي لمستواك</li>
          <li>نصائح لتعلم الكورية بشكل أسرع</li>
        </ul>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">عندك أسئلة؟ تواصل معنا على واتساب.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Free Trial Class is Confirmed! ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 🎉</h1>
      <p>Your free Korean trial class has been confirmed!</p>
      ${brandTable([
        ["📅 Date", p.trial_date || ""],
        ["⏰ Time", p.trial_time || ""],
        ["🌍 Timezone", tz],
        ["📚 Level", p.level || "Beginner"],
        ["⏱ Duration", "45 minutes"],
      ])}
      ${calBtn}
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">What to expect:</h3>
      <ul style="color: ${BRAND_TEXT}; padding-left: 20px;">
        <li>Live class with a real teacher</li>
        <li>Personalised level assessment</li>
        <li>Tips on how to learn Korean faster</li>
      </ul>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Have questions? Message us on WhatsApp.</p>
    `, false),
  };
}

function buildTrialRebookEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
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

  const slotsList = slots.length
    ? `<ul style="color: ${BRAND_TEXT}; ${isAr ? "padding-right: 20px;" : "padding-left: 20px;"} margin: 16px 0;">
        ${slots.map((s) => {
          const day = isAr ? dayNamesAr[s.day_of_week] : dayNamesEn[s.day_of_week];
          const tz = (s.timezone || "Africa/Cairo").replace(/_/g, " ");
          return `<li style="margin-bottom: 6px;"><strong>${day}</strong> — ${formatTime12(s.start_time, isAr)} <span style="color:${BRAND_MUTED}; font-size: 12px;">(${tz})</span></li>`;
        }).join("")}
      </ul>`
    : "";

  const btn = `<div style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
      ${isAr ? "اختر موعدك الآن" : "Pick your trial time"}
    </a>
  </div>`;

  if (isAr) {
    return {
      subject: "KLovers — من فضلك اختر موعد حصتك التجريبية 🕒",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 👋</h1>
        <p>شكراً لاهتمامك بحصة الكورية التجريبية المجانية في Klovers.</p>
        <p>موعد الحصة الذي اخترته سابقاً لم يعد متاحاً، أو لم تختر موعداً بعد. هذه هي المواعيد المتاحة حالياً:</p>
        ${slotsList}
        <p>اختر الموعد المناسب لك من الرابط التالي حتى نؤكد حجز حصتك:</p>
        ${btn}
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">إذا واجهت أي مشكلة، راسلنا على واتساب أو رد على هذا الإيميل.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Please pick a time for your free trial 🕒",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Thanks for your interest in a free Korean trial class at Klovers.</p>
      <p>Your previous slot is no longer available, or you haven't picked one yet. Here are the times we currently run:</p>
      ${slotsList}
      <p>Please pick the time that works best for you so we can confirm your class:</p>
      ${btn}
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any trouble? Just reply to this email or message us on WhatsApp.</p>
    `, false),
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

  if (isAr) {
    return {
      subject: "KLovers — تم استلام دفعتك! مقعدك محجوز ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! ✅</h1>
        <p>تم استلام دفعتك بنجاح وتأكيد حجز مقعدك.</p>
        <p>نحن حالياً نقوم بتشكيل مجموعتك الدراسية بناءً على مستواك وجدولك الزمني.</p>
        ${brandTable(rows)}
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;">⏳ <strong>الخطوة التالية:</strong> بمجرد تشكيل مجموعتك، ستتلقى بريداً إلكترونياً آخر يتضمن تفاصيل حصتك ورابط الانضمام.</p>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">لا يلزمك اتخاذ أي إجراء الآن. سنتواصل معك قريباً.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Payment Received! Your Seat is Reserved ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! ✅</h1>
      <p>We've confirmed your payment and your seat is reserved.</p>
      <p>We are currently forming your class group based on your level and availability.</p>
      ${brandTable(rows)}
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px;">⏳ <strong>What's next:</strong> Once your group is ready, you'll receive another email with your class details and meeting link.</p>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">No action is required from you right now. We'll be in touch soon.</p>
    `, false),
  };
}

function buildClassLinkEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const linkUrl = p.class_link_url || "#";

  if (isAr) {
    return {
      subject: "KLovers — حصتك جاهزة! إليك رابط الانضمام 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">حصتك جاهزة يا ${p.name}! 🎓</h1>
        <p>تم تشكيل مجموعتك الدراسية بالكامل وحصتك مجدولة ومستعدة للبدء.</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW}; text-align: center;">
          <p style="margin: 0 0 12px; font-weight: bold; font-size: 15px;">رابط الانضمام لحصتك:</p>
          ${brandButton("انضم للحصة الآن", linkUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">احتفظ بهذا الرابط — ستستخدمه للانضمام لجميع حصصك.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">في حالة أي استفسار، تواصل معنا على واتساب.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Class is Ready! Here's Your Meeting Link 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Your class is ready, ${p.name}! 🎓</h1>
      <p>Your study group is fully formed and your class is scheduled and ready to start.</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW}; text-align: center;">
        <p style="margin: 0 0 12px; font-weight: bold; font-size: 15px;">Your class meeting link:</p>
        ${brandButton("Join Your Class", linkUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">Save this link — you'll use it to join all your classes.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
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

    const payload: EmailPayload = await req.json();
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

    let subject: string;
    let html: string;

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
      case "class_link":
        ({ subject, html } = buildClassLinkEmail(payload));
        break;
      case "payment_method_reminder":
        ({ subject, html } = buildPaymentMethodReminderEmail(name, payload.enrollment_id!, language || "ar"));
        break;
      case "rejection":
        ({ subject, html } = buildRejectionEmail(payload));
        break;
      case "trial_confirmed":
        ({ subject, html } = buildTrialConfirmedEmail(payload));
        break;
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
      case "enrollment":
      default:
        ({ subject, html } = buildEnrollmentEmail(payload));
        break;
    }

    const result = await sendEmail(email, subject, html);
    console.log(`Email sent to ${email} (${template || "enrollment"}):`, result);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
