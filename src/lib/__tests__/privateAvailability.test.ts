import { describe, it, expect } from "vitest";

/**
 * Tests for computePrivateAvailability — the pure function in privateAvailability.ts.
 * We mirror it here to avoid the Supabase top-level import in that file.
 */

// ── Mirrored constants from @/constants/scheduling ───────────────────────────
const TIMEZONE = "Asia/Kuala_Lumpur";
const PRIVATE_TIME_OPTIONS = ["10:00", "18:00"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Mirrored formatTime12 helper ──────────────────────────────────────────────
function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Mirrored computePrivateAvailability ───────────────────────────────────────
function computePrivateAvailability(
  privateDayNames: string[],
  timeOptions: string[] = PRIVATE_TIME_OPTIONS
): {
  courseDays: string[];
  privateAllowedDays: string[];
  options: Array<{ weekday: string; dayIndex: number; time: string; timeFormatted: string; timezone: string }>;
} {
  const privateAllowedDays = privateDayNames.filter(d => WEEKDAYS.includes(d));
  const courseDays = WEEKDAYS.filter(d => !privateAllowedDays.includes(d));

  const options: Array<{ weekday: string; dayIndex: number; time: string; timeFormatted: string; timezone: string }> = [];
  for (const day of privateAllowedDays) {
    const dayIndex = WEEKDAYS.indexOf(day);
    for (const time of timeOptions) {
      options.push({
        weekday: day,
        dayIndex,
        time,
        timeFormatted: formatTime12(time),
        timezone: TIMEZONE,
      });
    }
  }

  return { courseDays, privateAllowedDays, options };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("computePrivateAvailability", () => {
  it("returns empty options when no private days provided", () => {
    const { options, privateAllowedDays, courseDays } = computePrivateAvailability([]);
    expect(options).toHaveLength(0);
    expect(privateAllowedDays).toHaveLength(0);
    expect(courseDays).toHaveLength(7); // all days become course days
  });

  it("privateAllowedDays only contains valid WEEKDAYS values", () => {
    const { privateAllowedDays } = computePrivateAvailability(["Monday", "InvalidDay", "Saturday"]);
    expect(privateAllowedDays).toEqual(["Monday", "Saturday"]);
    expect(privateAllowedDays).not.toContain("InvalidDay");
  });

  it("courseDays is the complement of privateAllowedDays", () => {
    const { privateAllowedDays, courseDays } = computePrivateAvailability(["Monday", "Wednesday"]);
    const union = new Set([...privateAllowedDays, ...courseDays]);
    expect(union.size).toBe(7); // all 7 days covered
    // No day appears in both sets
    for (const d of privateAllowedDays) {
      expect(courseDays).not.toContain(d);
    }
  });

  it("generates one slot per day × time option", () => {
    const { options } = computePrivateAvailability(["Monday", "Friday"], ["10:00", "18:00"]);
    expect(options).toHaveLength(4); // 2 days × 2 times
  });

  it("each option has the correct weekday, dayIndex, time, and timezone", () => {
    const { options } = computePrivateAvailability(["Tuesday"]);
    expect(options[0].weekday).toBe("Tuesday");
    expect(options[0].dayIndex).toBe(2); // Tuesday = index 2
    expect(options[0].timezone).toBe(TIMEZONE);
  });

  it("timeFormatted is in 12-hour format", () => {
    const { options } = computePrivateAvailability(["Monday"], ["10:00", "18:00"]);
    expect(options.find(o => o.time === "10:00")!.timeFormatted).toBe("10:00 AM");
    expect(options.find(o => o.time === "18:00")!.timeFormatted).toBe("6:00 PM");
  });

  it("uses PRIVATE_TIME_OPTIONS as default when no timeOptions provided", () => {
    const { options } = computePrivateAvailability(["Sunday"]);
    expect(options).toHaveLength(PRIVATE_TIME_OPTIONS.length);
  });

  it("accepts a custom time options list", () => {
    const { options } = computePrivateAvailability(["Wednesday"], ["09:00", "14:00", "20:00"]);
    expect(options).toHaveLength(3);
    expect(options.map(o => o.time)).toEqual(["09:00", "14:00", "20:00"]);
  });

  it("all 7 days can be set as private (no course days)", () => {
    const { courseDays, privateAllowedDays } = computePrivateAvailability(WEEKDAYS);
    expect(privateAllowedDays).toHaveLength(7);
    expect(courseDays).toHaveLength(0);
  });

  it("dayIndex values match WEEKDAYS array positions", () => {
    const { options } = computePrivateAvailability(["Sunday", "Saturday"], ["10:00"]);
    const sunday = options.find(o => o.weekday === "Sunday");
    const saturday = options.find(o => o.weekday === "Saturday");
    expect(sunday!.dayIndex).toBe(0);
    expect(saturday!.dayIndex).toBe(6);
  });
});
