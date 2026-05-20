// Maps tier + classType + duration to Stripe price IDs
// Generated from Stripe product creation

type TierKey = "local" | "regional" | "global";
type ClassType = "group" | "private";
type Duration = 1 | 3 | 6;

const DURATION_CLASSES: Record<Duration, number> = { 1: 4, 3: 12, 6: 24 };

interface PriceInfo {
  priceId: string;
  amount: number;
  classesIncluded: number;
}

const priceMap: Record<TierKey, Record<ClassType, Record<Duration, PriceInfo>>> = {
  local: {
    group: {
      1: { priceId: "price_1SzuGyP5xKnfzufHDEWn3gYQ", amount: 25, classesIncluded: 4 },
      3: { priceId: "price_1SzuHIP5xKnfzufHopangw1F", amount: 70, classesIncluded: 12 },
      6: { priceId: "price_1SzuHdP5xKnfzufHOnyjqTdp", amount: 130, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuJfP5xKnfzufHInig8j7K", amount: 50, classesIncluded: 4 },
      3: { priceId: "price_1SzuJxP5xKnfzufHfeHITx65", amount: 140, classesIncluded: 12 },
      6: { priceId: "price_1SzuKHP5xKnfzufHv2F9RQxh", amount: 250, classesIncluded: 24 },
    },
  },
  regional: {
    group: {
      1: { priceId: "price_1SzuHyP5xKnfzufH95Ft0goD", amount: 40, classesIncluded: 4 },
      3: { priceId: "price_1SzuIFP5xKnfzufHVP5B37k0", amount: 110, classesIncluded: 12 },
      6: { priceId: "price_1SzuIVP5xKnfzufHiKQZNrcN", amount: 200, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuKcP5xKnfzufH5GZEy8qJ", amount: 80, classesIncluded: 4 },
      3: { priceId: "price_1SzuKrP5xKnfzufHBdVWXoWm", amount: 220, classesIncluded: 12 },
      6: { priceId: "price_1SzuLKP5xKnfzufHqCc6Z88A", amount: 380, classesIncluded: 24 },
    },
  },
  global: {
    group: {
      1: { priceId: "price_1SzuIkP5xKnfzufHUoR4BcIy", amount: 60, classesIncluded: 4 },
      3: { priceId: "price_1SzuJ3P5xKnfzufHxh1lTYg6", amount: 170, classesIncluded: 12 },
      6: { priceId: "price_1SzuJMP5xKnfzufHERVUIwAG", amount: 300, classesIncluded: 24 },
    },
    private: {
      1: { priceId: "price_1SzuLZP5xKnfzufH4JcNbPF5", amount: 120, classesIncluded: 4 },
      3: { priceId: "price_1SzuLpP5xKnfzufHd9EcgWs2", amount: 330, classesIncluded: 12 },
      6: { priceId: "price_1SzuM4P5xKnfzufHQWJXvZWW", amount: 580, classesIncluded: 24 },
    },
  },
};

export function getStripePrice(tier: TierKey, classType: ClassType, duration: Duration): PriceInfo | null {
  return priceMap[tier]?.[classType]?.[duration] ?? null;
}

/** USD tier prices (amount only) derived from the canonical priceMap */
export const tierPrices: Record<TierKey, Record<ClassType, Record<Duration, number>>> = Object.fromEntries(
  (Object.keys(priceMap) as TierKey[]).map((tier) => [
    tier,
    Object.fromEntries(
      (Object.keys(priceMap[tier]) as ClassType[]).map((ct) => [
        ct,
        Object.fromEntries(
          (Object.keys(priceMap[tier][ct]).map(Number) as Duration[]).map((d) => [d, priceMap[tier][ct][d].amount])
        ),
      ])
    ),
  ])
) as Record<TierKey, Record<ClassType, Record<Duration, number>>>;

/** Tier-to-country mapping — single source of truth */
export const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

/** Resolve country name → pricing tier */
export function getTierForCountry(country: string): TierKey | null {
  for (const [tier, countries] of Object.entries(tierCountries)) {
    if (countries.includes(country)) return tier as TierKey;
  }
  return null;
}

export { DURATION_CLASSES };

export type { TierKey, ClassType, Duration, PriceInfo };

// ── Local-currency display ────────────────────────────────────────────────────

interface CountryCurrency {
  code: string;
  symbol: string;
  /** 1 USD = rate LOCAL */
  rate: number;
  /** true → symbol printed before the number (e.g. $25), false → after (e.g. 25 EGP) */
  symbolBefore: boolean;
}

export const countryCurrencyMap: Record<string, CountryCurrency> = {
  // Local tier
  Egypt:        { code: "EGP", symbol: "EGP", rate: 48,    symbolBefore: false },
  Morocco:      { code: "MAD", symbol: "MAD", rate: 10.0,  symbolBefore: false },
  Tunisia:      { code: "TND", symbol: "TND", rate: 3.1,   symbolBefore: false },
  Algeria:      { code: "DZD", symbol: "DZD", rate: 135,   symbolBefore: false },
  Libya:        { code: "LYD", symbol: "LYD", rate: 4.8,   symbolBefore: false },
  Jordan:       { code: "JOD", symbol: "JOD", rate: 0.71,  symbolBefore: false },
  Lebanon:      { code: "LBP", symbol: "LBP", rate: 89500, symbolBefore: false },
  Iraq:         { code: "IQD", symbol: "IQD", rate: 1310,  symbolBefore: false },
  Syria:        { code: "SYP", symbol: "SYP", rate: 14000, symbolBefore: false },
  Sudan:        { code: "SDG", symbol: "SDG", rate: 570,   symbolBefore: false },
  Yemen:        { code: "YER", symbol: "YER", rate: 530,   symbolBefore: false },
  // Regional tier
  Malaysia:     { code: "MYR", symbol: "RM",  rate: 4.4,   symbolBefore: true  },
  Indonesia:    { code: "IDR", symbol: "Rp",  rate: 16200, symbolBefore: true  },
  Thailand:     { code: "THB", symbol: "฿",   rate: 33,    symbolBefore: true  },
  Vietnam:      { code: "VND", symbol: "₫",   rate: 25400, symbolBefore: false },
  Philippines:  { code: "PHP", symbol: "₱",   rate: 56,    symbolBefore: true  },
  India:        { code: "INR", symbol: "₹",   rate: 84,    symbolBefore: true  },
  Pakistan:     { code: "PKR", symbol: "Rs",  rate: 278,   symbolBefore: true  },
  Brazil:       { code: "BRL", symbol: "R$",  rate: 5.7,   symbolBefore: true  },
  Mexico:       { code: "MXN", symbol: "MX$", rate: 17.5,  symbolBefore: true  },
  Colombia:     { code: "COP", symbol: "COP", rate: 4200,  symbolBefore: false },
  Argentina:    { code: "ARS", symbol: "AR$", rate: 1050,  symbolBefore: true  },
  Turkey:       { code: "TRY", symbol: "₺",   rate: 38,    symbolBefore: true  },
  // Global tier
  UAE:              { code: "AED", symbol: "AED", rate: 3.67,   symbolBefore: false },
  "Saudi Arabia":   { code: "SAR", symbol: "SAR", rate: 3.75,   symbolBefore: false },
  Qatar:            { code: "QAR", symbol: "QAR", rate: 3.64,   symbolBefore: false },
  Bahrain:          { code: "BHD", symbol: "BHD", rate: 0.377,  symbolBefore: false },
  Oman:             { code: "OMR", symbol: "OMR", rate: 0.385,  symbolBefore: false },
  Kuwait:           { code: "KWD", symbol: "KWD", rate: 0.31,   symbolBefore: false },
  "United States":  { code: "USD", symbol: "$",   rate: 1,      symbolBefore: true  },
  "United Kingdom": { code: "GBP", symbol: "£",   rate: 0.79,   symbolBefore: true  },
  Germany:          { code: "EUR", symbol: "€",   rate: 0.92,   symbolBefore: true  },
  France:           { code: "EUR", symbol: "€",   rate: 0.92,   symbolBefore: true  },
  Canada:           { code: "CAD", symbol: "CA$", rate: 1.38,   symbolBefore: true  },
  Australia:        { code: "AUD", symbol: "A$",  rate: 1.58,   symbolBefore: true  },
  Japan:            { code: "JPY", symbol: "¥",   rate: 148,    symbolBefore: true  },
  "South Korea":    { code: "KRW", symbol: "₩",   rate: 1330,   symbolBefore: true  },
  China:            { code: "CNY", symbol: "¥",   rate: 7.25,   symbolBefore: true  },
};

/** Format a USD amount as local currency for the given country. Falls back to USD. */
export function formatLocalPrice(country: string, usdAmount: number): string {
  const curr = countryCurrencyMap[country];
  if (!curr) return `$${usdAmount}`;
  const local = Math.round(usdAmount * curr.rate);
  const formatted = local.toLocaleString("en-US");
  return curr.symbolBefore ? `${curr.symbol}${formatted}` : `${formatted} ${curr.symbol}`;
}
