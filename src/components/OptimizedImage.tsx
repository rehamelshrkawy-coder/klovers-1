import { useState } from "react";
import { AlertCircle } from "lucide-react";

const SRCSET_WIDTHS_FULL = [320, 480, 640, 828, 1080, 1200, 1920];
const SRCSET_WIDTHS_CARD = [320, 480, 640, 828];

/**
 * Vercel's built-in image optimizer. The `images` block in vercel.json
 * configures this endpoint — but nothing ever requested a `/_vercel/image`
 * URL, so that whole configuration block was inert and every local image was
 * served at full size in its original format.
 *
 * Only used in the browser on the deployed origin: in dev, and during the
 * prerender pass, the endpoint does not exist.
 */
function vercelImageUrl(src: string, width: number, quality: number): string {
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

const canUseVercelOptimizer =
  typeof window !== "undefined" && !/^(localhost|127\.|0\.0\.0\.0)/.test(window.location.hostname);

function optimizedUrl(src: string, width: number, quality = 75): string {
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    // Local asset (/hero-korean.jpg, /assets/...). Hand it to Vercel's
    // optimizer so it gets resized and served as AVIF/WebP.
    if (src.startsWith("/") && canUseVercelOptimizer) {
      return vercelImageUrl(src, width, quality);
    }
    return src;
  }
  // Unsplash supports native resizing via URL params
  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));
    url.searchParams.set("auto", "format");
    return url.toString();
  }
  // Supabase Storage image transform API
  if (src.includes(".supabase.co/storage/v1/object/public/")) {
    const transformed = src.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const url = new URL(transformed);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(quality));
    url.searchParams.set("format", "webp");
    return url.toString();
  }
  return src;
}

function buildSrcSet(src: string, quality = 75, isCard = false): string {
  const widths = isCard ? SRCSET_WIDTHS_CARD : SRCSET_WIDTHS_FULL;
  return widths.map((w) => `${optimizedUrl(src, w, quality)} ${w}w`).join(", ");
}

/**
 * Intrinsic dimensions for the `width`/`height` attributes.
 *
 * These do not size the image — CSS does that — but without them the browser
 * cannot reserve space before the bytes arrive, so every image on the site
 * pushed the layout down as it loaded. The numbers only need the right
 * aspect ratio, which is fixed here by the variant's own CSS class
 * (`aspect-[16/9]` for heroes, `aspect-video` for cards).
 */
const INTRINSIC = {
  hero: { width: 1200, height: 675 },  // 16:9
  card: { width: 640, height: 360 },   // 16:9
} as const;

interface OptimizedImageProps {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
  figureClassName?: string;
  isHero?: boolean;
  fallbackEmoji?: string;
  variant?: "hero" | "card";
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const DEFAULT_SIZES_HERO = "(max-width: 768px) 100vw, 720px";
const DEFAULT_SIZES_CARD = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

const OptimizedImage = ({
  src,
  alt,
  caption,
  className = "w-full object-cover",
  figureClassName = "mb-8 -mx-4 sm:mx-0",
  isHero = false,
  fallbackEmoji = "📖",
  variant,
  priority = false,
  sizes,
  quality = 75,
}: OptimizedImageProps) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isCard = variant === "card";
  const effectiveIsHero = variant === "hero" || (!variant && isHero);

  const effectiveSizes =
    sizes || (isCard ? DEFAULT_SIZES_CARD : effectiveIsHero ? DEFAULT_SIZES_HERO : DEFAULT_SIZES_HERO);

  const isValidUrl = src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"));

  // Fallback UI for missing/broken images
  const fallbackContent = (
    <div
      className={`
        w-full flex items-center justify-center
        ${effectiveIsHero ? "aspect-[16/9] rounded-none sm:rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border" : "aspect-video bg-gradient-to-br from-muted/50 to-muted/20"}
        ${className}
      `}
    >
      <div className="text-center">
        {imgError && !isCard ? (
          <>
            <AlertCircle className="h-12 w-12 mx-auto text-destructive/50 mb-2" />
            <p className="text-xs text-muted-foreground">Image unavailable</p>
          </>
        ) : (
          <span className="text-5xl">{fallbackEmoji}</span>
        )}
      </div>
    </div>
  );

  if (!isValidUrl || imgError) {
    if (isCard) {
      return fallbackContent;
    }
    return (
      <figure className={figureClassName}>
        {fallbackContent}
        {caption && (
          <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  const imgElement = (
    <div className={`relative overflow-hidden ${effectiveIsHero ? "rounded-none sm:rounded-2xl" : "rounded-xl"}`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-muted animate-pulse ${effectiveIsHero ? "aspect-[16/9]" : "aspect-video"}`} />
      )}
      <img
        src={optimizedUrl(src!, effectiveIsHero ? 1200 : 640, quality)}
        srcSet={buildSrcSet(src!, quality, isCard)}
        sizes={effectiveSizes}
        alt={alt}
        /* Reserve the space before the bytes land — see INTRINSIC above. */
        width={effectiveIsHero ? INTRINSIC.hero.width : INTRINSIC.card.width}
        height={effectiveIsHero ? INTRINSIC.hero.height : INTRINSIC.card.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        referrerPolicy="no-referrer"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className={`
          ${className}
          ${effectiveIsHero ? "rounded-none sm:rounded-2xl aspect-[16/9] shadow-md" : "rounded-xl shadow-md"}
          ${isLoading ? "opacity-0" : "opacity-100"}
          transition-opacity duration-300
        `}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );

  if (isCard) {
    return imgElement;
  }

  return (
    <figure className={figureClassName}>
      {imgElement}
      {caption && (
        <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default OptimizedImage;
