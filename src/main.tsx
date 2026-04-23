import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import "./i18n/config";

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
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
