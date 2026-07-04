import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://kloversegy.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "reham.elshrkawy@gmail.com";
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LEVEL_LABELS: Record<string, string> = {
  beginner_1: "Korean Level 1",
  beginner_2: "Korean Level 2",
  intermediate_1: "Intermediate 1",
  intermediate_2: "Intermediate 2",
  advanced: "Advanced",
};

function getLevelLabel(level: string): string {
  return LEVEL_LABELS[level] || level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function generateCaption(group: {
  level: string; day_name: string; start_time: string;
  duration_min: number; seats_left: number;
}): string {
  const levelLabel = getLevelLabel(group.level);
  const seatsLine = group.seats_left <= 3 ? `\nOnly ${group.seats_left} seat${group.seats_left === 1 ? "" : "s"} left.` : "";
  return `🚀 ${levelLabel} — Starting ${group.day_name} ${group.start_time}${seatsLine}

Learn to read, speak, and build real Korean sentences from week one.

Reserve your seat today.

#LearnKorean #KoreanCourse #Klovers #KoreanLanguage #StudyKorean`;
}

function generateAdCopy(group: {
  level: string; day_name: string; start_time: string;
  duration_min: number; seats_left: number;
}): string {
  const level = getLevelLabel(group.level);
  return `Learn Korean the right way. ${level} starts ${group.day_name} at ${group.start_time}. Small group, structured lessons, real results. Limited seats available — register now.\n\nHeadline: ${level} — ${group.day_name} ${group.start_time}\nDescription: ${group.duration_min}-min weekly sessions. Small group. Structured learning.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch active groups
    const { data: pkgGroups, error: gErr } = await supabase
      .from("pkg_groups")
      .select("id, name, capacity, package_id")
      .eq("is_active", true);

    if (gErr) throw gErr;
    if (!pkgGroups?.length) {
      return new Response(JSON.stringify({ message: "No active groups found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const packageIds = [...new Set(pkgGroups.map((g) => g.package_id))];
    const { data: packages } = await supabase
      .from("schedule_packages")
      .select("id, level, day_of_week, start_time, duration_min")
      .in("id", packageIds)
      .eq("is_active", true);

    const pkgMap = new Map((packages || []).map((p) => [p.id, p]));

    const { data: members } = await supabase
      .from("pkg_group_members")
      .select("group_id")
      .eq("member_status", "active");

    const memberCounts = new Map<string, number>();
    (members || []).forEach((m) => {
      memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
    });

    // Build groups with available seats
    const groups: Array<{
      name: string; level: string; day_name: string; start_time: string;
      duration_min: number; capacity: number; seats_left: number;
    }> = [];

    for (const g of pkgGroups) {
      const pkg = pkgMap.get(g.package_id);
      if (!pkg) continue;
      const activeMembers = memberCounts.get(g.id) || 0;
      const seatsLeft = g.capacity - activeMembers;
      if (seatsLeft <= 0) continue;
      groups.push({
        name: g.name,
        level: pkg.level,
        day_name: DAY_NAMES[pkg.day_of_week] || "Unknown",
        start_time: formatTime(pkg.start_time),
        duration_min: pkg.duration_min,
        capacity: g.capacity,
        seats_left: seatsLeft,
      });
    }

    groups.sort((a, b) => a.seats_left - b.seats_left);

    if (groups.length === 0) {
      return new Response(JSON.stringify({ message: "No groups with available seats" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Build HTML for each group
    const groupCardsHtml = groups.map((g) => {
      const caption = generateCaption(g);
      const adCopy = generateAdCopy(g);
      const urgency = g.seats_left <= 2 ? "🔴 Last Seats" : g.seats_left <= 5 ? "🟡 Filling Up" : "🟢 Open";

      return `
        <div style="background:#fff;border:2px solid #FFFF00;border-radius:12px;padding:24px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div>
              <h2 style="margin:0;color:#000;font-size:18px;font-weight:700;">${getLevelLabel(g.level)}</h2>
              <p style="margin:4px 0 0;color:#555;font-size:13px;">${g.day_name} • ${g.start_time} • ${g.duration_min} min/session</p>
            </div>
            <div style="background:#FFFF00;color:#000;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;">
              ${g.seats_left} seats left ${urgency}
            </div>
          </div>

          <div style="background:#f9f9f9;border-left:4px solid #FFFF00;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:16px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;">📱 Social Media Caption</p>
            <pre style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#222;white-space:pre-wrap;line-height:1.6;">${caption}</pre>
          </div>

          <div style="background:#f0f0f0;padding:14px 16px;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;">📣 Meta Ad Copy</p>
            <pre style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#333;white-space:pre-wrap;line-height:1.5;">${adCopy}</pre>
          </div>
        </div>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
        <div style="max-width:680px;margin:32px auto;background:#f5f5f5;padding:0 16px 40px;">

          <!-- Header -->
          <div style="background:#000;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <div style="display:inline-block;background:#FFFF00;color:#000;font-size:22px;font-weight:900;padding:6px 18px;border-radius:8px;letter-spacing:1px;">K</div>
            <h1 style="margin:12px 0 4px;color:#FFFF00;font-size:22px;font-weight:800;">Monthly Social Media Report</h1>
            <p style="margin:0;color:#FFFF00;opacity:0.7;font-size:13px;">${monthName} — ${groups.length} group${groups.length === 1 ? "" : "s"} with available seats</p>
          </div>

          <!-- Intro -->
          <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
              Hi Reham 👋<br><br>
              Here are this month's ready-to-publish social media posts for all groups with <strong>available seats</strong>.
              Copy the captions and ad copy below and post them across your social channels to fill these spots.
            </p>
          </div>

          <!-- Platform Reminder -->
          <div style="background:#FFFF00;padding:14px 32px;margin:0;border:1px solid #e5e7eb;border-top:none;">
            <p style="margin:0;color:#000;font-size:13px;font-weight:600;">
              📌 Post on: Instagram • Facebook • TikTok • WhatsApp Status
            </p>
          </div>

          <!-- Group Cards -->
          <div style="background:#f5f5f5;padding:24px 0 0;">
            ${groupCardsHtml}
          </div>

          <!-- CTA -->
          <div style="background:#000;padding:24px 32px;border-radius:0 0 12px 12px;text-align:center;">
            <a href="https://kloversegy.com/admin/marketing"
               style="background:#FFFF00;color:#000;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;display:inline-block;margin-bottom:12px;">
              Open Marketing Generator →
            </a>
            <p style="margin:8px 0 0;color:#888;font-size:11px;">
              Auto-generated on ${new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" })} (Cairo time)
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KLovers <noreply@kloversegy.com>",
        to: [ADMIN_EMAIL],
        subject: `📅 Monthly Social Posts — ${monthName} (${groups.length} open groups)`,
        html,
      }),
    });

    const result = await res.json();
    console.log("Monthly report sent:", JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: true, groups_count: groups.length, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-monthly-marketing-report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
