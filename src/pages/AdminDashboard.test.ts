import { describe, it, expect } from "vitest";

/**
 * Pure-function tests for AdminDashboard logic.
 *
 * These functions live inside the AdminDashboard component but are pure enough
 * to test without mounting React or connecting to Supabase. We mirror them here
 * so they can run in Vitest without the full component tree.
 */

// ── approvalEmailLanguage ─────────────────────────────────────────────────────
//
// Determines whether to send an approval email in Arabic or English based on
// the student's browser timezone. Arabic is the default for Egypt / Gulf /
// Levant zones and any Africa/* timezone (covers all MENA markets).

const ARABIC_TZ = new Set([
  "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Bahrain", "Asia/Qatar",
  "Asia/Muscat", "Asia/Baghdad", "Asia/Amman", "Asia/Beirut", "Asia/Damascus",
  "Asia/Aden", "Asia/Gaza", "Asia/Hebron",
]);

function approvalEmailLanguage(tz: string): "ar" | "en" {
  if (!tz || tz.startsWith("Africa/") || ARABIC_TZ.has(tz)) return "ar";
  return "en";
}

describe("approvalEmailLanguage", () => {
  it.each([
    // Africa/* prefix — covers Egypt and all North/Sub-Saharan Africa
    ["Africa/Cairo",       "ar"],
    ["Africa/Casablanca",  "ar"],
    ["Africa/Tunis",       "ar"],
    ["Africa/Tripoli",     "ar"],
    ["Africa/Khartoum",    "ar"],
    // Gulf states in ARABIC_TZ set
    ["Asia/Riyadh",        "ar"],
    ["Asia/Dubai",         "ar"],
    ["Asia/Kuwait",        "ar"],
    ["Asia/Bahrain",       "ar"],
    ["Asia/Qatar",         "ar"],
    ["Asia/Muscat",        "ar"],
    // Levant
    ["Asia/Amman",         "ar"],
    ["Asia/Beirut",        "ar"],
    ["Asia/Damascus",      "ar"],
    ["Asia/Baghdad",       "ar"],
    ["Asia/Gaza",          "ar"],
    ["Asia/Hebron",        "ar"],
    // Empty string → safe Arabic default
    ["",                   "ar"],
  ] as [string, "ar" | "en"][])(
    "timezone %s → %s",
    (tz, expected) => {
      expect(approvalEmailLanguage(tz)).toBe(expected);
    }
  );

  it.each([
    ["Europe/London",     "en"],
    ["Europe/Paris",      "en"],
    ["Europe/Berlin",     "en"],
    ["America/New_York",  "en"],
    ["America/Los_Angeles","en"],
    ["Asia/Tokyo",        "en"],
    ["Asia/Seoul",        "en"],
    ["Asia/Kolkata",      "en"],
    ["Asia/Kuala_Lumpur", "en"],
    ["Australia/Sydney",  "en"],
    ["Pacific/Auckland",  "en"],
    // Starts with 'Asia' but not in the explicit set
    ["Asia/Singapore",    "en"],
    ["Asia/Jakarta",      "en"],
  ] as [string, "ar" | "en"][])(
    "timezone %s → %s",
    (tz, expected) => {
      expect(approvalEmailLanguage(tz)).toBe(expected);
    }
  );

  it("unknown/bogus timezone defaults to English", () => {
    expect(approvalEmailLanguage("Unknown/Zone")).toBe("en");
    expect(approvalEmailLanguage("Bogus/Tz")).toBe("en");
  });

  it("returns 'ar' or 'en' — never any other value", () => {
    const inputs = [
      "Africa/Cairo", "Asia/Riyadh", "Europe/London", "", "unknown",
    ];
    for (const tz of inputs) {
      const result = approvalEmailLanguage(tz);
      expect(["ar", "en"]).toContain(result);
    }
  });
});
