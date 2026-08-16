// Shared canvas renderer — used by both CreatorHub and MarketingGeneratorPage
//
// ─── Canvas Color Constants ───
// Centralised palette for canvas rendering. New templates should reference
// these constants instead of hardcoding hex values.
const CANVAS_PALETTE = {
  brand:     "#FFFF00",
  gold:      "#EBC82E",
  black:     "#111111",
  darkBlue:  "#1a1a2e",
  white:     "#FFFFFF",
  textDark:  "#1a1a1a",
  textMid:   "#555555",
  textLight: "#888888",
  gray900:   "#222222",
  gray800:   "#333333",
  gray700:   "#444444",
  gray600:   "#555555",
  gray400:   "#888888",
  gray200:   "#e5e5e5",
  gray100:   "#f5f5f5",
  nearBlack: "#0d0d0d",
} as const;

export type PostLang = "en" | "ar";

export interface PostData {
  id: string;
  mainText: string;
  subtitle: string;
  extraText: string;
  lang?: PostLang;
}

export type TemplateName = "classic" | "character" | "minimal" | "gradient" | "neon" | "dark" | "editorial" | "klovers_bold" | "klovers_varsity" | "klovers_split" | "klovers_alert" | "klovers_countdown" | "klovers_quote" | "klovers_tip" | "klovers_mascot_left" | "klovers_mascot_right" | "klovers_stats" | "klovers_list";
export type ColorTheme = "yellow" | "midnight";
export type FormatKey = "instagram" | "story" | "facebook" | "tiktok";

export interface FormatOption { label: string; w: number; h: number; }

export const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post", w: 1080, h: 1080 },
  story:     { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook:  { label: "Facebook Post", w: 1200, h: 630 },
  tiktok:    { label: "TikTok Cover", w: 1080, h: 1920 },
};

export const THEME_COLORS: Record<ColorTheme, { bg: string; text: string; accent: string; label: string; dot: string }> = {
  yellow:   { bg: "#FFFF00", text: "#1a1a1a", accent: "#333",    label: "Classic Yellow", dot: "#FFFF00" },
  midnight: { bg: "#1a1a2e", text: "#e0e0e0", accent: "#9b87f5", label: "Midnight",       dot: "#9b87f5" },
};

export const TEMPLATE_META: { key: TemplateName; label: string; desc: string; isKlovers?: boolean }[] = [
  { key: "klovers_bold",    label: "⚡ Bold",    desc: "Attention — Yellow frame + K badge",    isKlovers: true },
  { key: "klovers_varsity", label: "🏆 Varsity", desc: "Interest — Dark typographic layout",    isKlovers: true },
  { key: "klovers_split",   label: "✂ Split",    desc: "Action — Yellow/black diagonal CTA",    isKlovers: true },
  { key: "classic",   label: "Classic Yellow", desc: "Bold yellow background" },
  { key: "character", label: "Character Art",  desc: "Illustrated overlay" },
  { key: "minimal",   label: "Minimal",        desc: "Clean with border inset" },
  { key: "gradient",  label: "Gradient",       desc: "Smooth color blend" },
  { key: "neon",      label: "Neon",           desc: "Dark with glow effects" },
  { key: "dark",      label: "Dark",           desc: "Elegant dark theme" },
  { key: "editorial", label: "Editorial",      desc: "Magazine-style layout" },
  { key: "klovers_alert",     label: "🔴 Alert",     desc: "Urgency — Seat counter card",        isKlovers: true },
  { key: "klovers_countdown", label: "⏳ Countdown", desc: "Urgency — Days-left countdown ring",  isKlovers: true },
  { key: "klovers_quote",     label: "💬 Quote",     desc: "Social proof — Testimonial card",     isKlovers: true },
  { key: "klovers_tip",       label: "💡 Tip",       desc: "Engagement — Educational tip card",   isKlovers: true },
  { key: "klovers_mascot_left",  label: "🧑‍🎓 Mascot L", desc: "Characters left — text right",       isKlovers: true },
  { key: "klovers_mascot_right", label: "🧑‍🎓 Mascot R", desc: "Text left — characters right",       isKlovers: true },
  { key: "klovers_stats",        label: "📊 Stats",    desc: "Large number + label — social proof", isKlovers: true },
  { key: "klovers_list",         label: "📋 List",     desc: "Numbered list — tips & reasons",       isKlovers: true },
];

// ─── Canvas Helpers ───

export function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + rw - r, y);
  ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
  ctx.lineTo(x + rw, y + rh - r);
  ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
  ctx.lineTo(x + r, y + rh);
  ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 99) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
}

// ─── Arabic / RTL Helpers ─────────────────────────────────────────────────────

const FONT_AR = "'Tahoma', 'Arial', 'Segoe UI', sans-serif";
const FONT_EN = "'Inter', 'Segoe UI', sans-serif";

export function fontStack(lang: PostLang, weight: number | string = 400, size: number = 16): string {
  const w = typeof weight === "number" ? weight : parseInt(weight) || 400;
  const family = lang === "ar" ? FONT_AR : FONT_EN;
  return `${w} ${size}px ${family}`;
}

/** Arabic brand text equivalents */
export const AR_TEXT = {
  brandName: "أكاديمية كلوفرز الكورية",
  brandShort: "كلوفرز",
  koreanCourse: "كورس كوري",
  registerNow: "سجّل الآن ←",
  seatsLeft: "مقاعد متبقية",
  daysLeft: "يوم متبقي",
  didYouKnow: "هل تعلم؟",
  enrollToday: "سجّل اليوم",
  hashtags: "#تعلم_الكورية #كلوفرز #كورس_كوري",
};

export function wrapTextRTL(ctx: CanvasRenderingContext2D, text: string, rightX: number, y: number, maxW: number, lineH: number, maxLines = 99) {
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, rightX, y + i * lineH));
  ctx.restore();
}

/** Draws text using the correct direction based on language */
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number, lang: PostLang, w: number) {
  if (lang === "ar") {
    wrapTextRTL(ctx, text, w - (w - x - maxW) , y, maxW, lineH, maxLines);
  } else {
    wrapText(ctx, text, x, y, maxW, lineH, maxLines);
  }
}

// ─── Accent Word Highlighting (*asterisk* markup) ─────────────────────────────

interface AccentWord { text: string; accent: boolean; }

/** Parse "*accent*" markup into segments: "LEARN *KOREAN* TODAY" → [{text:"LEARN ",accent:false},{text:"KOREAN",accent:true},{text:" TODAY",accent:false}] */
function parseAccentSegments(text: string): AccentWord[] {
  const segments: AccentWord[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), accent: false });
    segments.push({ text: m[1], accent: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), accent: false });
  return segments.length ? segments : [{ text, accent: false }];
}

/** Strip asterisk markers for width measurement */
function stripAccent(text: string): string { return text.replace(/\*([^*]+)\*/g, "$1"); }

/** Word-wrap text with accent coloring. Renders word-by-word, switching fillStyle for *accent* words. */
function wrapTextAccent(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number, baseColor: string, accentColor: string) {
  const plain = stripAccent(text);
  const words = plain.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());

  // Build accent map: which character ranges are accented
  const segments = parseAccentSegments(text);
  const accentChars = new Set<number>();
  let ci = 0;
  for (const seg of segments) {
    if (seg.accent) for (let i = 0; i < seg.text.length; i++) accentChars.add(ci + i);
    ci += seg.text.length;
  }

  // Render each line word-by-word
  let charIdx = 0;
  lines.slice(0, maxLines).forEach((lineText, li) => {
    let cx = x;
    const lineWords = lineText.split(" ");
    for (let wi = 0; wi < lineWords.length; wi++) {
      const w = lineWords[wi];
      const isAccent = accentChars.has(charIdx);
      ctx.fillStyle = isAccent ? accentColor : baseColor;
      ctx.fillText(w, cx, y + li * lineH);
      cx += ctx.measureText(w + " ").width;
      charIdx += w.length + 1; // +1 for space
    }
  });
}

/** RTL version of accent word rendering */
function wrapTextAccentRTL(ctx: CanvasRenderingContext2D, text: string, rightX: number, y: number, maxW: number, lineH: number, maxLines: number, baseColor: string, accentColor: string) {
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  const plain = stripAccent(text);
  const words = plain.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());

  const segments = parseAccentSegments(text);
  const accentChars = new Set<number>();
  let ci = 0;
  for (const seg of segments) {
    if (seg.accent) for (let i = 0; i < seg.text.length; i++) accentChars.add(ci + i);
    ci += seg.text.length;
  }

  let charIdx = 0;
  lines.slice(0, maxLines).forEach((lineText, li) => {
    let cx = rightX;
    const lineWords = lineText.split(" ");
    for (let wi = 0; wi < lineWords.length; wi++) {
      const w = lineWords[wi];
      const isAccent = accentChars.has(charIdx);
      ctx.fillStyle = isAccent ? accentColor : baseColor;
      ctx.fillText(w, cx, y + li * lineH);
      cx -= ctx.measureText(w + " ").width;
      charIdx += w.length + 1;
    }
  });
  ctx.restore();
}

/** Draws text with optional accent coloring. Falls back to plain drawText if no accent markers. */
function drawTextAccent(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number, lang: PostLang, w: number, baseColor: string, accentColor?: string) {
  if (accentColor && text.includes("*")) {
    ctx.fillStyle = baseColor;
    if (lang === "ar") {
      wrapTextAccentRTL(ctx, text, w - (w - x - maxW), y, maxW, lineH, maxLines, baseColor, accentColor);
    } else {
      wrapTextAccent(ctx, text, x, y, maxW, lineH, maxLines, baseColor, accentColor);
    }
  } else {
    const clean = stripAccent(text);
    ctx.fillStyle = baseColor;
    drawText(ctx, clean, x, y, maxW, lineH, maxLines, lang, w);
  }
}

function ctaText(lang: PostLang, useWhatsApp = false): string {
  if (useWhatsApp) return "Chat on WhatsApp →";
  return lang === "ar" ? AR_TEXT.registerNow : "Register Now →";
}
function courseLabel(lang: PostLang): string { return lang === "ar" ? AR_TEXT.koreanCourse : "KOREAN COURSE"; }
function brandLabel(lang: PostLang): string { return lang === "ar" ? AR_TEXT.brandName : "KLOVERS KOREAN ACADEMY"; }
function enrollLabel(lang: PostLang): string { return lang === "ar" ? AR_TEXT.enrollToday : "ENROLL TODAY"; }

// ─── Placement Result Card ────────────────────────────────────────────────────

export interface PlacementCardData {
  levelEmoji: string;
  levelLabel: string;
  tagline: string;
  score: number;
  total: number;
}

/**
 * Draws a 1080×1080 branded result card onto the provided canvas.
 * Call canvas.toDataURL('image/png') afterwards to get the download URL.
 */
export function drawPlacementCard(canvas: HTMLCanvasElement, data: PlacementCardData): void {
  const W = 1080, H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#EBC82E";
  ctx.fillRect(0, 0, W, H);

  // Inner white panel
  ctx.fillStyle = "#ffffff";
  rRect(ctx, 60, 60, W - 120, H - 120, 40);
  ctx.fill();

  // Top accent bar
  ctx.fillStyle = "#EBC82E";
  rRect(ctx, 60, 60, W - 120, 160, 40);
  ctx.fill();
  ctx.fillStyle = "#EBC82E";
  ctx.fillRect(60, 160, W - 120, 40);

  // "K" logo circle (top-left)
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(160, 140, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#EBC82E";
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("K", 160, 144);

  // Brand name (top-right area)
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("KLOVERS", W - 100, 120);
  ctx.font = "24px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#333333";
  ctx.fillText("Korean Academy", W - 100, 162);

  // Emoji (large, centered)
  ctx.font = "160px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.levelEmoji, W / 2, 380);

  // Level label pill
  ctx.fillStyle = "#1a1a1a";
  rRect(ctx, 180, 490, W - 360, 90, 45);
  ctx.fill();
  ctx.fillStyle = "#EBC82E";
  ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.levelLabel, W / 2, 535);

  // Tagline
  ctx.fillStyle = "#444444";
  ctx.font = "32px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(data.tagline, W / 2, 610);

  // Score badge
  ctx.fillStyle = "#f5f5f5";
  rRect(ctx, W / 2 - 140, 680, 280, 90, 20);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`${data.score} / ${data.total}`, W / 2, 725);
  ctx.font = "26px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText("TOPIK-aligned score", W / 2, 800);

  // Divider
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(160, 860);
  ctx.lineTo(W - 160, 860);
  ctx.stroke();

  // URL footer
  ctx.fillStyle = "#888888";
  ctx.font = "28px system-ui, -apple-system, sans-serif";
  ctx.fillText("kloversegy.com/placement-test", W / 2, 920);
}

// ─── Placement Certificate (landscape 1200×850) ───────────────────────────────

export interface PlacementCertificateData {
  levelEmoji: string;
  levelLabel: string;
  tagline: string;
  score: number;
  total: number;
  date: string;
}

/**
 * Draws a landscape 1200×850 "Certificate of Language Assessment" onto the provided canvas.
 */
export function drawPlacementCertificate(canvas: HTMLCanvasElement, data: PlacementCertificateData): void {
  const W = 1200, H = 850;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Gold header bar
  ctx.fillStyle = "#EBC82E";
  ctx.fillRect(0, 0, W, 120);

  // Gold footer bar
  ctx.fillStyle = "#EBC82E";
  ctx.fillRect(0, H - 80, W, 80);

  // Gold left accent strip
  ctx.fillStyle = "#EBC82E";
  ctx.fillRect(0, 0, 14, H);

  // Gold right accent strip
  ctx.fillStyle = "#EBC82E";
  ctx.fillRect(W - 14, 0, 14, H);

  // "K" logo circle (header, left side)
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(80, 60, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#EBC82E";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("K", 80, 63);

  // Brand name (header)
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("KLOVERS KOREAN ACADEMY", 144, 50);
  ctx.font = "20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#333333";
  ctx.fillText("kloversegy.com", 144, 84);

  // "Certificate of Language Assessment" title
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Certificate of Language Assessment", W / 2, 154);

  // Subtitle line
  ctx.fillStyle = "#888888";
  ctx.font = "24px system-ui, -apple-system, sans-serif";
  ctx.fillText("TOPIK-Aligned · 30-Question Assessment", W / 2, 218);

  // Horizontal divider
  ctx.strokeStyle = "#EBC82E";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 268);
  ctx.lineTo(W - 100, 268);
  ctx.stroke();

  // Large level emoji
  ctx.font = "120px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.levelEmoji, W / 2, 390);

  // Level label pill
  ctx.fillStyle = "#1a1a1a";
  rRect(ctx, W / 2 - 260, 462, 520, 80, 40);
  ctx.fill();
  ctx.fillStyle = "#EBC82E";
  ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.levelLabel, W / 2, 502);

  // Tagline
  ctx.fillStyle = "#555555";
  ctx.font = "26px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(data.tagline, W / 2, 562);

  // Score badge (bottom-right)
  ctx.fillStyle = "#f5f5f5";
  rRect(ctx, W - 260, 580, 220, 100, 16);
  ctx.fill();
  ctx.strokeStyle = "#EBC82E";
  ctx.lineWidth = 3;
  rRect(ctx, W - 260, 580, 220, 100, 16);
  ctx.stroke();
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${data.score} / ${data.total}`, W - 150, 622);
  ctx.font = "18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText("Score", W - 150, 664);

  // Date (bottom-left)
  ctx.fillStyle = "#888888";
  ctx.font = "22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(data.date, 50, 630);

  // Footer URL
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("kloversegy.com/placement-test", W / 2, H - 40);
}

// ─── Photo Background Helper ─────────────────────────────────────────────────
// Draws an image as full-bleed cover with a dark gradient overlay for text readability.

function drawPhotoBg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, overlayStyle: "dark" | "dark-heavy" | "gradient-bottom" | "gradient-left" | "gradient-center" = "gradient-bottom") {
  const imgR = img.width / img.height;
  const canR = w / h;
  let dw = w, dh = h;
  if (imgR > canR) { dw = h * imgR; } else { dh = w / imgR; }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

  if (overlayStyle === "dark") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
  } else if (overlayStyle === "dark-heavy") {
    ctx.fillStyle = "rgba(0,0,0,0.68)";
    ctx.fillRect(0, 0, w, h);
  } else if (overlayStyle === "gradient-bottom") {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(0,0,0,0.15)");
    grad.addColorStop(0.4, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0.80)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (overlayStyle === "gradient-center") {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(0,0,0,0.75)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

// ─── KLOVERS BRAND DESIGNS ───────────────────────────────────────────────────
// All use fixed zone fractions so preview (270px CSS / 1080px canvas) = download (1080px canvas)

// BOLD — AIDA: ATTENTION. Stop the scroll. Maximum visual impact.
function renderKloversBold(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, _isPortrait: boolean, L: PostLang = "en", wa = false, bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const topH = Math.round(h * 0.10);
  const botH = Math.round(h * 0.18);
  const botY = h - botH;
  const hasPhoto = !!bgImage;

  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "gradient-bottom");
  } else {
    // ── Yellow background ──
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, h);

    // ── Decorative faint "K" watermark (subtle, bottom-right corner) ──
    ctx.save();
    ctx.font = `900 ${Math.round(h * 0.28)}px 'Inter', 'Segoe UI Black', sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.035)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("K", w - 12 * S, h * 0.76);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  // ── Black top bar ──
  ctx.fillStyle = hasPhoto ? "rgba(0,0,0,0.6)" : "#111111";
  ctx.fillRect(0, 0, w, topH);
  ctx.font = fontStack(L, 700, Math.round(18 * S));
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(brandLabel(L), w / 2, topH * 0.62);
  ctx.textAlign = "left";

  // ── Eyebrow zone — well below top bar ──
  const eyeY = h * 0.18;
  ctx.font = fontStack(L, 700, Math.round(14 * S));
  ctx.fillStyle = hasPhoto ? "#FFFF00" : "#111111";
  if (L === "ar") {
    ctx.save(); ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillText(courseLabel(L), w - pad, eyeY);
    ctx.restore();
    ctx.fillRect(w - pad - 36 * S, eyeY + 6 * S, 36 * S, 3 * S);
  } else {
    ctx.fillText(courseLabel(L), pad, eyeY);
    ctx.fillRect(pad, eyeY + 6 * S, 36 * S, 3 * S);
  }

  // ── K circle badge — opposite side from eyebrow ──
  const bR = 24 * S;
  const bx = L === "ar" ? pad + bR : w - pad - bR;
  const by = h * 0.18;
  ctx.fillStyle = hasPhoto ? "rgba(0,0,0,0.7)" : "#111111";
  ctx.beginPath(); ctx.arc(bx, by, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontStack("en", 900, Math.round(18 * S));
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", bx, by);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

  // ── ATTENTION: Massive headline — starts at h*0.30 with breathing room ──
  const hlMax = w - pad * 2;
  const hlSize = Math.min(80 * S, hlMax / 5.5);
  ctx.font = fontStack(L, 900, hlSize);
  ctx.fillStyle = hasPhoto ? "#ffffff" : "#111111";
  drawText(ctx, post.mainText, pad, h * 0.30, hlMax, hlSize * 1.10, 2, L, w);

  // ── Divider (FIXED) ──
  ctx.fillStyle = hasPhoto ? "#FFFF00" : "#111111";
  ctx.fillRect(L === "ar" ? w - pad - 36 * S : pad, h * 0.56, 36 * S, 3 * S);

  // ── Subtitle (FIXED zone) ──
  ctx.font = fontStack(L, 400, Math.round(22 * S));
  ctx.fillStyle = hasPhoto ? "rgba(255,255,255,0.85)" : "#222222";
  drawText(ctx, post.subtitle, pad, h * 0.61, w - pad * 2, 30 * S, 3, L, w);

  // ── Black bottom bar ──
  ctx.fillStyle = hasPhoto ? "rgba(0,0,0,0.6)" : "#111111";
  ctx.fillRect(0, botY, w, botH);

  // ── Yellow CTA pill ──
  const ctaH = 48 * S, ctaW = 200 * S;
  const ctaY = botY + (botH - ctaH) * 0.42;
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = fontStack(L, 700, Math.round(16 * S));
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(ctaText(L, wa), pad + ctaW / 2, ctaY + ctaH * 0.65);
  ctx.textAlign = "left";

  // ── Website ──
  ctx.font = fontStack("en", 400, Math.round(12 * S));
  ctx.fillStyle = "rgba(255,255,0,0.5)";
  ctx.textAlign = "right";
  ctx.fillText("kloversegy.com", w - pad, botY + botH * 0.78);
  ctx.textAlign = "left";
}

// VARSITY — AIDA: INTEREST / DESIRE. Build credibility. "What's in it for me?"
function renderKloversVarsity(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, _isPortrait: boolean, L: PostLang = "en", wa = false, bgImage?: HTMLImageElement | null) {
  const pad = 48 * S;

  if (bgImage) {
    drawPhotoBg(ctx, bgImage, w, h, "dark");
  } else {
    // ── Black background ──
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, w, h);

    // ── Subtle yellow radial glow ──
    const grd = ctx.createRadialGradient(w * 0.55, h * 0.35, 0, w * 0.55, h * 0.35, w * 0.65);
    grd.addColorStop(0, "rgba(255,220,0,0.08)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Yellow left accent bar ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, 4 * S, h);

  // ── KLOVERS eyebrow ──
  ctx.font = fontStack(L, 900, 18 * S);
  ctx.fillStyle = "#FFFF00";
  if (L === "ar") {
    ctx.save(); ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillText(AR_TEXT.brandShort, w - pad, h * 0.10);
    ctx.restore();
  } else {
    ctx.fillText("KLOVERS", pad, h * 0.10);
  }

  // ── Yellow thick rule ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(L === "ar" ? w - pad - w * 0.32 : pad, h * 0.13, w * 0.32, 3 * S);

  // ── "KOREAN COURSE" label ──
  ctx.font = fontStack(L, 400, 14 * S);
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  if (L === "ar") {
    ctx.save(); ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillText(courseLabel(L), w - pad, h * 0.19);
    ctx.restore();
  } else {
    ctx.fillText(courseLabel(L), pad, h * 0.19);
  }

  // ── INTEREST: Large white headline (FIXED start, max 2 lines) ──
  const hlSize = Math.min(68 * S, (w - pad * 2) / 6);
  ctx.font = fontStack(L, 900, hlSize);
  ctx.fillStyle = "#ffffff";
  drawText(ctx, post.mainText, pad, h * 0.29, w - pad * 2, hlSize * 1.10, 2, L, w);

  // ── Yellow divider (FIXED) ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(pad, h * 0.56, w - pad * 2, 2 * S);

  // ── Subtitle (FIXED zone) ──
  ctx.font = fontStack(L, 400, 22 * S);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  drawText(ctx, post.subtitle, pad, h * 0.62, w - pad * 2, 30 * S, 3, L, w);

  // ── Yellow bottom strip ──
  const stripH = 52 * S;
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, h - stripH, w, stripH);

  // CTA text in strip
  ctx.font = fontStack(L, 700, 18 * S);
  ctx.fillStyle = "#111111";
  if (L === "ar") {
    ctx.save(); ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillText(ctaText(L, wa), w - pad, h - stripH + stripH * 0.67);
    ctx.restore();
  } else {
    ctx.fillText(ctaText(L, wa), pad, h - stripH + stripH * 0.67);
  }

  // Website right-aligned
  ctx.font = fontStack("en", 400, 14 * S);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.textAlign = "right";
  ctx.fillText("kloversegy.com", w - pad, h - stripH + stripH * 0.67);
  ctx.textAlign = "left";
}

// SPLIT — AIDA: ACTION. Drive registration. Clear next step.
function renderKloversSplit(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, isPortrait: boolean, L: PostLang = "en", wa = false, bgImage?: HTMLImageElement | null) {
  const hasPhoto = !!bgImage;
  if (!isPortrait) {
    // Square / Landscape: yellow LEFT / black RIGHT with diagonal
    const splitX = w * 0.43;
    const slant = h * 0.08;

    if (hasPhoto) {
      drawPhotoBg(ctx, bgImage!, w, h, "dark");
      // Semi-transparent left panel
      ctx.fillStyle = "rgba(255,255,0,0.15)";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
      ctx.lineTo(splitX, h); ctx.lineTo(0, h);
      ctx.closePath(); ctx.fill();
    } else {
      // Yellow left
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
      ctx.lineTo(splitX, h); ctx.lineTo(0, h);
      ctx.closePath(); ctx.fill();

      // Black right
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.moveTo(splitX + slant, 0); ctx.lineTo(w, 0);
      ctx.lineTo(w, h); ctx.lineTo(splitX, h);
      ctx.closePath(); ctx.fill();
    }

    // Yellow diagonal accent line
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.moveTo(splitX + slant + 8 * S, 0); ctx.lineTo(splitX + 8 * S, h);
    ctx.stroke();

    // LEFT: Large K (centered)
    const lCx = splitX * 0.5;
    ctx.font = `900 ${Math.round(splitX * 0.48)}px 'Inter', sans-serif`;
    ctx.fillStyle = hasPhoto ? "rgba(255,255,255,0.15)" : "#111111";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", lCx, h * 0.40);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    // LEFT: KLOVERS label (well below K, no overlap)
    ctx.font = fontStack(L, 700, Math.round(18 * S));
    ctx.fillStyle = hasPhoto ? "#ffffff" : "#111111";
    ctx.textAlign = "center";
    ctx.fillText(L === "ar" ? AR_TEXT.brandShort : "KLOVERS", lCx, h * 0.70);
    ctx.textAlign = "left";

    // RIGHT: eyebrow
    const rLeft = splitX + slant + 22 * S;
    const rW = w - rLeft - 22 * S;
    ctx.font = fontStack(L, 600, 17 * S);
    ctx.fillStyle = "rgba(255,255,0,0.65)";
    ctx.fillText(enrollLabel(L), rLeft, h * 0.19);
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(rLeft, h * 0.21, 36 * S, 2 * S);

    // RIGHT: ACTION headline (FIXED, max 2 lines)
    const hlSize = Math.min(52 * S, rW / 5.5);
    ctx.font = fontStack(L, 900, hlSize);
    drawTextAccent(ctx, post.mainText, rLeft, h * 0.30, rW, hlSize * 1.08, 2, L, w, "#ffffff", "#FFFF00");

    // RIGHT: subtitle (FIXED zone)
    ctx.font = fontStack(L, 400, 20 * S);
    ctx.fillStyle = "rgba(255,255,0,0.80)";
    drawText(ctx, post.subtitle, rLeft, h * 0.60, rW, 27 * S, 2, L, w);

    // RIGHT: CTA pill (FIXED)
    const ctaH = 50 * S, ctaW = Math.min(rW * 0.90, 220 * S);
    const ctaX = rLeft + (rW - ctaW) / 2;
    const ctaY = h * 0.74;
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.font = fontStack(L, 700, 18 * S);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText(ctaText(L, wa), ctaX + ctaW / 2, ctaY + ctaH * 0.67);
    ctx.textAlign = "left";

    // RIGHT: website
    ctx.font = fontStack("en", 400, 14 * S);
    ctx.fillStyle = "rgba(255,255,0,0.40)";
    ctx.textAlign = "center";
    ctx.fillText("kloversegy.com", rLeft + rW / 2, h * 0.91);
    ctx.textAlign = "left";

  } else {
    // Portrait (Stories / TikTok): yellow TOP / black BOTTOM with diagonal
    const splitY = h * 0.40;
    const slant = w * 0.10;
    const pad = 36 * S;

    if (hasPhoto) {
      drawPhotoBg(ctx, bgImage!, w, h, "gradient-bottom");
      // Semi-transparent yellow top panel
      ctx.fillStyle = "rgba(255,255,0,0.12)";
      ctx.fillRect(0, 0, w, splitY + slant);
    } else {
      // Yellow top
      ctx.fillStyle = "#FFFF00";
      ctx.fillRect(0, 0, w, splitY + slant);

      // Black bottom
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.moveTo(0, splitY); ctx.lineTo(w, splitY + slant);
      ctx.lineTo(w, h); ctx.lineTo(0, h);
      ctx.closePath(); ctx.fill();
    }

    // Diagonal accent
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.moveTo(0, splitY + 14 * S); ctx.lineTo(w, splitY + slant + 14 * S);
    ctx.stroke();

    // TOP: K badge
    const bR = 26 * S;
    ctx.fillStyle = hasPhoto ? "rgba(0,0,0,0.6)" : "#111111";
    ctx.beginPath(); ctx.arc(pad + bR, pad + bR, bR, 0, Math.PI * 2); ctx.fill();
    ctx.font = `900 ${17 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFF00";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", pad + bR, pad + bR);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    // TOP: headline
    const hlSize = Math.min(76 * S, (w - pad * 2) / 5);
    ctx.font = fontStack(L, 900, hlSize);
    drawTextAccent(ctx, post.mainText, pad, h * 0.19, w - pad * 2, hlSize * 1.08, 2, L, w, hasPhoto ? "#ffffff" : "#111111", "#FFFF00");

    // BOTTOM: subtitle (FIXED zone)
    ctx.font = fontStack(L, 400, 24 * S);
    ctx.fillStyle = hasPhoto ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.85)";
    drawText(ctx, post.subtitle, pad, h * 0.60, w - pad * 2, 32 * S, 3, L, w);

    // BOTTOM: CTA pill
    const ctaH = 56 * S, ctaW = w - pad * 2;
    const ctaY = h * 0.74;
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.font = fontStack(L, 700, 20 * S);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText(ctaText(L, wa), w / 2, ctaY + ctaH * 0.67);
    ctx.textAlign = "left";

    // Website
    ctx.font = fontStack("en", 400, 15 * S);
    ctx.fillStyle = "rgba(255,255,0,0.45)";
    ctx.textAlign = "center";
    ctx.fillText("kloversegy.com", w / 2, h * 0.90);
    ctx.textAlign = "left";
  }
}

// ─── NEW TEMPLATES ──────────────────────────────────────────────────────────

// ALERT — Urgency seat counter card. Bold red/yellow with large seat number.
function renderKloversAlert(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const hasPhoto = !!bgImage;

  // ── Background ──
  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "dark");
  } else {
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, w, h);
  }

  // ── Thick yellow border (urgency frame) ──
  const bw = 6 * S;
  ctx.strokeStyle = "#FFFF00";
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);

  // ── Inner red glow line ──
  ctx.strokeStyle = "rgba(255,60,60,0.5)";
  ctx.lineWidth = 2 * S;
  ctx.strokeRect(bw + 8 * S, bw + 8 * S, w - bw * 2 - 16 * S, h - bw * 2 - 16 * S);

  // ── Brand eyebrow ──
  ctx.font = fontStack(L, 700, 16 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(brandLabel(L), w / 2, h * 0.10);

  // ── Yellow accent line ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(w * 0.3, h * 0.13, w * 0.4, 3 * S);

  // ── LARGE seat number (focal point) ──
  const numText = post.mainText.replace(/[^\d0-9]/g, "") || post.mainText;
  const numSize = Math.min(180 * S, w * 0.30);
  ctx.font = fontStack("en", 900, numSize);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(numText.slice(0, 3), w / 2, h * 0.36);
  ctx.textBaseline = "alphabetic";

  // ── "Seats Left" / "مقاعد متبقية" label ──
  ctx.font = fontStack(L, 700, 28 * S);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(L === "ar" ? AR_TEXT.seatsLeft : "SEATS LEFT", w / 2, h * 0.54);

  // ── Red urgency bar ──
  ctx.fillStyle = "#ff3c3c";
  rRect(ctx, pad, h * 0.59, w - pad * 2, 5 * S, 3 * S);
  ctx.fill();

  // ── Subtitle (schedule info) ──
  ctx.font = fontStack(L, 400, 20 * S);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  drawText(ctx, post.subtitle, pad, h * 0.66, w - pad * 2, 28 * S, 3, L, w);

  // ── CTA pill ──
  const ctaH = 48 * S, ctaW = 220 * S;
  const ctaY = h * 0.82;
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, (w - ctaW) / 2, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = fontStack(L, 700, 16 * S);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(ctaText(L), w / 2, ctaY + ctaH * 0.65);
  ctx.textAlign = "left";

  // ── Website ──
  ctx.font = fontStack("en", 400, 12 * S);
  ctx.fillStyle = "rgba(255,255,0,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("kloversegy.com", w / 2, h * 0.94);
  ctx.textAlign = "left";
}

// COUNTDOWN — Days-left countdown ring with progress arc.
function renderKloversCountdown(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const hasPhoto = !!bgImage;

  // ── Background ──
  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "dark");
  } else {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);
  }

  // ── Subtle radial glow ──
  const grd = ctx.createRadialGradient(w / 2, h * 0.40, 0, w / 2, h * 0.40, w * 0.45);
  grd.addColorStop(0, "rgba(255,255,0,0.08)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // ── Brand eyebrow ──
  ctx.font = fontStack(L, 700, 16 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(brandLabel(L), w / 2, h * 0.10);

  // ── Yellow accent line ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(w * 0.3, h * 0.13, w * 0.4, 3 * S);

  // ── Countdown ring (background) ──
  const cx = w / 2, cy = h * 0.38;
  const ringR = Math.min(w, h) * 0.18;
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 12 * S;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // ── Yellow progress arc (simulate ~70% complete) ──
  const numMatch = post.mainText.match(/\d+/);
  const daysNum = numMatch ? parseInt(numMatch[0]) : 7;
  const progress = Math.max(0.1, Math.min(1, 1 - daysNum / 30));
  ctx.strokeStyle = "#FFFF00";
  ctx.lineWidth = 12 * S;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  // ── Large number inside ring ──
  const numSize = ringR * 0.9;
  ctx.font = fontStack("en", 900, numSize);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(daysNum), cx, cy);
  ctx.textBaseline = "alphabetic";

  // ── "DAYS LEFT" / "يوم متبقي" ──
  ctx.font = fontStack(L, 700, 24 * S);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(L === "ar" ? AR_TEXT.daysLeft : "DAYS LEFT", w / 2, h * 0.58);

  // ── Subtitle ──
  ctx.font = fontStack(L, 400, 22 * S);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  drawText(ctx, post.subtitle, pad, h * 0.66, w - pad * 2, 30 * S, 3, L, w);

  // ── CTA pill ──
  const ctaH = 52 * S, ctaW = 240 * S;
  const ctaY = h * 0.82;
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, (w - ctaW) / 2, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = fontStack(L, 700, 18 * S);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(ctaText(L), w / 2, ctaY + ctaH * 0.67);

  // ── Website ──
  ctx.font = fontStack("en", 400, 14 * S);
  ctx.fillStyle = "rgba(255,255,0,0.4)";
  ctx.fillText("kloversegy.com", w / 2, h * 0.94);
  ctx.textAlign = "left";
}

// QUOTE — Testimonial / social proof card with decorative quotation marks.
function renderKloversQuote(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const hasPhoto = !!bgImage;

  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "gradient-center");
  } else {
    // ── White/cream background ──
    ctx.fillStyle = "#fafaf5";
    ctx.fillRect(0, 0, w, h);

    // ── Yellow top bar ──
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, h * 0.08);
  }

  // ── Brand name ──
  ctx.font = fontStack(L, 700, 14 * S);
  ctx.fillStyle = hasPhoto ? "#FFFF00" : "#111111";
  ctx.textAlign = "center";
  ctx.fillText(brandLabel(L), w / 2, h * 0.05);

  // ── Large decorative quotation mark ──
  ctx.font = `900 ${Math.round(h * 0.18)}px Georgia, serif`;
  ctx.fillStyle = hasPhoto ? "rgba(255,255,0,0.35)" : "rgba(255,255,0,0.25)";
  ctx.textAlign = L === "ar" ? "right" : "left";
  ctx.fillText(L === "ar" ? "\u201D" : "\u201C", L === "ar" ? w - pad : pad, h * 0.28);

  // ── Quote text (main) ──
  const quoteSize = Math.min(42 * S, (w - pad * 2) / 8);
  ctx.font = fontStack(L, 700, quoteSize);
  ctx.textAlign = "center";
  drawTextAccent(ctx, post.mainText, pad, h * 0.36, w - pad * 2, quoteSize * 1.3, 3, L, w, hasPhoto ? "#ffffff" : "#111111", "#FFFF00");

  // ── Yellow divider ──
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, w * 0.35, h * 0.64, w * 0.3, 4 * S, 2 * S);
  ctx.fill();

  // ── Student name / attribution ──
  ctx.font = fontStack(L, 400, 22 * S);
  ctx.fillStyle = hasPhoto ? "rgba(255,255,255,0.75)" : "#555";
  ctx.textAlign = "center";
  drawText(ctx, post.subtitle, pad, h * 0.70, w - pad * 2, 28 * S, 2, L, w);

  // ── K badge bottom ──
  const bR = 24 * S;
  ctx.fillStyle = hasPhoto ? "rgba(0,0,0,0.5)" : "#111111";
  ctx.beginPath(); ctx.arc(w / 2, h * 0.84, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontStack("en", 900, 18 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", w / 2, h * 0.84);
  ctx.textBaseline = "alphabetic";

  // ── Bottom bar ──
  if (!hasPhoto) {
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, h * 0.92, w, h * 0.08);
  }
  ctx.font = fontStack(L, 600, 14 * S);
  ctx.fillStyle = hasPhoto ? "rgba(255,255,0,0.6)" : "#111111";
  ctx.fillText(post.extraText || (L === "ar" ? AR_TEXT.hashtags : "#StudentSuccess #Klovers"), w / 2, h * 0.965);
  ctx.textAlign = "left";
}

// TIP — Educational tip card. Korean word with meaning. Engagement-focused.
function renderKloversTip(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const hasPhoto = !!bgImage;

  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "gradient-bottom");
  } else {
    // ── Gradient background (yellow → white) ──
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#FFFF00");
    grad.addColorStop(0.5, "#fffde0");
    grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Faint K watermark ──
  ctx.save();
  ctx.font = `900 ${Math.round(h * 0.22)}px 'Inter', sans-serif`;
  ctx.fillStyle = hasPhoto ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
  ctx.textAlign = "right"; ctx.textBaseline = "bottom";
  ctx.fillText("K", w - 12 * S, h * 0.76);
  ctx.restore();

  // ── K badge (top-left) ──
  const bR = 20 * S;
  ctx.fillStyle = hasPhoto ? "rgba(0,0,0,0.5)" : "#111111";
  ctx.beginPath(); ctx.arc(pad + bR, pad + bR, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontStack("en", 900, 14 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", pad + bR, pad + bR);
  ctx.textBaseline = "alphabetic";

  // ── "Did you know?" / "هل تعلم؟" eyebrow ──
  ctx.font = fontStack(L, 700, 18 * S);
  ctx.fillStyle = hasPhoto ? "#FFFF00" : "#111111";
  ctx.textAlign = "center";
  ctx.fillText(L === "ar" ? AR_TEXT.didYouKnow : "DID YOU KNOW?", w / 2, h * 0.14);

  // ── Underline ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(w * 0.3, h * 0.17, w * 0.4, 3 * S);

  // ── Korean word/phrase (large, centered) ──
  const mainSize = Math.min(72 * S, (w - pad * 2) / 5);
  ctx.font = fontStack(L, 900, mainSize);
  ctx.textAlign = "center";
  drawTextAccent(ctx, post.mainText, pad, h * 0.30, w - pad * 2, mainSize * 1.15, 2, L, w, hasPhoto ? "#ffffff" : "#111111", "#FFFF00");

  // ── Meaning / subtitle ──
  ctx.font = fontStack(L, 500, 24 * S);
  ctx.fillStyle = hasPhoto ? "rgba(255,255,255,0.85)" : "#333";
  ctx.textAlign = "center";
  drawText(ctx, post.subtitle, pad, h * 0.56, w - pad * 2, 32 * S, 3, L, w);

  // ── Black bottom strip ──
  if (!hasPhoto) {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
  }

  // ── Brand + hashtags in strip ──
  ctx.font = fontStack(L, 700, 16 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(L === "ar" ? AR_TEXT.brandShort : "KLOVERS", w / 2, h * 0.87);

  ctx.font = fontStack(L, 400, 14 * S);
  ctx.fillStyle = "rgba(255,255,0,0.6)";
  ctx.fillText(post.extraText || (L === "ar" ? AR_TEXT.hashtags : "#LearnKorean #Klovers"), w / 2, h * 0.93);
  ctx.textAlign = "left";
}

// ─── MASCOT LEFT — Characters on left, text on right ───────────────────────
function renderKloversMascotLeft(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null, wa = false) {
  const pad = 48 * S;
  const hasPhoto = !!bgImage;
  const img = hasPhoto ? null : (_mascotLoaded ? _mascot : null);

  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "gradient-left");
  } else {
    // ── Yellow background ──
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, h);

    // ── Black right panel (55% of width) ──
    const panelX = w * 0.45;
    ctx.fillStyle = "#111111";
    ctx.fillRect(panelX, 0, w - panelX, h);

    // ── Yellow diagonal accent between panels ──
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 3 * S;
    ctx.beginPath();
    ctx.moveTo(panelX + 6 * S, 0);
    ctx.lineTo(panelX + 6 * S, h);
    ctx.stroke();

    // ── Draw characters on left ──
    if (img) {
      const imgH = h * 0.70;
      const imgW = imgH * (img.width / img.height);
      const imgX = (panelX - imgW) / 2;
      const imgY = h * 0.12;
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
    } else {
      ctx.font = `900 ${Math.round(h * 0.28)}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("K", panelX / 2, h * 0.45);
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    }

    // ── Brand label on left top ──
    ctx.font = fontStack(L, 700, 12 * S);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText("KLOVERS", panelX / 2, h * 0.06);
    ctx.textAlign = "left";
  }

  // ── TEXT SIDE ──
  const rLeft = hasPhoto ? pad : (w * 0.45 + 24 * S);
  const rW = hasPhoto ? (w * 0.45) : (w - rLeft - pad);

  // Eyebrow
  ctx.font = fontStack(L, 600, 14 * S);
  ctx.fillStyle = "rgba(255,255,0,0.6)";
  ctx.fillText(courseLabel(L), rLeft, h * 0.14);
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(rLeft, h * 0.17, 32 * S, 2 * S);

  // Headline
  const hlSize = Math.min(52 * S, rW / 5);
  ctx.font = fontStack(L, 900, hlSize);
  drawTextAccent(ctx, post.mainText, rLeft, h * 0.26, rW, hlSize * 1.10, 3, L, w, "#ffffff", "#FFFF00");

  // Subtitle
  ctx.font = fontStack(L, 400, 18 * S);
  ctx.fillStyle = "rgba(255,255,0,0.8)";
  drawText(ctx, post.subtitle, rLeft, h * 0.58, rW, 24 * S, 3, L, w);

  // CTA pill
  const ctaH = 44 * S, ctaW = Math.min(rW * 0.85, 190 * S);
  const ctaY = h * 0.78;
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, rLeft, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = fontStack(L, 700, 15 * S);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(ctaText(L, wa), rLeft + ctaW / 2, ctaY + ctaH * 0.65);
  ctx.textAlign = "left";

  // Website
  ctx.font = fontStack("en", 400, 11 * S);
  ctx.fillStyle = "rgba(255,255,0,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("kloversegy.com", rLeft + rW / 2, h * 0.93);
  ctx.textAlign = "left";
}

// ─── MASCOT RIGHT — Text on left, characters on right ──────────────────────
function renderKloversMascotRight(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null, wa = false) {
  const pad = 48 * S;
  const hasPhoto = !!bgImage;
  const img = hasPhoto ? null : (_mascotLoaded ? _mascot : null);

  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "gradient-bottom");
  } else {
    // ── Black background ──
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);

    // ── Yellow right panel (45% of width) ──
    const panelX = w * 0.55;
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(panelX, 0, w - panelX, h);

    // ── Diagonal accent line ──
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 3 * S;
    ctx.beginPath();
    ctx.moveTo(panelX - 6 * S, 0);
    ctx.lineTo(panelX - 6 * S, h);
    ctx.stroke();

    // ── Draw characters on right ──
    if (img) {
      const imgH = h * 0.70;
      const imgW = imgH * (img.width / img.height);
      const imgX = panelX + ((w - panelX) - imgW) / 2;
      const imgY = h * 0.12;
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
    } else {
      ctx.font = `900 ${Math.round(h * 0.28)}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("K", panelX + (w - panelX) / 2, h * 0.45);
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    }

    // ── Brand label on right top ──
    ctx.font = fontStack(L, 700, 12 * S);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText("KLOVERS", panelX + (w - panelX) / 2, h * 0.06);
    ctx.textAlign = "left";
  }

  // ── LEFT SIDE TEXT ──
  const lW = hasPhoto ? (w - pad * 2) : (w * 0.55 - pad * 2);

  // Yellow accent bar
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(pad, h * 0.08, 4 * S, h * 0.10);

  // Eyebrow
  ctx.font = fontStack(L, 600, 14 * S);
  ctx.fillStyle = "rgba(255,255,0,0.6)";
  ctx.fillText(courseLabel(L), pad, h * 0.12);
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(pad, h * 0.15, 32 * S, 2 * S);

  // Headline
  const hlSize = Math.min(56 * S, lW / 4.5);
  ctx.font = fontStack(L, 900, hlSize);
  drawTextAccent(ctx, post.mainText, pad, h * 0.26, lW, hlSize * 1.10, 3, L, w, "#ffffff", "#FFFF00");

  // Subtitle
  ctx.font = fontStack(L, 400, 18 * S);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  drawText(ctx, post.subtitle, pad, h * 0.58, lW, 24 * S, 3, L, w);

  // CTA pill
  const ctaH = 44 * S, ctaW = Math.min(lW * 0.85, 190 * S);
  const ctaY = h * 0.78;
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = fontStack(L, 700, 15 * S);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(ctaText(L, wa), pad + ctaW / 2, ctaY + ctaH * 0.65);
  ctx.textAlign = "left";

  // Website
  ctx.font = fontStack("en", 400, 11 * S);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("kloversegy.com", pad, h * 0.93);
}

// STATS — Large number + label (social proof / authority)
function renderKloversStats(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const hasPhoto = !!bgImage;

  // ── Background ──
  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "dark");
  } else {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1 * S;
    ctx.strokeRect(0, 0, w, h);
  }

  // ── Brand tag ──
  ctx.font = fontStack(L, 700, 11 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.fillText("K-LOVERS", pad, h * 0.08);

  // ── Large number (focal point) ──
  const numText = post.mainText;
  const numSize = Math.min(120 * S, w * 0.22);
  ctx.font = fontStack("en", 900, numSize);
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(numText, w / 2, h * 0.38);
  ctx.textBaseline = "alphabetic";

  // ── Stat label ──
  ctx.font = fontStack(L, 700, 26 * S);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(post.subtitle.split("\n")[0] || "", w / 2, h * 0.56);

  // ── Description ──
  const desc = post.subtitle.split("\n").slice(1).join(" ") || post.extraText;
  if (desc) {
    ctx.font = fontStack(L, 400, 15 * S);
    ctx.fillStyle = "#888888";
    wrapText(ctx, desc, pad, h * 0.66, w - pad * 2, 22 * S, 3);
  }

  // ── CTA + K badge ──
  ctx.font = fontStack("en", 400, 11 * S);
  ctx.fillStyle = "#555";
  ctx.textAlign = "left";
  ctx.fillText("kloversegy.com", pad, h - pad);

  const bR = 22 * S;
  ctx.fillStyle = "#FFFF00";
  ctx.beginPath(); ctx.arc(w - pad - bR, h - pad, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontStack("en", 900, 16 * S);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", w - pad - bR, h - pad);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
}

// LIST — Numbered list with yellow circles (tips, reasons, steps)
function renderKloversList(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, L: PostLang = "en", bgImage?: HTMLImageElement | null) {
  const pad = 52 * S;
  const hasPhoto = !!bgImage;

  // ── Background ──
  if (hasPhoto) {
    drawPhotoBg(ctx, bgImage!, w, h, "dark-heavy");
  } else {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);
  }

  // ── Brand tag ──
  ctx.font = fontStack(L, 700, 11 * S);
  ctx.fillStyle = "#FFFF00";
  ctx.fillText("K-LOVERS", pad, h * 0.08);

  // ── Headline ──
  const hlSize = Math.min(40 * S, (w - pad * 2) / 8);
  ctx.font = fontStack(L, 900, hlSize);
  ctx.fillStyle = "#ffffff";
  wrapText(ctx, post.mainText, pad, h * 0.16, w - pad * 2, hlSize * 1.15, 2);

  // ── List items from subtitle (split by newline) ──
  const items = post.subtitle.split("\n").filter(s => s.trim());
  const startY = h * 0.34;
  const rowH = Math.min(48 * S, (h * 0.50) / Math.max(items.length, 1));
  const circleR = 17 * S;

  items.forEach((item, i) => {
    const y = startY + i * rowH;

    // Yellow circle with number
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath(); ctx.arc(pad + circleR, y, circleR, 0, Math.PI * 2); ctx.fill();
    ctx.font = fontStack("en", 900, 15 * S);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), pad + circleR, y);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    // Item text
    ctx.font = fontStack(L, 400, 16 * S);
    ctx.fillStyle = "#cccccc";
    ctx.fillText(item.trim(), pad + circleR * 2 + 18 * S, y + 5 * S);
  });

  // ── CTA + K badge ──
  ctx.font = fontStack("en", 400, 11 * S);
  ctx.fillStyle = "#555";
  ctx.fillText("kloversegy.com", pad, h - pad);

  const bR = 22 * S;
  ctx.fillStyle = "#FFFF00";
  ctx.beginPath(); ctx.arc(w - pad - bR, h - pad, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = fontStack("en", 900, 16 * S);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", w - pad - bR, h - pad);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
}

// ─── Mascot preload ───

let _mascot: HTMLImageElement | null = null;
let _mascotLoaded = false;

export function preloadMascot() {
  if (_mascot) return;
  _mascot = new Image();
  _mascot.onload = () => { _mascotLoaded = true; };
  _mascot.src = "/klovers-mascot.svg";
}

// ─── Main Canvas Renderer ───

export function renderPost(
  canvas: HTMLCanvasElement,
  post: PostData,
  template: TemplateName,
  theme: ColorTheme,
  format: FormatKey,
  bgImage?: HTMLImageElement | null,
  lang?: PostLang,
  useWhatsAppCTA = false,
) {
  const fmt = FORMATS[format];
  const scale = canvas.width / fmt.w;
  const ctx = canvas.getContext("2d")!;
  const c = THEME_COLORS[theme];
  const w = canvas.width;
  const h = canvas.height;
  const isPortrait = h > w;
  const isDark = template === "neon" || template === "dark";
  const L: PostLang = lang || post.lang || "en";
  const wa = useWhatsAppCTA;

  ctx.clearRect(0, 0, w, h);

  // ─── Klovers brand designs (bgImage passed through for photo backgrounds) ──
  if (template === "klovers_bold")      { renderKloversBold(ctx, post, w, h, scale, isPortrait, L, wa, bgImage);      return; }
  if (template === "klovers_varsity")   { renderKloversVarsity(ctx, post, w, h, scale, isPortrait, L, wa, bgImage);   return; }
  if (template === "klovers_split")     { renderKloversSplit(ctx, post, w, h, scale, isPortrait, L, wa, bgImage);     return; }
  if (template === "klovers_alert")     { renderKloversAlert(ctx, post, w, h, scale, L, bgImage);     return; }
  if (template === "klovers_countdown") { renderKloversCountdown(ctx, post, w, h, scale, L, bgImage); return; }
  if (template === "klovers_quote")     { renderKloversQuote(ctx, post, w, h, scale, L, bgImage);     return; }
  if (template === "klovers_tip")       { renderKloversTip(ctx, post, w, h, scale, L, bgImage);       return; }
  if (template === "klovers_mascot_left")  { renderKloversMascotLeft(ctx, post, w, h, scale, L, bgImage, wa);  return; }
  if (template === "klovers_mascot_right") { renderKloversMascotRight(ctx, post, w, h, scale, L, bgImage, wa); return; }
  if (template === "klovers_stats")       { renderKloversStats(ctx, post, w, h, scale, L, bgImage); return; }
  if (template === "klovers_list")        { renderKloversList(ctx, post, w, h, scale, L, bgImage); return; }

  // ─── FULL-BLEED PHOTO LAYOUT (legacy templates with photo) ─────
  if (bgImage) {
    drawPhotoBg(ctx, bgImage, w, h, "gradient-bottom");

    const tPad = 40 * scale;
    const tW = w - tPad * 2;

    // ── Brand eyebrow ──
    ctx.font = fontStack(L, 700, 14 * scale);
    ctx.fillStyle = "#FFFF00";
    ctx.fillText(brandLabel(L), tPad, h * 0.10);
    ctx.fillRect(tPad, h * 0.13, 48 * scale, 3 * scale);

    // ── Headline ──
    const mSize = Math.min(72 * scale, tW * 0.18);
    ctx.font = fontStack(L, 900, mSize);
    drawTextAccent(ctx, post.mainText, tPad, h * 0.50, tW, mSize * 1.12, 2, L, w, "#ffffff", "#FFFF00");

    // ── Subtitle ──
    if (post.subtitle) {
      ctx.font = fontStack(L, 400, 22 * scale);
      ctx.fillStyle = "rgba(255,255,255,0.80)";
      drawText(ctx, post.subtitle, tPad, h * 0.72, tW, 28 * scale, 3, L, w);
    }

    // ── CTA pill ──
    const ctaH = 48 * scale, ctaW = 220 * scale;
    const ctaY = h - 90 * scale;
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, tPad, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.font = fontStack(L, 700, 16 * scale);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText(ctaText(L), tPad + ctaW / 2, ctaY + ctaH * 0.65);
    ctx.textAlign = "left";

    // ── Website ──
    ctx.font = fontStack("en", 400, 12 * scale);
    ctx.fillStyle = "rgba(255,255,0,0.4)";
    ctx.fillText("kloversegy.com", tPad, h - 24 * scale);
    return;
  }

  // ─── CHARACTER TEMPLATE (mascot) ─────────────────────────
  if (template === "character") {
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, h);

    if (_mascotLoaded && _mascot) {
      // Left black panel, right mascot
      const panelW = w * 0.52;
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, panelW, h);

      // Draw mascot right side
      const mh = h, mw = mh * (_mascot.width / _mascot.height);
      ctx.drawImage(_mascot, panelW - mw * 0.15, 0, mw, mh);

      const pad = 36 * scale;
      ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      ctx.fillText("KLOVERS ACADEMY", pad, h * 0.12);

      const hlSize = Math.min(64 * scale, panelW / 6);
      ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, post.mainText, pad, h * 0.24, panelW - pad * 2, hlSize * 1.08, 2);

      if (post.subtitle) {
        ctx.font = `400 ${14 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255,255,0,0.8)";
        // FIXED zone
        wrapText(ctx, post.subtitle, pad, h * 0.58, panelW - pad * 2, 21 * scale, 3);
      }

      const ctaH = 40 * scale, ctaW = 160 * scale;
      const ctaY = h * 0.76;
      ctx.fillStyle = "#FFFF00";
      rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.font = `700 ${13 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.fillText("Register Now →", pad + ctaW / 2, ctaY + ctaH * 0.67);
      ctx.textAlign = "left";
    } else {
      // Fallback without mascot — use fixed safe zones
      ctx.save();
      ctx.font = `900 ${Math.round(h * 0.28)}px serif`;
      ctx.fillStyle = "rgba(0,0,0,0.035)";
      ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText("K", w - 20 * scale, h * 0.78);
      ctx.textBaseline = "alphabetic";
      ctx.restore();

      const pad = 44 * scale;
      ctx.font = `700 ${Math.round(18 * scale)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111";
      ctx.fillText("KLOVERS ACADEMY", pad, h * 0.155);

      const hlSize = Math.min(88 * scale, (w - pad * 2) / 6);
      ctx.font = `900 ${Math.round(hlSize)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111";
      wrapText(ctx, post.mainText, pad, h * 0.27, w - pad * 2, Math.round(hlSize * 1.08), 2);

      if (post.subtitle) {
        ctx.font = `400 ${Math.round(hlSize * 0.42)}px 'Inter', sans-serif`;
        ctx.fillStyle = "#333";
        wrapText(ctx, post.subtitle, pad, h * 0.60, w - pad * 2, Math.round(hlSize * 0.42 * 1.45), 3);
      }

      const ctaH = Math.round(52 * scale), ctaW = Math.round(220 * scale);
      const ctaY = h * 0.75;
      ctx.fillStyle = "#111111";
      rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.font = `700 ${Math.round(18 * scale)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      ctx.textAlign = "center";
      ctx.fillText("Register Now →", pad + ctaW / 2, ctaY + ctaH * 0.67);
      ctx.textAlign = "left";
    }
    return;
  }

  // ─── NO-PHOTO LAYOUTS (classic, minimal, gradient, neon, dark, editorial) ──
  const isBrand = !isDark && template !== "minimal";

  // Background
  if (template === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c.bg); grad.addColorStop(1, c.accent);
    ctx.fillStyle = grad;
  } else if (template === "neon") {
    ctx.fillStyle = "#0a0a0a";
  } else if (template === "dark") {
    ctx.fillStyle = "#1a1a1a";
  } else {
    ctx.fillStyle = c.bg;
  }
  ctx.fillRect(0, 0, w, h);

  // Diagonal triangle accent (bottom-right corner only) — brand only
  if (isBrand) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.78, h); ctx.lineTo(w, h * 0.78); ctx.lineTo(w, h);
    ctx.closePath(); ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fill();
    ctx.restore();
  }

  // Decorative K watermark (subtle, tucked in corner)
  if (isBrand) {
    ctx.save();
    ctx.font = `900 ${Math.round(h * 0.30)}px 'Inter', 'Segoe UI Black', sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("K", w - 8 * scale, h * 0.86);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.restore();
  }

  // Left accent bar
  ctx.fillStyle = isDark ? c.accent : "#1a1a1a";
  ctx.fillRect(32 * scale, 32 * scale, 4 * scale, h * 0.12);

  if (template === "minimal") {
    ctx.strokeStyle = c.text; ctx.lineWidth = 2 * scale;
    const m = 24 * scale; ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  }

  // Editorial: left black panel
  if (template === "editorial") {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w * 0.06, h);
    ctx.fillStyle = c.bg;
  }

  if (template === "neon") { ctx.shadowColor = c.accent; ctx.shadowBlur = 20 * scale; }

  // Text layout — all positions FIXED as fractions of h with generous safe zones
  const pad    = 52 * scale;
  const tLeft  = template === "editorial" ? pad * 1.6 : pad;
  const tW     = w - tLeft - pad;
  const eyeColor = isDark ? (template === "neon" ? c.accent : "#aaa") : "#1a1a1a";

  // Eyebrow
  ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
  ctx.fillStyle = eyeColor;
  ctx.font = fontStack(L, 700, Math.round(16 * scale));
  if (L === "ar") {
    ctx.save(); ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillText(courseLabel(L), w - tLeft, h * 0.18);
    ctx.restore();
    ctx.fillRect(w - tLeft - 36 * scale, h * 0.18 + 8 * scale, 36 * scale, 3 * scale);
  } else {
    ctx.fillText(courseLabel(L), tLeft, h * 0.18);
    ctx.fillRect(tLeft, h * 0.18 + 8 * scale, 36 * scale, 3 * scale);
  }

  if (template === "neon") { ctx.shadowColor = c.accent; ctx.shadowBlur = 16 * scale; }

  // Headline at h*0.30 with breathing room from eyebrow
  const mSize = Math.min(isPortrait ? 80 * scale : 68 * scale, tW * 0.14);
  ctx.font = fontStack(L, 900, Math.round(mSize));
  ctx.fillStyle = isDark ? "#fff" : "#1a1a1a";
  drawText(ctx, post.mainText, tLeft, h * 0.30, tW, Math.round(mSize * 1.12), 2, L, w);

  ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

  // Subtitle at h*0.60
  if (post.subtitle) {
    const sSize = Math.round(mSize * 0.40);
    ctx.font = fontStack(L, 500, sSize);
    ctx.fillStyle = isDark ? "#bbb" : "#333";
    drawText(ctx, post.subtitle, tLeft, h * 0.60, tW, Math.round(sSize * 1.45), 3, L, w);
  }

  // CTA pill at h*0.76
  const ctaH  = Math.round(46 * scale);
  const ctaW  = Math.round(200 * scale);
  const ctaY  = h * 0.76;
  const ctaBg = isDark ? c.accent : "#1a1a1a";
  ctx.fillStyle = ctaBg;
  rRect(ctx, tLeft, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = fontStack(L, 700, Math.round(16 * scale));
  ctx.fillStyle = isDark ? "#1a1a1a" : "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(ctaText(L, wa), tLeft + ctaW / 2, ctaY + ctaH * 0.65);
  ctx.textAlign = "left";

  // Footer strip with hashtags (h*0.89–h*1.0)
  ctx.fillStyle = isDark ? "#111" : "#1a1a1a";
  ctx.fillRect(0, h * 0.89, w, h * 0.11);
  ctx.font = fontStack(L, 700, Math.round(14 * scale));
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(post.extraText || (L === "ar" ? AR_TEXT.hashtags : "#LearnKorean #Klovers"), w / 2, h * 0.95);
  ctx.textAlign = "left";
}

// ─── Reel Cover Renderer (3-frame storyboard) ───────────────────────────────

export interface ReelSlide { text: string; }

export function renderReelCover(
  canvas: HTMLCanvasElement,
  slides: { slide1: string; slide2: string; slide3: string },
  bgImage?: HTMLImageElement | null,
) {
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const S = 1; // No scaling needed at native resolution

  // ── Background ──
  if (bgImage) {
    // Draw Unsplash image stretched to cover
    const imgR = bgImage.width / bgImage.height;
    const canR = W / H;
    let dw = W, dh = H;
    if (imgR > canR) { dw = H * imgR; } else { dh = W / imgR; }
    ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
    // Dark overlay
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
  } else {
    // Fallback: brand gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#111111");
    grad.addColorStop(0.5, "#1a1a2e");
    grad.addColorStop(1, "#111111");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const pad = 60;
  const slideH = H / 3;

  // ── Yellow dividers ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(pad, slideH - 2, W - pad * 2, 4);
  ctx.fillRect(pad, slideH * 2 - 2, W - pad * 2, 4);

  // ── Slide labels ──
  const labels = ["HOOK · 3 sec", "CONTENT · 5 sec", "CTA · 3 sec"];
  const slideTexts = [slides.slide1, slides.slide2, slides.slide3];

  for (let i = 0; i < 3; i++) {
    const y0 = slideH * i;

    // Slide number badge
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, pad, y0 + 30, 36, 36, 18);
    ctx.fill();
    ctx.font = "bold 20px 'Inter', 'Tahoma', sans-serif";
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), pad + 18, y0 + 53);
    ctx.textAlign = "left";

    // Label
    ctx.font = "600 16px 'Inter', 'Tahoma', sans-serif";
    ctx.fillStyle = "rgba(255,255,0,0.6)";
    ctx.fillText(labels[i], pad + 48, y0 + 52);

    // Slide text
    ctx.font = "700 36px 'Inter', 'Tahoma', sans-serif";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, slideTexts[i], pad, y0 + 110, W - pad * 2, 48, 8);
  }

  // ── K badge (bottom-right) ──
  const bR = 28;
  ctx.fillStyle = "#FFFF00";
  ctx.beginPath(); ctx.arc(W - pad - bR, H - 60, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = "900 22px 'Inter', sans-serif";
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", W - pad - bR, H - 60);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

  // ── Brand name (bottom-left) ──
  ctx.font = "700 18px 'Inter', 'Tahoma', sans-serif";
  ctx.fillStyle = "rgba(255,255,0,0.5)";
  ctx.fillText("KLOVERS", pad, H - 50);
  ctx.font = "400 14px 'Inter', 'Tahoma', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("kloversegy.com", pad, H - 28);
}

// ─── Grid Pattern System ────────────────────────────────────────────────────

export type GridPattern = "checkerboard" | "rows" | "columns" | "brand_mix" | "custom";

export interface GridSlot { template: TemplateName; theme: ColorTheme; }

const LIGHT_SLOT: GridSlot = { template: "klovers_bold", theme: "yellow" };
const DARK_SLOT: GridSlot  = { template: "klovers_varsity", theme: "midnight" };
const SPLIT_SLOT: GridSlot = { template: "klovers_split", theme: "yellow" };
const ALERT_SLOT: GridSlot = { template: "klovers_alert", theme: "yellow" };
const COUNT_SLOT: GridSlot = { template: "klovers_countdown", theme: "midnight" };
const QUOTE_SLOT: GridSlot = { template: "klovers_quote", theme: "yellow" };
const TIP_SLOT: GridSlot   = { template: "klovers_tip", theme: "yellow" };
const MASCOT_L: GridSlot   = { template: "klovers_mascot_left", theme: "yellow" };
const MASCOT_R: GridSlot   = { template: "klovers_mascot_right", theme: "midnight" };

const GRID_PATTERNS: Record<Exclude<GridPattern, "custom">, GridSlot[]> = {
  // Alternating light/dark for visual rhythm
  checkerboard: [
    LIGHT_SLOT, DARK_SLOT, LIGHT_SLOT,
    DARK_SLOT, LIGHT_SLOT, DARK_SLOT,
    LIGHT_SLOT, DARK_SLOT, LIGHT_SLOT,
  ],
  // Each row of 3 uses same template
  rows: [
    LIGHT_SLOT, LIGHT_SLOT, LIGHT_SLOT,
    DARK_SLOT, DARK_SLOT, DARK_SLOT,
    SPLIT_SLOT, SPLIT_SLOT, SPLIT_SLOT,
  ],
  // Each column shares a style
  columns: [
    LIGHT_SLOT, DARK_SLOT, SPLIT_SLOT,
    LIGHT_SLOT, DARK_SLOT, SPLIT_SLOT,
    LIGHT_SLOT, DARK_SLOT, SPLIT_SLOT,
  ],
  // Uses all Klovers templates including mascots
  brand_mix: [
    LIGHT_SLOT, DARK_SLOT, MASCOT_L,
    QUOTE_SLOT, SPLIT_SLOT, MASCOT_R,
    TIP_SLOT, ALERT_SLOT, COUNT_SLOT,
  ],
};

export const GRID_PATTERN_META: { key: GridPattern; label: string; desc: string }[] = [
  { key: "checkerboard", label: "Checkerboard", desc: "Light/dark alternating — high contrast" },
  { key: "rows",         label: "Rows",         desc: "Same template per row — clean bands" },
  { key: "columns",      label: "Columns",      desc: "Same template per column — vertical rhythm" },
  { key: "brand_mix",    label: "Brand Mix",    desc: "All Klovers templates — max variety" },
  { key: "custom",       label: "Custom",       desc: "Use each post's own template" },
];

export function getGridSlots(pattern: GridPattern, count: number): GridSlot[] {
  if (pattern === "custom") return [];
  const base = GRID_PATTERNS[pattern];
  return Array.from({ length: count }, (_, i) => base[i % base.length]);
}
