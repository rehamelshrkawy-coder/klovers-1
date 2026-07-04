import { describe, it, expect } from "vitest";
import { currencySymbol, formatMoney, formatDate, formatDateTime, formatDateIso } from "./format";

// ── currencySymbol ────────────────────────────────────────────────────────────

describe("currencySymbol", () => {
  it("returns 'LE' for EGP", () => {
    expect(currencySymbol("EGP")).toBe("LE");
  });

  it("returns '$' for USD", () => {
    expect(currencySymbol("USD")).toBe("$");
  });

  it("returns '$' when currency is null", () => {
    expect(currencySymbol(null)).toBe("$");
  });

  it("returns '$' when currency is undefined", () => {
    expect(currencySymbol(undefined)).toBe("$");
  });

  it("returns '$' for empty string", () => {
    expect(currencySymbol("")).toBe("$");
  });

  it("is case-insensitive for EGP", () => {
    expect(currencySymbol("egp")).toBe("LE");
  });

  it("is case-insensitive for USD", () => {
    expect(currencySymbol("usd")).toBe("$");
  });

  it("uppercases and echoes back unrecognised currency codes", () => {
    expect(currencySymbol("gbp")).toBe("GBP");
    expect(currencySymbol("EUR")).toBe("EUR");
    expect(currencySymbol("sar")).toBe("SAR");
  });
});

// ── formatMoney ───────────────────────────────────────────────────────────────

describe("formatMoney", () => {
  it("prefixes EGP amounts with 'LE'", () => {
    const result = formatMoney(1000, "EGP");
    expect(result).toMatch(/^LE/);
  });

  it("prefixes USD amounts with '$'", () => {
    const result = formatMoney(500, "USD");
    expect(result).toMatch(/^\$/);
  });

  it("rounds fractional amounts up", () => {
    const result = formatMoney(100.6, "USD");
    expect(result).toContain("101");
  });

  it("rounds fractional amounts down", () => {
    const result = formatMoney(100.4, "USD");
    expect(result).toContain("100");
  });

  it("treats null amount as 0", () => {
    const result = formatMoney(null, "USD");
    expect(result).toContain("0");
  });

  it("treats undefined amount as 0", () => {
    const result = formatMoney(undefined, "USD");
    expect(result).toContain("0");
  });

  it("uses '$' when currency is null", () => {
    const result = formatMoney(100, null);
    expect(result).toMatch(/^\$/);
  });

  it("uses '$' when currency is omitted", () => {
    const result = formatMoney(100);
    expect(result).toMatch(/^\$/);
  });

  it("handles zero amount", () => {
    const result = formatMoney(0, "EGP");
    expect(result).toContain("0");
  });

  it("result is a non-empty string", () => {
    const result = formatMoney(350, "EGP");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("returns '—' for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("returns '—' for empty string", () => {
    expect(formatDate("")).toBe("—");
  });

  it("returns '—' for an invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("returns a non-empty string for a valid ISO date string", () => {
    const result = formatDate("2025-06-15");
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts a Date object and returns a non-empty string", () => {
    const result = formatDate(new Date("2025-06-15T00:00:00Z"));
    expect(result).not.toBe("—");
  });

  it("accepts an ISO timestamp string", () => {
    const result = formatDate("2025-06-15T10:30:00Z");
    expect(result).not.toBe("—");
  });
});

// ── formatDateTime ────────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("returns '—' for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("returns '—' for empty string", () => {
    expect(formatDateTime("")).toBe("—");
  });

  it("returns '—' for an invalid date string", () => {
    expect(formatDateTime("invalid")).toBe("—");
  });

  it("returns a non-empty string for a valid ISO timestamp", () => {
    const result = formatDateTime("2025-06-15T10:30:00Z");
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts a Date object", () => {
    const result = formatDateTime(new Date("2025-06-15T10:30:00Z"));
    expect(result).not.toBe("—");
  });
});

// ── formatDateIso ─────────────────────────────────────────────────────────────

describe("formatDateIso", () => {
  it("returns '' for null", () => {
    expect(formatDateIso(null)).toBe("");
  });

  it("returns '' for undefined", () => {
    expect(formatDateIso(undefined)).toBe("");
  });

  it("returns '' for empty string", () => {
    expect(formatDateIso("")).toBe("");
  });

  it("returns '' for an invalid date string", () => {
    expect(formatDateIso("not-a-date")).toBe("");
  });

  it("returns YYYY-MM-DD for a UTC ISO date string", () => {
    // new Date('2025-06-15') is treated as UTC midnight → ISO → 2025-06-15
    expect(formatDateIso("2025-06-15")).toBe("2025-06-15");
  });

  it("returns YYYY-MM-DD format from a UTC timestamp", () => {
    // noon UTC on 2026-01-20 — unambiguous regardless of local timezone
    expect(formatDateIso("2026-01-20T12:00:00Z")).toBe("2026-01-20");
  });

  it("result always matches YYYY-MM-DD pattern for valid inputs", () => {
    const result = formatDateIso("2026-03-10T06:00:00Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts a Date object", () => {
    const result = formatDateIso(new Date("2025-01-01T12:00:00Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
