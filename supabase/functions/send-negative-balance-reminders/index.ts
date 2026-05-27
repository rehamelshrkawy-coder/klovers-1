import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildEnglishEmail(name: string, overCount: number): { subject: string; html: string } {
  return {
    subject: `Action needed: ${overCount} class${overCount === 1 ? "" : "es"} over your package`,
    html: `
      <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6d28d9;">Hi ${name},</h2>
        <p>You've used <strong>${overCount}</strong> more class${overCount === 1 ? "" : "es"} than your current package includes.</p>
        <p>To continue without interruptions, please renew your package.</p>
        <div style="margin: 24px 0;">
          <a href="https://kloversegy.com/enroll-now" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Renew Package</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;"><span translate="no" class="notranslate">— The KLovers Team</span></p>
      </div>
    `,
  };
}

function buildArabicEmail(name: string, overCount: number): { subject: string; html: string } {
  return {
    subject: `تنبيه: تجاوزت باقتك بـ ${overCount} حصة`,
    html: `
      <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
        <h2 style="color: #6d28d9;">مرحباً ${name}،</h2>
        <p>لقد استخدمت <strong>${overCount}</strong> حصة إضافية أكثر من باقتك الحالية.</p>
        <p>لمتابعة دروسك بدون انقطاع، يرجى تجديد باقتك.</p>
        <div style="margin: 24px 0;">
          <a href="https://kloversegy.com/enroll-now" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">تجديد الباقة</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
      </div>
    `,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find enrollments with negative balance needing a reminder (48h gap)
    const { data: enrollments, error: fetchErr } = await supabaseAdmin
      .from("enrollments")
      .select("id, user_id, sessions_remaining, last_reminder_at, reminder_count")
      .eq("payment_status", "PAID")
      .eq("approval_status", "APPROVED")
      .lt("sessions_remaining", 0);

    if (fetchErr) throw fetchErr;
    if (!enrollments || enrollments.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No negative balances found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    let sent = 0;

    for (const enrollment of enrollments) {
      // Check 48h gap
      if (enrollment.last_reminder_at) {
        const lastSent = new Date(enrollment.last_reminder_at);
        if (now.getTime() - lastSent.getTime() < FORTY_EIGHT_HOURS) continue;
      }

      // Get user profile for name/email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name, email")
        .eq("user_id", enrollment.user_id)
        .single();

      if (!profile?.email) continue;

      const overCount = Math.abs(enrollment.sessions_remaining);
      // Default to English; could check profile language preference if available
      const { subject, html } = buildEnglishEmail(profile.name || "Student", overCount);

      // Log email (same pattern as send-confirmation-email until SMTP is wired)
      console.log(`[REMINDER] To: ${profile.email} | Subject: ${subject}`);
      console.log(`[REMINDER] Body preview: ${overCount} classes over package`);

      // Update tracking
      await supabaseAdmin
        .from("enrollments")
        .update({
          last_reminder_at: now.toISOString(),
          reminder_count: (enrollment.reminder_count || 0) + 1,
        })
        .eq("id", enrollment.id);

      sent++;
    }

    return new Response(
      JSON.stringify({ sent, message: `Processed ${sent} reminder(s)` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
