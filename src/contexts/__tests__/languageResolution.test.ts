import { describe, it, expect } from "vitest";
import { resolveInitialLanguage } from "../LanguageContext";

/**
 * The site's hreflang annotation points Google at `/?lang=ar`, and every
 * WhatsApp campaign link carries the same parameter. Nothing read it, so the
 * Arabic site could not be indexed, linked or shared, and an Arabic reader
 * following an Arabic ad landed on the English page.
 */
describe("resolveInitialLanguage", () => {
  it("takes the language from the URL when present", () => {
    expect(resolveInitialLanguage("?lang=ar", null)).toBe("ar");
    expect(resolveInitialLanguage("?lang=en", null)).toBe("en");
  });

  it("lets the URL override a saved preference", () => {
    // A shared /?lang=ar link must show Arabic even to someone whose last
    // visit was in English — otherwise the link is not really a link.
    expect(resolveInitialLanguage("?lang=ar", "en")).toBe("ar");
    expect(resolveInitialLanguage("?lang=en", "ar")).toBe("en");
  });

  it("falls back to the saved preference when the URL says nothing", () => {
    expect(resolveInitialLanguage("", "ar")).toBe("ar");
    expect(resolveInitialLanguage("?ref=abc", "ar")).toBe("ar");
  });

  it("defaults to English with no URL and no saved preference", () => {
    expect(resolveInitialLanguage("", null)).toBe("en");
  });

  it("ignores values that are not a supported language", () => {
    expect(resolveInitialLanguage("?lang=fr", null)).toBe("en");
    expect(resolveInitialLanguage("?lang=", "ar")).toBe("ar");
    expect(resolveInitialLanguage("", "klingon")).toBe("en");
  });

  it("finds lang among other query parameters", () => {
    expect(resolveInitialLanguage("?utm_source=wa&lang=ar&ref=x", null)).toBe("ar");
  });
});
