// ── Tracking utility ──────────────────────────────────────────────────────
// Wraps Meta Pixel (fbq) and GA4 (gtag) so callers don't need guard checks.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Meta Pixel events
export const track = {
  /** Visitor views a page (auto-fired by Pixel base code, but call for SPAs) */
  pageView() {
    window.fbq?.("track", "PageView");
  },

  /** Free trial form submitted */
  lead(data?: { content_name?: string; currency?: string; trial_date?: string; value?: number }) {
    window.fbq?.("track", "Lead", data);
    window.gtag?.("event", "generate_lead");
  },

  /** User created an account */
  completeRegistration() {
    window.fbq?.("track", "CompleteRegistration");
    window.gtag?.("event", "sign_up");
  },

  /** User reached checkout / payment page */
  initiateCheckout(data?: { value?: number; currency?: string }) {
    window.fbq?.("track", "InitiateCheckout", data);
    window.gtag?.("event", "begin_checkout", {
      currency: data?.currency ?? "USD",
      value: data?.value ?? 0,
    });
  },

  /** Payment submitted (Egypt manual upload or Stripe) */
  purchase(data?: { value?: number; currency?: string }) {
    window.fbq?.("track", "Purchase", {
      value: data?.value ?? 0,
      currency: data?.currency ?? "USD",
    });
    window.gtag?.("event", "purchase", {
      currency: data?.currency ?? "USD",
      value: data?.value ?? 0,
    });
  },

  /** Custom funnel events (Meta: trackCustom, GA4: event) */
  custom(eventName: string, params?: Record<string, unknown>) {
    window.fbq?.("trackCustom", eventName, params);
    window.gtag?.("event", eventName, params);
  },
};
