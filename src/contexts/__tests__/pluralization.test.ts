import { describe, it, expect } from "vitest";

/**
 * Tests for the Arabic + English plural category logic extracted from LanguageContext.
 * These run without React so they stay fast and dependency-free.
 */

type Language = "en" | "ar";
type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

// Copy of getPluralCategory from LanguageContext (pure function, safe to duplicate for test)
function getPluralCategory(count: number, lang: Language): PluralCategory {
  if (lang === "ar") {
    if (count === 0) return "zero";
    if (count === 1) return "one";
    if (count === 2) return "two";
    if (count >= 3 && count <= 10) return "few";
    if (count >= 11 && count <= 99) return "many";
    return "other";
  }
  return count === 1 ? "one" : "other";
}

// Copy of tInterpolate (pure function)
function tInterpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
  );
}

// ─── Arabic plural categories ──────────────────────────────────────────────
describe("getPluralCategory — Arabic (6 forms)", () => {
  it("zero → 0", () => expect(getPluralCategory(0, "ar")).toBe("zero"));
  it("one  → 1", () => expect(getPluralCategory(1, "ar")).toBe("one"));
  it("two  → 2", () => expect(getPluralCategory(2, "ar")).toBe("two"));

  it("few  → 3", () => expect(getPluralCategory(3, "ar")).toBe("few"));
  it("few  → 7", () => expect(getPluralCategory(7, "ar")).toBe("few"));
  it("few  → 10", () => expect(getPluralCategory(10, "ar")).toBe("few"));

  it("many → 11", () => expect(getPluralCategory(11, "ar")).toBe("many"));
  it("many → 50", () => expect(getPluralCategory(50, "ar")).toBe("many"));
  it("many → 99", () => expect(getPluralCategory(99, "ar")).toBe("many"));

  it("other → 100", () => expect(getPluralCategory(100, "ar")).toBe("other"));
  it("other → 1000", () => expect(getPluralCategory(1000, "ar")).toBe("other"));
});

// ─── English plural categories ────────────────────────────────────────────
describe("getPluralCategory — English (2 forms)", () => {
  it("one   → 1",    () => expect(getPluralCategory(1, "en")).toBe("one"));
  it("other → 0",   () => expect(getPluralCategory(0, "en")).toBe("other"));
  it("other → 2",   () => expect(getPluralCategory(2, "en")).toBe("other"));
  it("other → 100", () => expect(getPluralCategory(100, "en")).toBe("other"));
});

// ─── tInterpolate ──────────────────────────────────────────────────────────
describe("tInterpolate", () => {
  it("replaces {{count}}", () => {
    expect(tInterpolate("{{count}} درس", { count: 5 })).toBe("5 درس");
  });

  it("replaces multiple variables", () => {
    expect(tInterpolate("{{first}} and {{second}}", { first: "a", second: "b" })).toBe("a and b");
  });

  it("leaves unknown placeholders intact", () => {
    expect(tInterpolate("Hello {{name}}", {})).toBe("Hello {{name}}");
  });

  it("handles numeric zero correctly", () => {
    expect(tInterpolate("{{count}} items", { count: 0 })).toBe("0 items");
  });

  it("does not mutate the template string", () => {
    const tmpl = "{{a}} + {{b}}";
    tInterpolate(tmpl, { a: 1, b: 2 });
    expect(tmpl).toBe("{{a}} + {{b}}");
  });
});
