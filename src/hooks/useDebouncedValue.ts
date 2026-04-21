import { useEffect, useState } from "react";

/**
 * Returns a value that trails the input by `delayMs`. Great for
 * expensive search-driven filtering — render the raw value in the
 * input, but use the debounced one for the filter computation.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 250): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
