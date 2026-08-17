import { describe, it, expect } from "vitest";
import { translations } from "../translations";

/** CLDR plural categories. Arabic legitimately carries more of them than English. */
const PLURAL_CATEGORIES = new Set(["zero", "one", "two", "few", "many", "other"]);

/** Every leaf path in an object, dotted. Arrays are indexed. */
function paths(node: unknown, prefix = ""): string[] {
  if (node === null || typeof node !== "object") return [prefix];
  if (Array.isArray(node)) {
    return node.flatMap((v, i) => paths(v, `${prefix}[${i}]`));
  }
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    paths(v, prefix ? `${prefix}.${k}` : k),
  );
}

const enPaths = paths(translations.en);
const arPaths = paths(translations.ar);
const enSet = new Set(enPaths);
const arSet = new Set(arPaths);

/**
 * A path is an extra plural form when its last segment is a CLDR category
 * that English does not have. Arabic has six forms, English two, so
 * `zero`/`two`/`few`/`many` may legitimately exist only in Arabic.
 */
const isExtraPluralForm = (p: string) => {
  const last = p.split(".").pop() ?? "";
  return PLURAL_CATEGORIES.has(last) && last !== "one" && last !== "other";
};

describe("EN/AR translation parity", () => {
  it("every English key has an Arabic sibling at the same path", () => {
    const missing = enPaths.filter((p) => !arSet.has(p));
    expect(missing).toEqual([]);
  });

  it("Arabic has no keys English lacks, except extra CLDR plural forms", () => {
    const extra = arPaths.filter((p) => !enSet.has(p) && !isExtraPluralForm(p));
    expect(extra).toEqual([]);
  });

  it("no translated value is an empty string", () => {
    const emptyIn = (lang: "en" | "ar") =>
      paths(translations[lang]).filter((p) => {
        const value = p
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .reduce<any>((acc, k) => acc?.[k], translations[lang]);
        return typeof value === "string" && value.trim() === "";
      });
    expect({ en: emptyIn("en"), ar: emptyIn("ar") }).toEqual({ en: [], ar: [] });
  });
});

describe("interpolation placeholders", () => {
  /**
   * The engine substitutes single-brace `{name}`. A double-brace `{{name}}`
   * would survive interpolation and render literally to the user.
   */
  it("uses single-brace placeholders everywhere", () => {
    const offenders: string[] = [];
    for (const lang of ["en", "ar"] as const) {
      for (const p of paths(translations[lang])) {
        const value = p
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .reduce<any>((acc, k) => acc?.[k], translations[lang]);
        if (typeof value === "string" && /\{\{\w+\}\}/.test(value)) {
          offenders.push(`${lang}.${p}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("EN and AR agree on which variables each string interpolates", () => {
    const varsOf = (s: string) =>
      [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    const read = (lang: "en" | "ar", p: string) =>
      p.replace(/\[(\d+)\]/g, ".$1").split(".").reduce<any>((acc, k) => acc?.[k], translations[lang]);

    const mismatched: string[] = [];
    for (const p of enPaths) {
      // CLDR plural forms are exempt. Arabic's `zero`/`one`/`two` forms spell
      // the quantity as a word ("مكانان متبقيان"), so they legitimately carry
      // no {count} where the English `one` form does.
      const last = p.split(".").pop() ?? "";
      if (PLURAL_CATEGORIES.has(last)) continue;

      const en = read("en", p);
      const ar = read("ar", p);
      if (typeof en !== "string" || typeof ar !== "string") continue;
      if (varsOf(en) !== varsOf(ar)) mismatched.push(`${p} — en:{${varsOf(en)}} ar:{${varsOf(ar)}}`);
    }
    expect(mismatched).toEqual([]);
  });
});

describe("Arabic numerals", () => {
  /**
   * The corpus is overwhelmingly Western-digit. A handful of Arabic-Indic
   * strings put two numeral systems metres apart in the same row of the hero.
   */
  it("uses Western digits, not Arabic-Indic", () => {
    const offenders: string[] = [];
    for (const p of arPaths) {
      const value = p
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .reduce<any>((acc, k) => acc?.[k], translations.ar);
      if (typeof value === "string" && /[٠-٩۰-۹]/.test(value)) {
        offenders.push(`ar.${p} — ${value}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses the ASCII percent sign, not ٪", () => {
    const offenders = arPaths.filter((p) => {
      const value = p
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .reduce<any>((acc, k) => acc?.[k], translations.ar);
      return typeof value === "string" && value.includes("٪");
    });
    expect(offenders).toEqual([]);
  });
});
