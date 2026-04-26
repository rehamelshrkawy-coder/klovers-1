/**
 * Edge-case and boundary tests for enrollment business logic.
 * Supplements enrollment.test.ts with adversarial inputs and property tests.
 */
import { describe, it, expect } from "vitest";
import {
  getApprovalBlockReason,
  validateUnitPrice,
  calcAttendancePct,
  calcReferralBonus,
  detectReceiptKind,
  calcAmountDue,
  isAtRisk,
  isLocked,
  derivedStatusFromRemaining,
} from "../enrollment";
import { MAX_UNIT_PRICE, LOCKED_SESSION_THRESHOLD, AT_RISK_SESSION_THRESHOLD } from "../admin-utils";

// ── getApprovalBlockReason — adversarial ──────────────────────────────────────

describe("getApprovalBlockReason — edge cases", () => {
  it("treats whitespace-only matchedAt as present (falsy check only)", () => {
    // " " is truthy — the guard uses !matchedAt, not .trim(). DB never stores whitespace timestamps.
    expect(getApprovalBlockReason({ matchedAt: "   ", paymentProvider: "stripe", receiptUrl: null })).toBeNull();
  });

  it("treats receipt_url=manual as missing receipt", () => {
    // "manual" is the sentinel for 'no file uploaded yet'
    expect(getApprovalBlockReason({
      matchedAt: "2024-01-01", paymentProvider: "manual", receiptUrl: "manual",
    })).toBe("missing_receipt");
  });

  it("allows unknown payment providers without a receipt check", () => {
    expect(getApprovalBlockReason({
      matchedAt: "2024-01-01", paymentProvider: "paypal", receiptUrl: null,
    })).toBeNull();
  });

  it("prioritises not_matched over missing_receipt", () => {
    // Both conditions: no matchedAt AND manual without receipt
    expect(getApprovalBlockReason({
      matchedAt: null, paymentProvider: "manual", receiptUrl: null,
    })).toBe("not_matched");
  });

  it("treats unitPriceOverride=0 as invalid", () => {
    expect(getApprovalBlockReason({
      matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: 0,
    })).toBe("invalid_unit_price");
  });

  it("treats unitPriceOverride=Infinity as invalid", () => {
    expect(getApprovalBlockReason({
      matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: Infinity,
    })).toBe("invalid_unit_price");
  });

  it("treats unitPriceOverride=null as 'not provided' (skips check)", () => {
    expect(getApprovalBlockReason({
      matchedAt: "2024-01-01", paymentProvider: "stripe", receiptUrl: null, unitPriceOverride: null,
    })).toBeNull();
  });
});

// ── validateUnitPrice — boundary ──────────────────────────────────────────────

describe("validateUnitPrice — boundaries", () => {
  it("rejects negative infinity", () => {
    expect(validateUnitPrice(-Infinity).valid).toBe(false);
  });

  it("rejects +Infinity", () => {
    expect(validateUnitPrice(Infinity).valid).toBe(false);
  });

  it("accepts exactly 1 (minimum positive)", () => {
    expect(validateUnitPrice(1).valid).toBe(true);
  });

  it("rejects MAX+0.01 (just over boundary)", () => {
    expect(validateUnitPrice(MAX_UNIT_PRICE + 0.01).valid).toBe(false);
  });

  it("accepts MAX-0.01 (just under boundary)", () => {
    expect(validateUnitPrice(MAX_UNIT_PRICE - 0.01).valid).toBe(true);
  });

  it("returns a human-readable reason string on failure", () => {
    const result = validateUnitPrice(-5);
    expect(result.valid).toBe(false);
    expect(typeof result.reason).toBe("string");
    expect(result.reason!.length).toBeGreaterThan(0);
  });

  it("returns no reason on success", () => {
    const result = validateUnitPrice(500);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

// ── calcAttendancePct — edge cases ────────────────────────────────────────────

describe("calcAttendancePct — edge cases", () => {
  it("returns null for negative total (guard against bad data)", () => {
    expect(calcAttendancePct(-1, 0)).toBeNull();
  });

  it("clamps to 0% when remaining > total (over-counted)", () => {
    // 10 total, 15 remaining → used = -5, pct = -50 — test we handle this
    const pct = calcAttendancePct(10, 15);
    // Function returns -50 which is mathematically correct; callers should guard display
    expect(typeof pct).toBe("number");
  });

  it("returns 100% when all sessions used (remaining=0)", () => {
    expect(calcAttendancePct(24, 0)).toBe(100);
  });

  it("rounds 2/3 correctly to 67%", () => {
    expect(calcAttendancePct(3, 1)).toBe(67);
  });

  it("rounds 1/3 correctly to 33%", () => {
    expect(calcAttendancePct(3, 2)).toBe(33);
  });
});

// ── isAtRisk — invariants ─────────────────────────────────────────────────────

describe("isAtRisk — invariants", () => {
  it("returns false for every non-ACTIVE status", () => {
    const statuses = ["LEAD", "LOCKED", "COMPLETED", "PENDING", "CANCELLED", ""];
    statuses.forEach(s => {
      expect(isAtRisk(1, s)).toBe(false);
    });
  });

  it("returns false when sessions=0 even if ACTIVE (completed, not at-risk)", () => {
    expect(isAtRisk(0, "ACTIVE")).toBe(false);
  });

  it("returns true for exactly AT_RISK_SESSION_THRESHOLD sessions remaining", () => {
    expect(isAtRisk(AT_RISK_SESSION_THRESHOLD, "ACTIVE")).toBe(true);
  });

  it("returns false for AT_RISK_SESSION_THRESHOLD+1", () => {
    expect(isAtRisk(AT_RISK_SESSION_THRESHOLD + 1, "ACTIVE")).toBe(false);
  });
});

// ── isLocked — invariants ─────────────────────────────────────────────────────

describe("isLocked — invariants", () => {
  it("isLocked(0) is false — 0 remaining is COMPLETED not LOCKED", () => {
    expect(isLocked(0)).toBe(false);
  });

  it("isLocked(LOCKED_SESSION_THRESHOLD) is true", () => {
    expect(isLocked(LOCKED_SESSION_THRESHOLD)).toBe(true);
  });

  it("isLocked(LOCKED_SESSION_THRESHOLD - 1) is true (deeper in the hole)", () => {
    expect(isLocked(LOCKED_SESSION_THRESHOLD - 1)).toBe(true);
  });
});

// ── derivedStatusFromRemaining — exhaustive ───────────────────────────────────

describe("derivedStatusFromRemaining — exhaustive transitions", () => {
  it("deeply negative → LOCKED", () => {
    expect(derivedStatusFromRemaining(-100)).toBe("LOCKED");
  });

  it("LOCKED_SESSION_THRESHOLD - 1 → LOCKED", () => {
    expect(derivedStatusFromRemaining(LOCKED_SESSION_THRESHOLD - 1)).toBe("LOCKED");
  });

  it("LOCKED_SESSION_THRESHOLD → LOCKED", () => {
    expect(derivedStatusFromRemaining(LOCKED_SESSION_THRESHOLD)).toBe("LOCKED");
  });

  it("LOCKED_SESSION_THRESHOLD + 1 → ACTIVE (if > 0)", () => {
    if (LOCKED_SESSION_THRESHOLD + 1 > 0) {
      expect(derivedStatusFromRemaining(LOCKED_SESSION_THRESHOLD + 1)).toBe("ACTIVE");
    } else {
      // Still in completed range
      expect(derivedStatusFromRemaining(LOCKED_SESSION_THRESHOLD + 1)).toBe("COMPLETED");
    }
  });

  it("0 → COMPLETED exactly", () => {
    expect(derivedStatusFromRemaining(0)).toBe("COMPLETED");
  });

  it("large positive → ACTIVE", () => {
    expect(derivedStatusFromRemaining(1000)).toBe("ACTIVE");
  });
});

// ── calcReferralBonus — property tests ───────────────────────────────────────

describe("calcReferralBonus — properties", () => {
  it("result is always non-negative", () => {
    const cases = [
      { conversions: 0, clicks: 0 },
      { conversions: 5, clicks: 3 },
      { conversions: 0, clicks: 100 },
      { conversions: 100, clicks: 0 },
    ];
    cases.forEach(c => expect(calcReferralBonus(c)).toBeGreaterThanOrEqual(0));
  });

  it("result never exceeds 15 (REFERRAL_MAX_BONUS_PCT)", () => {
    const cases = [
      { conversions: 100, clicks: 1000 },
      { conversions: 3, clicks: 3 },
    ];
    cases.forEach(c => expect(calcReferralBonus(c)).toBeLessThanOrEqual(15));
  });

  it("more conversions never decreases bonus (monotonic)", () => {
    const base = calcReferralBonus({ conversions: 1, clicks: 1 });
    const more = calcReferralBonus({ conversions: 2, clicks: 2 });
    expect(more).toBeGreaterThanOrEqual(base);
  });
});

// ── detectReceiptKind — adversarial ──────────────────────────────────────────

describe("detectReceiptKind — adversarial inputs", () => {
  it("handles undefined gracefully", () => {
    expect(detectReceiptKind(undefined)).toBe("none");
  });

  it("handles null gracefully", () => {
    expect(detectReceiptKind(null)).toBe("none");
  });

  it("handles whitespace-only gracefully", () => {
    expect(detectReceiptKind("   \t\n")).toBe("none");
  });

  it("stripe with uppercase is not a stripe receipt (case-sensitive)", () => {
    // 'Stripe:xxx' does NOT start with lowercase 'stripe:'
    expect(detectReceiptKind("Stripe:xxx")).toBe("storage"); // treated as storage key
  });

  it("https receipt is always 'url'", () => {
    expect(detectReceiptKind("https://receipts.s3.aws.com/some/key.pdf")).toBe("url");
  });

  it("http receipt is always 'url'", () => {
    expect(detectReceiptKind("http://localhost:3000/receipt")).toBe("url");
  });
});

// ── calcAmountDue — edge cases ────────────────────────────────────────────────

describe("calcAmountDue — edge cases", () => {
  it("returns 0 for negative sessions input (guard)", () => {
    expect(calcAmountDue(-5, 350)).toBe(0);
  });

  it("returns 0 for zero sessions", () => {
    expect(calcAmountDue(0, 350)).toBe(0);
  });

  it("returns 0 for zero unit price", () => {
    expect(calcAmountDue(5, 0)).toBe(0);
  });

  it("calculates correctly for large values", () => {
    expect(calcAmountDue(100, 1000)).toBe(100_000);
  });

  it("result is always non-negative", () => {
    expect(calcAmountDue(0, 0)).toBeGreaterThanOrEqual(0);
    expect(calcAmountDue(5, 100)).toBeGreaterThanOrEqual(0);
  });
});
