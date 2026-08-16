/**
 * One numeral system, sitewide.
 *
 * The Arabic copy mixed Arabic-Indic digits (٦ أشهر, ٣٠ دقيقة) with Western
 * ones, and every data-driven number — prices, seat counts, times, XP — has
 * always been Western because it comes from the database. Mixing the two inside
 * a single viewport reads as a typo rather than a style.
 *
 * Western digits win: they dominate the corpus 316 to 12, they are the norm on
 * Egyptian web UI, and they keep the copy consistent with the live values
 * rendered next to it. `-u-nu-latn` asks for Arabic locale conventions with
 * Latin digits, which is exactly that.
 */

const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options ?? {})}`;
  let formatter = FORMATTERS.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    FORMATTERS.set(key, formatter);
  }
  return formatter;
}

/** Locale tag to use for a given UI language. Arabic keeps Latin digits. */
export function numberLocale(lang: "en" | "ar"): string {
  return lang === "ar" ? "ar-EG-u-nu-latn" : "en-US";
}

/** Format a plain number for display. */
export function formatNumber(value: number, lang: "en" | "ar"): string {
  return formatterFor(numberLocale(lang)).format(value);
}

/**
 * Format a monetary amount.
 *
 * Prices were previously concatenated by hand ("$25/mo", "1,200 EGP/mo"), so
 * currency placement and grouping were whatever the author typed.
 */
export function formatCurrencyAmount(
  value: number,
  currency: string,
  lang: "en" | "ar",
): string {
  try {
    return formatterFor(numberLocale(lang), {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown currency code — never let a formatting detail break the page.
    return `${formatNumber(value, lang)} ${currency}`;
  }
}
