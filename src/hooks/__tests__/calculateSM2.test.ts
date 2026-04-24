import { describe, it, expect } from "vitest";
import { calculateSM2 } from "../../lib/sm2";

/**
 * SM-2 Algorithm Tests
 * Verifies the spaced repetition engine that drives vocabulary review scheduling.
 *
 * SM-2 spec: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 * Rules:
 *   - quality < 3  → reset interval to 1 day (failed review)
 *   - EF (difficulty) is clamped at minimum 1.3
 *   - First review  → 1 day
 *   - Second review → 3 days
 *   - Subsequent   → round(previousInterval × EF)
 */
describe("calculateSM2", () => {
  // ─── Quality < 3: Failed review resets to 1 day ──────────────────────────
  it("quality 0 (complete blackout) resets interval to 1", () => {
    const { newInterval } = calculateSM2(0, 2.5, 10);
    expect(newInterval).toBe(1);
  });

  it("quality 1 resets interval to 1", () => {
    const { newInterval } = calculateSM2(1, 2.5, 10);
    expect(newInterval).toBe(1);
  });

  it("quality 2 resets interval to 1", () => {
    const { newInterval } = calculateSM2(2, 2.5, 10);
    expect(newInterval).toBe(1);
  });

  // ─── First review (previousInterval === 0) ────────────────────────────────
  it("first review (interval 0) returns 1-day interval regardless of quality", () => {
    expect(calculateSM2(5, 2.5, 0).newInterval).toBe(1);
    expect(calculateSM2(3, 2.5, 0).newInterval).toBe(1);
  });

  // ─── Second review (previousInterval === 1) ───────────────────────────────
  it("second review (interval 1) returns 3-day interval for passing quality", () => {
    expect(calculateSM2(3, 2.5, 1).newInterval).toBe(3);
    expect(calculateSM2(5, 2.5, 1).newInterval).toBe(3);
  });

  it("second review with quality < 3 resets to 1", () => {
    expect(calculateSM2(2, 2.5, 1).newInterval).toBe(1);
  });

  // ─── Subsequent reviews (previousInterval > 1) ───────────────────────────
  it("subsequent reviews multiply by difficulty factor", () => {
    // interval 3, EF 2.5 → round(3 × 2.5) = 8
    const { newInterval } = calculateSM2(5, 2.5, 3);
    expect(newInterval).toBe(8);
  });

  it("subsequent review with lower quality gives shorter next interval", () => {
    const { newInterval: hi } = calculateSM2(5, 2.5, 10);
    const { newInterval: lo } = calculateSM2(3, 2.5, 10);
    expect(hi).toBeGreaterThanOrEqual(lo);
  });

  // ─── Difficulty factor (EF) updates ──────────────────────────────────────
  it("perfect quality (5) increases difficulty factor", () => {
    const { newDifficulty } = calculateSM2(5, 2.5, 3);
    expect(newDifficulty).toBeGreaterThan(2.5);
  });

  it("quality 3 decreases difficulty factor", () => {
    const { newDifficulty } = calculateSM2(3, 2.5, 3);
    expect(newDifficulty).toBeLessThan(2.5);
  });

  it("difficulty factor never falls below 1.3 (SM-2 minimum)", () => {
    // Apply worst-case quality 10 times in a row starting at 1.3
    let ef = 1.3;
    for (let i = 0; i < 10; i++) {
      const { newDifficulty } = calculateSM2(0, ef, 3);
      ef = newDifficulty;
      expect(ef).toBeGreaterThanOrEqual(1.3);
    }
  });

  it("difficulty factor is rounded to 2 decimal places", () => {
    const { newDifficulty } = calculateSM2(4, 2.5, 3);
    const decimal = newDifficulty.toString().split(".")[1] || "";
    expect(decimal.length).toBeLessThanOrEqual(2);
  });

  // ─── Quality clamping ─────────────────────────────────────────────────────
  it("quality above 5 is clamped to 5", () => {
    const clamped = calculateSM2(5, 2.5, 3);
    const overshot = calculateSM2(100, 2.5, 3);
    expect(overshot.newDifficulty).toBe(clamped.newDifficulty);
    expect(overshot.newInterval).toBe(clamped.newInterval);
  });

  it("quality below 0 is clamped to 0", () => {
    const clamped = calculateSM2(0, 2.5, 3);
    const negative = calculateSM2(-5, 2.5, 3);
    expect(negative.newInterval).toBe(clamped.newInterval);
  });

  // ─── Return type shape ────────────────────────────────────────────────────
  it("always returns newDifficulty and newInterval as numbers", () => {
    const result = calculateSM2(4, 2.5, 6);
    expect(typeof result.newDifficulty).toBe("number");
    expect(typeof result.newInterval).toBe("number");
  });

  // ─── Long-term spacing growth ─────────────────────────────────────────────
  it("intervals grow exponentially with perfect recall over 5 reviews", () => {
    const intervals: number[] = [];
    let ef = 2.5;
    let interval = 0;

    for (let i = 0; i < 5; i++) {
      const result = calculateSM2(5, ef, interval);
      ef = result.newDifficulty;
      interval = result.newInterval;
      intervals.push(interval);
    }

    // Each interval should be >= the previous one for perfect recall
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
  });
});
