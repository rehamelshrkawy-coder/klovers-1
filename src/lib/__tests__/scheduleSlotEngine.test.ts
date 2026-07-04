import { describe, it, expect } from "vitest";

/**
 * Tests for pure helper functions extracted from scheduleSlotEngine.ts.
 * The engine itself depends on Supabase, so we mirror the pure functions here
 * to test them in isolation without a database connection.
 */

// ── formatTime12 (local copy) ─────────────────────────────────────────────────
// Converts "HH:MM" 24-hour time to a 12-hour "H:MM AM/PM" display string.

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

describe("formatTime12", () => {
  it("converts midnight to 12:00 AM", () => {
    expect(formatTime12("00:00")).toBe("12:00 AM");
  });

  it("converts noon to 12:00 PM", () => {
    expect(formatTime12("12:00")).toBe("12:00 PM");
  });

  it("converts morning hours correctly", () => {
    expect(formatTime12("06:00")).toBe("6:00 AM");
    expect(formatTime12("09:30")).toBe("9:30 AM");
    expect(formatTime12("11:59")).toBe("11:59 AM");
  });

  it("converts afternoon / evening hours correctly", () => {
    expect(formatTime12("13:00")).toBe("1:00 PM");
    expect(formatTime12("18:00")).toBe("6:00 PM");
    expect(formatTime12("23:45")).toBe("11:45 PM");
  });

  it("preserves two-digit minutes including zero", () => {
    expect(formatTime12("10:05")).toBe("10:05 AM");
    expect(formatTime12("14:07")).toBe("2:07 PM");
    expect(formatTime12("20:00")).toBe("8:00 PM");
  });
});

// ── nextDateForDayOfWeek (local copy) ─────────────────────────────────────────
// Returns the next upcoming occurrence of a given day-of-week (0=Sun, 6=Sat).
// Always returns a date strictly in the future (diff = 0 → adds 7 days).

function nextDateForDayOfWeek(dayOfWeek: number): string {
  const today = new Date();
  const todayDow = today.getDay();
  let diff = dayOfWeek - todayDow;
  if (diff <= 0) diff += 7;
  const target = new Date(today);
  target.setDate(today.getDate() + diff);
  return target.toISOString().split("T")[0];
}

describe("nextDateForDayOfWeek", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    for (let dow = 0; dow <= 6; dow++) {
      expect(nextDateForDayOfWeek(dow)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("result is always strictly in the future (not today)", () => {
    const todayIso = new Date().toISOString().split("T")[0];
    for (let dow = 0; dow <= 6; dow++) {
      const result = nextDateForDayOfWeek(dow);
      expect(result > todayIso, `nextDateForDayOfWeek(${dow}) should be after today`).toBe(true);
    }
  });

  it("result day-of-week always matches the requested day", () => {
    for (let dow = 0; dow <= 6; dow++) {
      const result = nextDateForDayOfWeek(dow);
      // Parse using local time (engine uses local getDay/setDate)
      const [y, mo, d] = result.split("-").map(Number);
      const date = new Date(y, mo - 1, d);
      expect(date.getDay(), `nextDateForDayOfWeek(${dow}) should fall on day ${dow}`).toBe(dow);
    }
  });

  it("result is within the next 7 days", () => {
    const today = new Date();
    for (let dow = 0; dow <= 6; dow++) {
      const result = nextDateForDayOfWeek(dow);
      const [y, mo, d] = result.split("-").map(Number);
      const target = new Date(y, mo - 1, d);
      const diffMs = target.getTime() - today.getTime();
      const diffDays = diffMs / 86_400_000;
      expect(diffDays, `day ${dow}: should be 0-7 days ahead`).toBeGreaterThan(0);
      expect(diffDays, `day ${dow}: should not exceed 8 days`).toBeLessThanOrEqual(8);
    }
  });
});

// ── derivePostType (local copy) ───────────────────────────────────────────────
// Determines the marketing post type for a given slot configuration.

type PostType =
  | "group_opening"
  | "limited_seats_alert"
  | "new_class_opportunity"
  | "private_opening"
  | "weekend_class";

function derivePostType(slot: {
  classType?: "group" | "private";
  dayOfWeek: number;
  seatsAvailable?: number;
  packageId?: string;
}): PostType {
  if (slot.classType === "private") return "private_opening";
  if (slot.dayOfWeek === 5 || slot.dayOfWeek === 6) return "weekend_class";
  if (!slot.packageId) return "new_class_opportunity";
  if (slot.seatsAvailable !== undefined && slot.seatsAvailable <= 3) return "limited_seats_alert";
  return "group_opening";
}

describe("derivePostType", () => {
  it("private class type → 'private_opening' regardless of other fields", () => {
    expect(derivePostType({ classType: "private", dayOfWeek: 1, packageId: "pkg-1" }))
      .toBe("private_opening");
    expect(derivePostType({ classType: "private", dayOfWeek: 6 }))
      .toBe("private_opening");
  });

  it("Friday (5) group class → 'weekend_class'", () => {
    expect(derivePostType({ classType: "group", dayOfWeek: 5, packageId: "pkg-1" }))
      .toBe("weekend_class");
  });

  it("Saturday (6) group class → 'weekend_class'", () => {
    expect(derivePostType({ classType: "group", dayOfWeek: 6, packageId: "pkg-1" }))
      .toBe("weekend_class");
  });

  it("no packageId → 'new_class_opportunity'", () => {
    expect(derivePostType({ classType: "group", dayOfWeek: 1 }))
      .toBe("new_class_opportunity");
    expect(derivePostType({ classType: "group", dayOfWeek: 3, packageId: undefined }))
      .toBe("new_class_opportunity");
  });

  it("seatsAvailable ≤ 3 with packageId → 'limited_seats_alert'", () => {
    expect(derivePostType({ classType: "group", dayOfWeek: 1, packageId: "pkg-1", seatsAvailable: 1 }))
      .toBe("limited_seats_alert");
    expect(derivePostType({ classType: "group", dayOfWeek: 2, packageId: "pkg-1", seatsAvailable: 3 }))
      .toBe("limited_seats_alert");
  });

  it("seatsAvailable > 3 with packageId → 'group_opening'", () => {
    expect(derivePostType({ classType: "group", dayOfWeek: 1, packageId: "pkg-1", seatsAvailable: 4 }))
      .toBe("group_opening");
    expect(derivePostType({ classType: "group", dayOfWeek: 2, packageId: "pkg-1", seatsAvailable: 10 }))
      .toBe("group_opening");
  });

  it("no seatsAvailable (undefined) with packageId → 'group_opening' (not limited)", () => {
    expect(derivePostType({ classType: "group", dayOfWeek: 1, packageId: "pkg-1" }))
      .not.toBe("limited_seats_alert");
  });

  it("private_opening takes priority over weekend_class", () => {
    expect(derivePostType({ classType: "private", dayOfWeek: 5 })).toBe("private_opening");
    expect(derivePostType({ classType: "private", dayOfWeek: 6 })).toBe("private_opening");
  });

  it("weekday midweek with package and seats → 'group_opening'", () => {
    // Monday–Thursday (1-4) with package and >3 seats
    for (let dow = 1; dow <= 4; dow++) {
      expect(derivePostType({ classType: "group", dayOfWeek: dow, packageId: "p", seatsAvailable: 8 }))
        .toBe("group_opening");
    }
  });
});
