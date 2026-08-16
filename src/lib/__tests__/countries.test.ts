import { describe, it, expect } from "vitest";
import { ALL_COUNTRIES, resolveCountry } from "@/lib/countries";

describe("resolveCountry", () => {
  it("passes canonical names through unchanged", () => {
    for (const country of ALL_COUNTRIES) {
      expect(resolveCountry(country)).toBe(country);
    }
  });

  // The exact shapes the audit found: the registration checklist stores country
  // as free text, and the booking page demanded an exact case-sensitive match,
  // so each of these re-asked the question and silently dropped the student
  // into the cheapest pricing tier.
  it.each([
    ["egypt", "Egypt"],
    ["EGYPT", "Egypt"],
    ["Egypt ", "Egypt"],
    ["  eGyPt  ", "Egypt"],
    ["مصر", "Egypt"],
  ])("resolves %j to %j", (input, expected) => {
    expect(resolveCountry(input)).toBe(expected);
  });

  it("resolves Arabic country names", () => {
    expect(resolveCountry("السعودية")).toBe("Saudi Arabia");
    expect(resolveCountry("الإمارات")).toBe("UAE");
    expect(resolveCountry("الامارات")).toBe("UAE");
    expect(resolveCountry("المغرب")).toBe("Morocco");
  });

  it("resolves common English aliases", () => {
    expect(resolveCountry("UK")).toBe("United Kingdom");
    expect(resolveCountry("usa")).toBe("United States");
    expect(resolveCountry("United Arab Emirates")).toBe("UAE");
    expect(resolveCountry("korea")).toBe("South Korea");
  });

  it("returns null rather than guessing", () => {
    expect(resolveCountry("Atlantis")).toBeNull();
    expect(resolveCountry("")).toBeNull();
    expect(resolveCountry(null)).toBeNull();
    expect(resolveCountry(undefined)).toBeNull();
  });
});
