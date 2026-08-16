import { createContext, useCallback, useContext, useState, useEffect, useMemo, ReactNode } from "react";

type Language = "en" | "ar";

/** CLDR plural categories (subset used in this app) */
type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * Returns the CLDR plural category for `count` in the given language.
 *
 * English: one → 1, other → everything else
 * Arabic:  zero → 0, one → 1, two → 2, few → 3-10, many → 11-99, other → 100+
 * (Arabic has 6 plural forms — the richest plural system of any major language.)
 */
export function getPluralCategory(count: number, lang: Language): PluralCategory {
  if (lang === "ar") {
    if (count === 0) return "zero";
    if (count === 1) return "one";
    if (count === 2) return "two";
    if (count >= 3 && count <= 10) return "few";
    if (count >= 11 && count <= 99) return "many";
    return "other";
  }
  // English (and fallback for other languages)
  return count === 1 ? "one" : "other";
}

/**
 * Interpolate `{name}` / `{{name}}` placeholders in a translated string.
 *
 * Exported as a plain function so tests exercise the code that actually ships.
 * The regex used to match `{{name}}` only, while all 29 interpolated strings in
 * both locales are written with single braces — zero overlap, so this was a
 * no-op on 100% of the corpus, and the one caller that did interpolate had to
 * hand-roll `.replace()`.
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{?(\w+)\}?\}/g, (match, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : match
  );
}

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (sectionOrPath: string, key?: string) => string;
  tArray: (sectionOrPath: string, key?: string) => any[];
  /**
   * Pluralization-aware translation.
   * The translation value must be an object with CLDR plural keys.
   * Supports {{count}} and any other {{variable}} interpolation.
   *
   * Example translation:
   *   { lessons: { one: "{{count}} lesson", other: "{{count}} lessons" } }
   * Usage:
   *   tPlural("lessons", 5) → "5 lessons"
   */
  tPlural: (
    sectionOrPath: string,
    count: number,
    vars?: Record<string, string | number>
  ) => string;
  /**
   * Interpolate `{{variable}}` placeholders in a translated string.
   * Usage: tInterpolate(t("greeting"), { name: "أحمد" })
   */
  tInterpolate: (template: string, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations } from "@/i18n/translations";

const STORAGE_KEY = "k-lovers-lang";

/**
 * Resolve the initial language.
 *
 * Order: explicit `?lang=` in the URL, then the visitor's saved choice, then
 * the browser's own preference. The URL comes first because it is the only
 * representation of language that can be linked, shared, crawled or campaigned
 * against — the site publishes `hreflang="ar" -> /?lang=ar` and, until this
 * read existed, that URL served the English page.
 */
function initialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "ar" || fromUrl === "en") return fromUrl;
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
  if (saved === "ar" || saved === "en") return saved;
  return typeof navigator !== "undefined" && navigator.language?.startsWith("ar") ? "ar" : "en";
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    const isAr = language === "ar";
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.documentElement.lang = language;
    try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Storage is optional. */ }

    // Keep the URL honest about the current language so the page can be
    // linked, shared and indexed, and so `og:locale` / `hreflang` describe
    // something real. Replaces rather than pushes: switching language is not
    // a navigation the back button should have to undo.
    const url = new URL(window.location.href);
    const current = url.searchParams.get("lang");
    if (isAr && current !== "ar") {
      url.searchParams.set("lang", "ar");
      window.history.replaceState(null, "", url.toString());
    } else if (!isAr && current !== null) {
      url.searchParams.delete("lang");
      window.history.replaceState(null, "", url.toString());
    }

    // Social previews are scraped from the served HTML, so these have to be
    // updated for the crawler that follows an ?lang=ar link.
    document
      .querySelector('meta[property="og:locale"]')
      ?.setAttribute("content", isAr ? "ar_EG" : "en_US");
    document
      .querySelector('meta[property="og:locale:alternate"]')
      ?.setAttribute("content", isAr ? "en_US" : "ar_EG");
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const resolve = useCallback((sectionOrPath: string, key?: string): any => {
    let allKeys: string[];
    if (key !== undefined) {
      // Legacy: t("section", "nested.key")
      allKeys = [sectionOrPath, ...key.split(".")];
    } else {
      // New: t("section.nested.key")
      allKeys = sectionOrPath.split(".");
    }
    let result: any = translations[language] as any;
    for (const k of allKeys) {
      result = result?.[k];
    }
    return result;
  }, [language]);

  const t = useCallback((sectionOrPath: string, key?: string): string => {
    const result = resolve(sectionOrPath, key);
    return typeof result === "string" ? result : (key ?? sectionOrPath);
  }, [resolve]);

  const tArray = useCallback((sectionOrPath: string, key?: string): any[] => {
    const result = resolve(sectionOrPath, key);
    return Array.isArray(result) ? result : [];
  }, [resolve]);

  const tInterpolate = useCallback(interpolate, []);

  const tPlural = useCallback((
    sectionOrPath: string,
    count: number,
    vars?: Record<string, string | number>
  ): string => {
    const pluralObj = resolve(sectionOrPath);
    if (typeof pluralObj !== "object" || pluralObj === null) {
      return sectionOrPath; // Fallback to key if shape is wrong
    }
    const category = getPluralCategory(count, language);
    // Walk through CLDR categories in priority order, falling back to "other"
    const categories: PluralCategory[] = [category, "other", "many", "few", "one"];
    let template = "";
    for (const cat of categories) {
      if (typeof pluralObj[cat] === "string") {
        template = pluralObj[cat];
        break;
      }
    }
    if (!template) return sectionOrPath;
    return tInterpolate(template, { count, ...vars });
  }, [language, resolve, tInterpolate]);

  const value = useMemo(
    () => ({ language, toggleLanguage, t, tArray, tPlural, tInterpolate }),
    [language, toggleLanguage, t, tArray, tPlural, tInterpolate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
