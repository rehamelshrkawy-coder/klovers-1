/**
 * Canonical country list and a tolerant resolver for it.
 *
 * Two forms disagreed about what a country is: the registration checklist saves
 * whatever the student types into a free-text field, while the booking page
 * required an exact, case-sensitive match against this 38-item list. A student
 * who typed "egypt", "EGYPT", "مصر" or "Egypt " was asked for their country a
 * second time — and their pricing tier silently fell back to the cheapest
 * bracket regardless of where they actually live.
 *
 * `resolveCountry` is the seam between the two: free text in, a canonical name
 * or null out.
 */

export const ALL_COUNTRIES = [
  "Algeria", "Argentina", "Australia", "Bahrain", "Brazil", "Canada", "China",
  "Colombia", "Egypt", "France", "Germany", "India", "Indonesia", "Iraq", "Japan",
  "Jordan", "Kuwait", "Lebanon", "Libya", "Malaysia", "Mexico", "Morocco", "Oman",
  "Pakistan", "Philippines", "Qatar", "Saudi Arabia", "South Korea", "Sudan",
  "Syria", "Thailand", "Tunisia", "Turkey", "UAE", "United Kingdom", "United States",
  "Vietnam", "Yemen",
] as const;

export type Country = (typeof ALL_COUNTRIES)[number];

/**
 * Arabic names and the English spellings people actually type.
 * Keys are matched after the same normalisation applied to user input.
 */
const ALIASES: Record<string, Country> = {
  // Arabic
  "مصر": "Egypt",
  "المغرب": "Morocco",
  "تونس": "Tunisia",
  "الجزائر": "Algeria",
  "ليبيا": "Libya",
  "الاردن": "Jordan",
  "الأردن": "Jordan",
  "لبنان": "Lebanon",
  "العراق": "Iraq",
  "سوريا": "Syria",
  "السودان": "Sudan",
  "اليمن": "Yemen",
  "الامارات": "UAE",
  "الإمارات": "UAE",
  "السعودية": "Saudi Arabia",
  "المملكة العربية السعودية": "Saudi Arabia",
  "قطر": "Qatar",
  "البحرين": "Bahrain",
  "عمان": "Oman",
  "سلطنة عمان": "Oman",
  "الكويت": "Kuwait",
  "ماليزيا": "Malaysia",
  "تركيا": "Turkey",
  "كوريا الجنوبية": "South Korea",
  "اليابان": "Japan",
  // English variants
  "uae": "UAE",
  "united arab emirates": "UAE",
  "u.a.e.": "UAE",
  "ksa": "Saudi Arabia",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "england": "United Kingdom",
  "britain": "United Kingdom",
  "usa": "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "us": "United States",
  "america": "United States",
  "korea": "South Korea",
  "republic of korea": "South Korea",
  "deutschland": "Germany",
  "misr": "Egypt",
  "masr": "Egypt",
};

/**
 * Casefold, strip diacritics and the Arabic definite article's spacing quirks,
 * and collapse whitespace, so "  EGYPT " and "مصر" both land on a stable key.
 */
function normalise(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")     // Latin combining marks
    .replace(/[ً-ْٰ]/g, "") // Arabic diacritics
    .replace(/\s+/g, " ");
}

const CANONICAL_BY_KEY = new Map<string, Country>();
for (const country of ALL_COUNTRIES) CANONICAL_BY_KEY.set(normalise(country), country);
for (const [alias, country] of Object.entries(ALIASES)) {
  CANONICAL_BY_KEY.set(normalise(alias), country);
}

/**
 * Map arbitrary user input onto a canonical country name.
 *
 * @returns the canonical name, or null when the input matches nothing — callers
 *          should then ask, rather than silently assuming a pricing tier.
 */
export function resolveCountry(input: string | null | undefined): Country | null {
  if (!input) return null;
  return CANONICAL_BY_KEY.get(normalise(input)) ?? null;
}
