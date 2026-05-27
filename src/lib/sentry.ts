import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry error monitoring.
 *
 * Reads `VITE_SENTRY_DSN` at build time. If unset, Sentry is a no-op
 * (safe for local dev / preview deploys without a DSN configured).
 *
 * Set `VITE_SENTRY_DSN` in Vercel env vars to activate in production.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    // No DSN configured — skip init silently. Sentry calls become no-ops.
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE_SHA || undefined,
    // Capture 10% of normal traffic; 100% on errors.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Replay only on errors to keep payload small.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 0.1 : 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Ignore noisy third-party / browser-extension errors.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      /^Network request failed/i,
      /Loading chunk \d+ failed/i,
      /Loading CSS chunk \d+ failed/i,
    ],
    beforeSend(event) {
      // Drop events from localhost in production builds (rare, but possible).
      if (
        import.meta.env.PROD &&
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")
      ) {
        return null;
      }
      return event;
    },
  });
}

export { Sentry };
