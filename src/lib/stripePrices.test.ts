import { describe, it, expect } from "vitest";
import {
  getStripePrice,
  getTierForCountry,
  DURATION_CLASSES,
  tierPrices,
  tierCountries,
} from "./stripePrices";

// ── getStripePrice ────────────────────────────────────────────────────────────

describe("getStripePrice", () => {
  it("returns a PriceInfo for every valid tier/classType/duration combination", () => {
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    const durs = [1, 3, 6] as const;
    for (const tier of tiers) {
      for (const ct of types) {
        for (const dur of durs) {
          const info = getStripePrice(tier, ct, dur);
          expect(info, `${tier}/${ct}/${dur} should not be null`).not.toBeNull();
          expect(info!.priceId).toMatch(/^price_/);
          expect(info!.amount).toBeGreaterThan(0);
          expect(info!.classesIncluded).toBeGreaterThan(0);
        }
      }
    }
  });

  it("returns null for an invalid tier", () => {
    // @ts-expect-error intentionally invalid
    expect(getStripePrice("invalid", "group", 1)).toBeNull();
  });

  it("local group 1-month plan costs $25", () => {
    expect(getStripePrice("local", "group", 1)!.amount).toBe(25);
  });

  it("local group 3-month plan costs $70", () => {
    expect(getStripePrice("local", "group", 3)!.amount).toBe(70);
  });

  it("local group 6-month plan costs $130", () => {
    expect(getStripePrice("local", "group", 6)!.amount).toBe(130);
  });

  it("global private 6-month plan costs $580", () => {
    expect(getStripePrice("global", "private", 6)!.amount).toBe(580);
  });

  it("private is always more expensive than group for same tier+duration", () => {
    const tiers = ["local", "regional", "global"] as const;
    const durs = [1, 3, 6] as const;
    for (const tier of tiers) {
      for (const dur of durs) {
        const group = getStripePrice(tier, "group", dur)!.amount;
        const priv = getStripePrice(tier, "private", dur)!.amount;
        expect(priv, `private > group for ${tier}/${dur}`).toBeGreaterThan(group);
      }
    }
  });

  it("6-month plan always costs more total than 1-month plan", () => {
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    for (const tier of tiers) {
      for (const ct of types) {
        const m1 = getStripePrice(tier, ct, 1)!.amount;
        const m6 = getStripePrice(tier, ct, 6)!.amount;
        expect(m6, `${tier}/${ct} 6-month > 1-month`).toBeGreaterThan(m1);
      }
    }
  });

  it("longer plans offer a lower per-class cost than shorter plans", () => {
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    for (const tier of tiers) {
      for (const ct of types) {
        const m1 = getStripePrice(tier, ct, 1)!;
        const m6 = getStripePrice(tier, ct, 6)!;
        const perClass1 = m1.amount / m1.classesIncluded;
        const perClass6 = m6.amount / m6.classesIncluded;
        expect(perClass6, `${tier}/${ct} per-class cost 6m < 1m`).toBeLessThan(perClass1);
      }
    }
  });

  it("1-month plan always includes 4 classes", () => {
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    for (const tier of tiers) {
      for (const ct of types) {
        expect(getStripePrice(tier, ct, 1)!.classesIncluded).toBe(4);
      }
    }
  });

  it("6-month plan always includes 24 classes", () => {
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    for (const tier of tiers) {
      for (const ct of types) {
        expect(getStripePrice(tier, ct, 6)!.classesIncluded).toBe(24);
      }
    }
  });

  it("all price IDs are unique (no reuse across plans)", () => {
    const priceIds = new Set<string>();
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    const durs = [1, 3, 6] as const;
    for (const t of tiers) {
      for (const ct of types) {
        for (const d of durs) {
          const id = getStripePrice(t, ct, d)!.priceId;
          expect(priceIds.has(id), `duplicate priceId: ${id}`).toBe(false);
          priceIds.add(id);
        }
      }
    }
  });
});

// ── getTierForCountry ─────────────────────────────────────────────────────────

describe("getTierForCountry", () => {
  it.each([
    ["Egypt", "local"],
    ["Morocco", "local"],
    ["Tunisia", "local"],
    ["Algeria", "local"],
    ["Jordan", "local"],
    ["Lebanon", "local"],
    ["Iraq", "local"],
  ])("%s → 'local'", (country, expected) => {
    expect(getTierForCountry(country)).toBe(expected);
  });

  it.each([
    ["Malaysia", "regional"],
    ["Indonesia", "regional"],
    ["India", "regional"],
    ["Pakistan", "regional"],
    ["Brazil", "regional"],
    ["Turkey", "regional"],
  ])("%s → 'regional'", (country, expected) => {
    expect(getTierForCountry(country)).toBe(expected);
  });

  it.each([
    ["UAE", "global"],
    ["Saudi Arabia", "global"],
    ["Qatar", "global"],
    ["United States", "global"],
    ["United Kingdom", "global"],
    ["Germany", "global"],
    ["Japan", "global"],
    ["South Korea", "global"],
  ])("%s → 'global'", (country, expected) => {
    expect(getTierForCountry(country)).toBe(expected);
  });

  it("returns null for an unrecognised country", () => {
    expect(getTierForCountry("Narnia")).toBeNull();
    expect(getTierForCountry("Atlantis")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(getTierForCountry("")).toBeNull();
  });
});

// ── DURATION_CLASSES ──────────────────────────────────────────────────────────

describe("DURATION_CLASSES", () => {
  it("1-month → 4 classes", () => expect(DURATION_CLASSES[1]).toBe(4));
  it("3-month → 12 classes", () => expect(DURATION_CLASSES[3]).toBe(12));
  it("6-month → 24 classes", () => expect(DURATION_CLASSES[6]).toBe(24));

  it("classes increase proportionally with duration", () => {
    // 3-month has exactly 3× the classes of 1-month
    expect(DURATION_CLASSES[3]).toBe(DURATION_CLASSES[1] * 3);
    // 6-month has exactly 6× the classes of 1-month
    expect(DURATION_CLASSES[6]).toBe(DURATION_CLASSES[1] * 6);
  });
});

// ── tierPrices ────────────────────────────────────────────────────────────────

describe("tierPrices", () => {
  it("all amounts are positive numbers", () => {
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    const durs = [1, 3, 6] as const;
    for (const t of tiers) {
      for (const ct of types) {
        for (const d of durs) {
          expect(tierPrices[t][ct][d]).toBeGreaterThan(0);
        }
      }
    }
  });

  it("global group prices exceed regional, which exceed local", () => {
    for (const dur of [1, 3, 6] as const) {
      expect(tierPrices.regional.group[dur]).toBeGreaterThan(tierPrices.local.group[dur]);
      expect(tierPrices.global.group[dur]).toBeGreaterThan(tierPrices.regional.group[dur]);
    }
  });

  it("matches the amounts from getStripePrice", () => {
    // tierPrices is derived from the same priceMap — values must be identical
    const tiers = ["local", "regional", "global"] as const;
    const types = ["group", "private"] as const;
    const durs = [1, 3, 6] as const;
    for (const t of tiers) {
      for (const ct of types) {
        for (const d of durs) {
          expect(tierPrices[t][ct][d]).toBe(getStripePrice(t, ct, d)!.amount);
        }
      }
    }
  });
});

// ── tierCountries ─────────────────────────────────────────────────────────────

describe("tierCountries", () => {
  it("Egypt is in local tier", () => {
    expect(tierCountries.local).toContain("Egypt");
  });

  it("Malaysia is in regional tier", () => {
    expect(tierCountries.regional).toContain("Malaysia");
  });

  it("UAE is in global tier", () => {
    expect(tierCountries.global).toContain("UAE");
  });

  it("no country appears in more than one tier", () => {
    const all = [...tierCountries.local, ...tierCountries.regional, ...tierCountries.global];
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  it("every tier has at least one country", () => {
    expect(tierCountries.local.length).toBeGreaterThan(0);
    expect(tierCountries.regional.length).toBeGreaterThan(0);
    expect(tierCountries.global.length).toBeGreaterThan(0);
  });
});
