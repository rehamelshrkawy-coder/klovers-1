import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import "./i18n/config";
import { initSentry, Sentry } from "./lib/sentry";
import ErrorBoundary from "./components/ErrorBoundary";
import { initMetaPixel } from "./lib/metaPixel";

// Initialize Sentry as early as possible so it can capture init-time errors.
initSentry();
initMetaPixel();

// Reload the page when a lazy-loaded chunk fails to fetch (stale deploy).
// Vite fires this event when a dynamic import 404s after a new production build.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Redirect any non-production domain to kloversegy.com
const CANONICAL = "kloversegy.com";
if (
  typeof window !== "undefined" &&
  window.location.hostname !== CANONICAL &&
  window.location.hostname !== "localhost" &&
  !window.location.hostname.includes("127.0.0.1")
) {
  window.location.replace(
    `https://${CANONICAL}${window.location.pathname}${window.location.search}${window.location.hash}`
  );
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>
          <button
            className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
            onClick={resetError}
          >
            Try again
          </button>
        </div>
      </div>
    )}
    showDialog={false}
  >
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </Sentry.ErrorBoundary>
);
