import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveSlotInstant, viewerToday, NO_END_DATE_SENTINEL } from "@/lib/trialTime";

afterEach(() => { vi.useRealTimers(); });

describe("resolveSlotInstant", () => {
  it("resolves a wall-clock time in the source timezone to an absolute instant", () => {
    // 21:00 in Kuala Lumpur (UTC+8) is 13:00 UTC on the same day.
    const d = resolveSlotInstant("2026-08-20", "21:00", "Asia/Kuala_Lumpur");
    expect(d?.toISOString()).toBe("2026-08-20T13:00:00.000Z");
  });

  it("resolves the same wall-clock time differently per source timezone", () => {
    const myt = resolveSlotInstant("2026-08-20", "21:00", "Asia/Kuala_Lumpur");
    const cairo = resolveSlotInstant("2026-08-20", "21:00", "Africa/Cairo");
    // Cairo is behind MYT, so the same local time is a later absolute instant.
    expect(cairo!.getTime()).toBeGreaterThan(myt!.getTime());
  });

  it("accepts seconds in the time column, as Postgres `time` returns", () => {
    const d = resolveSlotInstant("2026-08-20", "09:30:00", "Asia/Kuala_Lumpur");
    expect(d?.toISOString()).toBe("2026-08-20T01:30:00.000Z");
  });

  it("returns null rather than an Invalid Date for missing or malformed input", () => {
    expect(resolveSlotInstant(null, "21:00", "Asia/Kuala_Lumpur")).toBeNull();
    expect(resolveSlotInstant("2026-08-20", null, "Asia/Kuala_Lumpur")).toBeNull();
    expect(resolveSlotInstant("not-a-date", "21:00", "Asia/Kuala_Lumpur")).toBeNull();
    expect(resolveSlotInstant("2026-08-20", "nope", "Asia/Kuala_Lumpur")).toBeNull();
  });
});

describe("viewerToday", () => {
  /**
   * The regression this exists for: "today" used to be computed as
   * `Date.now() + 8h`, an approximation of the teacher's date. From 18:00
   * Cairo onward that rolled over to tomorrow, so the duplicate-booking
   * pre-check excluded a student's own class on the day of the class.
   */
  it("is the viewer's own date, not a UTC+8 approximation", () => {
    // 19:00 Cairo on 20 Aug = 17:00 UTC. Naive +8h gives 01:00 on the 21st.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T17:00:00Z"));

    expect(viewerToday("Africa/Cairo")).toBe("2026-08-20");

    const naive = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    expect(naive).toBe("2026-08-21"); // what the old code produced
    expect(viewerToday("Africa/Cairo")).not.toBe(naive);
  });

  it("still reports the teacher's own date correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T17:00:00Z"));
    // 17:00 UTC is 01:00 on the 21st in Kuala Lumpur.
    expect(viewerToday("Asia/Kuala_Lumpur")).toBe("2026-08-21");
  });

  it("returns a lexically sortable YYYY-MM-DD string", () => {
    expect(viewerToday("Africa/Cairo")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("NO_END_DATE_SENTINEL", () => {
  it("is the far-future date the scheduling tables use for 'no end'", () => {
    expect(NO_END_DATE_SENTINEL).toBe("2099-12-31");
  });
});
