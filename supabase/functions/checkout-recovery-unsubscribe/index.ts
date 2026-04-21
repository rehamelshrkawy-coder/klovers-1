// One-click unsubscribe for abandoned checkout recovery emails.
// Token format: `${lead_id}.${recovery_row_id}` — we validate the row belongs
// to that lead and mark ALL recovery rows for that lead as unsubscribed,
// preventing any future stage emails from being sent.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://kloversegy.com";

const BRAND_BLACK = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK = "#1a1a1a";

function page(body: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>KLovers — Unsubscribe</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 16px; color: ${BRAND_DARK}; }
  .card { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; text-align: center; border: 1px solid #e0e0e0; }
  .badge { display: inline-block; background: ${BRAND_BLACK}; color: ${BRAND_YELLOW}; padding: 6px 14px; border-radius: 999px; font-size: 12px; letter-spacing: 1px; font-weight: bold; margin-bottom: 16px; }
  a { color: ${BRAND_DARK}; }
  .btn { display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 2px solid ${BRAND_BLACK}; margin-top: 16px; }
</style></head>
<body><div class="card"><div class="badge">KLOVERS</div>${body}</div></body></html>`;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const [leadId, rowId] = token.split(".");

    if (!leadId || !rowId) {
      return new Response(page(`<h2>Invalid unsubscribe link</h2><p>This link appears to be malformed.</p><a class="btn" href="${SITE_URL}">Back to KLovers</a>`), {
        status: 400, headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Validate the row belongs to the claimed lead.
    const { data: row, error: rowErr } = await supabase
      .from("checkout_recovery_emails")
      .select("id, lead_id")
      .eq("id", rowId)
      .eq("lead_id", leadId)
      .maybeSingle();

    if (rowErr || !row) {
      return new Response(page(`<h2>Link not recognized</h2><p>We couldn't verify this unsubscribe link.</p><a class="btn" href="${SITE_URL}">Back to KLovers</a>`), {
        status: 404, headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const { error: updErr } = await supabase
      .from("checkout_recovery_emails")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .is("unsubscribed_at", null);

    if (updErr) throw new Error(updErr.message);

    return new Response(page(`
      <h2>You're unsubscribed</h2>
      <p>You won't receive any more enrollment reminder emails from KLovers.</p>
      <p style="color: #666; font-size: 13px;">If you still want to join a class, you can enroll anytime.</p>
      <a class="btn" href="${SITE_URL}/enroll-now">Enroll now</a>
    `), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(page(`<h2>Something went wrong</h2><p>${msg}</p><a class="btn" href="${SITE_URL}">Back to KLovers</a>`), {
      status: 500, headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
