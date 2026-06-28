import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** Arabic-language equivalent URL, when one exists. */
  hreflangAr?: string;
}

const BASE_URL = "https://kloversegy.com";
const SITE_NAME = "Klovers | Korean Lovers Academy";
const DEFAULT_IMAGE = `${BASE_URL}/hero-korean.jpg`;
const DEFAULT_DESC =
  "Learn Korean online with Klovers — Korean Lovers Academy. Interactive lessons, games, placement tests, and certified instructors.";

const absoluteUrl = (value: string) => new URL(value, BASE_URL).toString();
const pageTitle = (title: string) =>
  /\|\s*Klovers\b/i.test(title) ? title : `${title} | Klovers`;

export const useSEO = ({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  hreflangAr,
}: SEOProps) => {
  useEffect(() => {
    const fullTitle = pageTitle(title.trim());
    const canonicalHref = absoluteUrl(canonical || window.location.pathname);
    const imageUrl = absoluteUrl(ogImage);
    const imageAlt = `${title.replace(/\s*\|.*$/, "")} — Klovers Korean Lovers Academy`;

    const setMeta = (selector: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        const match = selector.match(/\[([^\]="]+)="([^"]+)"\]/);
        if (match) element.setAttribute(match[1], match[2]);
        document.head.appendChild(element);
      }
      element.content = value;
    };

    document.title = fullTitle;
    setMeta('meta[name="description"]', description);
    setMeta(
      'meta[name="robots"]',
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );

    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:type"]', type);
    setMeta('meta[property="og:url"]', canonicalHref);
    setMeta('meta[property="og:site_name"]', "Klovers");
    setMeta('meta[property="og:locale"]', "en_US");
    setMeta('meta[property="og:image"]', imageUrl);
    setMeta('meta[property="og:image:secure_url"]', imageUrl);
    setMeta('meta[property="og:image:type"]', "image/jpeg");
    setMeta('meta[property="og:image:alt"]', imageAlt);

    setMeta('meta[name="twitter:card"]', "summary_large_image");
    setMeta('meta[name="twitter:site"]', "@kloversegy");
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', imageUrl);
    setMeta('meta[name="twitter:image:alt"]', imageAlt);

    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalElement) {
      canonicalElement = document.createElement("link");
      canonicalElement.rel = "canonical";
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = canonicalHref;

    let pageSchema = document.getElementById("page-jsonld") as HTMLScriptElement | null;
    if (!noindex) {
      if (!pageSchema) {
        pageSchema = document.createElement("script");
        pageSchema.id = "page-jsonld";
        pageSchema.type = "application/ld+json";
        document.head.appendChild(pageSchema);
      }
      pageSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": type === "article" ? "Article" : "WebPage",
        "@id": `${canonicalHref}#webpage`,
        url: canonicalHref,
        name: fullTitle,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: { "@id": `${BASE_URL}/#organization` },
        primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
      });
    } else {
      pageSchema?.remove();
    }

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove());
    const hreflangElements: HTMLLinkElement[] = [];
    if (hreflangAr) {
      const addAlternate = (language: string, href: string) => {
        const element = document.createElement("link");
        element.rel = "alternate";
        element.hreflang = language;
        element.href = absoluteUrl(href);
        document.head.appendChild(element);
        hreflangElements.push(element);
      };
      addAlternate("en", canonicalHref);
      addAlternate("ar", hreflangAr);
      addAlternate("x-default", canonicalHref);
    }

    return () => {
      document.title = SITE_NAME;
      pageSchema?.remove();
      hreflangElements.forEach((element) => element.remove());
    };
  }, [title, description, canonical, ogImage, type, noindex, hreflangAr]);
};
