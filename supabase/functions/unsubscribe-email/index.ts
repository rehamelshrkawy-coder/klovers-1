// Unsubscribe endpoint — called when a student clicks the unsubscribe link in an email.
// URL: /functions/v1/unsubscribe-email?token=<unsubscribe_token>
// Sets profiles.email_unsubscribed = true for the matching token.
// Returns a simple HTML confirmation page (no login required).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const html = (msg: string, isAr: boolean) => `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KLovers — ${isAr ? "إلغاء الاشتراك" : "Unsubscribe"}</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
.card{background:#fff;border-radius:12px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.08)}</style>
</head>
<body><div class="card">${msg}</div></body></html>`;

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const lang  = url.searchParams.get("lang") ?? "en";
  const isAr  = lang === "ar";

  if (!token) {
    return new Response(
      html(isAr
        ? "<h2>رابط غير صالح</h2><p>الرابط الذي استخدمته غير صالح أو منتهي الصلاحية.</p>"
        : "<h2>Invalid link</h2><p>The unsubscribe link you used is invalid or has expired.</p>",
        isAr),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase
    .from("profiles")
    .update({ email_unsubscribed: true })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return new Response(
      html(isAr
        ? "<h2>حدث خطأ</h2><p>لم نتمكن من معالجة طلبك. تواصل معنا عبر واتساب.</p>"
        : "<h2>Something went wrong</h2><p>We couldn't process your request. Please contact us on WhatsApp.</p>",
        isAr),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(
    html(isAr
      ? `<h2>✅ تم إلغاء الاشتراك</h2>
         <p>لن تتلقى بعد الآن رسائل تلقائية من KLovers.</p>
         <p style="font-size:13px;color:#666">إذا غيّرت رأيك، يمكنك إعادة تفعيل الإشعارات من <a href="https://kloversegy.com/dashboard">لوحة الطالب</a>.</p>`
      : `<h2>✅ Unsubscribed</h2>
         <p>You won't receive automated emails from KLovers anymore.</p>
         <p style="font-size:13px;color:#666">Changed your mind? You can re-enable notifications from your <a href="https://kloversegy.com/dashboard">Student Dashboard</a>.</p>`,
      isAr),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
});
