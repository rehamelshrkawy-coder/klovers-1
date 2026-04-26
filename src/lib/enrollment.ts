/**
 * Pure business-logic functions for enrollment management.
 * No React, no Supabase — all functions are synchronous and side-effect free,
 * making them trivially unit-testable.
 */

import {
  AT_RISK_SESSION_THRESHOLD,
  LOCKED_SESSION_THRESHOLD,
  MAX_UNIT_PRICE,
  REFERRAL_CONVERSION_BONUS_PCT,
  REFERRAL_CLICK_BONUS_PCT,
  REFERRAL_MAX_BONUS_PCT,
} from "./admin-utils";

// ── Approval guards ───────────────────────────────────────────────────────────

export type ApprovalBlockReason =
  | "not_matched"
  | "missing_receipt"
  | "invalid_unit_price"
  | null;

export interface ApprovalGuardInput {
  matchedAt: string | null | undefined;
  paymentProvider: string | null | undefined;
  receiptUrl: string | null | undefined;
  unitPriceOverride?: number | null;
}

/**
 * Returns the reason an enrollment cannot be approved, or null if it can.
 * Maps to the validation checks in handleEnrollmentAction / handleBulkApprove.
 */
export function getApprovalBlockReason(input: ApprovalGuardInput): ApprovalBlockReason {
  if (!input.matchedAt) return "not_matched";

  const isManual =
    input.paymentProvider === "egypt_manual" ||
    input.paymentProvider === "manual";
  const hasReceipt =
    !!input.receiptUrl &&
    input.receiptUrl.trim() !== "" &&
    input.receiptUrl !== "manual";

  if (isManual && !hasReceipt) return "missing_receipt";

  if (input.unitPriceOverride != null) {
    if (
      isNaN(input.unitPriceOverride) ||
      input.unitPriceOverride <= 0 ||
      input.unitPriceOverride > MAX_UNIT_PRICE
    ) {
      return "invalid_unit_price";
    }
  }

  return null;
}

/** Returns true when no approval block reason exists for the given enrollment. */
export function canApproveEnrollment(input: ApprovalGuardInput): boolean {
  return getApprovalBlockReason(input) === null;
}

// ── Unit price validation ─────────────────────────────────────────────────────

export interface PriceValidationResult {
  valid: boolean;
  reason?: string;
}

/** Validates that a per-session unit price is a positive number within the allowed range. */
export function validateUnitPrice(price: number): PriceValidationResult {
  if (isNaN(price)) return { valid: false, reason: "Unit price must be a valid number." };
  if (price <= 0) return { valid: false, reason: "Unit price must be greater than zero." };
  if (price > MAX_UNIT_PRICE) return { valid: false, reason: "Unit price seems too high. Please verify." };
  return { valid: true };
}

// ── Session calculations ──────────────────────────────────────────────────────

/** Calculates the attendance percentage as sessions attended / sessions total. Returns null when sessionsTotal is zero. */
export function calcAttendancePct(sessionsTotal: number, sessionsRemaining: number): number | null {
  if (sessionsTotal <= 0) return null;
  return Math.round(((sessionsTotal - sessionsRemaining) / sessionsTotal) * 100);
}

/** Returns true when an active student is within the at-risk session threshold. */
export function isAtRisk(sessionsRemaining: number, derivedStatus: string): boolean {
  return (
    derivedStatus === "ACTIVE" &&
    sessionsRemaining > 0 &&
    sessionsRemaining <= AT_RISK_SESSION_THRESHOLD
  );
}

/** Returns true when a student's remaining sessions are at or below the locked threshold. */
export function isLocked(sessionsRemaining: number): boolean {
  return sessionsRemaining <= LOCKED_SESSION_THRESHOLD;
}

/** Derives enrollment status from remaining sessions: LOCKED → COMPLETED → ACTIVE. */
export function derivedStatusFromRemaining(sessionsRemaining: number): "ACTIVE" | "COMPLETED" | "LOCKED" {
  if (sessionsRemaining <= LOCKED_SESSION_THRESHOLD) return "LOCKED";
  if (sessionsRemaining <= 0) return "COMPLETED";
  return "ACTIVE";
}

// ── Referral bonus calculation ────────────────────────────────────────────────

export interface ReferralBonusInput {
  conversions: number;
  clicks: number;
}

/**
 * Calculates a referrer's discount bonus percentage.
 * Formula: (conversions × 5%) + (click-only visitors × 2%), capped at 15%.
 * click-only = clicks that did NOT convert.
 */
export function calcReferralBonus({ conversions, clicks }: ReferralBonusInput): number {
  const clickOnly = Math.max(0, clicks - conversions);
  const raw =
    conversions * REFERRAL_CONVERSION_BONUS_PCT +
    clickOnly * REFERRAL_CLICK_BONUS_PCT;
  return Math.min(raw, REFERRAL_MAX_BONUS_PCT);
}

// ── Receipt type detection ────────────────────────────────────────────────────

export type ReceiptKind = "stripe" | "url" | "storage" | "manual" | "none";

/** Detects the kind of receipt stored — Stripe, external URL, Supabase storage path, manual, or none. */
export function detectReceiptKind(receiptUrl: string | null | undefined): ReceiptKind {
  if (!receiptUrl || receiptUrl.trim() === "") return "none";
  if (receiptUrl === "manual") return "manual";
  if (receiptUrl.startsWith("stripe:")) return "stripe";
  if (receiptUrl.startsWith("http")) return "url";
  return "storage";
}

// ── Amount due ────────────────────────────────────────────────────────────────

/**
 * Amount a student owes for sessions attended beyond their purchased plan.
 * negativeSessions = abs(sessionsRemaining) when sessionsRemaining < 0.
 */
export function calcAmountDue(negativeSessions: number, unitPrice: number): number {
  if (negativeSessions <= 0 || unitPrice <= 0) return 0;
  return negativeSessions * unitPrice;
}
