import { describe, it, expect } from "vitest";
import { getPluralCategory, interpolate as tInterpolate } from "@/contexts/LanguageContext";

/**
 * Arabic + English plural categories and placeholder interpolation.
 *
 * These import the shipped implementations rather than re-declaring copies of
 * them. The copies were the reason the interpolation bug survived: the test
 * asserted against its own `{{name}}`-only regex and passed happily while the
 * whole translation corpus used single braces, so the real function was a no-op
 * on 100% of it.
 */

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

  // Every interpolated string in both locales is written with SINGLE braces.
  // The regex matched double braces only, so the function was a no-op on the
  // entire corpus — it did not break production only because nothing called it.
  it("replaces single-brace {count}, which is what the corpus actually uses", () => {
    expect(tInterpolate("{count} درس", { count: 5 })).toBe("5 درس");
    expect(tInterpolate("Question {current} of {total}", { current: 2, total: 20 }))
      .toBe("Question 2 of 20");
  });

  it("handles both brace styles in one template", () => {
    expect(tInterpolate("{a} and {{b}}", { a: "x", b: "y" })).toBe("x and y");
  });

  it("leaves unknown single-brace placeholders intact", () => {
    expect(tInterpolate("Hello {name}", {})).toBe("Hello {name}");
  });
});
