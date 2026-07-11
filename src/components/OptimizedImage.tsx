import { useState } from "react";
import { AlertCircle } from "lucide-react";

const SRCSET_WIDTHS_FULL = [320, 480, 640, 828, 1080, 1200, 1920];
const SRCSET_WIDTHS_CARD = [320, 480, 640, 828];

function optimizedUrl(src: string, width: number, quality = 75): string {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return src;
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
