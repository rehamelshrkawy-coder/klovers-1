// Resend delivery webhook — updates email_logs with real delivery status.
// Configure in Resend dashboard → Webhooks → add this function URL.
// Events: email.delivered, email.bounced, email.complained
// Signature verified via Svix if RESEND_WEBHOOK_SECRET is set.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Webhook } from "https://esm.sh/svix@1.24.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  let payload: { type?: string; data?: { email_id?: string } };

  if (WEBHOOK_SECRET) {
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      payload = wh.verify(rawBody, {
        "svix-id":        req.headers.get("svix-id")        ?? "",
        "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
        "svix-signature": req.headers.get("svix-signature") ?? "",
      }) as typeof payload;
    } catch {
      return new Response(JSON.stringify({ error: "bad signature" }), { status: 401 });
    }
  } else {
    try { payload = JSON.parse(rawBody); } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
    }
  }

  const type    = payload?.type;
  const emailId = payload?.data?.email_id;

  if (!type || !emailId) {
    return new Response(JSON.stringify({ ok: true, ignored: "missing type/email_id" }));
  }

  const HANDLED = ["email.delivered", "email.bounced", "email.complained"];
  if (!HANDLED.includes(type)) {
    return new Response(JSON.stringify({ ok: true, ignored: type }));
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date().toISOString();

  const statusMap: Record<string, string> = {
    "email.delivered":  "delivered",
    "email.bounced":    "bounced",
    "email.complained": "complained",
  };
  const stampMap: Record<string, string> = {
    "email.delivered":  "delivered_at",
    "email.bounced":    "bounced_at",
    "email.complained": "complained_at",
  };

  const { data: row } = await supabase
    .from("email_logs")
    .select("id")
    .eq("resend_id", emailId)
    .maybeSingle();

  if (!row) {
    return new Response(JSON.stringify({ ok: true, ignored: "no matching log row" }));
  }

  await supabase
    .from("email_logs")
    .update({ status: statusMap[type], [stampMap[type]]: now })
    .eq("id", row.id);

  return new Response(JSON.stringify({ ok: true, type }));
});
