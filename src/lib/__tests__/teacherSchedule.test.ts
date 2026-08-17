import { describe, expect, it } from "vitest";
import {
  addDays, formatTime, normalizeTime, startOfWeek, toDateKey,
} from "@/lib/teacherScheduleTime";

describe("toDateKey", () => {
  it("uses the local calendar day, not the UTC one", () => {
    // Late-evening local times are the trap: toISOString() would roll these
    // over to the next day for any timezone east of UTC, silently filing a
    // block under the wrong date.
    expect(toDateKey(new Date(2026, 0, 1, 23, 30))).toBe("2026-01-01");
    expect(toDateKey(new Date(2026, 0, 1, 0, 15))).toBe("2026-01-01");
  });

  it("zero-pads month and day", () => {
    expect(toDateKey(new Date(2026, 8, 5))).toBe("2026-09-05");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(toDateKey(addDays(new Date(2026, 0, 31), 1))).toBe("2026-02-01");
    expect(toDateKey(addDays(new Date(2026, 11, 31), 1))).toBe("2027-01-01");
  });

  it("goes backwards", () => {
    expect(toDateKey(addDays(new Date(2026, 2, 1), -1))).toBe("2026-02-28");
  });

  it("does not mutate its argument", () => {
    const original = new Date(2026, 5, 10);
    addDays(original, 5);
    expect(toDateKey(original)).toBe("2026-06-10");
  });

  it("handles a leap day", () => {
    expect(toDateKey(addDays(new Date(2028, 1, 28), 1))).toBe("2028-02-29");
  });
});

describe("startOfWeek", () => {
  it("returns the Sunday of that week, matching the 0=Sun convention", () => {
    // 2026-08-17 is a Monday; its week starts Sunday 2026-08-16.
    expect(toDateKey(startOfWeek(new Date(2026, 7, 17)))).toBe("2026-08-16");
  });

  it("is a no-op on a Sunday", () => {
    expect(toDateKey(startOfWeek(new Date(2026, 7, 16)))).toBe("2026-08-16");
  });

  it("keeps a Saturday in the week that already started", () => {
    expect(toDateKey(startOfWeek(new Date(2026, 7, 22)))).toBe("2026-08-16");
  });

  it("strips the time so week ranges compare cleanly", () => {
    const start = startOfWeek(new Date(2026, 7, 17, 22, 45));
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0]);
  });
});

describe("formatTime", () => {
  it("renders midnight and noon the way people read them", () => {
    expect(formatTime("00:30:00")).toBe("12:30 AM");
    expect(formatTime("12:00:00")).toBe("12:00 PM");
  });

  it("renders morning and evening", () => {
    expect(formatTime("09:05:00")).toBe("9:05 AM");
    expect(formatTime("18:00:00")).toBe("6:00 PM");
    expect(formatTime("23:45:00")).toBe("11:45 PM");
  });

  it("accepts HH:MM without seconds", () => {
    expect(formatTime("18:00")).toBe("6:00 PM");
  });
});

describe("normalizeTime", () => {
  it("pads a single-digit hour", () => {
    expect(normalizeTime("9:00")).toBe("09:00");
    expect(normalizeTime("18:30")).toBe("18:30");
  });

  it("trims surrounding whitespace, as left by comma-splitting a list", () => {
    expect(normalizeTime("  19:00 ")).toBe("19:00");
  });

  it("rejects out-of-range and malformed values", () => {
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("18:60")).toBeNull();
    expect(normalizeTime("18")).toBeNull();
    expect(normalizeTime("6pm")).toBeNull();
    expect(normalizeTime("")).toBeNull();
  });
});
