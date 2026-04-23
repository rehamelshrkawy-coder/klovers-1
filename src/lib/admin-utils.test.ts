import { describe, it, expect } from "vitest";
import { convertSlotToTimezone, convertDateTimeToTimezone, formatTime } from "./admin-utils";

describe("formatTime", () => {
  it("converts 24h → 12h", () => {
    expect(formatTime("18:00")).toBe("6:00 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
  it("handles invalid input gracefully", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("bogus")).toBe("bogus");
  });
});

describe("convertSlotToTimezone (weekly)", () => {
  it("converts across UTC+2 → UTC+8 (±DST-sensitive)", () => {
    // Thursday 18:00 Cairo → Singapore is either Thursday 23:00 (Cairo DST+3)
    // or Friday 00:00 (Cairo standard +2). Either outcome is correct.
    const r = convertSlotToTimezone(4, "18:00", "Africa/Cairo", "Asia/Singapore");
    expect(["Thursday", "Friday"]).toContain(r.weekday);
    expect(r.timeFormatted).toMatch(/(11:00 PM|12:00 AM)/);
  });

  it("converts Cairo → same tz is identity", () => {
    const r = convertSlotToTimezone(4, "18:00", "Africa/Cairo", "Africa/Cairo");
    expect(r.weekday).toBe("Thursday");
    expect(r.timeFormatted).toBe("6:00 PM");
  });

  it("handles early morning with previous-day shift", () => {
    // Friday 02:00 Cairo in Los Angeles = Thursday PM
    const r = convertSlotToTimezone(5, "02:00", "Africa/Cairo", "America/Los_Angeles");
    expect(r.weekday).toBe("Thursday");
    expect(r.dayIndex).toBe(4);
  });

  it("round-trips through source tz", () => {
    const kl = convertSlotToTimezone(1, "10:00", "Asia/Kuala_Lumpur", "Africa/Cairo");
    const [hStr, period] = kl.timeFormatted.split(" ");
    const [h12, mm] = hStr.split(":").map(Number);
    const h24 = (period === "PM" ? (h12 % 12) + 12 : h12 % 12);
    const back = convertSlotToTimezone(kl.dayIndex, `${String(h24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, "Africa/Cairo", "Asia/Kuala_Lumpur");
    expect(back.weekday).toBe("Monday");
    expect(back.timeFormatted).toBe("10:00 AM");
  });

  it("falls back gracefully on invalid input", () => {
    const r = convertSlotToTimezone(0, "", "Africa/Cairo", "Asia/Singapore");
    expect(r.weekday).toBe("Sunday");
    expect(r.dayIndex).toBe(0);
  });
});

describe("convertDateTimeToTimezone (specific date)", () => {
  it("preserves Cairo → Cairo", () => {
    const r = convertDateTimeToTimezone("2026-05-14", "18:00", "Africa/Cairo", "Africa/Cairo");
    expect(r.dateStr).toBe("2026-05-14");
    expect(r.weekday).toBe("Thursday");
    expect(r.timeFormatted).toBe("6:00 PM");
  });

  it("shifts forward a day when crossing midnight east-bound", () => {
    const r = convertDateTimeToTimezone("2026-05-14", "22:00", "Africa/Cairo", "Asia/Singapore");
    expect(r.dateStr).toBe("2026-05-15");
    expect(r.weekday).toBe("Friday");
  });

  it("shifts backward a day when crossing midnight west-bound", () => {
    const r = convertDateTimeToTimezone("2026-05-14", "02:00", "Africa/Cairo", "America/Los_Angeles");
    expect(r.dateStr).toBe("2026-05-13");
  });

  it("handles invalid input", () => {
    const r = convertDateTimeToTimezone("", "18:00", "Africa/Cairo", "Africa/Cairo");
    expect(r.dateStr).toBe("");
  });
});
