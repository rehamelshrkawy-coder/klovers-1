import { describe, it, expect, afterEach, vi } from "vitest";
import { supportedTimeZones } from "@/lib/viewerTimezone";

/**
 * `Intl.supportedValuesOf` is ES2022 and throws a TypeError on Safari below
 * 15.4. Two timezone pickers called it bare, so those browsers crashed the
 * enrolment and reschedule pages instead of degrading.
 */
describe("supportedTimeZones", () => {
  const original = (Intl as Record<string, unknown>).supportedValuesOf;

  afterEach(() => {
    if (original === undefined) delete (Intl as Record<string, unknown>).supportedValuesOf;
    else (Intl as Record<string, unknown>).supportedValuesOf = original;
    vi.restoreAllMocks();
  });

  it("uses the platform list when the API is available", () => {
    (Intl as Record<string, unknown>).supportedValuesOf = () => ["Africa/Cairo", "Europe/London"];
    expect(supportedTimeZones()).toEqual(["Africa/Cairo", "Europe/London"]);
  });

  it("falls back when the API is missing entirely", () => {
    delete (Intl as Record<string, unknown>).supportedValuesOf;
    const zones = supportedTimeZones();
    expect(zones.length).toBeGreaterThan(20);
    expect(zones).toContain("Africa/Cairo");
    expect(zones).toContain("Asia/Kuala_Lumpur");
  });

  it("falls back when the API throws", () => {
    (Intl as Record<string, unknown>).supportedValuesOf = () => { throw new TypeError("nope"); };
    expect(() => supportedTimeZones()).not.toThrow();
    expect(supportedTimeZones()).toContain("Africa/Cairo");
  });

  it("falls back when the API returns nothing useful", () => {
    (Intl as Record<string, unknown>).supportedValuesOf = () => [];
    expect(supportedTimeZones().length).toBeGreaterThan(20);
  });

  it("includes the visitor's own zone so their answer is selectable", () => {
    delete (Intl as Record<string, unknown>).supportedValuesOf;
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
      resolvedOptions: () => ({ timeZone: "Pacific/Chatham" }),
    } as unknown as Intl.DateTimeFormat);
    expect(supportedTimeZones()).toContain("Pacific/Chatham");
  });

  it("returns a sorted, duplicate-free list on the fallback path", () => {
    delete (Intl as Record<string, unknown>).supportedValuesOf;
    const zones = supportedTimeZones();
    expect(new Set(zones).size).toBe(zones.length);
    expect([...zones].sort()).toEqual(zones);
  });
});
