import { describe, it, expect, vi, afterEach } from "vitest";
import { formatTime, formatCurrency, ADMIN_PAGE_SIZE, AT_RISK_SESSION_THRESHOLD, LOCKED_SESSION_THRESHOLD, MAX_UNIT_PRICE } from "../admin-utils";

describe("formatTime", () => {
  it("converts 24h to 12h AM", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
    expect(formatTime("00:00")).toBe("12:00 AM");
    expect(formatTime("00:30")).toBe("12:30 AM");
  });

  it("converts 24h to 12h PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("13:30")).toBe("1:30 PM");
    expect(formatTime("23:59")).toBe("11:59 PM");
  });

  it("pads minutes correctly", () => {
    expect(formatTime("9:05")).toBe("9:05 AM");
    expect(formatTime("14:07")).toBe("2:07 PM");
  });

  it("returns input unchanged for non-time strings", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("invalid")).toBe("invalid");
    expect(formatTime("9am")).toBe("9am");
  });
});

describe("formatCurrency", () => {
  it("formats with default EGP", () => {
    expect(formatCurrency(1000)).toBe("1,000 EGP");
  });

  it("formats with explicit currency", () => {
    expect(formatCurrency(500, "USD")).toBe("500 USD");
  });
});

describe("constants", () => {
  it("ADMIN_PAGE_SIZE is a positive integer", () => {
    expect(ADMIN_PAGE_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(ADMIN_PAGE_SIZE)).toBe(true);
  });

  it("AT_RISK_SESSION_THRESHOLD is positive", () => {
    expect(AT_RISK_SESSION_THRESHOLD).toBeGreaterThan(0);
  });

  it("LOCKED_SESSION_THRESHOLD is negative", () => {
    expect(LOCKED_SESSION_THRESHOLD).toBeLessThan(0);
  });

  it("MAX_UNIT_PRICE is a reasonable upper bound", () => {
    expect(MAX_UNIT_PRICE).toBeGreaterThan(1000);
    expect(MAX_UNIT_PRICE).toBeLessThanOrEqual(100_000);
  });
});
