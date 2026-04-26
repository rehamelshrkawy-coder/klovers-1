/**
 * Tests for useStudentOverview utility: buildOverviewByEmail
 */
import { describe, it, expect } from "vitest";
import { buildOverviewByEmail } from "../overview-utils";
import type { OverviewRow } from "../../types/admin";

function makeRow(overrides: Partial<OverviewRow> = {}): OverviewRow {
  return {
    user_id: "uid-1",
    name: "Test User",
    email: "test@example.com",
    country: "EG",
    level: "Beginner",
    joined_at: "2024-01-01T00:00:00Z",
    enrollment_id: null,
    payment_status: null,
    approval_status: null,
    payment_method: null,
    payment_provider: null,
    sessions_total: 12,
    sessions_remaining: 6,
    enrollment_created_at: null,
    plan_type: null,
    duration: null,
    amount: 1000,
    currency: "EGP",
    derived_status: "ACTIVE",
    source_label: "Stripe",
    unit_price: null,
    negative_sessions: 0,
    amount_due: 0,
    remaining_balance: 0,
    ...overrides,
  };
}

describe("buildOverviewByEmail", () => {
  it("returns empty map for empty array", () => {
    expect(buildOverviewByEmail([])).toEqual({});
  });

  it("maps each row by lowercase email", () => {
    const rows = [
      makeRow({ user_id: "a", email: "Alice@Example.com" }),
      makeRow({ user_id: "b", email: "bob@example.com" }),
    ];
    const map = buildOverviewByEmail(rows);
    expect(map["alice@example.com"].user_id).toBe("a");
    expect(map["bob@example.com"].user_id).toBe("b");
  });

  it("normalises uppercase email to lowercase key", () => {
    const rows = [makeRow({ email: "UPPER@TEST.COM" })];
    const map = buildOverviewByEmail(rows);
    expect("upper@test.com" in map).toBe(true);
    expect("UPPER@TEST.COM" in map).toBe(false);
  });

  it("skips rows with empty email", () => {
    const rows = [makeRow({ email: "" })];
    const map = buildOverviewByEmail(rows);
    // Empty string key should not be present (or is present but empty key — check behaviour)
    // Based on implementation: `if (r.email) map[...] = r` — empty string is falsy
    expect("" in map).toBe(false);
  });

  it("last row wins on duplicate email", () => {
    const rows = [
      makeRow({ user_id: "first", email: "dup@example.com" }),
      makeRow({ user_id: "second", email: "dup@example.com" }),
    ];
    const map = buildOverviewByEmail(rows);
    expect(map["dup@example.com"].user_id).toBe("second");
  });

  it("preserves all OverviewRow fields", () => {
    const row = makeRow({ email: "x@y.com", derived_status: "LOCKED", sessions_remaining: -5 });
    const map = buildOverviewByEmail([row]);
    expect(map["x@y.com"].derived_status).toBe("LOCKED");
    expect(map["x@y.com"].sessions_remaining).toBe(-5);
  });

  it("handles 100 rows efficiently", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({ user_id: `u${i}`, email: `user${i}@test.com` })
    );
    const map = buildOverviewByEmail(rows);
    expect(Object.keys(map).length).toBe(100);
    expect(map["user99@test.com"].user_id).toBe("u99");
  });
});
