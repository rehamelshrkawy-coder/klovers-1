import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("k-lovers-lang");
    return (saved === "ar" ? "ar" : "en") as Language;
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("k-lovers-lang", language);
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  const resolve = (sectionOrPath: string, key?: string): any => {
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
  };

  const t = (sectionOrPath: string, key?: string): string => {
    const result = resolve(sectionOrPath, key);
    return typeof result === "string" ? result : (key ?? sectionOrPath);
  };

  const tArray = (sectionOrPath: string, key?: string): any[] => {
    const result = resolve(sectionOrPath, key);
    return Array.isArray(result) ? result : [];
  };

  const tInterpolate = (template: string, vars: Record<string, string | number>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
    );
  };

  const tPlural = (
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
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, tArray, tPlural, tInterpolate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
