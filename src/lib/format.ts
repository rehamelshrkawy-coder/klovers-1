/**
 * Centralized formatters for currency and dates.
 * Replaces scattered inline `Math.round(x).toLocaleString()` /
 * `new Date(x).toLocaleDateString()` patterns across the admin UI.
 */

export type CurrencyCode = "EGP" | "USD" | string;

const CURRENCY_SYMBOL: Record<string, string> = {
  EGP: "LE",
  USD: "$",
};

export function currencySymbol(currency?: CurrencyCode | null): string {
  if (!currency) return "$";
  return CURRENCY_SYMBOL[currency.toUpperCase()] ?? currency.toUpperCase();
}

/**
 * Format a money amount with its currency symbol. Always uses grouping
 * separators for readability. Rounds to whole units (no cents) to match
 * the admin UI's existing conventions.
 */
export function formatMoney(amount: number | null | undefined, currency?: CurrencyCode | null): string {
  const value = Number(amount ?? 0);
  const rounded = Math.round(value);
  return `${currencySymbol(currency)}${rounded.toLocaleString()}`;
}

/** Short date: e.g. "14 Apr 2026" — for tables/cards where space is tight. */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Short date+time: e.g. "14 Apr 2026, 10:30" */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** ISO date (YYYY-MM-DD) — for CSV exports, API params, HTML date inputs. */
export function formatDateIso(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
