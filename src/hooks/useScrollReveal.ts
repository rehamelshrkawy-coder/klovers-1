import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Reveal-on-scroll, with two safety nets that the hand-rolled observers
 * around the codebase were missing.
 *
 * Sections using this pattern start at `opacity-0` and only become visible
 * when the observer fires. That means any failure of the observer leaves real
 * content — including the final call to action — permanently invisible, with
 * no error and nothing in the console. Two things can cause that:
 *
 *   · `IntersectionObserver` is unavailable (older browsers, some in-app
 *     webviews, and any environment where a privacy extension has stubbed it
 *     out). The observer is never constructed, so nothing ever reveals.
 *   · The observer exists but never fires — the element is laid out at zero
 *     height when observation starts, the callback is starved, or the section
 *     is already past the viewport on a restored scroll position.
 *
 * So: if there is no observer, show immediately; and regardless, show after
 * `failsafeMs` no matter what the observer did or did not do. A section
 * appearing slightly early is a non-event. A section that never appears is a
 * silently broken page.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number; failsafeMs?: number } = {},
): { ref: RefObject<T>; visible: boolean } {
  const { threshold = 0.2, failsafeMs = 2000 } = options;
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;

    // No observer, or the user prefers reduced motion: show it now.
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof IntersectionObserver === "undefined" || reduceMotion) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);

    // The failsafe. Content is never worth withholding for an animation.
    const timer = window.setTimeout(() => setVisible(true), failsafeMs);

    return () => {
      obs.disconnect();
      window.clearTimeout(timer);
    };
  }, [threshold, failsafeMs, visible]);

  return { ref, visible };
}
