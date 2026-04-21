import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiter
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < 60_000);
  rateLimitMap.set(ip, recent);
  if (recent.length >= 5) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Compute the next occurrence of a given day_of_week (0=Sun) from today. */
function nextDateForDay(dayOfWeek: number): string {
  const today = new Date();
  const todayDay = today.getUTCDay();
  let diff = dayOfWeek - todayDay;
  if (diff <= 0) diff += 7; // always at least 1 day in the future
  const next = new Date(today);
  next.setUTCDate(today.getUTCDate() + diff);
  return next.toISOString().split("T")[0]; // YYYY-MM-DD
}

/** Build a Google Calendar "Add Event" URL. */
function buildCalendarUrl(params: {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  description: string;
  timezone: string;
}): string {
  const { title, date, time, durationMin, description, timezone } = params;
  const [h, m] = time.split(":").map(Number);
  // Format: YYYYMMDDTHHmmSS
  const dateClean = date.replace(/-/g, "");
  const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const endH = h + Math.floor((m + durationMin) / 60);
  const endM = (m + durationMin) % 60;
  const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

  const params2 = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: description,
    ctz: timezone,
  });
  return `https://calendar.google.com/calendar/render?${params2.toString()}`;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { name, email, phone, country, level, goal, day_of_week, start_time, referrer_id, authed } = body;

    // ── Authenticated path: derive identity from JWT, skip placeholder hacks ──
    // When the client passes `authed: true` AND a valid Authorization bearer
    // token, we trust the JWT-resolved profile instead of the body fields.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let resolvedUserId: string | null = null;
    let resolvedEmail: string | null = null;
    let resolvedName: string | null = null;
    let resolvedLevel: string | null = null;
    if (authed) {
      const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          resolvedUserId = userData.user.id;
          resolvedEmail = userData.user.email ?? null;
          // Capture level from user_metadata as a fallback for email-confirmation
          // signups where the profile row hasn't been updated yet.
          const metaLevel = (userData.user.user_metadata?.level as string | undefined)?.trim();
          if (metaLevel) resolvedLevel = metaLevel;
          // Pull the name + level from profiles for nicer display
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("name, email, level")
            .eq("user_id", resolvedUserId)
            .maybeSingle();
          if (profileRow) {
            resolvedName = profileRow.name ?? null;
            if (!resolvedEmail && profileRow.email) resolvedEmail = profileRow.email;
            const profileLevel = (profileRow.level as string | undefined)?.trim();
            if (profileLevel) resolvedLevel = profileLevel;
          }
        }
      }
    }

    // Validation — accept email from JWT in the authed path
    const effectiveEmail = resolvedEmail ?? email;
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!effectiveEmail || !emailRegex.test(effectiveEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) {
      return new Response(
        JSON.stringify({ error: "Invalid day_of_week." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!start_time || typeof start_time !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid start_time." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalName = (resolvedName || name || "").trim() || effectiveEmail.split("@")[0];
    const normalizedEmail = effectiveEmail.trim().toLowerCase();
    const trialDate = nextDateForDay(day_of_week);
    const timezone = "Africa/Cairo";

    // 1. Upsert lead
    const goalWithPhone = [
      goal || "Free trial",
      phone ? `WhatsApp: ${phone}` : "",
      referrer_id ? `ref:${referrer_id}` : "",
    ].filter(Boolean).join(" | ");

    const dayName = DAY_NAMES[day_of_week];
    const scheduleStr = `${dayName} ${formatTime12h(start_time)}`;

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      await supabase
        .from("leads")
        .update({
          name: finalName,
          country: country?.trim() || undefined,
          level: level?.trim() || undefined,
          goal: goalWithPhone,
          schedule: scheduleStr,
          source: authed ? "trial-booking-authed" : "free-trial-page",
          status: "trial_booked",
          ...(resolvedUserId ? { user_id: resolvedUserId } : {}),
        })
        .eq("id", existingLead.id);
    } else {
      await supabase.from("leads").insert({
        name: finalName,
        email: normalizedEmail,
        country: country?.trim() || "Unknown",
        level: level?.trim() || "",
        goal: goalWithPhone,
        schedule: scheduleStr,
        source: authed ? "trial-booking-authed" : "free-trial-page",
        status: "trial_booked",
        ...(resolvedUserId ? { user_id: resolvedUserId } : {}),
      });
    }

    // 2. If this email already has a TBA (unscheduled) placeholder booking from
    // the rebook-email flow, drop it so the INSERT below can proceed without
    // tripping the per-email unique index. Real (non-TBA) bookings are left
    // alone — the INSERT will hit 23505 and we return a friendly message.
    const { data: existingBooking, error: lookupError } = await supabase
      .from("trial_bookings")
      .select("id, start_time, trial_date")
      .ilike("email", normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      console.error("book-trial lookup error:", JSON.stringify(lookupError));
    }

    const isTbaPlaceholder =
      !!existingBooking &&
      (existingBooking.start_time === "TBA" || existingBooking.trial_date === "2099-12-31");

    if (isTbaPlaceholder && existingBooking) {
      const { error: deleteError } = await supabase
        .from("trial_bookings")
        .delete()
        .eq("id", existingBooking.id);
      if (deleteError) {
        console.error("book-trial delete TBA placeholder error:", JSON.stringify(deleteError));
        throw deleteError;
      }
    }

    const { data: booking, error: bookingError } = await supabase
      .from("trial_bookings")
      .insert({
        name: finalName,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        level: level?.trim() || null,
        goal: goal?.trim() || null,
        day_of_week,
        start_time,
        trial_date: trialDate,
        timezone,
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        ...(resolvedUserId ? { user_id: resolvedUserId } : {}),
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      // Unique constraint: user has a real booking — return a friendly 200
      // with ok:false so the frontend's `if (data?.error)` handler runs
      // instead of throwing a FunctionsHttpError on non-2xx.
      if (bookingError?.code === "23505") {
        return new Response(
          JSON.stringify({
            ok: false,
            success: false,
            error: "You already have a trial class booked. Check your email for details.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("book-trial insert error:", JSON.stringify(bookingError));
      throw bookingError ?? new Error("Failed to insert trial booking");
    }

    // 3. Notify admin
    await supabase.from("admin_notifications").insert({
      message: `New trial booking: ${finalName} (${normalizedEmail}) — ${dayName} ${formatTime12h(start_time)}, Level: ${level || "Unknown"}`,
      type: "trial",
    }).catch(() => {}); // non-critical

    // 4. Build calendar URL for the response
    const calendarUrl = buildCalendarUrl({
      title: "Free Korean Trial Class — Klovers Academy",
      date: trialDate,
      time: start_time,
      durationMin: 45,
      description: `Your free trial Korean class with Klovers Academy.\nLevel: ${level || "Beginner"}\n\nhttps://kloversegy.com`,
      timezone,
    });

    // 5. Send trial confirmation email (auto-confirmed — no admin step)
    supabase.functions.invoke("send-confirmation-email", {
      body: {
        template: "trial_confirmed",
        email: normalizedEmail,
        name: finalName,
        language: "ar",
        trial_date: trialDate,
        trial_time: start_time,
        trial_timezone: timezone,
        level: level?.trim() || "",
        calendar_url: calendarUrl,
      },
    }).catch((e) => console.warn("trial_confirmed email failed:", e));

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          trial_date: trialDate,
          day_name: dayName,
          start_time,
          start_time_12h: formatTime12h(start_time),
          duration_min: 45,
          timezone,
          calendar_url: calendarUrl,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("book-trial error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
