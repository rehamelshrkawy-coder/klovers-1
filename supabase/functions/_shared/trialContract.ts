/**
 * The trial-class contract, for the Deno edge functions.
 *
 * This mirrors `src/lib/siteConfig.ts`, which the browser bundle uses. The two
 * runtimes cannot share a module, so the values are duplicated here on purpose
 * — with this comment as the reminder that changing one means changing the
 * other. Before this file existed, each email template carried its own numbers:
 * the day-before email said the class was 45 minutes while marketing sold 30,
 * and the follow-up quoted a group of "4-8 students" against a capacity of 6.
 */

/** Trial class length in minutes. Must match TRIAL_DURATION_MIN. */
export const TRIAL_DURATION_MIN = 30;

/** Maximum students in one trial group. Must match TRIAL_GROUP_SIZE_MAX. */
export const TRIAL_GROUP_SIZE_MAX = 6;

/**
 * Post-trial offer.
 *
 * ⚠️ PLACEHOLDER VALUES — set these before relying on the follow-up sequence.
 *
 * The audit asked the T+ follow-up to carry "one offer, one deadline". The
 * mechanism is built and wired; these are the three inputs it needs, and they
 * are business decisions rather than engineering ones:
 *
 *   POST_TRIAL_OFFER_ENABLED  — false until the terms below are real, so the
 *                               email ships without an offer rather than with
 *                               an invented one.
 *   POST_TRIAL_OFFER_PERCENT  — the discount actually honoured at checkout.
 *   POST_TRIAL_OFFER_DAYS     — how long it stands, counted from the trial.
 *   POST_TRIAL_OFFER_CODE     — the promo code; must exist in promo_codes.
 *
 * A deadline that is not enforced at checkout is a fabricated scarcity string,
 * which is exactly what the audit told us to stop shipping. Enable this only
 * once the code and its expiry exist on the pricing side.
 */
export const POST_TRIAL_OFFER_ENABLED = false;
export const POST_TRIAL_OFFER_PERCENT = 0;
export const POST_TRIAL_OFFER_DAYS = 0;
export const POST_TRIAL_OFFER_CODE = "";

/** True only when the offer is switched on AND fully specified. */
export function postTrialOfferIsUsable(): boolean {
  return (
    POST_TRIAL_OFFER_ENABLED &&
    POST_TRIAL_OFFER_PERCENT > 0 &&
    POST_TRIAL_OFFER_DAYS > 0 &&
    POST_TRIAL_OFFER_CODE.length > 0
  );
}
