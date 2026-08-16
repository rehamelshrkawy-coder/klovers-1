import { describe, it, expect, afterEach, vi } from "vitest";
import { zonedDateTimeToInstant, todayInTimezone } from "@/lib/admin-utils";

describe("zonedDateTimeToInstant", () => {
  it("resolves a wall-clock time in the given zone to the right instant", () => {
    // 09:00 in Kuala Lumpur (UTC+8, no DST) is 01:00 UTC.
    const instant = zonedDateTimeToInstant("2026-09-10", "09:00", "Asia/Kuala_Lumpur");
    expect(instant?.toISOString()).toBe("2026-09-10T01:00:00.000Z");
  });

  it("honours DST in zones that observe it", () => {
    // London is UTC+1 in July and UTC+0 in January.
    expect(zonedDateTimeToInstant("2026-07-01", "12:00", "Europe/London")?.toISOString())
      .toBe("2026-07-01T11:00:00.000Z");
    expect(zonedDateTimeToInstant("2026-01-01", "12:00", "Europe/London")?.toISOString())
      .toBe("2026-01-01T12:00:00.000Z");
  });

  it("returns null on malformed input rather than an Invalid Date", () => {
    expect(zonedDateTimeToInstant("", "09:00", "Asia/Kuala_Lumpur")).toBeNull();
    expect(zonedDateTimeToInstant("2026-09-10", "", "Asia/Kuala_Lumpur")).toBeNull();
    expect(zonedDateTimeToInstant("2026-09-10", "nine", "Asia/Kuala_Lumpur")).toBeNull();
  });
});

describe("todayInTimezone", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("reads the date in the target zone, not the viewer's", () => {
    // 20:00 UTC on the 10th is already the 11th in Kuala Lumpur (UTC+8).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T20:00:00Z"));
    expect(todayInTimezone("Asia/Kuala_Lumpur")).toBe("2026-09-11");
    expect(todayInTimezone("Africa/Cairo")).toBe("2026-09-10");
    expect(todayInTimezone("UTC")).toBe("2026-09-10");
  });

  it("does not roll over early for an Egyptian evening", () => {
    // This is the regression the audit found: a fixed `Date.now() + 8h` made
    // "today" become tomorrow from about 18:00 Cairo onward, so a student whose
    // trial was that same day failed the pre-check and their booking vanished.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T19:00:00Z")); // 22:00 Cairo
    const naiveOffsetResult = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    expect(naiveOffsetResult).toBe("2026-09-11");            // the old, wrong answer
    expect(todayInTimezone("Africa/Cairo")).toBe("2026-09-10"); // still today in Cairo
  });
});
