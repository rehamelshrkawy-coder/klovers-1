import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Fetch profiles immediately
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("name, email")
    .neq("email", "");

  if (error || !profiles || profiles.length === 0) {
    return new Response(JSON.stringify({ message: "No students found", error: error?.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send emails in background
  const sendAll = async () => {
    const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];
      try {
        // Rate limit: 1 req/sec
        if (i > 0) await new Promise((r) => setTimeout(r, 1000));

        const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#6d28d9;">Welcome to KLovers, ${p.name || "Student"}! 🎉</h1>
          <p>You're registered with KLovers! Here's what you can do:</p>
          <ul>
            <li>📖 <a href="https://kloversegy.com/blog" style="color:#6d28d9;">Read our blog</a></li>
            <li>📚 <a href="https://kloversegy.com/enroll-now" style="color:#6d28d9;">Enroll in classes</a></li>
            <li>🎯 <a href="https://kloversegy.com/dashboard" style="color:#6d28d9;">Student Dashboard</a></li>
          </ul>
          <div style="margin:24px 0;">
            <a href="https://kloversegy.com/enroll-now" style="background:#6d28d9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Start Learning Korean</a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;"><span translate="no" class="notranslate">— The KLovers Team</span></p>
        </div>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [p.email],
            subject: "Welcome to KLovers! 🎉",
            html,
          }),
        });
        console.log(`Sent to ${p.email}`);
      } catch (err) {
        console.error(`Failed: ${p.email}`, err);
      }
    }
    console.log("Batch complete");
  };

  EdgeRuntime.waitUntil(sendAll());

  return new Response(
    JSON.stringify({ message: `Sending welcome emails to ${profiles.length} students in background` }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
