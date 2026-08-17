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
function getPluralCategory(count: number, lang: Language): PluralCategory {
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

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (sectionOrPath: string, key?: string) => string;
  tArray: (sectionOrPath: string, key?: string) => any[];
  /**
   * Pluralization-aware translation.
   * The translation value must be an object with CLDR plural keys.
   * Supports {count} and any other {variable} interpolation.
   *
   * Example translation:
   *   { lessons: { one: "{count} lesson", other: "{count} lessons" } }
   * Usage:
   *   tPlural("lessons", 5) → "5 lessons"
   */
  tPlural: (
    sectionOrPath: string,
    count: number,
    vars?: Record<string, string | number>
  ) => string;
  /**
   * Interpolate `{variable}` placeholders in a translated string.
   * Usage: tInterpolate(t("greeting"), { name: "أحمد" })
   */
  tInterpolate: (template: string, vars: Record<string, string | number>) => string;
  /** Sets the language explicitly (the toggle is the two-value case of this). */
  setLanguage: (lang: Language) => void;
}

const LANG_STORAGE_KEY = "k-lovers-lang";

const isLanguage = (v: unknown): v is Language => v === "en" || v === "ar";

/**
 * URL first, saved preference second, English last.
 *
 * The URL has to win: the site's hreflang annotation points Google at
 * `/?lang=ar` and every WhatsApp campaign link carries the same parameter.
 * While nothing read it, the Arabic site could not be indexed, linked or
 * shared — an Arabic reader following an Arabic ad landed on English.
 *
 * Kept in sync with the pre-paint script in index.html, which applies the
 * same resolution to <html dir/lang> so there is no LTR flash.
 */
export function resolveInitialLanguage(
  search: string,
  stored: string | null,
): Language {
  const fromUrl = new URLSearchParams(search).get("lang");
  if (isLanguage(fromUrl)) return fromUrl;
  if (isLanguage(stored)) return stored;
  return "en";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations } from "@/i18n/translations";
import { syncAdminLanguage } from "@/i18n/config";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(LANG_STORAGE_KEY); } catch { /* private mode */ }
    return resolveInitialLanguage(window.location.search, stored);
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    try { localStorage.setItem(LANG_STORAGE_KEY, language); } catch { /* private mode */ }

    // The admin panel runs on i18next rather than this context. Keep the two
    // in step so its Arabic strings are actually reachable.
    syncAdminLanguage(language);

    // Write the choice back into the URL so the page is linkable and
    // shareable in the language the reader is actually looking at.
    // replaceState, not pushState: switching language should not add a
    // history entry that Back has to walk through.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("lang") !== language) {
        url.searchParams.set("lang", language);
        window.history.replaceState(window.history.state, "", url.toString());
      }
    } catch { /* Non-fatal: the language still applies. */ }
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

  /**
   * Every interpolated string in the corpus uses single braces — `{count}`,
   * `{name}`, `{days}`. The regex required `{{name}}`, so this function
   * matched nothing it was ever given: a guaranteed no-op waiting for the
   * next developer to trip over.
   */
  const tInterpolate = useCallback((template: string, vars: Record<string, string | number>): string => {
    return template.replace(/\{(\w+)\}/g, (whole, key) =>
      vars[key] !== undefined ? String(vars[key]) : whole
    );
  }, []);

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
    () => ({ language, toggleLanguage, setLanguage, t, tArray, tPlural, tInterpolate }),
    [language, toggleLanguage, setLanguage, t, tArray, tPlural, tInterpolate],
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
