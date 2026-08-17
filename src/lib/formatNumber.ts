/**
 * Locale-explicit number and price formatting.
 *
 * A bare `toLocaleString()` formats using the *browser's* locale, not the
 * language the page is being read in. The same price rendered for two Arabic
 * readers came out differently depending on their OS settings, and an Arabic
 * page on an en-US machine got English grouping.
 *
 * Digits stay Western in both languages (`-u-nu-latn`), matching the rest of
 * the corpus — there is no benefit to a page that mixes numeral systems.
 */

export type UiLanguage = "en" | "ar";

function localeFor(language: UiLanguage): string {
  // `-u-nu-latn` pins Western digits; ar-EG would otherwise emit Arabic-Indic.
  return language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
}

/** Grouped integer, e.g. 1,200. */
export function formatNumber(value: number, language: UiLanguage): string {
  return new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: 0 }).format(value);
}

/**
 * A price with its currency, as a plain string.
 *
 * Use `<bdi>` around the result when rendering (see PriceText below): in an
 * RTL paragraph a bare "1,200 EGP" can have its parts reordered by the bidi
 * algorithm and render as "EGP 1,200" — or worse, split across a sentence
 * boundary — because Latin currency codes and digits have opposite
 * directionality to the surrounding Arabic.
 */
export function formatPrice(
  amount: number,
  currency: string,
  language: UiLanguage,
): string {
  const n = formatNumber(amount, language);
  // EGP renders as a code beside the number; USD as a leading symbol.
  return currency === "USD" || currency === "$" ? `$${n}` : `${n} ${currency}`;
}
