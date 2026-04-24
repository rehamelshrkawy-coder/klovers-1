import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps Korean text in a <span lang="ko"> element.
 *
 * Why this matters:
 * - Screen readers use lang to select the correct TTS voice engine
 * - Browsers apply the correct font-kerning rules for Hangul glyphs
 * - Google's language detection for rich results is more reliable
 *
 * Usage:
 *   <Korean>안녕하세요</Korean>
 *   <Korean className="text-2xl font-bold">{word.korean}</Korean>
 */
const Korean = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      lang="ko"
      className={cn("font-korean", className)}
      {...props}
    >
      {children}
    </span>
  )
);

Korean.displayName = "Korean";

export default Korean;
