/**
 * SM-2 Spaced Repetition Algorithm
 * Used by Anki and SuperMemo — industry standard for language learning.
 *
 * Extracted to its own module so it can be unit-tested without any
 * browser/Supabase dependencies.
 *
 * Spec: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 */
export function calculateSM2(
  quality: number, // 0-5: 0=complete blackout, 5=perfect response
  previousDifficulty: number,
  previousInterval: number
): { newDifficulty: number; newInterval: number } {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, quality));

  // Calculate new difficulty factor (EF formula from SM-2)
  let newDifficulty =
    previousDifficulty +
    (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Clamp difficulty to minimum of 1.3 (SM-2 spec)
  newDifficulty = Math.max(1.3, newDifficulty);

  // Calculate new interval
  let newInterval: number;
  if (q < 3) {
    // Failed review: restart from 1 day
    newInterval = 1;
  } else if (previousInterval === 0) {
    // First review: 1 day
    newInterval = 1;
  } else if (previousInterval === 1) {
    // Second review: 3 days
    newInterval = 3;
  } else {
    // Subsequent reviews: multiply by difficulty factor
    newInterval = Math.round(previousInterval * newDifficulty);
  }

  return {
    newDifficulty: parseFloat(newDifficulty.toFixed(2)),
    newInterval,
  };
}
