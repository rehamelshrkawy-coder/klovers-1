import { describe, it, expect } from "vitest";
import {
  getApprovalBlockReason,
  canApproveEnrollment,
  validateUnitPrice,
  calcAttendancePct,
  isAtRisk,
  isLocked,
  derivedStatusFromRemaining,
  calcReferralBonus,
  detectReceiptKind,
  calcAmountDue,
} from "../enrollment";
import { MAX_UNIT_PRICE, AT_RISK_SESSION_THRESHOLD, LOCKED_SESSION_THRESHOLD } from "../admin-utils";

// ── getApprovalBlockReason ────────────────────────────────────────────────────

describe("getApprovalBlockReason", () => {
  it("blocks when matchedAt is missing", () => {
    expect(getApprovalBlockReason({ matchedAt: null, paymentProvider: "stripe", receiptUrl: null })).toBe("not_matched");
    expect(getApprovalBlockReason({ matchedAt: undefined, paymentProvider: "stripe", receiptUrl: null })).toBe("not_matched");
    expect(getApprovalBlockReason({ matchedAt: "", paymentProvider: "stripe", receiptUrl: null })).toBe("not_matched");
  });

  it("blocks manual payment without a receipt", () => {
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "egypt_manual", receiptUrl: null })).toBe("missing_receipt");
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "manual", receiptUrl: "" })).toBe("missing_receipt");
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "manual", receiptUrl: "manual" })).toBe("missing_receipt");
  });

  it("allows manual payment with a valid receipt", () => {
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "egypt_manual", receiptUrl: "receipts/abc.jpg" })).toBeNull();
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "manual", receiptUrl: "https://example.com/receipt.pdf" })).toBeNull();
  });

  it("allows Stripe payment without a receipt", () => {
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null })).toBeNull();
  });

  it("blocks invalid unit price override", () => {
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: 0 })).toBe("invalid_unit_price");
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: -50 })).toBe("invalid_unit_price");
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: MAX_UNIT_PRICE + 1 })).toBe("invalid_unit_price");
  });

  it("allows valid unit price override", () => {
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: 500 })).toBeNull();
    expect(getApprovalBlockReason({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: MAX_UNIT_PRICE })).toBeNull();
  });
});

describe("canApproveEnrollment", () => {
  it("returns true only when no block reason exists", () => {
    expect(canApproveEnrollment({ matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null })).toBe(true);
    expect(canApproveEnrollment({ matchedAt: null, paymentProvider: "stripe", receiptUrl: null })).toBe(false);
  });
});

// ── validateUnitPrice ─────────────────────────────────────────────────────────

describe("validateUnitPrice", () => {
  it("rejects NaN", () => {
    expect(validateUnitPrice(NaN).valid).toBe(false);
  });

  it("rejects zero and negative", () => {
    expect(validateUnitPrice(0).valid).toBe(false);
    expect(validateUnitPrice(-1).valid).toBe(false);
  });

  it("rejects above MAX_UNIT_PRICE", () => {
    expect(validateUnitPrice(MAX_UNIT_PRICE + 1).valid).toBe(false);
  });

  it("accepts boundary MAX_UNIT_PRICE", () => {
    expect(validateUnitPrice(MAX_UNIT_PRICE).valid).toBe(true);
  });

  it("accepts typical prices", () => {
    expect(validateUnitPrice(100).valid).toBe(true);
    expect(validateUnitPrice(350).valid).toBe(true);
  });
});

// ── calcAttendancePct ─────────────────────────────────────────────────────────

describe("calcAttendancePct", () => {
  it("returns null when no sessions", () => {
    expect(calcAttendancePct(0, 0)).toBeNull();
  });

  it("calculates correctly", () => {
    expect(calcAttendancePct(12, 6)).toBe(50);   // used 6/12
    expect(calcAttendancePct(24, 0)).toBe(100);  // all used
    expect(calcAttendancePct(4, 4)).toBe(0);     // none used
  });

  it("rounds to nearest integer", () => {
    expect(calcAttendancePct(3, 2)).toBe(33);    // 1/3 = 33.3%
  });
});

// ── isAtRisk ──────────────────────────────────────────────────────────────────

describe("isAtRisk", () => {
  it("flags ACTIVE students at or below threshold", () => {
    expect(isAtRisk(AT_RISK_SESSION_THRESHOLD, "ACTIVE")).toBe(true);
    expect(isAtRisk(1, "ACTIVE")).toBe(true);
  });

  it("does not flag students above threshold", () => {
    expect(isAtRisk(AT_RISK_SESSION_THRESHOLD + 1, "ACTIVE")).toBe(false);
  });

  it("does not flag non-ACTIVE statuses", () => {
    expect(isAtRisk(2, "COMPLETED")).toBe(false);
    expect(isAtRisk(1, "LOCKED")).toBe(false);
    expect(isAtRisk(3, "LEAD")).toBe(false);
  });

  it("does not flag zero remaining (COMPLETED, not at-risk)", () => {
    expect(isAtRisk(0, "ACTIVE")).toBe(false);
  });
});

// ── isLocked ──────────────────────────────────────────────────────────────────

describe("isLocked", () => {
  it("locks at or below the threshold", () => {
    expect(isLocked(LOCKED_SESSION_THRESHOLD)).toBe(true);
    expect(isLocked(LOCKED_SESSION_THRESHOLD - 1)).toBe(true);
  });

  it("does not lock above threshold", () => {
    expect(isLocked(LOCKED_SESSION_THRESHOLD + 1)).toBe(false);
    expect(isLocked(0)).toBe(false);
    expect(isLocked(5)).toBe(false);
  });
});

// ── derivedStatusFromRemaining ────────────────────────────────────────────────

describe("derivedStatusFromRemaining", () => {
  it("returns LOCKED at threshold", () => {
    expect(derivedStatusFromRemaining(LOCKED_SESSION_THRESHOLD)).toBe("LOCKED");
    expect(derivedStatusFromRemaining(-10)).toBe("LOCKED");
  });

  it("returns COMPLETED at zero", () => {
    expect(derivedStatusFromRemaining(0)).toBe("COMPLETED");
  });

  it("returns ACTIVE when sessions remain", () => {
    expect(derivedStatusFromRemaining(1)).toBe("ACTIVE");
    expect(derivedStatusFromRemaining(24)).toBe("ACTIVE");
  });
});

// ── calcReferralBonus ─────────────────────────────────────────────────────────

describe("calcReferralBonus", () => {
  it("calculates conversion-only bonus", () => {
    expect(calcReferralBonus({ conversions: 1, clicks: 1 })).toBe(5);   // 1×5%
    expect(calcReferralBonus({ conversions: 2, clicks: 2 })).toBe(10);  // 2×5%
  });

  it("adds click-only bonus", () => {
    // 1 conversion (5%) + 1 click-only (2%) = 7%
    expect(calcReferralBonus({ conversions: 1, clicks: 2 })).toBe(7);
  });

  it("caps at REFERRAL_MAX_BONUS_PCT", () => {
    expect(calcReferralBonus({ conversions: 10, clicks: 10 })).toBe(15);
    expect(calcReferralBonus({ conversions: 100, clicks: 200 })).toBe(15);
  });

  it("returns 0 for zero activity", () => {
    expect(calcReferralBonus({ conversions: 0, clicks: 0 })).toBe(0);
  });

  it("handles clicks < conversions gracefully (no negative click-only)", () => {
    // Shouldn't happen in practice but must not return negative
    expect(calcReferralBonus({ conversions: 5, clicks: 3 })).toBeGreaterThanOrEqual(0);
  });
});

// ── detectReceiptKind ─────────────────────────────────────────────────────────

describe("detectReceiptKind", () => {
  it('detects "none"', () => {
    expect(detectReceiptKind(null)).toBe("none");
    expect(detectReceiptKind("")).toBe("none");
    expect(detectReceiptKind("   ")).toBe("none");
  });

  it('detects "manual" sentinel', () => {
    expect(detectReceiptKind("manual")).toBe("manual");
  });

  it('detects Stripe prefix', () => {
    expect(detectReceiptKind("stripe:ch_abc123")).toBe("stripe");
  });

  it('detects plain URL', () => {
    expect(detectReceiptKind("https://example.com/r.pdf")).toBe("url");
    expect(detectReceiptKind("http://example.com/r.jpg")).toBe("url");
  });

  it('detects storage object key', () => {
    expect(detectReceiptKind("receipts/abc-def.jpg")).toBe("storage");
    expect(detectReceiptKind("2024/01/receipt.pdf")).toBe("storage");
  });
});

// ── calcAmountDue ─────────────────────────────────────────────────────────────

describe("calcAmountDue", () => {
  it("calculates correctly", () => {
    expect(calcAmountDue(3, 350)).toBe(1050);
    expect(calcAmountDue(1, 200)).toBe(200);
  });

  it("returns 0 when no negative sessions", () => {
    expect(calcAmountDue(0, 350)).toBe(0);
  });

  it("returns 0 when unit price is 0", () => {
    expect(calcAmountDue(5, 0)).toBe(0);
  });
});
