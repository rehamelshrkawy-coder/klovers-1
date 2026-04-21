// Resend webhook receiver for abandoned-checkout-recovery emails.
// Resend fires: email.sent, email.delivered, email.opened, email.clicked,
//               email.bounced, email.complained, email.delivery_delayed
//
// We match each event to a `checkout_recovery_emails` row by provider_message_id
// (`data.email_id`) and stamp opened_at / clicked_at.
//
// Signature verification: Resend signs webhook payloads with Svix. If
// RESEND_WEBHOOK_SECRET is set we verify `svix-signature`. If not set, we
// accept all requests (dev / initial setup).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Webhook } from "https://esm.sh/svix@1.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-signature, svix-timestamp",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();
  let payload: any;

  if (WEBHOOK_SECRET) {
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      payload = wh.verify(rawBody, {
        "svix-id":        req.headers.get("svix-id")        ?? "",
        "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
        "svix-signature": req.headers.get("svix-signature") ?? "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: "bad signature", detail: msg }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    try { payload = JSON.parse(rawBody); } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const type  = payload?.type as string | undefined;
  const data  = payload?.data ?? {};
  const emailId = data.email_id as string | undefined;

  if (!type || !emailId) {
    return new Response(JSON.stringify({ ok: true, ignored: "missing type/email_id" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const nowIso = new Date().toISOString();

  let updates: Record<string, string> | null = null;
  if (type === "email.opened") {
    updates = { opened_at: nowIso };
  } else if (type === "email.clicked") {
    // Stamp both — a click implies an open even if that event was missed.
    updates = { clicked_at: nowIso, opened_at: nowIso };
  }

  if (!updates) {
    return new Response(JSON.stringify({ ok: true, ignored: type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Only set timestamps if still null — record the FIRST event time.
  const columns = Object.keys(updates);
  const { data: row, error: fetchErr } = await supabase
    .from("checkout_recovery_emails")
    .select("id, opened_at, clicked_at")
    .eq("provider_message_id", emailId)
    .maybeSingle();

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!row) {
    return new Response(JSON.stringify({ ok: true, ignored: "no matching row" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const patch: Record<string, string> = {};
  for (const col of columns) {
    if ((row as any)[col] == null) patch[col] = updates[col];
  }
  if (Object.keys(patch).length === 0) {
    return new Response(JSON.stringify({ ok: true, already: type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: updErr } = await supabase
    .from("checkout_recovery_emails")
    .update(patch)
    .eq("id", row.id);

  if (updErr) {
    return new Response(JSON.stringify({ error: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, type, updated: patch }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
