import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TRIAL_DURATION_MIN, TRIAL_GROUP_SIZE_MAX } from "@/lib/siteConfig";

/**
 * The browser bundle and the Deno edge functions cannot share a module, so the
 * trial contract is duplicated in `supabase/functions/_shared/trialContract.ts`.
 * Duplication that is only held together by a comment drifts — which is how the
 * class came to be 30 minutes in marketing and 45 in the day-before email, and
 * the group 6 in the picker and "4-8" in the follow-up.
 *
 * This reads the Deno file as text (importing it would pull in Deno-only
 * specifiers) and asserts the numbers still match.
 */
const CONTRACT_PATH = resolve(__dirname, "../../../supabase/functions/_shared/trialContract.ts");

function numericExport(source: string, name: string): number {
  const match = source.match(new RegExp(`export const ${name}\\s*=\\s*(-?\\d+)`));
  if (!match) throw new Error(`${name} not found in trialContract.ts`);
  return Number(match[1]);
}

describe("trial contract parity across runtimes", () => {
  const source = readFileSync(CONTRACT_PATH, "utf8");

  it("agrees on the trial duration", () => {
    expect(numericExport(source, "TRIAL_DURATION_MIN")).toBe(TRIAL_DURATION_MIN);
  });

  it("agrees on the maximum group size", () => {
    expect(numericExport(source, "TRIAL_GROUP_SIZE_MAX")).toBe(TRIAL_GROUP_SIZE_MAX);
  });

  it("keeps the post-trial offer switched off until its terms are real", () => {
    // The offer renders only when enabled AND fully specified. If someone flips
    // the flag without setting the code, percent and window, this fails rather
    // than shipping an email with an unenforceable deadline in it.
    const enabled = /export const POST_TRIAL_OFFER_ENABLED\s*=\s*true/.test(source);
    if (!enabled) return;
    expect(numericExport(source, "POST_TRIAL_OFFER_PERCENT")).toBeGreaterThan(0);
    expect(numericExport(source, "POST_TRIAL_OFFER_DAYS")).toBeGreaterThan(0);
    const code = source.match(/export const POST_TRIAL_OFFER_CODE\s*=\s*"([^"]*)"/)?.[1] ?? "";
    expect(code.length).toBeGreaterThan(0);
  });
});
