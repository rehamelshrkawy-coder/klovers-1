import { describe, it, expect } from "vitest";

// ── Pure helpers extracted from supabase/functions/book-trial/index.ts ────────
// These are self-contained and have no Deno / Supabase dependencies.

/** Compute the next occurrence of a given day_of_week (0=Sun) from today (UTC). */
function nextDateForDay(dayOfWeek: number, fromDate = new Date()): string {
  const todayDay = fromDate.getUTCDay();
  let diff = dayOfWeek - todayDay;
  if (diff <= 0) diff += 7; // always at least 1 day in the future
  const next = new Date(fromDate);
  next.setUTCDate(fromDate.getUTCDate() + diff);
  return next.toISOString().split("T")[0]; // YYYY-MM-DD
}

/** Build a Google Calendar "Add Event" URL. */
function buildCalendarUrl(params: {
  title: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  durationMin: number;
  description: string;
  timezone: string;
}): string {
  const { title, date, time, durationMin, description, timezone } = params;
  const [h, m] = time.split(":").map(Number);
  const dateClean = date.replace(/-/g, "");
  const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const endH = h + Math.floor((m + durationMin) / 60);
  const endM = (m + durationMin) % 60;
  const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

  const urlParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: description,
    ctz: timezone,
  });
  return `https://calendar.google.com/calendar/render?${urlParams.toString()}`;
}

/** Format HH:MM time to 12h AM/PM string. */
function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Email regex used in book-trial for input validation. */
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// ── nextDateForDay ─────────────────────────────────────────────────────────────

describe("nextDateForDay()", () => {
  it("returns a date strictly in the future (diff > 0)", () => {
    // Use a fixed reference: Monday 2025-01-06 (UTC day = 1)
    const monday = new Date("2025-01-06T12:00:00Z");

    // Next Sunday (0) from a Monday should be 6 days away
    const nextSun = nextDateForDay(0, monday);
    expect(nextSun).toBe("2025-01-12");

    // Next Monday (1) from a Monday: diff = 0, so adds 7 → next week
    const nextMon = nextDateForDay(1, monday);
    expect(nextMon).toBe("2025-01-13");

    // Next Wednesday (3) from Monday: diff = 2
    const nextWed = nextDateForDay(3, monday);
    expect(nextWed).toBe("2025-01-08");
  });

  it("never returns today's date (always future)", () => {
    for (let dow = 0; dow <= 6; dow++) {
      // Run from a reference date that IS that day of week
      // 2025-01-05 is Sunday (dow=0), 2025-01-06 is Monday (dow=1), etc.
      const ref = new Date(`2025-01-${String(5 + dow).padStart(2, "0")}T00:00:00Z`);
      const result = nextDateForDay(dow, ref);
      const resultDate = new Date(result + "T00:00:00Z");
      expect(resultDate.getTime()).toBeGreaterThan(ref.getTime());
    }
  });

  it("returns a valid YYYY-MM-DD string", () => {
    const result = nextDateForDay(3);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("result day-of-week matches requested day", () => {
    for (let dow = 0; dow <= 6; dow++) {
      const result = nextDateForDay(dow);
      const d = new Date(result + "T00:00:00Z");
      expect(d.getUTCDay()).toBe(dow);
    }
  });
});

// ── buildCalendarUrl ───────────────────────────────────────────────────────────

describe("buildCalendarUrl()", () => {
  const baseParams = {
    title: "Free Korean Trial Class",
    date: "2025-03-15",
    time: "10:00",
    durationMin: 45,
    description: "Your free trial class.",
    timezone: "Africa/Cairo",
  };

  it("returns a Google Calendar render URL", () => {
    const url = buildCalendarUrl(baseParams);
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  });

  it("encodes the event title", () => {
    const url = buildCalendarUrl(baseParams);
    expect(url).toContain("text=Free+Korean+Trial+Class");
  });

  it("encodes the timezone", () => {
    const url = buildCalendarUrl(baseParams);
    expect(url).toContain("ctz=Africa%2FCairo");
  });

  it("computes correct start datetime from date + time", () => {
    const url = buildCalendarUrl({ ...baseParams, date: "2025-03-15", time: "14:30" });
    expect(url).toContain("20250315T143000");
  });

  it("computes end time correctly for 45-minute duration", () => {
    // 10:00 + 45 min = 10:45
    const url = buildCalendarUrl({ ...baseParams, time: "10:00", durationMin: 45 });
    expect(url).toContain("20250315T100000%2F20250315T104500");
  });

  it("handles hour carry-over in end time (e.g. 10:30 + 45 min = 11:15)", () => {
    const url = buildCalendarUrl({ ...baseParams, time: "10:30", durationMin: 45 });
    expect(url).toContain("20250315T103000%2F20250315T111500");
  });

  it("includes action=TEMPLATE", () => {
    const url = buildCalendarUrl(baseParams);
    expect(url).toContain("action=TEMPLATE");
  });
});

// ── formatTime12h ──────────────────────────────────────────────────────────────

describe("formatTime12h()", () => {
  it("formats midnight as 12:00 AM", () => {
    expect(formatTime12h("00:00")).toBe("12:00 AM");
  });

  it("formats noon as 12:00 PM", () => {
    expect(formatTime12h("12:00")).toBe("12:00 PM");
  });

  it("formats AM times correctly", () => {
    expect(formatTime12h("09:00")).toBe("9:00 AM");
    expect(formatTime12h("06:30")).toBe("6:30 AM");
    expect(formatTime12h("11:59")).toBe("11:59 AM");
  });

  it("formats PM times correctly", () => {
    expect(formatTime12h("13:00")).toBe("1:00 PM");
    expect(formatTime12h("17:45")).toBe("5:45 PM");
    expect(formatTime12h("23:59")).toBe("11:59 PM");
  });

  it("pads single-digit minutes", () => {
    expect(formatTime12h("09:05")).toBe("9:05 AM");
    expect(formatTime12h("14:07")).toBe("2:07 PM");
  });
});

// ── email validation regex ─────────────────────────────────────────────────────

describe("book-trial email validation regex", () => {
  it("accepts standard email addresses", () => {
    expect(emailRegex.test("user@example.com")).toBe(true);
    expect(emailRegex.test("name.surname+tag@sub.domain.org")).toBe(true);
  });

  it("rejects addresses without @", () => {
    expect(emailRegex.test("notanemail")).toBe(false);
  });

  it("rejects addresses without a domain", () => {
    expect(emailRegex.test("user@")).toBe(false);
  });

  it("rejects addresses without a TLD", () => {
    expect(emailRegex.test("user@domain")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(emailRegex.test("")).toBe(false);
  });

  it("accepts Egyptian user emails", () => {
    expect(emailRegex.test("ahmed.hassan@gmail.com")).toBe(true);
    expect(emailRegex.test("sara.ali@yahoo.com")).toBe(true);
  });
});

// ── trial_date cut-off logic ───────────────────────────────────────────────────

/**
 * Mirror of the "close bookings 1 day before" check in book-trial/index.ts.
 * The function returns true when the booking window is CLOSED.
 */
function isBookingClosed(trialDate: string, nowMYT: Date): boolean {
  const mytDayStr = nowMYT.toISOString().split("T")[0];
  const trialMs = new Date(trialDate + "T00:00:00Z").getTime();
  const todayMs = new Date(mytDayStr + "T00:00:00Z").getTime();
  return Math.round((trialMs - todayMs) / 86_400_000) <= 1;
}

describe("isBookingClosed()", () => {
  // Pin a reference "now" to a Tuesday in MYT: 2025-03-11T00:00:00 MYT = 2025-03-10T16:00:00Z
  const myt_tuesday = new Date("2025-03-11T08:00:00Z"); // 08:00 UTC = 16:00 MYT (UTC+8)

  it("closes booking on the day of the class", () => {
    expect(isBookingClosed("2025-03-11", myt_tuesday)).toBe(true);
  });

  it("closes booking 1 day before the class", () => {
    expect(isBookingClosed("2025-03-12", myt_tuesday)).toBe(true);
  });

  it("keeps booking open 2 days before the class", () => {
    expect(isBookingClosed("2025-03-13", myt_tuesday)).toBe(false);
  });

  it("keeps booking open for a date far in the future", () => {
    expect(isBookingClosed("2025-06-01", myt_tuesday)).toBe(false);
  });

  it("closes booking for a date in the past", () => {
    expect(isBookingClosed("2025-03-01", myt_tuesday)).toBe(true);
  });
});
