import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /**
   * Pass an Arabic-language URL when this page has an Arabic equivalent.
   * Emits hreflang="ar" + hreflang="x-default" link tags for Google.
   * If omitted, no hreflang tags are emitted (correct for pages with no AR pair).
   */
  hreflangAr?: string;
}

const BASE_URL = "https://kloversegy.com";
const SITE_NAME = "Klovers | Korean Lovers Academy";
const DEFAULT_IMAGE = `${BASE_URL}/klovers-logo.jpg`;
const DEFAULT_DESC =
  "Learn Korean online with Klovers — Korean Lovers Academy. Interactive lessons, games, placement tests, and certified instructors.";

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
    const fullTitle = `${title} | Klovers`;

    // Title
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta") as HTMLMetaElement;
        const match = selector.match(/\[([^\]="]+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Robots (noindex for private pages)
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) robotsMeta.setAttribute("content", noindex ? "noindex, nofollow" : "index, follow");

    // Standard meta
    setMeta('meta[name="description"]', "content", description);

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:image"]', "content", ogImage);
    if (canonical) setMeta('meta[property="og:url"]', "content", canonical);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    // Canonical — always set to current page URL (or explicit override)
    const canonicalHref = canonical || `${BASE_URL}${window.location.pathname}`;
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalHref;

    // og:url always matches canonical
    setMeta('meta[property="og:url"]', "content", canonicalHref);

    // hreflang — emit only when an Arabic pair URL is provided
    const hreflangEls: HTMLLinkElement[] = [];
    if (hreflangAr) {
      const createHreflang = (lang: string, href: string) => {
        const el = document.createElement("link");
        el.rel = "alternate";
        el.setAttribute("hreflang", lang);
        el.href = href;
        document.head.appendChild(el);
        hreflangEls.push(el);
      };
      createHreflang("en", canonicalHref);
      createHreflang("ar", hreflangAr);
      createHreflang("x-default", canonicalHref);
    }

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = SITE_NAME;
      setMeta('meta[name="description"]', "content", DEFAULT_DESC);
      hreflangEls.forEach(el => el.remove());
    };
  }, [title, description, canonical, ogImage, type, hreflangAr]);
};
