import { describe, it, expect } from "vitest";

/**
 * Churn prevention signal logic — pure function tests.
 *
 * We extract and test the pure signal derivations from useChurnPrevention
 * without needing to mount React or mock Supabase.
 */

// ─── Pure helpers extracted from hook logic ───────────────────────────────────

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const last = new Date(isoDate);
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / 86_400_000);
}

function isInactiveRisk(lastActivityDate: string | null, currentStreak: number): boolean {
  const days = daysSince(lastActivityDate);
  return days !== null && days >= 3 && currentStreak > 0;
}

function isSessionLow(sessionsRemaining: number | null): boolean {
  return sessionsRemaining !== null && sessionsRemaining >= 1 && sessionsRemaining <= 2;
}

function isSessionEmpty(sessionsRemaining: number | null): boolean {
  return sessionsRemaining === 0;
}

// ─── daysSince ────────────────────────────────────────────────────────────────
describe("daysSince", () => {
  it("returns null for null input", () => {
    expect(daysSince(null)).toBeNull();
  });

  it("returns 0 for today's date", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(daysSince(today)).toBe(0);
  });

  it("returns positive number for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = daysSince(past.toISOString().split("T")[0]);
    expect(result).toBeGreaterThanOrEqual(4); // allow for time-of-day edge
    expect(result).toBeLessThanOrEqual(6);
  });
});

// ─── isInactiveRisk ───────────────────────────────────────────────────────────
describe("isInactiveRisk", () => {
  const threeDaysAgo = (() => {
    const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split("T")[0];
  })();

  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0];
  })();

  it("true when inactive 3+ days AND had a streak", () => {
    expect(isInactiveRisk(threeDaysAgo, 5)).toBe(true);
  });

  it("false when inactive < 3 days", () => {
    expect(isInactiveRisk(yesterday, 5)).toBe(false);
  });

  it("false when no streak (new user who never built a habit)", () => {
    expect(isInactiveRisk(threeDaysAgo, 0)).toBe(false);
  });

  it("false when lastActivityDate is null (never studied)", () => {
    expect(isInactiveRisk(null, 10)).toBe(false);
  });
});

// ─── isSessionLow ────────────────────────────────────────────────────────────
describe("isSessionLow", () => {
  it("true for 1 session remaining", () => expect(isSessionLow(1)).toBe(true));
  it("true for 2 sessions remaining", () => expect(isSessionLow(2)).toBe(true));
  it("false for 3 sessions remaining", () => expect(isSessionLow(3)).toBe(false));
  it("false for 0 sessions (use isSessionEmpty instead)", () => expect(isSessionLow(0)).toBe(false));
  it("false for null (no enrollment)", () => expect(isSessionLow(null)).toBe(false));
  it("false for large number", () => expect(isSessionLow(20)).toBe(false));
});

// ─── isSessionEmpty ───────────────────────────────────────────────────────────
describe("isSessionEmpty", () => {
  it("true for 0 sessions", () => expect(isSessionEmpty(0)).toBe(true));
  it("false for 1 session", () => expect(isSessionEmpty(1)).toBe(false));
  it("false for null (no enrollment)", () => expect(isSessionEmpty(null)).toBe(false));
});

// ─── Combined signal interaction ──────────────────────────────────────────────
describe("signal priority", () => {
  it("isSessionEmpty and isInactiveRisk can both be true simultaneously", () => {
    const threeDaysAgo = (() => {
      const d = new Date(); d.setDate(d.getDate() - 4); return d.toISOString().split("T")[0];
    })();
    expect(isInactiveRisk(threeDaysAgo, 7)).toBe(true);
    expect(isSessionEmpty(0)).toBe(true);
  });

  it("isSessionLow and isSessionEmpty are mutually exclusive", () => {
    // A session count cannot simultaneously satisfy both predicates
    for (let i = -5; i <= 20; i++) {
      const low = isSessionLow(i);
      const empty = isSessionEmpty(i);
      expect(low && empty, `both true for sessions=${i}`).toBe(false);
    }
  });
});
