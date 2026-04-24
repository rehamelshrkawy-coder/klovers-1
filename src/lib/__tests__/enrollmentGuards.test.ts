import { describe, it, expect } from "vitest";

/**
 * Enrollment approval guard logic — unit tests.
 *
 * These mirror the checks performed by the Admin Dashboard's
 * handleBulkApprove / handleApproveEnrollment before calling
 * the `approve_enrollment` Supabase RPC.
 *
 * The guards are pure-function extractions of the inline conditions
 * defined in AdminDashboard.tsx so they can be tested independently
 * of the React component tree.
 */

// ─── Types matching AdminDashboard's enrollment shape ────────────────────────
interface Enrollment {
  id: string;
  payment_provider: string | null;
  receipt_url: string | null;
  matched_at: string | null;
}

// ─── Guard functions (extracted from AdminDashboard inline logic) ─────────────

/** Returns true when the enrollment is an Egyptian manual-payment type. */
function isManualPayment(enrollment: Enrollment): boolean {
  return (
    enrollment.payment_provider === "egypt_manual" ||
    enrollment.payment_provider === "manual"
  );
}

/** Returns true when a valid receipt URL is attached to the enrollment. */
function hasValidReceipt(enrollment: Enrollment): boolean {
  return Boolean(
    enrollment.receipt_url &&
    enrollment.receipt_url.trim() !== "" &&
    enrollment.receipt_url !== "manual"
  );
}

/** Returns the reason an enrollment cannot be approved, or null if it can. */
function getApprovalBlocker(enrollment: Enrollment | undefined): string | null {
  if (!enrollment) return "not_found";
  if (!enrollment.matched_at) return "not_matched";
  if (isManualPayment(enrollment) && !hasValidReceipt(enrollment)) return "no_receipt";
  return null;
}

// ─── isManualPayment ─────────────────────────────────────────────────────────
describe("isManualPayment", () => {
  it("returns true for egypt_manual provider", () => {
    expect(isManualPayment({ id: "1", payment_provider: "egypt_manual", receipt_url: null, matched_at: null })).toBe(true);
  });

  it("returns true for manual provider", () => {
    expect(isManualPayment({ id: "1", payment_provider: "manual", receipt_url: null, matched_at: null })).toBe(true);
  });

  it("returns false for stripe provider", () => {
    expect(isManualPayment({ id: "1", payment_provider: "stripe", receipt_url: null, matched_at: null })).toBe(false);
  });

  it("returns false for null provider", () => {
    expect(isManualPayment({ id: "1", payment_provider: null, receipt_url: null, matched_at: null })).toBe(false);
  });
});

// ─── hasValidReceipt ─────────────────────────────────────────────────────────
describe("hasValidReceipt", () => {
  it("returns true for a real URL", () => {
    expect(hasValidReceipt({ id: "1", payment_provider: "egypt_manual", receipt_url: "https://example.com/receipt.jpg", matched_at: null })).toBe(true);
  });

  it("returns false for null receipt_url", () => {
    expect(hasValidReceipt({ id: "1", payment_provider: "egypt_manual", receipt_url: null, matched_at: null })).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasValidReceipt({ id: "1", payment_provider: "egypt_manual", receipt_url: "", matched_at: null })).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(hasValidReceipt({ id: "1", payment_provider: "egypt_manual", receipt_url: "   ", matched_at: null })).toBe(false);
  });

  it("returns false for the sentinel string 'manual'", () => {
    expect(hasValidReceipt({ id: "1", payment_provider: "egypt_manual", receipt_url: "manual", matched_at: null })).toBe(false);
  });
});

// ─── getApprovalBlocker ──────────────────────────────────────────────────────
describe("getApprovalBlocker", () => {
  const baseEnrollment: Enrollment = {
    id: "abc",
    payment_provider: "stripe",
    receipt_url: null,
    matched_at: "2024-01-01T00:00:00Z",
  };

  it("returns null for a valid Stripe enrollment (no blockers)", () => {
    expect(getApprovalBlocker(baseEnrollment)).toBeNull();
  });

  it("returns 'not_found' when enrollment is undefined", () => {
    expect(getApprovalBlocker(undefined)).toBe("not_found");
  });

  it("returns 'not_matched' when matched_at is null", () => {
    expect(getApprovalBlocker({ ...baseEnrollment, matched_at: null })).toBe("not_matched");
  });

  it("returns 'no_receipt' for manual payment without receipt", () => {
    expect(getApprovalBlocker({
      ...baseEnrollment,
      payment_provider: "egypt_manual",
      receipt_url: null,
    })).toBe("no_receipt");
  });

  it("returns 'no_receipt' for manual payment with sentinel receipt URL", () => {
    expect(getApprovalBlocker({
      ...baseEnrollment,
      payment_provider: "egypt_manual",
      receipt_url: "manual",
    })).toBe("no_receipt");
  });

  it("returns null for valid manual payment with real receipt URL", () => {
    expect(getApprovalBlocker({
      ...baseEnrollment,
      payment_provider: "egypt_manual",
      receipt_url: "https://storage.example.com/receipts/abc123.jpg",
    })).toBeNull();
  });

  it("not_matched check takes priority over no_receipt check", () => {
    // Both conditions present — not_matched should be returned first
    expect(getApprovalBlocker({
      ...baseEnrollment,
      payment_provider: "egypt_manual",
      receipt_url: null,
      matched_at: null,
    })).toBe("not_matched");
  });
});
