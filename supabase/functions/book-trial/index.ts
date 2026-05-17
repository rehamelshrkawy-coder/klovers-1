import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// DB-backed rate limiter — survives Edge Function cold starts.
// Uses the trial_rate_limits table with 1-hour windows.
// Max RATE_LIMIT_MAX attempts per identifier per window.
const RATE_LIMIT_MAX = 5;

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  action = "book",
): Promise<boolean> {
  // Truncate to the current hour bucket
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);

  // UPSERT: increment counter; if it exceeds the limit, we're rate-limited.
  const { data, error } = await supabase.rpc("upsert_trial_rate_limit", {
    p_identifier: identifier,
    p_action: action,
    p_window_start: windowStart.toISOString(),
    p_max_attempts: RATE_LIMIT_MAX,
  });
  if (error) {
    // Fail open — don't block legitimate requests if the table/function is missing.
    console.warn("[book-trial] rate limit check error:", error.message);
    return false;
  }
  // Returns true if the caller is rate-limited (attempt_count > max)
  return data === true;
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

    const body = await req.json();
    const { name, email, phone, country, level, goal, day_of_week, start_time, trial_date: bodyTrialDate, class_language, referrer_id, authed } = body;

    // ── Authenticated path: derive identity from JWT, skip placeholder hacks ──
    // When the client passes `authed: true` AND a valid Authorization bearer
    // token, we trust the JWT-resolved profile instead of the body fields.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── DB-backed rate limiting (survives cold starts) ─────────────────────
    if (await checkRateLimit(supabase, ip)) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    // Use the actual group date from the frontend if provided; fall back to computing the next occurrence.
    const trialDate = (bodyTrialDate && /^\d{4}-\d{2}-\d{2}$/.test(bodyTrialDate))
      ? bodyTrialDate
      : nextDateForDay(day_of_week);

    // Look up the slot's source timezone from the DB (teacher is MYT-based).
    // Fall back to MYT if the slot row is missing.
    const { data: slotTzRow } = await supabase
      .from("trial_slots")
      .select("timezone")
      .eq("trial_date", trialDate)
      .eq("start_time", start_time)
      .maybeSingle();
    const timezone: string = (slotTzRow as { timezone?: string | null } | null)?.timezone || "Asia/Kuala_Lumpur";

    // Registrations close 1 day before the class (compare in MYT, UTC+8)
    const mytNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const mytDayStr = mytNow.toISOString().split("T")[0];
    const trialMs = new Date(trialDate + "T00:00:00Z").getTime();
    const todayMs = new Date(mytDayStr + "T00:00:00Z").getTime();
    if (Math.round((trialMs - todayMs) / 86_400_000) <= 1) {
      return new Response(
        JSON.stringify({ ok: false, success: false, error: "Booking is closed — registrations close 1 day before the class." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // 2. For authenticated users rebooking, remove any existing booking (TBA or
    // real) so the INSERT below succeeds. Unauthenticated path only removes TBA
    // placeholders; real bookings there hit 23505 and return a friendly message.
    // Look up existing booking — prefer user_id match (reliable), fall back to email.
    let existingBooking: { id: string; start_time: string | null; trial_date: string | null; is_tba: boolean | null } | null = null;
    if (resolvedUserId) {
      const { data, error: e1 } = await supabase
        .from("trial_bookings")
        .select("id, start_time, trial_date, is_tba")
        .eq("user_id", resolvedUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (e1) console.error("book-trial lookup by user_id error:", JSON.stringify(e1));
      existingBooking = data;
    }
    if (!existingBooking) {
      const { data, error: e2 } = await supabase
        .from("trial_bookings")
        .select("id, start_time, trial_date, is_tba")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (e2) console.error("book-trial lookup by email error:", JSON.stringify(e2));
      existingBooking = data;
    }

    const isTbaPlaceholder =
      !!existingBooking &&
      (existingBooking.is_tba === true ||
        !existingBooking.start_time || !existingBooking.trial_date ||
        existingBooking.start_time === "TBA" ||
        existingBooking.trial_date === "2099-12-31");

    // Authenticated rebook: remove previous booking (any kind) to allow slot change.
    // Unauthenticated: only remove TBA placeholders.
    const shouldDelete = existingBooking && (authed || isTbaPlaceholder);

    // Atomic delete + insert via Postgres RPC (prevents orphaned bookings on crash)
    const { data: newBookingId, error: bookingError } = await supabase.rpc("upsert_trial_booking", {
      p_delete_id:   shouldDelete ? existingBooking!.id : null,
      p_name:        finalName,
      p_email:       normalizedEmail,
      p_phone:       phone?.trim() || null,
      p_level:       level?.trim() || null,
      p_goal:        goal?.trim() || null,
      p_day_of_week: day_of_week,
      p_start_time:  start_time,
      p_trial_date:  trialDate,
      p_timezone:    timezone,
      p_language:    class_language === "arabic" ? "arabic" : "english",
      p_user_id:     resolvedUserId || null,
      p_status:      "confirmed",
    });

    // Wrap result in same shape the rest of the function expects
    const booking = newBookingId ? { id: newBookingId as string } : null;

    if (bookingError || !booking) {
      // Unique constraint: user has a real booking
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
      // Conflict trigger: trial time overlaps an existing enrolled class
      if (bookingError?.code === "23514" || bookingError?.message?.includes("trial_booking_conflict")) {
        return new Response(
          JSON.stringify({
            ok: false,
            success: false,
            error: "This trial time overlaps with one of your existing classes. Please pick a different slot or contact us on WhatsApp.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Surface the real DB error in the response body instead of throwing a
      // generic 500 — this lets the UI show a meaningful message and lets us
      // see the error code/message without needing server-side log access.
      const errMsg = bookingError?.message ?? "Failed to insert trial booking";
      const errCode = bookingError?.code ?? "unknown";
      console.error("book-trial insert error:", errCode, errMsg, JSON.stringify(bookingError));
      return new Response(
        JSON.stringify({ ok: false, success: false, error: errMsg, error_code: errCode }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Notify admin
    try {
      await supabase.from("admin_notifications").insert({
        message: `New trial booking: ${finalName} (${normalizedEmail}) — ${dayName} ${formatTime12h(start_time)}, Level: ${level || "Unknown"}`,
        type: "trial",
      });
    } catch { /* non-critical */ }

    // 4. Build calendar URL for the response
    const calendarUrl = buildCalendarUrl({
      title: "Free Korean Trial Class — Klovers Academy",
      date: trialDate,
      time: start_time,
      durationMin: 30,
      description: `Your free 30-min trial Korean class with Klovers Academy.\nLevel: ${level || "Beginner"}\n\nhttps://kloversegy.com`,
      timezone,
    });

    // Fetch meeting URL from the matching trial slot (if set by admin)
    const { data: slotRow } = await supabase
      .from("trial_slots")
      .select("meeting_url")
      .eq("trial_date", trialDate)
      .eq("start_time", start_time)
      .maybeSingle();
    const meetingUrl: string | null = (slotRow as { meeting_url?: string | null } | null)?.meeting_url ?? null;

    // 5. Send trial confirmation email — track failures in DB for admin visibility
    supabase.functions.invoke("send-confirmation-email", {
      body: {
        template: "trial_confirmed",
        email: normalizedEmail,
        name: finalName,
        language: "en",
        trial_date: trialDate,
        trial_time: start_time,
        trial_timezone: timezone,
        level: level?.trim() || "",
        calendar_url: calendarUrl,
        ...(meetingUrl ? { class_link_url: meetingUrl } : {}),
      },
    }).then(null, async (e) => {
      console.warn("trial_confirmed email failed:", e);
      // Mark failure so admin can see it in the dashboard and manually resend
      try {
        await supabase
          .from("trial_bookings")
          .update({ confirmation_email_failed_at: new Date().toISOString() })
          .eq("id", booking.id);
      } catch { /* non-critical */ }
    });

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          trial_date: trialDate,
          day_name: dayName,
          start_time,
          start_time_12h: formatTime12h(start_time),
          duration_min: 30,
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
