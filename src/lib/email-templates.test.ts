import { describe, it, expect } from "vitest";

// Mirror of the esc() HTML-escaping helper used in send-confirmation-email edge function.
// Kept here as a pure TS function so it can be unit-tested without Deno.
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

describe("esc() HTML escaping", () => {
  it("escapes angle brackets", () => {
    expect(esc("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(esc("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes double quotes", () => {
    expect(esc('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(esc("it's fine")).toBe("it&#39;s fine");
  });

  it("handles null gracefully", () => {
    expect(esc(null)).toBe("");
  });

  it("handles undefined gracefully", () => {
    expect(esc(undefined)).toBe("");
  });

  it("handles empty string gracefully", () => {
    expect(esc("")).toBe("");
  });

  it("leaves safe ASCII strings untouched", () => {
    expect(esc("Ahmed Mohamed")).toBe("Ahmed Mohamed");
  });

  it("leaves Arabic text untouched", () => {
    expect(esc("مرحباً")).toBe("مرحباً");
  });

  it("escapes XSS injection attempt — no raw < or > in output", () => {
    const result = esc('<img src=x onerror="alert(1)">');
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("escapes multiple special chars in one string", () => {
    const result = esc('<a href="/?q=1&x=2">link</a>');
    expect(result).toBe("&lt;a href=&quot;/?q=1&amp;x=2&quot;&gt;link&lt;/a&gt;");
  });
});

// Mirror of the approvalEmailLanguage() logic used in AdminDashboard to decide
// whether to send approval emails in Arabic or English based on the student's
// browser timezone.
const ARABIC_TZ = new Set([
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Bahrain",
  "Asia/Qatar",
  "Asia/Muscat",
  "Asia/Baghdad",
  "Asia/Amman",
  "Asia/Beirut",
  "Asia/Damascus",
  "Asia/Aden",
  "Asia/Gaza",
  "Asia/Hebron",
]);

function approvalEmailLanguage(tz: string): "ar" | "en" {
  if (!tz || tz.startsWith("Africa/") || ARABIC_TZ.has(tz)) return "ar";
  return "en";
}

describe("approvalEmailLanguage()", () => {
  it("returns ar for Egypt timezone (Africa/ prefix)", () => {
    expect(approvalEmailLanguage("Africa/Cairo")).toBe("ar");
  });

  it("returns ar for any other Africa/ timezone", () => {
    expect(approvalEmailLanguage("Africa/Tunis")).toBe("ar");
    expect(approvalEmailLanguage("Africa/Tripoli")).toBe("ar");
  });

  it("returns ar for Saudi Arabia (Asia/Riyadh)", () => {
    expect(approvalEmailLanguage("Asia/Riyadh")).toBe("ar");
  });

  it("returns ar for UAE (Asia/Dubai)", () => {
    expect(approvalEmailLanguage("Asia/Dubai")).toBe("ar");
  });

  it("returns ar for Kuwait", () => {
    expect(approvalEmailLanguage("Asia/Kuwait")).toBe("ar");
  });

  it("returns ar for Qatar", () => {
    expect(approvalEmailLanguage("Asia/Qatar")).toBe("ar");
  });

  it("returns ar for Jordan (Asia/Amman)", () => {
    expect(approvalEmailLanguage("Asia/Amman")).toBe("ar");
  });

  it("returns en for Europe/London", () => {
    expect(approvalEmailLanguage("Europe/London")).toBe("en");
  });

  it("returns en for US timezones", () => {
    expect(approvalEmailLanguage("America/New_York")).toBe("en");
    expect(approvalEmailLanguage("America/Los_Angeles")).toBe("en");
  });

  it("returns en for Asian non-Arabic timezones", () => {
    expect(approvalEmailLanguage("Asia/Seoul")).toBe("en");
    expect(approvalEmailLanguage("Asia/Tokyo")).toBe("en");
    expect(approvalEmailLanguage("Asia/Kuala_Lumpur")).toBe("en");
  });

  it("returns ar for empty string (safe Arabic default)", () => {
    expect(approvalEmailLanguage("")).toBe("ar");
  });

  it("returns en for a completely unknown timezone (non-Arabic default)", () => {
    // Unrecognised zones that don't start with Africa/ and aren't in the set get en
    expect(approvalEmailLanguage("Unknown/Zone")).toBe("en");
    expect(approvalEmailLanguage("Bogus/Tz")).toBe("en");
  });
});
