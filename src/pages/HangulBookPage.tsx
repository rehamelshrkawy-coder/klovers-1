import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

/* ─── Brand tokens ─────────────────────────────── */
const Y    = "#FFFF00";   // yellow — thin accent lines only
const YL   = "#FFFDE7";   // very pale yellow — subtle row tints
const GL   = "#F0FFF4";   // very pale mint — subtle vowel tint
const GD   = "#166534";   // dark green text on mint
const BK   = "#111111";   // primary text
const BK2  = "#333333";   // secondary text
const GOLD = "#D4AF37";   // cover gold accent
const CREAM = "#FAFAF8";  // page soft background (near-white)
/* ─── Book design system ────────────────────────── */
const T1   = "#111111";   // heading text
const T2   = "#444444";   // body text
const T3   = "#777777";   // captions / metadata
const BD   = "#DDDDDD";   // borders / dividers
const SBG  = "#F8F8F8";   // soft background (very subtle)
const MAR  = "15mm 16mm"; // page margins

/* ─── Custom Korean-style SVG Icons ─────────────── */

function TaegeukIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="none" stroke={Y} strokeWidth="3" />
      {/* Top half - blue */}
      <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2Z" fill="#0047AB" />
      {/* Bottom half - red */}
      <path d="M50 98 A48 48 0 0 1 50 2 A24 24 0 0 1 50 50 A24 24 0 0 0 50 98Z" fill="#C8102E" />
      {/* Small circles */}
      <circle cx="50" cy="26" r="12" fill="#0047AB" />
      <circle cx="50" cy="74" r="12" fill="#C8102E" />
    </svg>
  );
}

function MugunghwaIcon({ size = 40, color = Y }: { size?: number; color?: string }) {
  const petals = 5;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * 360) / petals - 90;
        const rad = (angle * Math.PI) / 180;
        const x = 50 + 28 * Math.cos(rad);
        const y = 50 + 28 * Math.sin(rad);
        return (
          <ellipse
            key={i}
            cx={x} cy={y}
            rx="16" ry="10"
            fill={color}
            opacity="0.85"
            transform={`rotate(${angle + 90}, ${x}, ${y})`}
          />
        );
      })}
      <circle cx="50" cy="50" r="14" fill={BK} />
      <circle cx="50" cy="50" r="8" fill={Y} />
    </svg>
  );
}

function PalaceRoofIcon({ size = 40, color = Y }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Curved roof */}
      <path d="M10 60 Q15 30 50 20 Q85 30 90 60 Z" fill={color} />
      {/* Roof ridge */}
      <rect x="20" y="58" width="60" height="6" rx="3" fill={BK} />
      {/* Upturned eaves */}
      <path d="M10 60 Q5 55 3 45" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M90 60 Q95 55 97 45" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Column */}
      <rect x="44" y="64" width="12" height="30" rx="2" fill={color} opacity="0.7" />
      {/* Base */}
      <rect x="15" y="92" width="70" height="6" rx="3" fill={color} />
    </svg>
  );
}

function HanjaIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" rx="12" fill={BK} />
      <text x="50" y="72" textAnchor="middle" fontSize="64" fill={Y} fontWeight="bold">字</text>
    </svg>
  );
}

function KoreanLanternIcon({ size = 40, color = Y }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* String */}
      <line x1="50" y1="0" x2="50" y2="12" stroke={color} strokeWidth="3" />
      {/* Top cap */}
      <path d="M30 12 Q50 8 70 12 L65 20 Q50 16 35 20Z" fill={color} />
      {/* Body */}
      <ellipse cx="50" cy="52" rx="26" ry="34" fill={color} opacity="0.9" />
      {/* Ribs */}
      {[28,40,52,64,76].map(y => (
        <line key={y} x1={50 - Math.sqrt(Math.max(0, 26*26 - (y-52)*(y-52)))*0.9}
              y1={y} x2={50 + Math.sqrt(Math.max(0, 26*26 - (y-52)*(y-52)))*0.9}
              y2={y} stroke={BK} strokeWidth="2" opacity="0.4" />
      ))}
      {/* Bottom cap */}
      <path d="M35 84 Q50 88 65 84 L70 92 Q50 96 30 92Z" fill={color} />
      {/* Tassel */}
      <line x1="50" y1="92" x2="50" y2="100" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

function DancheongBorder() {
  return (
    <div style={{
      display:"flex", gap:"4px", alignItems:"center",
      padding:"6px 0", marginBottom:"8px",
    }}>
      {["#0047AB","#C8102E",Y,GL,"#C8102E","#0047AB",Y,GL,"#C8102E","#0047AB",Y,GL,"#C8102E","#0047AB"].map((c,i) => (
        <div key={i} style={{
          width:"14px", height:"14px", borderRadius:"2px",
          background: c, flexShrink:0,
          clipPath: i%2===0 ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : "none",
        }} />
      ))}
    </div>
  );
}

/* ─── QR Code placeholder (visual, non-functional) ──────────── */
function QRPlaceholder({ size = 60, label = "Scan for audio" }: { size?: number; label?: string }) {
  const n = 15;
  const cell = size / n;
  const pat = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
    [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
    [0,1,1,0,1,0,1,0,1,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,1,0,0,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,0],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,1,1,1,0,0,1,1],
  ];
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ display:"inline-block", padding:"4px", background:"#fff", borderRadius:"6px", border:`2px solid ${Y}` }}>
        <svg width={size} height={size}>
          {pat.map((row, y) => row.map((v, x) =>
            v ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={BK} /> : null
          ))}
        </svg>
      </div>
      <div style={{ fontSize:"9px", color:"#888", marginTop:"3px" }}>{label}</div>
    </div>
  );
}

/* ─── Barcode placeholder ─────────────────────────────────────── */
function BarcodeIcon() {
  const bars = [
    {x:2,w:3},{x:7,w:1},{x:10,w:4},{x:16,w:1},{x:19,w:2},{x:23,w:3},
    {x:28,w:1},{x:31,w:2},{x:35,w:4},{x:41,w:1},{x:44,w:3},{x:49,w:1},
    {x:52,w:2},{x:56,w:3},{x:61,w:1},{x:64,w:2},{x:68,w:4},{x:74,w:1},
  ];
  return (
    <svg width="80" height="44" viewBox="0 0 80 44">
      {bars.map((b,i) => <rect key={i} x={b.x} y={0} width={b.w} height={34} fill={BK} />)}
      <text x="40" y="43" textAnchor="middle" fontSize="6.5" fill={BK} fontFamily="monospace" letterSpacing="0.5">978-986-00-0001-0</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   KLOVERS CHARACTER SCENES
   Junho = boy (teal hanbok, fox basket)
   Miya  = girl (cream/burgundy hanbok, brown satchel)
   Fox   = Gumiho (orange, in Junho's basket)
════════════════════════════════════════════════════════ */

/* ── Scene: Cover — "Welcome to Hangul!" ── */
function SceneCover({ h = 240, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 900 360" style={{ width:"100%", height:`${h}px`, display:"block", borderRadius:`${radius}px` }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cvSky" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1a2e"/>
          <stop offset="100%" stopColor="#080808"/>
        </radialGradient>
        <radialGradient id="cvGlow" cx="50%" cy="70%" r="45%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        {/* 3D character gradients — cover */}
        <radialGradient id="faceGrad_cv" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde8cc"/>
          <stop offset="60%" stopColor="#f5c5a3"/>
          <stop offset="100%" stopColor="#d4956a"/>
        </radialGradient>
        <radialGradient id="blushGrad_cv" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9999" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff6666" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="tealGrad_cv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40d4ca"/>
          <stop offset="40%" stopColor="#20B2AA"/>
          <stop offset="100%" stopColor="#0d6e68"/>
        </linearGradient>
        <linearGradient id="burgGrad_cv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a03060"/>
          <stop offset="40%" stopColor="#7B1A3A"/>
          <stop offset="100%" stopColor="#3d0d1d"/>
        </linearGradient>
        <linearGradient id="hairGrad_cv" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a"/>
          <stop offset="30%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <radialGradient id="foxGrad_cv" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e8904a"/>
          <stop offset="55%" stopColor="#D2691E"/>
          <stop offset="100%" stopColor="#8a4010"/>
        </radialGradient>
        <linearGradient id="pantsGrad_cv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a6590"/>
          <stop offset="50%" stopColor="#3a4570"/>
          <stop offset="100%" stopColor="#1e2540"/>
        </linearGradient>
        <linearGradient id="jeoGrad_cv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#fff8f0"/>
          <stop offset="100%" stopColor="#e8e0d5"/>
        </linearGradient>
        <filter id="shadow_cv" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35"/>
        </filter>
        <radialGradient id="groundShadow_cv" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Sky */}
      <rect width="900" height="360" fill="url(#cvSky)"/>
      <rect width="900" height="360" fill="url(#cvGlow)"/>
      {/* Stars */}
      {[[60,30],[140,18],[230,45],[700,22],[780,40],[820,15],[540,12],[620,35],[450,8]].map(([sx,sy],i)=>(
        <circle key={i} cx={sx} cy={sy} r={i%3===0?2:1.2} fill="#fff" opacity={0.6+i*0.04}/>
      ))}
      {/* Ground / path */}
      <ellipse cx="450" cy="360" rx="500" ry="80" fill="#0d0d00"/>
      <rect x="0" y="310" width="900" height="50" fill="#111100"/>
      {/* Stone path */}
      {[200,270,340,410,480,550,620,690].map((px,i)=>(
        <ellipse key={i} cx={px} cy={330} rx="28" ry="10" fill="#1e1c00" stroke="#ffff00" strokeWidth="0.6" opacity="0.5"/>
      ))}
      {/* Floating Hangul letters */}
      {[["ㄱ",95,75,52,0.55],["ㄴ",175,130,38,0.4],["ㅂ",72,200,44,0.5],["ㄷ",160,255,32,0.35],
        ["ㅅ",805,70,52,0.55],["ㅇ",740,125,38,0.4],["ㅈ",820,205,44,0.5],["ㅎ",748,260,32,0.35],
        ["ㅏ",418,30,36,0.45],["ㅣ",482,25,36,0.45],["ㅗ",390,340,28,0.35],["ㅜ",510,345,28,0.35],
        ["가",340,60,28,0.3],["나",550,55,28,0.3]
      ].map(([ch,x,y,sz,op],i)=>(
        <text key={i} x={x as number} y={y as number} fontSize={sz as number} fontWeight="900" fill="#ffff00" opacity={op as number} textAnchor="middle">{ch}</text>
      ))}
      {/* Sparkles */}
      {[[220,80],[680,75],[240,280],[660,285],[450,45],[320,310],[580,315]].map(([sx,sy],i)=>(
        <g key={i}>
          <circle cx={sx} cy={sy} r={i%2===0?4:2.5} fill="#ffff00" opacity="0.75"/>
          <line x1={sx-12} y1={sy} x2={sx+12} y2={sy} stroke="#ffff00" strokeWidth="1.5" opacity="0.4"/>
          <line x1={sx} y1={sy-12} x2={sx} y2={sy+12} stroke="#ffff00" strokeWidth="1.5" opacity="0.4"/>
        </g>
      ))}
      {/* JUNHO (left, large) — 3D */}
      <ellipse cx="295" cy="350" rx="62" ry="14" fill="url(#groundShadow_cv)"/>
      <g filter="url(#shadow_cv)">
        <path d="M268 220 L260 345 L285 345 L290 270 L298 270 L303 345 L328 345 L320 220Z" fill="url(#pantsGrad_cv)"/>
        <ellipse cx="268" cy="346" rx="18" ry="7" fill="#1a1508"/>
        <ellipse cx="316" cy="346" rx="18" ry="7" fill="#1a1508"/>
        <path d="M258 108 L248 225 L344 225 L334 108Z" fill="url(#tealGrad_cv)"/>
        <rect x="248" y="200" width="96" height="14" rx="5" fill="#8B1010"/>
        <path d="M291 108 L278 140" stroke="#40d4ca" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M291 108 L304 140" stroke="#40d4ca" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M248 130 L212 190 L228 200 L262 142Z" fill="url(#tealGrad_cv)"/>
        <ellipse cx="215" cy="196" rx="14" ry="14" fill="url(#faceGrad_cv)"/>
        <path d="M334 125 L368 170 L380 162 L348 116Z" fill="url(#tealGrad_cv)"/>
        {/* Fox basket */}
        <path d="M368 164 Q392 152 416 164 Q420 190 392 200 Q364 190 368 164Z" fill="#8B6408"/>
        <path d="M366 168 Q392 158 418 168" fill="none" stroke="#5a3800" strokeWidth="3"/>
        <circle cx="392" cy="176" r="22" fill="url(#foxGrad_cv)"/>
        <path d="M378 162 L371 142 L385 160Z" fill="url(#foxGrad_cv)"/>
        <path d="M406 162 L413 142 L398 160Z" fill="url(#foxGrad_cv)"/>
        <ellipse cx="392" cy="184" rx="14" ry="10" fill="#f0b090"/>
        <circle cx="385" cy="172" r="5" fill="#111"/>
        <circle cx="399" cy="172" r="5" fill="#111"/>
        <circle cx="386" cy="170" r="2.5" fill="#fff"/>
        <circle cx="400" cy="170" r="2.5" fill="#fff"/>
        <circle cx="392" cy="180" r="3" fill="#8B0000"/>
        <path d="M387 185 Q392 191 397 185" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round"/>
        {/* Junho head */}
        <rect x="283" y="90" width="18" height="26" rx="7" fill="url(#faceGrad_cv)"/>
        <ellipse cx="292" cy="66" rx="44" ry="46" fill="url(#faceGrad_cv)"/>
        {/* Specular highlight on head */}
        <ellipse cx="278" cy="48" rx="14" ry="10" fill="#fff" opacity="0.35"/>
        <path d="M250 55 Q253 20 292 17 Q331 20 334 55 Q325 36 292 33 Q259 36 250 55Z" fill="url(#hairGrad_cv)"/>
        {/* Hair shine */}
        <path d="M258 46 Q280 36 310 40" fill="none" stroke="#6a6a6a" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
        <path d="M250 55 Q242 72 246 85" fill="none" stroke="url(#hairGrad_cv)" strokeWidth="13" strokeLinecap="round"/>
        <path d="M334 55 Q342 72 338 85" fill="none" stroke="url(#hairGrad_cv)" strokeWidth="13" strokeLinecap="round"/>
        <path d="M272 64 Q278 69 284 64" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M300 64 Q306 69 312 64" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M268 52 Q276 47 283 51" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M301 51 Q308 47 316 52" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="256" cy="78" r="15" fill="url(#blushGrad_cv)"/>
        <circle cx="328" cy="78" r="15" fill="url(#blushGrad_cv)"/>
        <path d="M278 80 Q292 90 306 80" fill="none" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      {/* MIYA (right, large) — 3D */}
      <ellipse cx="610" cy="350" rx="56" ry="14" fill="url(#groundShadow_cv)"/>
      <g filter="url(#shadow_cv)">
        <path d="M578 140 Q568 255 582 345 L638 345 Q652 255 642 140Z" fill="url(#burgGrad_cv)"/>
        <path d="M570 255 Q610 262 650 255" fill="none" stroke="#a03060" strokeWidth="2.5" opacity="0.6"/>
        <path d="M568 278 Q610 285 652 278" fill="none" stroke="#a03060" strokeWidth="2" opacity="0.4"/>
        <path d="M578 110 L572 145 L648 145 L642 110Z" fill="url(#jeoGrad_cv)"/>
        <path d="M610 110 L598 132" stroke="#40d4ca" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M610 110 L622 132" stroke="#40d4ca" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M594 134 L602 145 L610 140 L618 145 L626 134 L618 141 L610 138 L602 141Z" fill="#C8102E"/>
        <path d="M572 118 L540 165 L556 175 L582 130Z" fill="url(#jeoGrad_cv)"/>
        <ellipse cx="542" cy="172" rx="13" ry="13" fill="url(#faceGrad_cv)"/>
        <path d="M642 118 L662 152 L650 160 L635 128Z" fill="url(#jeoGrad_cv)"/>
        <path d="M660 150 Q670 130 690 120 Q700 140 690 160 Q670 170 660 150Z" fill="#ffff00" opacity="0.8"/>
        <path d="M660 150 Q670 130 690 120" fill="none" stroke="#8B6914" strokeWidth="1.5" opacity="0.6"/>
        <path d="M660 150 Q672 135 690 128" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.4"/>
        <path d="M660 150 Q674 140 690 136" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.3"/>
        <ellipse cx="592" cy="346" rx="16" ry="7" fill="#1a1508"/>
        <ellipse cx="628" cy="346" rx="16" ry="7" fill="#1a1508"/>
        {/* Miya head */}
        <rect x="602" y="92" width="16" height="22" rx="6" fill="url(#faceGrad_cv)"/>
        <ellipse cx="610" cy="70" rx="40" ry="43" fill="url(#faceGrad_cv)"/>
        {/* Specular highlight on head */}
        <ellipse cx="596" cy="52" rx="12" ry="9" fill="#fff" opacity="0.35"/>
        <path d="M572 60 Q574 28 610 25 Q646 28 648 60 Q640 42 610 40 Q580 42 572 60Z" fill="url(#hairGrad_cv)"/>
        <circle cx="610" cy="27" r="18" fill="url(#hairGrad_cv)"/>
        {/* Hair shine */}
        <path d="M580 50 Q600 40 628 44" fill="none" stroke="#6a6a6a" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="595" y1="20" x2="616" y2="16" stroke="#C8102E" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="595" cy="20" r="7" fill="#C8102E"/>
        <path d="M572 60 Q564 76 567 88" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round"/>
        <path d="M648 60 Q656 76 653 88" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round"/>
        <path d="M592 66 Q598 72 604 66" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M616 66 Q622 72 628 66" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M589 54 Q597 49 604 53" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M616 53 Q623 49 631 54" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="576" cy="80" r="14" fill="url(#blushGrad_cv)"/>
        <circle cx="644" cy="80" r="14" fill="url(#blushGrad_cv)"/>
        <path d="M598 78 Q610 88 622 78" fill="none" stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      {/* Welcome banner */}
      <rect x="280" y="290" width="340" height="52" rx="14" fill="#ffff00"/>
      <text x="450" y="316" textAnchor="middle" fontSize="18" fontWeight="900" fill="#111">안녕하세요! Welcome!</text>
      <text x="450" y="334" textAnchor="middle" fontSize="13" fontWeight="700" fill="#333">Let's learn Hangul together 🇰🇷</text>
    </svg>
  );
}

/* ── Scene: Classroom — "Study Time!" ── */
function SceneClassroom({ h = 280, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 900 360" style={{ width:"100%", height:`${h}px`, display:"block", borderRadius:`${radius}px` }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="clsGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        {/* 3D character gradients — classroom */}
        <radialGradient id="faceGrad_cls" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde8cc"/>
          <stop offset="60%" stopColor="#f5c5a3"/>
          <stop offset="100%" stopColor="#d4956a"/>
        </radialGradient>
        <radialGradient id="blushGrad_cls" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9999" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff6666" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="tealGrad_cls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40d4ca"/>
          <stop offset="40%" stopColor="#20B2AA"/>
          <stop offset="100%" stopColor="#0d6e68"/>
        </linearGradient>
        <linearGradient id="burgGrad_cls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a03060"/>
          <stop offset="40%" stopColor="#7B1A3A"/>
          <stop offset="100%" stopColor="#3d0d1d"/>
        </linearGradient>
        <linearGradient id="hairGrad_cls" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a"/>
          <stop offset="30%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <radialGradient id="foxGrad_cls" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e8904a"/>
          <stop offset="55%" stopColor="#D2691E"/>
          <stop offset="100%" stopColor="#8a4010"/>
        </radialGradient>
        <linearGradient id="pantsGrad_cls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a6590"/>
          <stop offset="50%" stopColor="#3a4570"/>
          <stop offset="100%" stopColor="#1e2540"/>
        </linearGradient>
        <linearGradient id="jeoGrad_cls" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#fff8f0"/>
          <stop offset="100%" stopColor="#e8e0d5"/>
        </linearGradient>
        <filter id="shadow_cls" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35"/>
        </filter>
        <radialGradient id="groundShadow_cls" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="900" height="360" fill="#080808"/>
      <rect width="900" height="360" fill="url(#clsGlow)"/>
      <rect x="0" y="0" width="900" height="280" fill="#0a0900"/>
      <rect x="0" y="280" width="900" height="80" fill="#0d0b00"/>
      <rect x="0" y="250" width="900" height="6" fill="#ffff00" opacity="0.15"/>
      <rect x="180" y="20" width="540" height="160" rx="8" fill="#0d1a0d" stroke="#ffff00" strokeWidth="2"/>
      <rect x="192" y="32" width="516" height="136" rx="4" fill="#0a160a"/>
      <text x="280" y="85" textAnchor="middle" fontSize="52" fontWeight="900" fill="#ffff00" opacity="0.9">가나다</text>
      <text x="280" y="140" textAnchor="middle" fontSize="36" fontWeight="700" fill="#ffff00" opacity="0.6">라마바사</text>
      <text x="600" y="80" textAnchor="middle" fontSize="38" fontWeight="900" fill="#ffff00" opacity="0.7">아이우</text>
      <text x="600" y="120" textAnchor="middle" fontSize="26" fontWeight="700" fill="#ffff00" opacity="0.5">에오</text>
      <rect x="180" y="180" width="540" height="12" rx="3" fill="#1a1800"/>
      <rect x="250" y="182" width="18" height="7" rx="2" fill="#fff" opacity="0.7"/>
      <rect x="276" y="182" width="18" height="7" rx="2" fill="#ffff00" opacity="0.7"/>
      <rect x="730" y="30" width="130" height="120" rx="6" fill="#060810" stroke="#ffff00" strokeWidth="1.5" opacity="0.6"/>
      <line x1="795" y1="30" x2="795" y2="150" stroke="#ffff00" strokeWidth="1" opacity="0.3"/>
      <line x1="730" y1="90" x2="860" y2="90" stroke="#ffff00" strokeWidth="1" opacity="0.3"/>
      <circle cx="792" cy="70" r="20" fill="#ffff00" opacity="0.15"/>
      <circle cx="800" cy="63" r="15" fill="#080810" opacity="0.8"/>
      <rect x="100" y="270" width="280" height="22" rx="6" fill="#5a2e0e"/>
      <rect x="120" y="290" width="12" height="40" rx="3" fill="#3a1e08"/>
      <rect x="356" y="290" width="12" height="40" rx="3" fill="#3a1e08"/>
      <rect x="520" y="270" width="280" height="22" rx="6" fill="#5a2e0e"/>
      <rect x="540" y="290" width="12" height="40" rx="3" fill="#3a1e08"/>
      <rect x="776" y="290" width="12" height="40" rx="3" fill="#3a1e08"/>
      <rect x="180" y="252" width="80" height="18" rx="4" fill="#f5e6c0"/>
      <text x="220" y="265" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">ㄱ ㄴ ㄷ ㄹ</text>
      <rect x="590" y="252" width="80" height="18" rx="4" fill="#f5e6c0"/>
      <text x="630" y="265" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">ㅁ ㅂ ㅅ ㅇ</text>
      <ellipse cx="340" cy="265" rx="12" ry="8" fill="#222"/>
      <rect x="330" y="258" width="20" height="10" rx="3" fill="#333"/>
      <line x1="344" y1="255" x2="350" y2="240" stroke="#8B6914" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M344 255 L347 261 L340 261Z" fill="#111"/>
      <circle cx="138" cy="255" r="18" fill="url(#foxGrad_cls)"/>
      <path d="M126 243 L120 228 L132 242Z" fill="url(#foxGrad_cls)"/>
      <path d="M150 243 L156 228 L144 242Z" fill="url(#foxGrad_cls)"/>
      <ellipse cx="138" cy="261" rx="11" ry="8" fill="#f0b090"/>
      <circle cx="132" cy="253" r="4" fill="#111"/>
      <circle cx="144" cy="253" r="4" fill="#111"/>
      <circle cx="133" cy="251" r="1.5" fill="#fff"/>
      <circle cx="145" cy="251" r="1.5" fill="#fff"/>
      <path d="M133 260 Q138 265 143 260" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round"/>
      {/* JUNHO seated left — 3D */}
      <ellipse cx="248" cy="358" rx="64" ry="12" fill="url(#groundShadow_cls)"/>
      <g filter="url(#shadow_cls)">
        <path d="M220 240 L214 290 L250 290 L254 255 L260 255 L264 290 L296 290 L290 240Z" fill="url(#pantsGrad_cls)"/>
        <path d="M210 115 L202 248 L298 248 L290 115Z" fill="url(#tealGrad_cls)"/>
        <rect x="202" y="226" width="96" height="14" rx="5" fill="#8B1010"/>
        <path d="M250 115 L238 150" stroke="#40d4ca" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M250 115 L262 150" stroke="#40d4ca" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M290 135 L380 190 L388 180 L296 125Z" fill="url(#tealGrad_cls)"/>
        <ellipse cx="385" cy="185" rx="12" ry="12" fill="url(#faceGrad_cls)"/>
        <path d="M202 148 L175 210 L190 218 L216 158Z" fill="url(#tealGrad_cls)"/>
        <ellipse cx="178" cy="215" rx="11" ry="11" fill="url(#faceGrad_cls)"/>
        <rect x="242" y="97" width="16" height="22" rx="6" fill="url(#faceGrad_cls)"/>
        <ellipse cx="250" cy="74" rx="44" ry="46" fill="url(#faceGrad_cls)"/>
        <ellipse cx="236" cy="56" rx="13" ry="9" fill="#fff" opacity="0.35"/>
        <path d="M208 62 Q211 26 250 23 Q289 26 292 62 Q283 42 250 39 Q217 42 208 62Z" fill="url(#hairGrad_cls)"/>
        <path d="M216 52 Q238 42 268 46" fill="none" stroke="#6a6a6a" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
        <path d="M208 62 Q200 79 203 93" fill="none" stroke="#1a1a1a" strokeWidth="13" strokeLinecap="round"/>
        <path d="M292 62 Q300 79 297 93" fill="none" stroke="#1a1a1a" strokeWidth="13" strokeLinecap="round"/>
        <path d="M226 57 Q234 50 242 55" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        <path d="M258 55 Q266 50 274 57" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        <path d="M226 68 Q233 75 240 68" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M260 68 Q267 75 274 68" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="212" cy="86" r="14" fill="url(#blushGrad_cls)"/>
        <circle cx="288" cy="86" r="14" fill="url(#blushGrad_cls)"/>
      </g>
      {/* MIYA seated right — 3D */}
      <ellipse cx="656" cy="358" rx="58" ry="12" fill="url(#groundShadow_cls)"/>
      <g filter="url(#shadow_cls)">
        <path d="M622 165 Q614 265 630 295 L682 295 Q698 265 690 165Z" fill="url(#burgGrad_cls)"/>
        <path d="M614 272 Q655 280 696 272" fill="none" stroke="#a03060" strokeWidth="2.5" opacity="0.5"/>
        <path d="M622 130 L618 170 L694 170 L690 130Z" fill="url(#jeoGrad_cls)"/>
        <path d="M656 130 L644 158" stroke="#40d4ca" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M656 130 L668 158" stroke="#40d4ca" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M640 161 L648 172 L656 167 L664 172 L672 161 L664 168 L656 165 L648 168Z" fill="#C8102E"/>
        <path d="M618 142 L590 186 L604 196 L628 155Z" fill="url(#jeoGrad_cls)"/>
        <ellipse cx="592" cy="193" rx="12" ry="12" fill="url(#faceGrad_cls)"/>
        <path d="M690 142 L720 175 L710 183 L684 152Z" fill="url(#jeoGrad_cls)"/>
        <line x1="718" y1="173" x2="730" y2="152" stroke="#8B6914" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M718 173 L722 183 L712 183Z" fill="#111"/>
        <rect x="648" y="112" width="16" height="22" rx="6" fill="url(#faceGrad_cls)"/>
        <ellipse cx="656" cy="88" rx="40" ry="43" fill="url(#faceGrad_cls)"/>
        <ellipse cx="641" cy="70" rx="12" ry="9" fill="#fff" opacity="0.35"/>
        <path d="M618 78 Q620 46 656 43 Q692 46 694 78 Q686 60 656 58 Q626 60 618 78Z" fill="url(#hairGrad_cls)"/>
        <circle cx="656" cy="45" r="18" fill="url(#hairGrad_cls)"/>
        <path d="M626 62 Q646 52 674 56" fill="none" stroke="#6a6a6a" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="640" y1="38" x2="661" y2="34" stroke="#C8102E" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="640" cy="38" r="7" fill="#C8102E"/>
        <path d="M618 78 Q610 96 613 110" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round"/>
        <path d="M694 78 Q702 96 699 110" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round"/>
        <path d="M636 82 Q643 89 650 82" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M662 82 Q669 89 676 82" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M633 68 Q641 62 649 67" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M663 67 Q671 62 679 68" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="622" cy="99" r="13" fill="url(#blushGrad_cls)"/>
        <circle cx="690" cy="99" r="13" fill="url(#blushGrad_cls)"/>
      </g>
      <rect x="750" y="200" width="130" height="62" rx="14" fill="#ffff00"/>
      <path d="M762 262 L750 280 L778 262Z" fill="#ffff00"/>
      <text x="815" y="228" textAnchor="middle" fontSize="22" fontWeight="900" fill="#111">가나다</text>
      <text x="815" y="252" textAnchor="middle" fontSize="14" fontWeight="700" fill="#333">라마바사</text>
    </svg>
  );
}

/* ── Scene: Street — "Seoul at Night!" ── */
function SceneStreet({ h = 220, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 900 340" style={{ width:"100%", height:`${h}px`, display:"block", borderRadius:`${radius}px` }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="stGlow1" cx="20%" cy="30%" r="30%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="stGlow2" cx="80%" cy="30%" r="30%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        {/* 3D character gradients — street */}
        <radialGradient id="faceGrad_st" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde8cc"/>
          <stop offset="60%" stopColor="#f5c5a3"/>
          <stop offset="100%" stopColor="#d4956a"/>
        </radialGradient>
        <radialGradient id="blushGrad_st" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9999" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff6666" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="tealGrad_st" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40d4ca"/>
          <stop offset="40%" stopColor="#20B2AA"/>
          <stop offset="100%" stopColor="#0d6e68"/>
        </linearGradient>
        <linearGradient id="burgGrad_st" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a03060"/>
          <stop offset="40%" stopColor="#7B1A3A"/>
          <stop offset="100%" stopColor="#3d0d1d"/>
        </linearGradient>
        <linearGradient id="hairGrad_st" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a"/>
          <stop offset="30%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <radialGradient id="foxGrad_st" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e8904a"/>
          <stop offset="55%" stopColor="#D2691E"/>
          <stop offset="100%" stopColor="#8a4010"/>
        </radialGradient>
        <linearGradient id="pantsGrad_st" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a6590"/>
          <stop offset="50%" stopColor="#3a4570"/>
          <stop offset="100%" stopColor="#1e2540"/>
        </linearGradient>
        <linearGradient id="jeoGrad_st" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#fff8f0"/>
          <stop offset="100%" stopColor="#e8e0d5"/>
        </linearGradient>
        <filter id="shadow_st" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35"/>
        </filter>
        <radialGradient id="groundShadow_st" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="900" height="340" fill="#040408"/>
      <rect width="900" height="340" fill="url(#stGlow1)"/>
      <rect width="900" height="340" fill="url(#stGlow2)"/>
      <circle cx="450" cy="50" r="32" fill="#ffff00" opacity="0.08"/>
      <circle cx="450" cy="50" r="22" fill="#ffff00" opacity="0.08"/>
      <rect x="0"   y="20"  width="160" height="260" fill="#090909" stroke="#ffff00" strokeWidth="0.6" opacity="0.5"/>
      <rect x="165" y="50"  width="110" height="230" fill="#090909" stroke="#ffff00" strokeWidth="0.6" opacity="0.45"/>
      <rect x="280" y="35"  width="80"  height="245" fill="#090909" stroke="#ffff00" strokeWidth="0.6" opacity="0.4"/>
      <rect x="540" y="30"  width="80"  height="250" fill="#090909" stroke="#ffff00" strokeWidth="0.6" opacity="0.4"/>
      <rect x="625" y="48"  width="110" height="232" fill="#090909" stroke="#ffff00" strokeWidth="0.6" opacity="0.45"/>
      <rect x="740" y="18"  width="160" height="262" fill="#090909" stroke="#ffff00" strokeWidth="0.6" opacity="0.5"/>
      {[[20,50],[20,90],[20,130],[50,50],[50,90],[50,130],[80,70],[80,110],[110,50],[110,90]].map(([wx,wy],i)=>(
        <rect key={i} x={wx} y={wy} width="18" height="12" rx="1" fill="#ffff00" opacity={0.1+i*0.02}/>
      ))}
      {[[760,45],[760,85],[760,125],[800,45],[800,85],[800,125],[830,65],[830,105]].map(([wx,wy],i)=>(
        <rect key={i} x={wx} y={wy} width="18" height="12" rx="1" fill="#ffff00" opacity={0.12+i*0.02}/>
      ))}
      <rect x="8"   y="62"  width="120" height="35" rx="5" fill="#050500" stroke="#ffff00" strokeWidth="2.5"/>
      <text x="68"  y="86"  textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffff00">한글학원</text>
      <rect x="8"   y="110" width="95"  height="26" rx="4" fill="#050500" stroke="#ffff00" strokeWidth="1.8" opacity="0.8"/>
      <text x="55"  y="128" textAnchor="middle" fontSize="16" fontWeight="700" fill="#ffff00" opacity="0.85">서울시</text>
      <rect x="172" y="62"  width="92"  height="30" rx="4" fill="#050500" stroke="#ffff00" strokeWidth="2"/>
      <text x="218" y="83"  textAnchor="middle" fontSize="18" fontWeight="900" fill="#ffff00">노래방</text>
      <rect x="172" y="100" width="80"  height="24" rx="4" fill="#050500" stroke="#ffff00" strokeWidth="1.5" opacity="0.7"/>
      <text x="212" y="116" textAnchor="middle" fontSize="14" fontWeight="700" fill="#ffff00" opacity="0.8">PC방</text>
      <rect x="750" y="58"  width="110" height="33" rx="5" fill="#050500" stroke="#ffff00" strokeWidth="2.5"/>
      <text x="805" y="80"  textAnchor="middle" fontSize="20" fontWeight="900" fill="#ffff00">편의점</text>
      <rect x="632" y="62"  width="80"  height="26" rx="4" fill="#050500" stroke="#ffff00" strokeWidth="2"/>
      <text x="672" y="80"  textAnchor="middle" fontSize="16" fontWeight="900" fill="#ffff00">치킨</text>
      <rect x="0" y="278" width="900" height="62" fill="#0d0d00"/>
      <rect x="0" y="278" width="900" height="4"  fill="#ffff00" opacity="0.2"/>
      {[80,200,350,500,650,800].map((lx,i)=>(
        <rect key={i} x={lx} y="295" width="50" height="5" rx="2" fill="#ffff00" opacity="0.12"/>
      ))}
      <line x1="365" y1="20" x2="365" y2="280" stroke="#ffff00" strokeWidth="2.5" opacity="0.3"/>
      <ellipse cx="365" cy="22" rx="30" ry="10" fill="#ffff00" opacity="0.2"/>
      <ellipse cx="365" cy="22" rx="50" ry="22" fill="#ffff00" opacity="0.05"/>
      <line x1="535" y1="20" x2="535" y2="280" stroke="#ffff00" strokeWidth="2.5" opacity="0.3"/>
      <ellipse cx="535" cy="22" rx="30" ry="10" fill="#ffff00" opacity="0.2"/>
      <ellipse cx="535" cy="22" rx="50" ry="22" fill="#ffff00" opacity="0.05"/>
      {/* JUNHO medium left — 3D */}
      <ellipse cx="388" cy="320" rx="52" ry="12" fill="url(#groundShadow_st)"/>
      <g filter="url(#shadow_st)">
        <path d="M365 200 L360 312 L378 312 L381 238 L387 238 L390 312 L408 312 L403 200Z" fill="url(#pantsGrad_st)"/>
        <ellipse cx="367" cy="313" rx="16" ry="6" fill="#1a1508"/>
        <ellipse cx="400" cy="313" rx="16" ry="6" fill="#1a1508"/>
        <path d="M356 120 L348 205 L428 205 L420 120Z" fill="url(#tealGrad_st)"/>
        <rect x="348" y="186" width="80" height="12" rx="4" fill="#8B1010"/>
        <path d="M388 120 L378 148" stroke="#40d4ca" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
        <path d="M388 120 L398 148" stroke="#40d4ca" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
        <path d="M348 136 L290 95 L284 103 L344 146Z" fill="url(#tealGrad_st)"/>
        <ellipse cx="285" cy="99" rx="11" ry="11" fill="url(#faceGrad_st)"/>
        <path d="M420 136 L456 170 L464 160 L428 124Z" fill="url(#tealGrad_st)"/>
        {/* Fox basket */}
        <path d="M452 162 Q472 150 492 162 Q496 182 472 190 Q448 182 452 162Z" fill="#8B6408"/>
        <circle cx="472" cy="170" r="16" fill="url(#foxGrad_st)"/>
        <path d="M462 160 L456 144 L468 158Z" fill="url(#foxGrad_st)"/>
        <path d="M482 160 L488 144 L476 158Z" fill="url(#foxGrad_st)"/>
        <ellipse cx="472" cy="177" rx="10" ry="8" fill="#f0b090"/>
        <circle cx="467" cy="168" r="3.5" fill="#111"/>
        <circle cx="477" cy="168" r="3.5" fill="#111"/>
        <circle cx="468" cy="166" r="1.5" fill="#fff"/>
        <circle cx="478" cy="166" r="1.5" fill="#fff"/>
        <rect x="382" y="103" width="12" height="20" rx="5" fill="url(#faceGrad_st)"/>
        <ellipse cx="388" cy="82" rx="36" ry="38" fill="url(#faceGrad_st)"/>
        <ellipse cx="375" cy="65" rx="11" ry="8" fill="#fff" opacity="0.35"/>
        <path d="M354 70 Q357 36 388 33 Q419 36 422 70 Q414 52 388 49 Q362 52 354 70Z" fill="url(#hairGrad_st)"/>
        <path d="M362 60 Q382 50 410 54" fill="none" stroke="#6a6a6a" strokeWidth="3.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M354 70 Q346 86 349 100" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M422 70 Q430 86 427 100" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M367 79 Q374 85 381 79" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <path d="M395 79 Q402 85 409 79" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="345" cy="94" r="12" fill="url(#blushGrad_st)"/>
        <circle cx="431" cy="94" r="12" fill="url(#blushGrad_st)"/>
      </g>
      {/* MIYA medium right — 3D */}
      <ellipse cx="545" cy="320" rx="48" ry="12" fill="url(#groundShadow_st)"/>
      <g filter="url(#shadow_st)">
        <path d="M516 172 Q508 280 520 314 L568 314 Q580 280 572 172Z" fill="url(#burgGrad_st)"/>
        <path d="M508 265 Q544 273 580 265" fill="none" stroke="#a03060" strokeWidth="2.5" opacity="0.55"/>
        <path d="M516 136 L512 178 L576 178 L572 136Z" fill="url(#jeoGrad_st)"/>
        <path d="M544 136 L534 162" stroke="#40d4ca" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
        <path d="M544 136 L554 162" stroke="#40d4ca" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
        <path d="M530 165 L537 177 L544 172 L551 177 L558 165 L551 172 L544 169 L537 172Z" fill="#C8102E"/>
        <path d="M512 148 L490 185 L502 193 L520 160Z" fill="url(#jeoGrad_st)"/>
        <ellipse cx="492" cy="190" rx="11" ry="11" fill="url(#faceGrad_st)"/>
        <path d="M572 148 L596 175 L586 183 L568 158Z" fill="url(#jeoGrad_st)"/>
        <ellipse cx="600" cy="180" rx="10" ry="10" fill="url(#faceGrad_st)"/>
        <rect x="537" y="118" width="12" height="20" rx="5" fill="url(#faceGrad_st)"/>
        <ellipse cx="543" cy="97" rx="34" ry="37" fill="url(#faceGrad_st)"/>
        <ellipse cx="530" cy="80" rx="10" ry="7" fill="#fff" opacity="0.35"/>
        <path d="M510 86 Q512 53 543 50 Q574 53 576 86 Q568 68 543 65 Q518 68 510 86Z" fill="url(#hairGrad_st)"/>
        <circle cx="543" cy="52" r="16" fill="url(#hairGrad_st)"/>
        <path d="M518 70 Q536 60 562 64" fill="none" stroke="#6a6a6a" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="528" y1="44" x2="548" y2="40" stroke="#C8102E" strokeWidth="4.5" strokeLinecap="round"/>
        <circle cx="528" cy="44" r="6" fill="#C8102E"/>
        <path d="M510 86 Q502 102 505 116" fill="none" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="round"/>
        <path d="M576 86 Q584 102 581 116" fill="none" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="round"/>
        <path d="M522 94 Q529 100 536 94" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <path d="M550 94 Q557 100 564 94" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="502" cy="110" r="12" fill="url(#blushGrad_st)"/>
        <circle cx="584" cy="110" r="12" fill="url(#blushGrad_st)"/>
      </g>
      <rect x="596" y="60" width="160" height="52" rx="14" fill="#ffff00"/>
      <path d="M608 112 L596 130 L624 112Z" fill="#ffff00"/>
      <text x="676" y="86" textAnchor="middle" fontSize="17" fontWeight="900" fill="#111">저기요!</text>
      <text x="676" y="103" textAnchor="middle" fontSize="13" fontWeight="700" fill="#333">Excuse me!</text>
    </svg>
  );
}

/* ── Scene: Concert — "K-Pop Night!" ── */
function SceneConcert({ h = 220, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 900 340" style={{ width:"100%", height:`${h}px`, display:"block", borderRadius:`${radius}px` }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="concGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        {/* 3D character gradients — concert */}
        <radialGradient id="faceGrad_cc" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde8cc"/>
          <stop offset="60%" stopColor="#f5c5a3"/>
          <stop offset="100%" stopColor="#d4956a"/>
        </radialGradient>
        <radialGradient id="blushGrad_cc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9999" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff6666" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="tealGrad_cc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40d4ca"/>
          <stop offset="40%" stopColor="#20B2AA"/>
          <stop offset="100%" stopColor="#0d6e68"/>
        </linearGradient>
        <linearGradient id="burgGrad_cc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a03060"/>
          <stop offset="40%" stopColor="#7B1A3A"/>
          <stop offset="100%" stopColor="#3d0d1d"/>
        </linearGradient>
        <linearGradient id="hairGrad_cc" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a"/>
          <stop offset="30%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <linearGradient id="jeoGrad_cc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#fff8f0"/>
          <stop offset="100%" stopColor="#e8e0d5"/>
        </linearGradient>
        <filter id="shadow_cc" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35"/>
        </filter>
        <radialGradient id="groundShadow_cc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="900" height="340" fill="#040406"/>
      <rect width="900" height="340" fill="url(#concGlow)"/>
      <path d="M50 80 Q450 20 850 80" fill="none" stroke="#ffff00" strokeWidth="3" opacity="0.7"/>
      <rect x="50" y="80" width="800" height="120" fill="#0a0a00" stroke="#ffff00" strokeWidth="1.5" opacity="0.6"/>
      <ellipse cx="450" cy="200" rx="380" ry="40" fill="#ffff00" opacity="0.06"/>
      <rect x="80" y="85" width="740" height="75" fill="#0c0c00" stroke="#ffff00" strokeWidth="1" opacity="0.4"/>
      <text x="450" y="130" textAnchor="middle" fontSize="40" fontWeight="900" fill="#ffff00" opacity="0.3">한글</text>
      <text x="450" y="158" textAnchor="middle" fontSize="22" fontWeight="700" fill="#ffff00" opacity="0.2">KLOVERS LIVE</text>
      <rect x="50" y="198" width="800" height="14" fill="#1a1a00" stroke="#ffff00" strokeWidth="1.5"/>
      {[[160,0,200,198],[300,0,330,198],[450,0,450,198],[600,0,570,198],[740,0,700,198]].map(([x1,y1,x2,y2],i)=>(
        <path key={i} d={`M${x1} ${y1} L${x2-30} ${y2} L${x2+30} ${y2}Z`} fill="#ffff00" opacity="0.03"/>
      ))}
      {[160,300,450,600,740].map((lx,i)=>(
        <circle key={i} cx={lx} cy={i%2===0?4:10} r="8" fill="#ffff00" opacity="0.8"/>
      ))}
      {[250,450,650].map((px,i)=>(
        <g key={i}>
          <ellipse cx={px} cy={125} rx={i===1?14:11} ry={i===1?14:11} fill="#f5c5a3"/>
          <path d={`M${px-16} 130 L${px-14} 175 L${px+14} 175 L${px+16} 130Z`}
                fill={i===1?"#C8102E":i===0?"#20B2AA":"#7B1A3A"}/>
          <line x1={px-16} y1={138} x2={px-36} y2={110} stroke={i===1?"#C8102E":i===0?"#20B2AA":"#7B1A3A"} strokeWidth="6" strokeLinecap="round"/>
          <line x1={px+16} y1={138} x2={px+36} y2={110} stroke={i===1?"#C8102E":i===0?"#20B2AA":"#7B1A3A"} strokeWidth="6" strokeLinecap="round"/>
          <ellipse cx={px-40} cy={108} rx="9" ry="9" fill="#f5c5a3"/>
          <ellipse cx={px+40} cy={108} rx="9" ry="9" fill="#f5c5a3"/>
          <line x1={px+14} y1={120} x2={px+24} y2={100} stroke="#888" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx={px+24} cy={97} r="5" fill="#666"/>
        </g>
      ))}
      <rect x="0" y="212" width="900" height="128" fill="#050508"/>
      <rect x="0" y="212" width="900" height="4" fill="#ffff00" opacity="0.12"/>
      {/* JUNHO in crowd — 3D */}
      <ellipse cx="300" cy="330" rx="56" ry="12" fill="url(#groundShadow_cc)"/>
      <g filter="url(#shadow_cc)">
        <path d="M276 258 L272 325 L292 325 L295 278 L302 278 L305 325 L325 325 L320 258Z" fill="url(#tealGrad_cc)"/>
        <rect x="272" y="304" width="48" height="10" rx="4" fill="#8B1010"/>
        <ellipse cx="298" cy="238" rx="36" ry="38" fill="url(#faceGrad_cc)"/>
        <ellipse cx="285" cy="220" rx="11" ry="8" fill="#fff" opacity="0.35"/>
        <path d="M263 228 Q265 196 298 193 Q331 196 333 228 Q326 212 298 209 Q270 212 263 228Z" fill="url(#hairGrad_cc)"/>
        <path d="M271 217 Q290 207 318 211" fill="none" stroke="#6a6a6a" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <path d="M263 228 Q256 243 259 255" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M333 228 Q340 243 337 255" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M280 238 Q287 245 294 238" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <path d="M302 238 Q309 245 316 238" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="255" cy="250" r="12" fill="url(#blushGrad_cc)"/>
        <circle cx="341" cy="250" r="12" fill="url(#blushGrad_cc)"/>
        <path d="M276 268 L252 240 L244 248 L270 276Z" fill="url(#tealGrad_cc)"/>
        <line x1="250" y1="242" x2="234" y2="205" stroke="#ffff00" strokeWidth="3.5" strokeLinecap="round"/>
        <ellipse cx="233" cy="200" rx="8" ry="14" fill="#ffff00" opacity="0.95"/>
        <ellipse cx="233" cy="200" rx="14" ry="22" fill="#ffff00" opacity="0.22"/>
        <path d="M320 268 L342 250 L348 258 L326 275Z" fill="url(#tealGrad_cc)"/>
      </g>
      {/* MIYA in crowd — 3D */}
      <ellipse cx="600" cy="330" rx="52" ry="12" fill="url(#groundShadow_cc)"/>
      <g filter="url(#shadow_cc)">
        <path d="M570 240 Q562 300 574 325 L626 325 Q638 300 630 240Z" fill="url(#burgGrad_cc)"/>
        <ellipse cx="600" cy="232" rx="34" ry="36" fill="url(#faceGrad_cc)"/>
        <ellipse cx="587" cy="214" rx="10" ry="7" fill="#fff" opacity="0.35"/>
        <path d="M567 222 Q569 192 600 189 Q631 192 633 222 Q626 208 600 205 Q574 208 567 222Z" fill="url(#hairGrad_cc)"/>
        <circle cx="600" cy="192" r="16" fill="url(#hairGrad_cc)"/>
        <path d="M574 206 Q592 196 618 200" fill="none" stroke="#6a6a6a" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <circle cx="593" cy="187" r="6" fill="#C8102E"/>
        <path d="M567 222 Q560 238 562 250" fill="none" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="round"/>
        <path d="M633 222 Q640 238 637 250" fill="none" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="round"/>
        <path d="M582 232 Q589 239 596 232" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <path d="M604 232 Q611 239 618 232" fill="none" stroke="#5a3010" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="554" cy="246" r="11" fill="url(#blushGrad_cc)"/>
        <circle cx="646" cy="246" r="11" fill="url(#blushGrad_cc)"/>
        <path d="M630 250 L652 225 L658 235 L636 258Z" fill="url(#jeoGrad_cc)"/>
        <line x1="654" y1="228" x2="670" y2="190" stroke="#ffff00" strokeWidth="3.5" strokeLinecap="round"/>
        <ellipse cx="671" cy="184" rx="8" ry="14" fill="#ffff00" opacity="0.95"/>
        <ellipse cx="671" cy="184" rx="15" ry="24" fill="#ffff00" opacity="0.22"/>
        <path d="M570 250 L548 232 L542 240 L566 258Z" fill="url(#jeoGrad_cc)"/>
      </g>
      {[[100,270],[160,278],[200,265],[720,268],[780,275],[840,262],[450,285],[500,272],[140,290],[820,288]].map(([cx,cy],i)=>(
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={20} ry={20} fill="#ffff00" opacity="0.1"/>
          <rect x={cx-14} y={cy+18} width={28} height={30} rx="5" fill="#ffff00" opacity="0.06"/>
          <line x1={cx} y1={cy-20} x2={cx+(i%2===0?-7:7)} y2={cy-44} stroke="#ffff00" strokeWidth="2.5" opacity="0.35"/>
          <ellipse cx={cx+(i%2===0?-7:7)} cy={cy-50} rx={5} ry={8} fill="#ffff00" opacity="0.55"/>
        </g>
      ))}
    </svg>
  );
}

/* ── Scene: Teacher — "Junho Teaches 가나다!" ── */
function SceneTeacher({ h = 260, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 700 360" style={{ width:"100%", height:`${h}px`, display:"block", borderRadius:`${radius}px` }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tchGlow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        {/* 3D character gradients — teacher */}
        <radialGradient id="faceGrad_tc" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde8cc"/>
          <stop offset="60%" stopColor="#f5c5a3"/>
          <stop offset="100%" stopColor="#d4956a"/>
        </radialGradient>
        <radialGradient id="blushGrad_tc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9999" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff6666" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="tealGrad_tc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40d4ca"/>
          <stop offset="40%" stopColor="#20B2AA"/>
          <stop offset="100%" stopColor="#0d6e68"/>
        </linearGradient>
        <linearGradient id="hairGrad_tc" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a"/>
          <stop offset="30%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <radialGradient id="foxGrad_tc" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e8904a"/>
          <stop offset="55%" stopColor="#D2691E"/>
          <stop offset="100%" stopColor="#8a4010"/>
        </radialGradient>
        <linearGradient id="pantsGrad_tc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a6590"/>
          <stop offset="50%" stopColor="#3a4570"/>
          <stop offset="100%" stopColor="#1e2540"/>
        </linearGradient>
        <filter id="shadow_tc" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35"/>
        </filter>
        <radialGradient id="groundShadow_tc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="700" height="360" fill="#080800"/>
      <rect width="700" height="360" fill="url(#tchGlow)"/>
      <rect x="0" y="308" width="700" height="52" fill="#0d0b00"/>
      <rect x="0" y="308" width="700" height="4" fill="#ffff00" opacity="0.15"/>
      <rect x="0" y="0" width="700" height="310" fill="#090900"/>
      <rect x="0" y="280" width="700" height="5" fill="#ffff00" opacity="0.1"/>
      <rect x="380" y="28" width="290" height="195" rx="10" fill="#0a1400" stroke="#ffff00" strokeWidth="2.5"/>
      <rect x="394" y="42" width="262" height="167" rx="6" fill="#081000"/>
      <text x="525" y="148" textAnchor="middle" fontSize="90" fontWeight="900" fill="#ffff00" opacity="0.92">가</text>
      <text x="525" y="188" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffff00" opacity="0.6">ga</text>
      <rect x="380" y="221" width="290" height="16" rx="3" fill="#1a1800"/>
      <rect x="410" y="224" width="24" height="10" rx="3" fill="#fff" opacity="0.75"/>
      <rect x="442" y="224" width="24" height="10" rx="3" fill="#ffff00" opacity="0.7"/>
      <line x1="236" y1="152" x2="390" y2="130" stroke="#8B6914" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="394" cy="128" r="5" fill="#5a3800"/>
      <ellipse cx="72" cy="42" rx="20" ry="28" fill="#ffff00" opacity="0.7"/>
      <rect x="52" y="14" width="40" height="8" rx="3" fill="#ffff00" opacity="0.8"/>
      <rect x="52" y="70" width="40" height="8" rx="3" fill="#ffff00" opacity="0.8"/>
      <line x1="72" y1="6" x2="72" y2="14" stroke="#ffff00" strokeWidth="2.5"/>
      <line x1="72" y1="78" x2="72" y2="90" stroke="#C8102E" strokeWidth="2.5"/>
      {[26,36,46,56,66].map(y=>(
        <line key={y} x1={52} y1={y} x2={92} y2={y} stroke="#0a0800" strokeWidth="1.5" opacity="0.4"/>
      ))}
      <ellipse cx="630" cy="42" rx="20" ry="28" fill="#ffff00" opacity="0.7"/>
      <rect x="610" y="14" width="40" height="8" rx="3" fill="#ffff00" opacity="0.8"/>
      <rect x="610" y="70" width="40" height="8" rx="3" fill="#ffff00" opacity="0.8"/>
      <line x1="630" y1="6" x2="630" y2="14" stroke="#ffff00" strokeWidth="2.5"/>
      <line x1="630" y1="78" x2="630" y2="90" stroke="#C8102E" strokeWidth="2.5"/>
      {/* JUNHO big teaching pose — 3D */}
      <ellipse cx="218" cy="350" rx="72" ry="14" fill="url(#groundShadow_tc)"/>
      <g filter="url(#shadow_tc)">
        <path d="M186 218 L178 342 L202 342 L207 256 L216 256 L221 342 L248 342 L240 218Z" fill="url(#pantsGrad_tc)"/>
        <ellipse cx="185" cy="343" rx="20" ry="8" fill="#1a1508"/>
        <ellipse cx="240" cy="343" rx="20" ry="8" fill="#1a1508"/>
        <path d="M170 108 L160 225 L278 225 L268 108Z" fill="url(#tealGrad_tc)"/>
        <rect x="160" y="204" width="118" height="16" rx="6" fill="#8B1010"/>
        <path d="M218 108 L204 142" stroke="#40d4ca" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M218 108 L232 142" stroke="#40d4ca" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M268 124 L382 148 L378 160 L262 136Z" fill="url(#tealGrad_tc)"/>
        <ellipse cx="385" cy="154" rx="13" ry="13" fill="url(#faceGrad_tc)"/>
        <path d="M160 138 L122 196 L136 206 L172 150Z" fill="url(#tealGrad_tc)"/>
        {/* Fox basket */}
        <path d="M118 190 Q142 176 166 190 Q170 215 142 224 Q114 215 118 190Z" fill="#8B6408"/>
        <path d="M116 195 Q142 184 168 195" fill="none" stroke="#5a3800" strokeWidth="3"/>
        <circle cx="142" cy="200" r="22" fill="url(#foxGrad_tc)"/>
        <path d="M128 188 L121 168 L135 186Z" fill="url(#foxGrad_tc)"/>
        <path d="M156 188 L163 168 L148 186Z" fill="url(#foxGrad_tc)"/>
        <ellipse cx="142" cy="208" rx="14" ry="10" fill="#f0b090"/>
        <circle cx="135" cy="198" r="4.5" fill="#111"/>
        <circle cx="149" cy="198" r="4.5" fill="#111"/>
        <circle cx="136" cy="196" r="1.8" fill="#fff"/>
        <circle cx="150" cy="196" r="1.8" fill="#fff"/>
        <circle cx="142" cy="205" r="3" fill="#8B0000"/>
        <path d="M137 210 Q142 216 147 210" fill="none" stroke="#8B0000" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="168" cy="168" r="5" fill="#ffff00" opacity="0.5"/>
        <circle cx="178" cy="158" r="7" fill="#ffff00" opacity="0.45"/>
        <circle cx="190" cy="148" r="9" fill="#ffff00" opacity="0.4"/>
        <text x="208" y="142" textAnchor="middle" fontSize="14" fontWeight="900" fill="#ffff00" opacity="0.8">가?</text>
        {/* Junho head */}
        <rect x="210" y="88" width="16" height="24" rx="7" fill="url(#faceGrad_tc)"/>
        <ellipse cx="218" cy="62" rx="50" ry="52" fill="url(#faceGrad_tc)"/>
        <ellipse cx="202" cy="42" rx="16" ry="11" fill="#fff" opacity="0.35"/>
        <path d="M170 50 Q173 10 218 7 Q263 10 266 50 Q256 28 218 25 Q180 28 170 50Z" fill="url(#hairGrad_tc)"/>
        <path d="M178 40 Q202 28 238 32" fill="none" stroke="#6a6a6a" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
        <path d="M170 50 Q160 70 163 86" fill="none" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round"/>
        <path d="M266 50 Q276 70 273 86" fill="none" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round"/>
        <path d="M197 68 Q205 75 213 68" fill="none" stroke="#5a3010" strokeWidth="4" strokeLinecap="round"/>
        <path d="M223 68 Q231 75 239 68" fill="none" stroke="#5a3010" strokeWidth="4" strokeLinecap="round"/>
        <path d="M184 50 Q194 44 204 48" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        <path d="M232 48 Q242 44 252 50" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="174" cy="76" r="16" fill="url(#blushGrad_tc)"/>
        <circle cx="262" cy="76" r="16" fill="url(#blushGrad_tc)"/>
      </g>
    </svg>
  );
}

/* ── Scene: Food — "Let's Eat Korean Food!" ── */
function SceneFood({ h = 200, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <svg viewBox="0 0 900 320" style={{ width:"100%", height:`${h}px`, display:"block", borderRadius:`${radius}px` }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="foodGlow" cx="50%" cy="65%" r="55%">
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#ffff00" stopOpacity="0"/>
        </radialGradient>
        {/* 3D character gradients — food */}
        <radialGradient id="faceGrad_fd" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde8cc"/>
          <stop offset="60%" stopColor="#f5c5a3"/>
          <stop offset="100%" stopColor="#d4956a"/>
        </radialGradient>
        <radialGradient id="blushGrad_fd" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff9999" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff6666" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="tealGrad_fd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40d4ca"/>
          <stop offset="40%" stopColor="#20B2AA"/>
          <stop offset="100%" stopColor="#0d6e68"/>
        </linearGradient>
        <linearGradient id="burgGrad_fd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a03060"/>
          <stop offset="40%" stopColor="#7B1A3A"/>
          <stop offset="100%" stopColor="#3d0d1d"/>
        </linearGradient>
        <linearGradient id="hairGrad_fd" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a3a"/>
          <stop offset="30%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#080808"/>
        </linearGradient>
        <linearGradient id="jeoGrad_fd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#fff8f0"/>
          <stop offset="100%" stopColor="#e8e0d5"/>
        </linearGradient>
        <filter id="shadow_fd" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35"/>
        </filter>
        <radialGradient id="groundShadow_fd" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="900" height="320" fill="#080808"/>
      <rect width="900" height="320" fill="url(#foodGlow)"/>
      <rect x="0" y="0" width="900" height="240" fill="#0a0800"/>
      <rect x="0" y="240" width="900" height="80" fill="#0d0a00"/>
      <rect x="0" y="240" width="900" height="4" fill="#ffff00" opacity="0.12"/>
      <rect x="300" y="8" width="300" height="40" rx="8" fill="#050500" stroke="#ffff00" strokeWidth="2"/>
      <text x="450" y="34" textAnchor="middle" fontSize="20" fontWeight="900" fill="#ffff00">한식당 Korean Kitchen</text>
      <ellipse cx="130" cy="52" rx="22" ry="30" fill="#C8102E" opacity="0.85"/>
      <rect x="108" y="22" width="44" height="8" rx="3" fill="#C8102E" opacity="0.9"/>
      <rect x="108" y="82" width="44" height="8" rx="3" fill="#C8102E" opacity="0.9"/>
      <line x1="130" y1="14" x2="130" y2="22" stroke="#ffff00" strokeWidth="2.5"/>
      <line x1="130" y1="90" x2="130" y2="100" stroke="#ffff00" strokeWidth="2"/>
      <ellipse cx="770" cy="52" rx="22" ry="30" fill="#C8102E" opacity="0.85"/>
      <rect x="748" y="22" width="44" height="8" rx="3" fill="#C8102E" opacity="0.9"/>
      <rect x="748" y="82" width="44" height="8" rx="3" fill="#C8102E" opacity="0.9"/>
      <line x1="770" y1="14" x2="770" y2="22" stroke="#ffff00" strokeWidth="2.5"/>
      <line x1="770" y1="90" x2="770" y2="100" stroke="#ffff00" strokeWidth="2"/>
      <rect x="210" y="218" width="480" height="26" rx="8" fill="#6B3A1F"/>
      <rect x="230" y="242" width="14" height="48" rx="4" fill="#4a2810"/>
      <rect x="656" y="242" width="14" height="48" rx="4" fill="#4a2810"/>
      <rect x="218" y="220" width="464" height="4" rx="2" fill="#8B5010" opacity="0.5"/>
      <ellipse cx="450" cy="220" rx="52" ry="18" fill="#2a2200"/>
      <ellipse cx="450" cy="215" rx="46" ry="14" fill="#3a3200"/>
      <ellipse cx="450" cy="211" rx="36" ry="10" fill="#555"/>
      <circle cx="450" cy="208" r="12" fill="#ffff00" opacity="0.45"/>
      <ellipse cx="440" cy="205" rx="8" ry="4" fill="#8B1010" opacity="0.8"/>
      <ellipse cx="460" cy="205" rx="8" ry="4" fill="#228B22" opacity="0.8"/>
      <ellipse cx="330" cy="222" rx="32" ry="11" fill="#6B0000"/>
      <ellipse cx="330" cy="218" rx="26" ry="8" fill="#8B1010"/>
      <ellipse cx="330" cy="215" rx="20" ry="6" fill="#aa2020"/>
      <ellipse cx="570" cy="222" rx="32" ry="11" fill="#6B0000"/>
      <ellipse cx="570" cy="218" rx="26" ry="8" fill="#9B1A1A"/>
      <ellipse cx="564" cy="215" rx="8" ry="4" fill="#cc3030" opacity="0.9"/>
      <ellipse cx="576" cy="216" rx="8" ry="4" fill="#cc3030" opacity="0.9"/>
      <ellipse cx="450" cy="235" rx="16" ry="8" fill="#3a2800" opacity="0.6"/>
      <line x1="390" y1="195" x2="404" y2="222" stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/>
      <line x1="398" y1="192" x2="411" y2="219" stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/>
      <path d="M446 204 Q442 194 446 184 Q450 174 446 164" fill="none" stroke="#fff" strokeWidth="2" opacity="0.2" strokeLinecap="round"/>
      <path d="M454 204 Q458 194 454 184 Q450 174 454 164" fill="none" stroke="#fff" strokeWidth="2" opacity="0.2" strokeLinecap="round"/>
      {/* JUNHO seated left — 3D */}
      <ellipse cx="278" cy="310" rx="58" ry="12" fill="url(#groundShadow_fd)"/>
      <g filter="url(#shadow_fd)">
        <path d="M250 190 L244 300 L268 300 L272 222 L278 222 L282 300 L308 300 L302 190Z" fill="url(#tealGrad_fd)"/>
        <rect x="244" y="278" width="64" height="12" rx="4" fill="#8B1010"/>
        <path d="M302 202 L338 192 L335 182 L298 193Z" fill="url(#tealGrad_fd)"/>
        <ellipse cx="341" cy="187" rx="10" ry="10" fill="url(#faceGrad_fd)"/>
        <line x1="338" y1="185" x2="354" y2="210" stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/>
        <line x1="344" y1="182" x2="360" y2="208" stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/>
        <path d="M244 205 L212 230 L220 240 L250 216Z" fill="url(#tealGrad_fd)"/>
        <ellipse cx="210" cy="236" rx="10" ry="10" fill="url(#faceGrad_fd)"/>
        <rect x="270" y="168" width="14" height="24" rx="6" fill="url(#faceGrad_fd)"/>
        <ellipse cx="277" cy="143" rx="42" ry="44" fill="url(#faceGrad_fd)"/>
        <ellipse cx="263" cy="124" rx="13" ry="9" fill="#fff" opacity="0.35"/>
        <path d="M237 132 Q239 98 277 95 Q315 98 317 132 Q309 115 277 112 Q245 115 237 132Z" fill="url(#hairGrad_fd)"/>
        <path d="M245 121 Q266 110 296 114" fill="none" stroke="#6a6a6a" strokeWidth="3.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M237 132 Q229 148 232 162" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round"/>
        <path d="M317 132 Q325 148 322 162" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round"/>
        <path d="M258 142 Q265 150 272 142" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M282 142 Q289 150 296 142" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="228" cy="157" r="14" fill="url(#blushGrad_fd)"/>
        <circle cx="326" cy="157" r="14" fill="url(#blushGrad_fd)"/>
        <path d="M260 158 Q277 170 294 158" fill="none" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* MIYA seated right — 3D */}
      <ellipse cx="624" cy="310" rx="56" ry="12" fill="url(#groundShadow_fd)"/>
      <g filter="url(#shadow_fd)">
        <path d="M592 182 Q584 280 597 300 L650 300 Q663 280 655 182Z" fill="url(#burgGrad_fd)"/>
        <path d="M584 268 Q624 276 664 268" fill="none" stroke="#a03060" strokeWidth="2.5" opacity="0.5"/>
        <path d="M592 194 L558 222 L565 232 L598 205Z" fill="url(#jeoGrad_fd)"/>
        <ellipse cx="555" cy="228" rx="10" ry="10" fill="url(#faceGrad_fd)"/>
        <path d="M655 194 L680 215 L672 225 L650 205Z" fill="url(#jeoGrad_fd)"/>
        <ellipse cx="683" cy="220" rx="10" ry="10" fill="url(#faceGrad_fd)"/>
        <path d="M593 156 L588 188 L660 188 L655 156Z" fill="url(#jeoGrad_fd)"/>
        <path d="M624 156 L613 180" stroke="#40d4ca" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M624 156 L635 180" stroke="#40d4ca" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <rect x="616" y="136" width="14" height="22" rx="5" fill="url(#faceGrad_fd)"/>
        <ellipse cx="623" cy="112" rx="40" ry="42" fill="url(#faceGrad_fd)"/>
        <ellipse cx="609" cy="93" rx="12" ry="8" fill="#fff" opacity="0.35"/>
        <path d="M584 100 Q586 68 623 65 Q660 68 662 100 Q654 82 623 79 Q592 82 584 100Z" fill="url(#hairGrad_fd)"/>
        <circle cx="623" cy="68" r="18" fill="url(#hairGrad_fd)"/>
        <path d="M592 84 Q610 74 638 78" fill="none" stroke="#6a6a6a" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="606" y1="60" x2="628" y2="55" stroke="#C8102E" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="606" cy="60" r="7" fill="#C8102E"/>
        <path d="M584 100 Q575 118 578 132" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M662 100 Q671 118 668 132" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M603 112 Q611 119 619 112" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M627 112 Q635 119 643 112" fill="none" stroke="#5a3010" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="576" cy="124" r="13" fill="url(#blushGrad_fd)"/>
        <circle cx="670" cy="124" r="13" fill="url(#blushGrad_fd)"/>
        <path d="M606 126 Q623 140 640 126" fill="none" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
      </g>
      <rect x="676" y="70" width="190" height="60" rx="14" fill="#ffff00"/>
      <path d="M690 130 L676 150 L706 130Z" fill="#ffff00"/>
      <text x="771" y="98" textAnchor="middle" fontSize="22" fontWeight="900" fill="#111">맛있어! 😋</text>
      <text x="771" y="120" textAnchor="middle" fontSize="15" fontWeight="700" fill="#333">Delicious!</text>
    </svg>
  );
}

/* ── Story Page — Arabic ── */
function StoryPageAr() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", padding:"0",
      boxSizing:"border-box", background:"#0a0800",
      position:"relative", pageBreakAfter:"always", breakAfter:"page",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      overflow:"hidden",
    }}>
      {/* top stripe */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:"#FFFF00" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:"#111111" }} />

      {/* Title */}
      <div style={{ textAlign:"center", marginBottom:"18px", zIndex:2, direction:"rtl", padding:"0 20mm" }}>
        <div style={{ fontSize:"11px", fontWeight:900, color:"#FFFF00", letterSpacing:"4px", textTransform:"uppercase", marginBottom:"6px", opacity:0.7 }}>قصة كلوفرز</div>
        <div style={{ fontSize:"26px", fontWeight:900, color:"#fff", lineHeight:1.2, marginBottom:"6px" }}>
          تعرّف على جونهو وميا 🇰🇷
        </div>
        <div style={{ fontSize:"12px", color:"#aaa", lineHeight:1.7 }}>
          مرحباً بك في رحلة تعلم الهانغول مع رفيقَيك الكوريَّيْن — جونهو وميا.
          تابع مغامراتهما من شوارع سيول إلى قاعة الدراسة، وتعلَّم الكورية بطريقة تجعلك تعيشها!
        </div>
      </div>

      {/* Video */}
      <div style={{
        width:"calc(210mm - 30mm)", borderRadius:"16px",
        overflow:"hidden", border:"3px solid #FFFF00",
        boxShadow:"0 0 40px rgba(255,255,0,0.2)",
        zIndex:2, position:"relative",
      }}>
        <video
          src="/videos/klovers-story.mp4"
          controls
          autoPlay
          muted
          loop
          playsInline
          style={{ width:"100%", display:"block", maxHeight:"340px", objectFit:"cover" }}
        />
      </div>

      {/* Character labels */}
      <div style={{ display:"flex", gap:"40px", marginTop:"20px", zIndex:2, direction:"rtl" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px" }}>🧑‍🎓</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#20B2AA" }}>جونهو</div>
          <div style={{ fontSize:"10px", color:"#777" }}>Junho</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px" }}>🦊</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#D2691E" }}>ثعلب غوميهو</div>
          <div style={{ fontSize:"10px", color:"#777" }}>The Gumiho Fox</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px" }}>👩‍🎓</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#7B1A3A" }}>ميا</div>
          <div style={{ fontSize:"10px", color:"#777" }}>Miya</div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div style={{ position:"absolute", bottom:"16px", left:0, right:0, textAlign:"center", fontSize:"10px", color:"#444", zIndex:2 }}>
        klovers.academy • تعلم الكورية مع كلوفرز
      </div>
    </div>
  );
}

/* ── Story Page — English ── */
function StoryPageEn() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", padding:"0",
      boxSizing:"border-box", background:"#0a0800",
      position:"relative", pageBreakAfter:"always", breakAfter:"page",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:"#FFFF00" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:"#111111" }} />

      <div style={{ textAlign:"center", marginBottom:"18px", zIndex:2, padding:"0 20mm" }}>
        <div style={{ fontSize:"11px", fontWeight:900, color:"#FFFF00", letterSpacing:"4px", textTransform:"uppercase", marginBottom:"6px", opacity:0.7 }}>The Klovers Story</div>
        <div style={{ fontSize:"26px", fontWeight:900, color:"#fff", lineHeight:1.2, marginBottom:"6px" }}>
          Meet Junho & Miya 🇰🇷
        </div>
        <div style={{ fontSize:"12px", color:"#aaa", lineHeight:1.7 }}>
          Welcome to your Hangul journey with your Korean companions — Junho and Miya.
          Follow their adventures from the streets of Seoul to the classroom, and learn Korean by living it!
        </div>
      </div>

      <div style={{
        width:"calc(210mm - 30mm)", borderRadius:"16px",
        overflow:"hidden", border:"3px solid #FFFF00",
        boxShadow:"0 0 40px rgba(255,255,0,0.2)",
        zIndex:2, position:"relative",
      }}>
        <video
          src="/videos/klovers-story.mp4"
          controls
          autoPlay
          muted
          loop
          playsInline
          style={{ width:"100%", display:"block", maxHeight:"340px", objectFit:"cover" }}
        />
      </div>

      <div style={{ display:"flex", gap:"40px", marginTop:"20px", zIndex:2 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px" }}>🧑‍🎓</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#20B2AA" }}>Junho</div>
          <div style={{ fontSize:"10px", color:"#777" }}>Our Korean guide</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px" }}>🦊</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#D2691E" }}>Gumiho Fox</div>
          <div style={{ fontSize:"10px", color:"#777" }}>The magical fox</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"18px" }}>👩‍🎓</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#7B1A3A" }}>Miya</div>
          <div style={{ fontSize:"10px", color:"#777" }}>Your learning partner</div>
        </div>
      </div>

      <div style={{ position:"absolute", bottom:"16px", left:0, right:0, textAlign:"center", fontSize:"10px", color:"#444", zIndex:2 }}>
        klovers.academy • Learn Korean with Klovers
      </div>
    </div>
  );
}

type Lang = "ar" | "en";

/* ══════════════════════════════════════════════════
   DATA — consonants (separate Arabic / English fields)
══════════════════════════════════════════════════ */
const CONSONANTS = [
  {
    char:"ㄱ", roman:"g / k", emoji:"🔫",
    strokes:["① →","② ↓"],
    arDialect:"زي 'ك' في كتاب، أو 'ج' في جمال (المصري)",
    en:{ name:"Giyeok", sound:"Like 'g' in go; 'k' at end of syllable", mnemonic:"A bent arm holding a GUN — fires a 'G' sound", eq:"g / k", ex:[{k:"가방",r:"ga-bang",m:"bag"},{k:"고양이",r:"go-yang-i",m:"cat"}] },
    ar:{ name:"جييوك", sound:"مثل 'ك' في كلمة / 'ق' في قلم", mnemonic:"ذراع منحنية تمسك مسدساً — صوت 'ك'", eq:"ك / ق", ex:[{k:"가방",r:"غا-بانغ",m:"حقيبة"},{k:"고양이",r:"غو-يانغ-إي",m:"قط"}] },
  },
  {
    char:"ㄴ", roman:"n", emoji:"👃",
    strokes:["① ↓","② →"],
    arDialect:"زي حرف 'ن' المصري تماماً — ماشي!",
    en:{ name:"Nieun", sound:"Like 'n' in no", mnemonic:"A NOSE seen from the side — tip points right", eq:"n", ex:[{k:"나비",r:"na-bi",m:"butterfly"},{k:"눈",r:"nun",m:"eye / snow"}] },
    ar:{ name:"نييون", sound:"مثل 'ن' في نعم", mnemonic:"أنف من الجانب — طرفه يشير لليمين", eq:"ن", ex:[{k:"나비",r:"نا-بي",m:"فراشة"},{k:"눈",r:"نون",m:"عين / ثلج"}] },
  },
  {
    char:"ㄷ", roman:"d / t", emoji:"🚪",
    strokes:["① →","② ↓","③ →"],
    arDialect:"زي 'د' في دار — خفيفة زي الدال المصري",
    en:{ name:"Digeut", sound:"Like 'd' in door; 't' at end", mnemonic:"An open DOOR frame viewed from above", eq:"d / t", ex:[{k:"달",r:"dal",m:"moon"},{k:"도시",r:"do-si",m:"city"}] },
    ar:{ name:"ديغوت", sound:"مثل 'د' في دار / 'ت' في النهاية", mnemonic:"إطار باب مفتوح ينظر إليه من الأعلى", eq:"د / ت", ex:[{k:"달",r:"دال",m:"قمر"},{k:"도시",r:"دو-سي",m:"مدينة"}] },
  },
  {
    char:"ㄹ", roman:"r / l", emoji:"🎢",
    strokes:["① →","② ↓","③ ↗","④ →","⑤ ↓"],
    arDialect:"مش راء ومش لام — في النص. جرّب تقول 'رل' بسرعة!",
    en:{ name:"Rieul", sound:"A flap sound — tongue between R and L", mnemonic:"A ROLLER-COASTER track, rolling between R and L", eq:"r / l", ex:[{k:"라면",r:"ra-myeon",m:"ramen"},{k:"사랑",r:"sa-rang",m:"love"}] },
    ar:{ name:"ريول", sound:"بين 'ر' و'ل' — طرف اللسان يرتد سريعاً", mnemonic:"مسار أفعوانية — يتحرك بين الراء واللام", eq:"ر / ل", ex:[{k:"라면",r:"را-ميون",m:"رامن"},{k:"사랑",r:"سا-رانغ",m:"حب"}] },
  },
  {
    char:"ㅁ", roman:"m", emoji:"👄",
    strokes:["① ↓","② →","③ ↑","④ →"],
    arDialect:"زي 'م' في ماما — سهلة جداً!",
    en:{ name:"Mieum", sound:"Like 'm' in mom", mnemonic:"A square MOUTH sealed shut — M for Mouth", eq:"m", ex:[{k:"물",r:"mul",m:"water"},{k:"마음",r:"ma-eum",m:"heart/mind"}] },
    ar:{ name:"مييوم", sound:"مثل 'م' في ماء", mnemonic:"فم مربع مغلق تماماً — م للفم", eq:"م", ex:[{k:"물",r:"مول",m:"ماء"},{k:"마음",r:"ما-أوم",m:"قلب"}] },
  },
  {
    char:"ㅂ", roman:"b / p", emoji:"📦",
    strokes:["① ↓","② ↓","③ →","④ →"],
    arDialect:"زي 'ب' في بيت — لكن أخف شوية",
    en:{ name:"Bieup", sound:"Like 'b' in boy; 'p' at end", mnemonic:"A BOX with arms — B for Box sealed shut", eq:"b / p", ex:[{k:"밥",r:"bap",m:"rice"},{k:"버스",r:"beo-seu",m:"bus"}] },
    ar:{ name:"بييوب", sound:"مثل 'ب' في بيت / 'پ' في النهاية", mnemonic:"صندوق مع ذراعين — ب للصندوق المغلق", eq:"ب / پ", ex:[{k:"밥",r:"باب",m:"أرز"},{k:"버스",r:"بو-سو",m:"أتوبيس"}] },
  },
  {
    char:"ㅅ", roman:"s", emoji:"⛰️",
    strokes:["① ↘","② ↙"],
    arDialect:"زي 'س' في سلام — صافية وواضحة",
    en:{ name:"Siot", sound:"Like 's' in sun", mnemonic:"A mountain PEAK — the Sun shines from the top", eq:"s", ex:[{k:"사랑",r:"sa-rang",m:"love"},{k:"스타",r:"seu-ta",m:"star"}] },
    ar:{ name:"سييوت", sound:"مثل 'س' في سماء", mnemonic:"قمة جبل — الشمس تسطع من الأعلى", eq:"س", ex:[{k:"사랑",r:"سا-رانغ",m:"حب"},{k:"스타",r:"سو-تا",m:"نجم"}] },
  },
  {
    char:"ㅇ", roman:"∅ / ng", emoji:"⭕",
    strokes:["① ○ (دائرة كاملة)"],
    arDialect:"في البداية: صامت زي همزة الوصل. في النهاية: 'نغ' زي 'ring'",
    en:{ name:"Ieung", sound:"Silent at start; 'ng' (like sing) at end", mnemonic:"A ZERO circle — starts silent, ends like a ring", eq:"silent / ng", ex:[{k:"아이",r:"a-i",m:"child"},{k:"강",r:"gang",m:"river"}] },
    ar:{ name:"ييونغ", sound:"صامت في بداية المقطع؛ 'نغ' (مثل ring) في النهاية", mnemonic:"دائرة صفر — صامت في البداية، 'نغ' في النهاية", eq:"صامت / نغ", ex:[{k:"아이",r:"أ-إي",m:"طفل"},{k:"강",r:"غانغ",m:"نهر"}] },
  },
  {
    char:"ㅈ", roman:"j", emoji:"⭐",
    strokes:["① →","② ↘","③ ↙"],
    arDialect:"زي 'ج' في جميل — تماماً زي جيمنا!",
    en:{ name:"Jieut", sound:"Like 'j' in juice", mnemonic:"A star shape with a hat — JUMPING star", eq:"j", ex:[{k:"저",r:"jeo",m:"I / me (formal)"},{k:"좋아요",r:"jo-a-yo",m:"I like it"}] },
    ar:{ name:"جييوت", sound:"مثل 'ج' في جميل", mnemonic:"نجمة بقبعة — نجمة قافزة", eq:"ج", ex:[{k:"저",r:"جو",m:"أنا (رسمي)"},{k:"좋아요",r:"جو-أ-يو",m:"أحبه"}] },
  },
  {
    char:"ㅊ", roman:"ch", emoji:"👑",
    strokes:["① →","② →","③ ↘","④ ↙"],
    arDialect:"زي 'تش' في 'تشيلسي' — ج مع نفخة هواء",
    en:{ name:"Chieut", sound:"Like 'ch' in chair — aspirated version of ㅈ", mnemonic:"ㅈ wearing a CROWN — same sound with a puff of air", eq:"ch", ex:[{k:"친구",r:"chin-gu",m:"friend"},{k:"차",r:"cha",m:"tea / car"}] },
    ar:{ name:"تشييوت", sound:"مثل 'تش' — نفس ㅈ مع نفخة هواء قوية", mnemonic:"ㅈ مع تاج — نفس الصوت لكن مع نفخة", eq:"تش / چ", ex:[{k:"친구",r:"تشين-غو",m:"صديق"},{k:"차",r:"تشا",m:"شاي / سيارة"}] },
  },
  {
    char:"ㅋ", roman:"k", emoji:"💨",
    strokes:["① →","② ↓","③ →"],
    arDialect:"زي 'ك' في كريم — بس مع نفخة هواء قوية",
    en:{ name:"Kieuk", sound:"Aspirated 'k' — ㄱ with a strong puff of air", mnemonic:"ㄱ with an extra KICK bar — harder K", eq:"k (aspirated)", ex:[{k:"카페",r:"ka-pe",m:"café"},{k:"코",r:"ko",m:"nose"}] },
    ar:{ name:"كييوك", sound:"'ك' مع نفخة هواء قوية — ㄱ أقوى", mnemonic:"ㄱ مع خط إضافي — 'ك' أشد وأقوى", eq:"ك (مع نفخة)", ex:[{k:"카페",r:"كا-بيه",m:"مقهى"},{k:"코",r:"كو",m:"أنف"}] },
  },
  {
    char:"ㅌ", roman:"t", emoji:"🌬️",
    strokes:["① →","② →","③ ↓","④ →"],
    arDialect:"زي 'ت' في تفاح — بس مع نفخة قوية من الفم",
    en:{ name:"Tieut", sound:"Aspirated 't' — ㄷ with a strong puff of air", mnemonic:"ㄷ with a middle BAR — a door frame reinforced", eq:"t (aspirated)", ex:[{k:"택시",r:"taek-si",m:"taxi"},{k:"토끼",r:"to-kki",m:"rabbit"}] },
    ar:{ name:"تييوت", sound:"'ت' مع نفخة هواء قوية — ㄷ أقوى", mnemonic:"ㄷ مع خط وسطي — إطار باب مُعزَّز", eq:"ت (مع نفخة)", ex:[{k:"택시",r:"تيك-سي",m:"تاكسي"},{k:"토끼",r:"تو-كي",m:"أرنب"}] },
  },
  {
    char:"ㅍ", roman:"p", emoji:"🦅",
    strokes:["① ↓","② ↓","③ →","④ →","⑤ →"],
    arDialect:"زي 'ب' في بابا — بس مع نفخة قوية (زي P إنجليزي)",
    en:{ name:"Pieup", sound:"Aspirated 'p' — ㅂ with a strong puff of air", mnemonic:"Two arms wide open — PUFFING with energy", eq:"p (aspirated)", ex:[{k:"파티",r:"pa-ti",m:"party"},{k:"편의점",r:"pyeo-ni-jeom",m:"convenience store"}] },
    ar:{ name:"بييوب الكبير", sound:"'ب' مع نفخة هواء قوية — ㅂ أقوى", mnemonic:"ذراعان مفتوحتان على مصراعيهما — 'ب' مع قوة", eq:"ب (مع نفخة)", ex:[{k:"파티",r:"با-تي",m:"حفلة"},{k:"편의점",r:"بيو-ني-جوم",m:"دكان صغير"}] },
  },
  {
    char:"ㅎ", roman:"h", emoji:"🎩",
    strokes:["① ○","② →","③ ↓"],
    arDialect:"زي 'هـ' في هيا — تماماً زي الهاء المصري!",
    en:{ name:"Hieut", sound:"Like 'h' in hello", mnemonic:"A PERSON wearing a HAT — H for Hello", eq:"h", ex:[{k:"한국",r:"han-guk",m:"Korea"},{k:"학교",r:"hak-gyo",m:"school"}] },
    ar:{ name:"هييوت", sound:"مثل 'هـ' في هلا / هيا", mnemonic:"شخص يرتدي قبعة — هـ للـ'هيا'", eq:"هـ", ex:[{k:"한국",r:"هان-غوك",m:"كوريا"},{k:"학교",r:"هاك-غيو",m:"مدرسة"}] },
  },
];

/* ── Vowels ──────────────────────────────────────── */
const VOWELS = [
  {
    char:"ㅏ", roman:"a", emoji:"😮",
    en:{ name:"A", sound:"Like 'a' in father — wide open mouth", mnemonic:"Vertical line + branch pointing RIGHT → open 'AH'", ex:[{k:"아버지",r:"a-beo-ji",m:"father"},{k:"바나나",r:"ba-na-na",m:"banana"}] },
    ar:{ name:"آ", sound:"مثل 'آ' — افتح فمك على اتساعه", mnemonic:"خط عمودي وفرع يشير لليمين → 'آ' مفتوح", ex:[{k:"아버지",r:"أ-بو-جي",m:"أب"},{k:"바나나",r:"با-نا-نا",m:"موز"}] },
  },
  {
    char:"ㅓ", roman:"eo", emoji:"😕",
    en:{ name:"EO", sound:"Like 'u' in but — pulled back 'uh'", mnemonic:"Vertical line + branch pointing LEFT → pulled back 'UH'", ex:[{k:"어머니",r:"eo-meo-ni",m:"mother"},{k:"서울",r:"seo-ul",m:"Seoul"}] },
    ar:{ name:"أُ (eo)", sound:"مثل 'أُ' — ممدودة نحو الخلف", mnemonic:"خط عمودي وفرع يشير لليسار → 'أُ' للخلف", ex:[{k:"어머니",r:"أو-مو-ني",m:"أم"},{k:"서울",r:"سو-أول",m:"سيول"}] },
  },
  {
    char:"ㅗ", roman:"o", emoji:"⬆️",
    en:{ name:"O", sound:"Like 'o' in go — round your lips", mnemonic:"Horizontal line + branch pointing UP → round 'OH'", ex:[{k:"오늘",r:"o-neul",m:"today"},{k:"고마워",r:"go-ma-wo",m:"thank you (casual)"}] },
    ar:{ name:"أو", sound:"مثل 'أو' — دوّر شفتيك", mnemonic:"خط أفقي وفرع لأعلى → 'أو' مستدير", ex:[{k:"오늘",r:"أو-نول",m:"اليوم"},{k:"고마워",r:"غو-ما-وو",m:"شكراً (غير رسمي)"}] },
  },
  {
    char:"ㅜ", roman:"u", emoji:"⬇️",
    en:{ name:"U", sound:"Like 'oo' in moon — round lips downward", mnemonic:"Horizontal line + branch pointing DOWN → drooping 'OO'", ex:[{k:"우유",r:"u-yu",m:"milk"},{k:"구름",r:"gu-reum",m:"cloud"}] },
    ar:{ name:"أُو", sound:"مثل 'أُو' في أُوه — شفاه دائرية تنزل", mnemonic:"خط أفقي وفرع لأسفل → 'أُو' ينزل", ex:[{k:"우유",r:"أو-يو",m:"حليب"},{k:"구름",r:"غو-رأوم",m:"سحابة"}] },
  },
  {
    char:"ㅡ", roman:"eu", emoji:"➖",
    en:{ name:"EU", sound:"Neutral flat sound — spread lips, no movement", mnemonic:"A flat horizontal line — keep your face FLAT", ex:[{k:"크다",r:"keu-da",m:"big / large"},{k:"으악",r:"eu-ak",m:"Ahh! (surprise)"}] },
    ar:{ name:"إ (محايد)", sound:"صوت محايد مسطح — شفاه ممدودة ولا حركة", mnemonic:"خط أفقي مسطح — ابقِ وجهك مسطحاً", ex:[{k:"크다",r:"كو-دا",m:"كبير"},{k:"으악",r:"أو-أك",m:"آه! (تعجب)"}] },
  },
  {
    char:"ㅣ", roman:"i", emoji:"🧍",
    en:{ name:"I", sound:"Like 'ee' in see — tall and clear", mnemonic:"A single tall vertical line — stands like 'EE'", ex:[{k:"이름",r:"i-reum",m:"name"},{k:"기다려",r:"gi-da-ryeo",m:"wait for me"}] },
    ar:{ name:"إي", sound:"مثل 'إي' في ييه — طويل وواضح", mnemonic:"خط عمودي وحيد — يقف منتصباً مثل 'إي'", ex:[{k:"이름",r:"إي-روم",m:"اسم"},{k:"기다려",r:"كي-دا-ريو",m:"انتظرني"}] },
  },
  {
    char:"ㅐ", roman:"ae", emoji:"😬",
    en:{ name:"AE", sound:"Like 'e' in bed — open 'eh' sound", mnemonic:"ㅏ with an extra bar added → open 'EH'", ex:[{k:"개",r:"gae",m:"dog"},{k:"애인",r:"ae-in",m:"sweetheart"}] },
    ar:{ name:"إِ (ae)", sound:"مثل 'إِ' في بيت — مفتوح", mnemonic:"ㅏ مع خط إضافي → 'إِ' مفتوح", ex:[{k:"개",r:"غيه",m:"كلب"},{k:"애인",r:"إيه-إن",m:"حبيبي"}] },
  },
  {
    char:"ㅔ", roman:"e", emoji:"😐",
    en:{ name:"E", sound:"Like 'e' in bed — same as ㅐ in modern speech", mnemonic:"ㅓ with an extra bar → sounds identical to ㅐ today", ex:[{k:"에어컨",r:"e-eo-kon",m:"air conditioner"},{k:"세상",r:"se-sang",m:"world"}] },
    ar:{ name:"إِ (e)", sound:"مثل 'إِ' — نفس صوت ㅐ في الكورية الحديثة", mnemonic:"ㅓ مع خط إضافي → نفس صوت ㅐ اليوم تماماً", ex:[{k:"에어컨",r:"إيه-أو-كون",m:"تكييف"},{k:"세상",r:"سيه-سانغ",m:"عالم"}] },
  },
  {
    char:"ㅑ", roman:"ya", emoji:"✌️",
    en:{ name:"YA", sound:"Like 'ya' in yard", mnemonic:"ㅏ with TWO right branches — double energy gives 'YA'", ex:[{k:"야채",r:"ya-chae",m:"vegetables"},{k:"야구",r:"ya-gu",m:"baseball"}] },
    ar:{ name:"يَا", sound:"مثل 'يَا' في ياسمين", mnemonic:"ㅏ مع فرعين لليمين — طاقة مضاعفة تعطي 'يَا'", ex:[{k:"야채",r:"يا-تشيه",m:"خضروات"},{k:"야구",r:"يا-غو",m:"بيسبول"}] },
  },
  {
    char:"ㅕ", roman:"yeo", emoji:"✌️",
    en:{ name:"YEO", sound:"Like 'yuh' or 'yeo'", mnemonic:"ㅓ with TWO left branches — pulling back gives 'YUH'", ex:[{k:"여자",r:"yeo-ja",m:"woman"},{k:"여행",r:"yeo-haeng",m:"travel"}] },
    ar:{ name:"يُ (yeo)", sound:"مثل 'يُ' — ممدودة للخلف", mnemonic:"ㅓ مع فرعين لليسار — السحب للخلف يعطي 'يُ'", ex:[{k:"여자",r:"يو-جا",m:"امرأة"},{k:"여행",r:"يو-هينغ",m:"سفر"}] },
  },
];

/* ── K-Drama vocab ───────────────────────────────── */
const KDRAMA_AR = [
  { k:"오빠", r:"أوبا", m:"أخ أكبر (فتاة للولد)", note:"الكلمة الأكثر تكراراً في المسلسلات الكورية", emoji:"💛" },
  { k:"언니", r:"أونّي", m:"أخت كبرى (فتاة لفتاة)", note:"البنات يقلنها للبنات الأكبر منهن", emoji:"👭" },
  { k:"형", r:"هيونغ", m:"أخ أكبر (ولد للولد)", note:"الأولاد يقولونها للذكور الأكبر منهم", emoji:"👬" },
  { k:"사랑해", r:"سارانغ-هيه", m:"أحبك", note:"أشهر جملة في المسلسلات الكورية", emoji:"❤️" },
  { k:"괜찮아?", r:"كوينتشانا؟", m:"هل أنت بخير؟", note:"تُسمع في كل حلقة تقريباً!", emoji:"🤔" },
  { k:"미안해", r:"ميانهيه", m:"أنا آسف", note:"اعتذار غير رسمي بين الأصدقاء", emoji:"🙏" },
  { k:"고마워", r:"غوماوو", m:"شكراً (غير رسمي)", note:"تُستخدم بين الأصدقاء والعائلة", emoji:"💚" },
  { k:"대박!", r:"ديباك!", m:"رائع! إبداع!", note:"سلانغ تعني 'واو' / 'لقطة'", emoji:"🤩" },
  { k:"화이팅!", r:"هوايتينغ!", m:"يلا! اقدر عليها!", note:"تشجيع كوري — مستعار من الإنجليزية", emoji:"💪" },
  { k:"잠깐!", r:"جامكان!", m:"انتظر لحظة!", note:"تُستخدم دائماً في مشاهد المطاردة", emoji:"✋" },
  { k:"배고파", r:"بيغوبا", m:"أنا جائع", note:"تُقال قبل كل مشهد رامن في الدراما!", emoji:"🍜" },
  { k:"진짜?!", r:"جينجا؟!", m:"جدياً؟! فعلاً؟!", note:"تعبير عن الدهشة والاستغراب", emoji:"😱" },
  { k:"보고 싶어", r:"بوغو-سيبو", m:"اشتقت إليك", note:"أكثر جملة رومانسية في المسلسلات!", emoji:"🥺" },
  { k:"어떡해?", r:"أوتيوكيه؟", m:"ماذا أفعل؟! أنا مش عارف!", note:"تُقال في لحظات الذعر والتوتر", emoji:"😰" },
  { k:"아이고!", r:"آي-غو!", m:"يا إلهي! آه!", note:"تعبير مصري مكافئ: 'يا ربي!' أو 'آه!'", emoji:"🤦" },
  { k:"힘내!", r:"هيم-نيه!", m:"قوّى عزيمتك! امشي!", note:"تشجيع — يقولها الأحباب لبعضهم", emoji:"💪" },
  { k:"바보!", r:"با-بو!", m:"يا أبله! يا غبي! (بمودة)", note:"تُقال بين الأصدقاء والأزواج بدلالة المحبة", emoji:"🤣" },
  { k:"잘 자", r:"جال-جا", m:"تصبح على خير / نامي بسلام", note:"تُقال قبل النوم — مشهد المكالمة الليلية الكلاسيكي", emoji:"🌙" },
  { k:"왜?", r:"ويه؟", m:"ليه؟ / لماذا؟", note:"كلمة قصيرة لكنها الأكثر دراما!", emoji:"🤨" },
];
const KDRAMA_EN = [
  { k:"오빠", r:"op-pa", m:"Older brother (girl to boy)", note:"Most heard word in K-dramas!", emoji:"💛" },
  { k:"언니", r:"eon-ni", m:"Older sister (girl to girl)", note:"Girls call older girls this", emoji:"👭" },
  { k:"형", r:"hyeong", m:"Older brother (boy to boy)", note:"Boys call older boys this", emoji:"👬" },
  { k:"사랑해", r:"sa-rang-hae", m:"I love you", note:"The most iconic K-drama line", emoji:"❤️" },
  { k:"괜찮아?", r:"gwaen-chan-a?", m:"Are you okay?", note:"Heard almost every episode!", emoji:"🤔" },
  { k:"미안해", r:"mi-an-hae", m:"I'm sorry", note:"Informal apology between friends", emoji:"🙏" },
  { k:"고마워", r:"go-ma-wo", m:"Thank you (casual)", note:"Used between friends and family", emoji:"💚" },
  { k:"대박!", r:"dae-bak!", m:"Awesome! Amazing!", note:"Slang for 'jackpot / wow'", emoji:"🤩" },
  { k:"화이팅!", r:"hwa-i-ting!", m:"You got this! Go for it!", note:"Korean cheer borrowed from English", emoji:"💪" },
  { k:"잠깐!", r:"jam-kkan!", m:"Wait a moment!", note:"Constantly heard in chase scenes", emoji:"✋" },
  { k:"배고파", r:"bae-go-pa", m:"I'm hungry", note:"Said before every ramen scene!", emoji:"🍜" },
  { k:"진짜?!", r:"jin-jja?!", m:"Really?! Seriously?!", note:"Expression of disbelief", emoji:"😱" },
  { k:"보고 싶어", r:"bo-go si-peo", m:"I miss you", note:"The most romantic K-drama sentence!", emoji:"🥺" },
  { k:"어떡해?", r:"eo-tteok-hae?", m:"What do I do?! I don't know!", note:"Said in moments of panic and drama", emoji:"😰" },
  { k:"아이고!", r:"a-i-go!", m:"Oh my! / Oh no!", note:"Universal Korean exclamation of surprise", emoji:"🤦" },
  { k:"힘내!", r:"him-nae!", m:"Hang in there! Stay strong!", note:"Encouragement between loved ones", emoji:"💪" },
  { k:"바보!", r:"ba-bo!", m:"Idiot! Silly! (affectionately)", note:"Said lovingly between friends and couples", emoji:"🤣" },
  { k:"잘 자", r:"jal ja", m:"Good night / Sleep well", note:"Classic late-night phone call scene line", emoji:"🌙" },
  { k:"왜?", r:"wae?", m:"Why?", note:"Short but the most dramatic word in K-dramas!", emoji:"🤨" },
];

/* ── Syllable examples ───────────────────────────── */
const SYLLABLES = [
  { c:"ㅎ", v:"ㅏ", b:"하", r:"ha", en:"(to do)", ar:"(للفعل)" },
  { c:"ㄴ", v:"ㅏ", b:"나", r:"na", en:"I / me", ar:"أنا" },
  { c:"ㅅ", v:"ㅏ", b:"사", r:"sa", en:"four", ar:"أربعة" },
  { c:"ㅂ", v:"ㅏ", b:"바", r:"ba", en:"(sea part)", ar:"(بحر)" },
  { c:"ㄱ", v:"ㅗ", b:"고", r:"go", en:"and", ar:"و" },
  { c:"ㄴ", v:"ㅗ", b:"노", r:"no", en:"no / song", ar:"لا / أغنية" },
  { c:"ㄷ", v:"ㅗ", b:"도", r:"do", en:"also / too", ar:"أيضاً" },
  { c:"ㄹ", v:"ㅏ", b:"라", r:"ra", en:"(ramen start)", ar:"(رامن)" },
  { c:"ㅁ", v:"ㅏ", b:"마", r:"ma", en:"horse", ar:"حصان" },
  { c:"ㅈ", v:"ㅏ", b:"자", r:"ja", en:"ruler / sleep", ar:"مسطرة / نوم" },
  { c:"ㅊ", v:"ㅏ", b:"차", r:"cha", en:"tea / car", ar:"شاي / سيارة" },
  { c:"ㅅ", v:"ㅣ", b:"시", r:"si", en:"time / poem", ar:"وقت / قصيدة" },
];

/* ══════════════════════════════════════════════════
   LAYOUT HELPERS
══════════════════════════════════════════════════ */
function Page({ children, dir = "ltr", chapter }: { children: React.ReactNode; dir?: "ltr" | "rtl"; chapter?: string }) {
  const isRtl = dir === "rtl";
  return (
    <div
      className="book-page"
      style={{
        width:"210mm", minHeight:"297mm", padding:"13mm 16mm 12mm",
        boxSizing:"border-box", background:"#ffffff",
        position:"relative",
        pageBreakAfter:"always", breakAfter:"page",
        direction: dir,
        fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Running header */}
      <div style={{
        position:"absolute", top:"7mm",
        left:"16mm", right:"16mm",
        display:"flex", justifyContent: isRtl ? "flex-end" : "flex-start",
        alignItems:"center", gap:"6px",
        borderBottom:`1px solid ${BD}`, paddingBottom:"2.5mm",
        direction: isRtl ? "rtl" : "ltr",
      }}>
        <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:Y, flexShrink:0 }} />
        <span style={{ fontSize:"8px", color:T3, letterSpacing:"1.5px", textTransform:"uppercase", fontWeight:600 }}>
          Klovers Hangul Book 1
        </span>
        {chapter && (
          <>
            <span style={{ fontSize:"8px", color:BD }}>·</span>
            <span style={{ fontSize:"8px", color:T3 }}>{chapter}</span>
          </>
        )}
      </div>

      {/* Content area */}
      <div style={{ marginTop:"9mm" }}>{children}</div>

      {/* Footer */}
      <div style={{
        position:"absolute", bottom:"6mm",
        left:"16mm", right:"16mm",
        borderTop:`1px solid ${BD}`, paddingTop:"2mm",
        display:"flex", justifyContent:"center",
      }}>
        <span style={{ fontSize:"8px", color:T3 }}>klovers.academy</span>
      </div>
    </div>
  );
}

function SHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom:"7mm" }}>
      <h2 style={{ fontSize:"22px", fontWeight:900, color:T1, lineHeight:1.15, margin:0, marginBottom:"3px" }}>
        {title}
      </h2>
      <div style={{ width:"36px", height:"3px", background:Y, borderRadius:"2px", marginBottom:"4px" }} />
      {subtitle && <p style={{ fontSize:"11px", color:T3, margin:0, lineHeight:1.5 }}>{subtitle}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STROKE ORDER TIP
══════════════════════════════════════════════════ */
function StrokeOrderTip({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  return (
    <div style={{ borderLeft: isAr ? "none" : `3px solid ${Y}`, borderRight: isAr ? `3px solid ${Y}` : "none",
      paddingLeft: isAr ? "0" : "10px", paddingRight: isAr ? "10px" : "0",
      marginBottom:"5mm", color:T2, fontSize:"11px", lineHeight:1.6 }}>
      <strong style={{ color:T1 }}>{isAr ? "ترتيب الكتابة:" : "Stroke order rule:"}</strong>{" "}
      {isAr
        ? "دائماً من الأعلى للأسفل، ثم من اليسار لليمين."
        : "Always top → bottom, then left → right."}
      <div style={{ marginTop:"3px", color:T3, fontSize:"10px", direction:"ltr" }}>
        ㄱ(2) · ㄴ(2) · ㄷ(3) · ㄹ(5) · ㅁ(4) · ㅂ(4) · ㅅ(2)
        {!isAr && " — numbers = stroke count"}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHAPE MNEMONIC — small SVG per consonant shape
══════════════════════════════════════════════════ */
function ShapeMnemonic({ char }: { char: string }) {
  const s = 34; // svg size
  const shapes: Record<string, React.ReactNode> = {
    "ㄱ": <><line x1="6" y1="6" x2="28" y2="6" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="28" y1="6" x2="28" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><circle cx="22" cy="20" r="3" fill={GOLD} opacity="0.7"/></>,
    "ㄴ": <><line x1="8" y1="6" x2="8" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="8" y1="28" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><ellipse cx="14" cy="10" rx="3" ry="5" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.6"/></>,
    "ㄷ": <><line x1="8" y1="8" x2="26" y2="8" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="8" y1="8" x2="8" y2="26" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="8" y1="26" x2="26" y2="26" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/></>,
    "ㄹ": <><path d="M6 8 Q17 8 17 14 Q17 20 28 20 Q28 26 17 26" stroke={GOLD} strokeWidth="2.5" fill="none" strokeLinecap="round"/><circle cx="17" cy="14" r="2" fill={GOLD} opacity="0.7"/></>,
    "ㅁ": <rect x="7" y="7" width="20" height="20" rx="2" stroke={GOLD} strokeWidth="3" fill="none"/>,
    "ㅂ": <><line x1="8" y1="6" x2="8" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="26" y1="6" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="8" y1="17" x2="26" y2="17" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="8" y1="28" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/></>,
    "ㅅ": <><line x1="17" y1="6" x2="8" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="6" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/></>,
    "ㅇ": <circle cx="17" cy="17" r="10" stroke={GOLD} strokeWidth="3" fill="none"/>,
    "ㅈ": <><line x1="6" y1="10" x2="28" y2="10" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="10" x2="8" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="10" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/></>,
    "ㅊ": <><line x1="11" y1="5" x2="23" y2="5" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/><line x1="6" y1="12" x2="28" y2="12" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="12" x2="8" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="17" y1="12" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/></>,
    "ㅋ": <><line x1="6" y1="6" x2="28" y2="6" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="28" y1="6" x2="28" y2="20" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="10" y1="13" x2="28" y2="13" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/></>,
    "ㅌ": <><line x1="6" y1="8" x2="28" y2="8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/><line x1="6" y1="15" x2="28" y2="15" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="8" x2="8" y2="28" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="28" x2="26" y2="28" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/></>,
    "ㅍ": <><line x1="8" y1="8" x2="8" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="26" y1="8" x2="26" y2="28" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="6" y1="17" x2="28" y2="17" stroke={GOLD} strokeWidth="3" strokeLinecap="round"/><line x1="6" y1="8" x2="28" y2="8" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/></>,
    "ㅎ": <><circle cx="17" cy="18" r="8" stroke={GOLD} strokeWidth="2.5" fill="none"/><line x1="11" y1="9" x2="23" y2="9" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/><line x1="17" y1="5" x2="17" y2="9" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"/></>,
  };
  const shape = shapes[char];
  if (!shape) return null;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display:"block", margin:"2px auto" }}>
      <rect width={s} height={s} rx="5" fill="rgba(212,175,55,0.1)"/>
      {shape}
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   CONSONANT CARD — pure single language
══════════════════════════════════════════════════ */
function ConsCard({ c, lang }: { c: typeof CONSONANTS[0]; lang: Lang }) {
  const d = c[lang];
  const isAr = lang === "ar";
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"68px 1fr",
      gap:"10px", direction: isAr ? "rtl" : "ltr",
      pageBreakInside:"avoid", breakInside:"avoid",
      paddingBottom:"8px", marginBottom:"8px",
      borderBottom:`1px solid ${BD}`,
    }}>
      {/* Character column */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
        <div style={{
          width:"68px", height:"68px",
          border:`1px solid ${BD}`, borderRadius:"6px",
          background:SBG,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
        }}>
          <span style={{ fontSize:"46px", fontWeight:900, color:T1, lineHeight:1 }}>{c.char}</span>
        </div>
        <span style={{ fontSize:"10px", color:T3, fontWeight:600, direction:"ltr" }}>{c.roman}</span>
        <ShapeMnemonic char={c.char} />
        <div style={{ fontSize:"8.5px", color:T3, textAlign:"center", direction:"ltr", lineHeight:1.4 }}>
          {c.strokes.join(" · ")}
        </div>
      </div>

      {/* Content column */}
      <div>
        {/* Letter name */}
        <div style={{ fontSize:"13px", fontWeight:900, color:T1, marginBottom:"3px" }}>{d.name}</div>

        {/* Sound */}
        <div style={{ fontSize:"11px", color:T2, marginBottom:"3px", lineHeight:1.5 }}>
          <span style={{ fontWeight:700, color:T1 }}>{isAr ? "النطق: " : "Sound: "}</span>{d.sound}
        </div>

        {/* Mnemonic */}
        <div style={{
          fontSize:"10.5px", color:T2, fontStyle:"italic", marginBottom:"5px",
          paddingRight: isAr ? "8px" : "0", paddingLeft: isAr ? "0" : "8px",
          borderRight: isAr ? `2px solid ${Y}` : "none",
          borderLeft: isAr ? "none" : `2px solid ${Y}`,
          lineHeight:1.5,
        }}>
          {d.mnemonic}
        </div>

        {/* Arabic phonetic bridge */}
        {d.eq && (
          <div style={{ fontSize:"10.5px", color:T2, marginBottom:"3px" }}>
            <span style={{ fontWeight:700 }}>{isAr ? "يشبه: " : "Like: "}</span>
            <span style={{ color:T1 }}>{d.eq}</span>
          </div>
        )}

        {/* Egyptian dialect note */}
        {c.arDialect && isAr && (
          <div style={{ fontSize:"10px", color:T3, marginBottom:"4px", lineHeight:1.4 }}>
            🇪🇬 <em>{c.arDialect}</em>
          </div>
        )}

        {/* Example words */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"5px" }}>
          {d.ex.map((ex, i) => (
            <div key={i} style={{ fontSize:"10.5px", color:T2 }}>
              <span style={{ fontSize:"14px", fontWeight:900, color:T1, direction:"ltr", display:"inline-block" }}>{ex.k}</span>
              <span style={{ color:T3 }}> {ex.r}</span>
              <span style={{ color:T2 }}> — {ex.m}</span>
            </div>
          ))}
        </div>

        {/* Practice boxes */}
        <div style={{ display:"flex", gap:"3px", alignItems:"center" }}>
          <span style={{ fontSize:"9px", color:T3, flexShrink:0 }}>{isAr ? "تدرب:" : "Write:"}</span>
          <div style={{ position:"relative", width:"26px", height:"26px", border:`1px solid ${BD}`, borderRadius:"3px",
            display:"flex", alignItems:"center", justifyContent:"center", background:SBG }}>
            <span style={{ fontSize:"18px", color:"rgba(0,0,0,0.07)", fontWeight:900 }}>{c.char}</span>
          </div>
          {[1,2,3,4,5].map(n=>(
            <div key={n} style={{ width:"26px", height:"26px", border:`1px solid ${BD}`, borderRadius:"3px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Vowel card ─────────────────────────────────── */
function VowCard({ v, lang }: { v: typeof VOWELS[0]; lang: Lang }) {
  const d = v[lang];
  const isAr = lang === "ar";
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"60px 1fr", gap:"10px",
      pageBreakInside:"avoid", breakInside:"avoid",
      paddingBottom:"8px", marginBottom:"8px",
      borderBottom:`1px solid ${BD}`,
      direction: isAr ? "rtl" : "ltr",
    }}>
      {/* Character */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
        <div style={{
          width:"60px", height:"60px",
          border:`1px solid ${BD}`, borderRadius:"6px", background:SBG,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <span style={{ fontSize:"40px", fontWeight:900, color:T1, lineHeight:1 }}>{v.char}</span>
        </div>
        <span style={{ fontSize:"10px", color:T3, fontWeight:600, direction:"ltr" }}>{v.roman}</span>
      </div>
      {/* Content */}
      <div>
        <div style={{ fontSize:"12px", fontWeight:900, color:T1, marginBottom:"3px" }}>{d.name}</div>
        <div style={{ fontSize:"11px", color:T2, marginBottom:"3px" }}>
          <span style={{ fontWeight:700 }}>{isAr ? "النطق: " : "Sound: "}</span>{d.sound}
        </div>
        <div style={{ fontSize:"10.5px", color:T2, fontStyle:"italic", marginBottom:"4px",
          paddingRight: isAr ? "8px" : "0", paddingLeft: isAr ? "0" : "8px",
          borderRight: isAr ? `2px solid ${Y}` : "none",
          borderLeft: isAr ? "none" : `2px solid ${Y}`,
        }}>{d.mnemonic}</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"3px" }}>
          {d.ex.map((ex, i) => (
            <span key={i} style={{ fontSize:"10.5px", color:T2 }}>
              <span style={{ fontSize:"14px", fontWeight:900, color:T1, direction:"ltr", display:"inline-block" }}>{ex.k}</span>
              {" — "}{ex.m}
            </span>
          ))}
        </div>
        {(d as any).eq && (
          <div style={{
            fontSize:"10px", color:T3, direction:"ltr",
          }}>
            🔤 {isAr ? "يشبه: " : "Like: "}<span style={{ fontSize:"13px" }}>{(d as any).eq}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHARED INTRO DATA
══════════════════════════════════════════════════ */

const BOOKS_AR = [
  { n:"١", icon:"🔤", title:"الهانغول — الأبجدية الكورية", sub:"هذا الكتاب", current:true },
  { n:"٢", icon:"👋", title:"أهلاً وسهلاً — التحيات والمحادثة الأولى", sub:"الكتاب الثاني", current:false },
  { n:"٣", icon:"🔢", title:"الأرقام والوقت والحياة اليومية", sub:"الكتاب الثالث", current:false },
  { n:"٤", icon:"📖", title:"قواعد اللغة — الأساسيات", sub:"الكتاب الرابع", current:false },
  { n:"٥", icon:"🎬", title:"المحادثة ولغة المسلسلات", sub:"الكتاب الخامس", current:false },
  { n:"٦", icon:"🏆", title:"القراءة والكتابة والطلاقة", sub:"الكتاب السادس", current:false },
];
const BOOKS_EN = [
  { n:"1", icon:"🔤", title:"Hangul — The Korean Alphabet", sub:"This Book", current:true },
  { n:"2", icon:"👋", title:"Hello! — Greetings & Basic Conversation", sub:"Book Two", current:false },
  { n:"3", icon:"🔢", title:"Numbers, Time & Daily Life", sub:"Book Three", current:false },
  { n:"4", icon:"📖", title:"Grammar Foundations", sub:"Book Four", current:false },
  { n:"5", icon:"🎬", title:"Conversation & K-Drama Language", sub:"Book Five", current:false },
  { n:"6", icon:"🏆", title:"Reading, Writing & Fluency", sub:"Book Six", current:false },
];

/* ══════════════════════════════════════════════════
   BOOK PAGES — Arabic version
══════════════════════════════════════════════════ */

/* ── 7-Day Study Plan AR ── */
function StudyPlanAr() {
  const days = [
    { d:"اليوم ١", icon:"🔤", task:"الحروف الساكنة — الجزء الأول (ㄱ–ㅅ)", tip:"كرر كل حرف ١٠ مرات بصوت عالٍ", color:"#fef9ec" },
    { d:"اليوم ٢", icon:"🔤", task:"الحروف الساكنة — الجزء الثاني (ㅇ–ㅎ)", tip:"اكتب كل حرف ٥ مرات في كراسة", color:"#fef9ec" },
    { d:"اليوم ٣", icon:"🗣️", task:"حروف المد (ㅏ–ㅕ) + الحروف المُشدَّدة", tip:"استمع للنطق من QR ثم كرره", color:"#f0fff4" },
    { d:"اليوم ٤", icon:"🏗️", task:"بناء الكتل المقطعية + الباتشيم", tip:"جرب تكتب اسمك بالكوري!", color:"#f0fff4" },
    { d:"اليوم ٥", icon:"✏️", task:"التمارين التطبيقية (المستويات ١–٣)", tip:"خصص ٣٠ دقيقة بدون هاتف", color:"#fffef0" },
    { d:"اليوم ٦", icon:"🎬", task:"مفردات المسلسلات الكورية (٢٠ كلمة)", tip:"اربط كل كلمة بمشهد من مسلسل تحبه", color:"#fffef0" },
    { d:"اليوم ٧", icon:"🏆", task:"مراجعة شاملة + اختبار المفردات", tip:"اقرأ خمس كلمات كورية عشوائية بصوت عالٍ!", color:"#f0f4ff" },
  ];
  return (
    <Page dir="rtl">
      <SHead title="خطة الدراسة — ٧ أيام" subtitle="اتبع هذه الخطة وستقرأ الكورية في أسبوع واحد!" />
      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"10px", marginBottom:"8mm", background:SBG, padding:"8px 10px" }}>
        <div style={{ fontSize:"12px", fontWeight:800, color:T1, marginBottom:"2px" }}>🎯 الهدف: قراءة الهانغول في ٧ أيام</div>
        <div style={{ fontSize:"11px", color:T3, lineHeight:1.6 }}>٣٠–٤٥ دقيقة يومياً تكفي. الاستمرارية أهم من الكم!</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", marginBottom:"8mm" }}>
        {days.map((day, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"54px 1fr", gap:"10px", padding:"7px 0", borderBottom:`1px solid ${BD}`, alignItems:"baseline" }}>
            <div style={{ fontSize:"10px", fontWeight:900, color: i===6 ? T1 : T3, background: i===6 ? Y : "transparent", padding: i===6 ? "1px 5px" : "0", borderRadius:"3px", display:"inline-block" }}>{day.d}</div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>{day.task}</div>
              <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>{day.tip}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.7, borderTop:`1px solid ${BD}`, paddingTop:"4mm", margin:0 }}>
        🔑 <strong>سر النجاح:</strong> لا تنتقل لليوم التالي قبل أن تتقن حروف اليوم الحالي. الجودة تتفوق على السرعة دائماً!
      </p>
    </Page>
  );
}

/* ── Aspirated/Tensed Consonants AR ── */
const ASPIRATED = [
  { char:"ㄲ", base:"ㄱ", roman:"kk", emoji:"💥",
    en:{ name:"Double Giyeok", sound:"Tensed hard 'k' — no air released", mnemonic:"TWO guns firing at once — double force!", eq:"kk (tensed)", ex:[{k:"까다",r:"kka-da",m:"picky"},{k:"꽃",r:"kkot",m:"flower"}] },
    ar:{ name:"جييوك المضاعف", sound:"ك صلبة مضغوطة — بدون هواء", mnemonic:"مسدسان يطلقان معاً — قوة مضاعفة!", eq:"ك مشددة (ق قوية)", ex:[{k:"까다",r:"كا-دا",m:"انتقائي"},{k:"꽃",r:"كوت",m:"زهرة"}] },
  },
  { char:"ㄸ", base:"ㄷ", roman:"tt", emoji:"🔨",
    en:{ name:"Double Digeut", sound:"Tensed hard 't' — no air released", mnemonic:"TWO doors slammed shut simultaneously", eq:"tt (tensed)", ex:[{k:"따뜻하다",r:"tta-tteu-ta-da",m:"warm"},{k:"딸",r:"ttal",m:"daughter"}] },
    ar:{ name:"ديغوت المضاعف", sound:"ت صلبة مضغوطة — بدون هواء", mnemonic:"بابان يُغلقان بقوة في نفس اللحظة", eq:"ت مشددة", ex:[{k:"따뜻하다",r:"تا-توت-ها-دا",m:"دافئ"},{k:"딸",r:"تال",m:"ابنة"}] },
  },
  { char:"ㅃ", base:"ㅂ", roman:"pp", emoji:"📦",
    en:{ name:"Double Bieup", sound:"Tensed hard 'p' — no air released", mnemonic:"TWO boxes pressed firmly together", eq:"pp (tensed)", ex:[{k:"빨리",r:"ppal-li",m:"quickly"},{k:"빵",r:"ppang",m:"bread"}] },
    ar:{ name:"بييوب المضاعف", sound:"ب صلبة مضغوطة — بدون هواء", mnemonic:"صندوقان مضغوطان فوق بعضهما", eq:"ب مشددة", ex:[{k:"빨리",r:"بال-لي",m:"بسرعة"},{k:"빵",r:"بانغ",m:"خبز"}] },
  },
  { char:"ㅆ", base:"ㅅ", roman:"ss", emoji:"🐍",
    en:{ name:"Double Siot", sound:"Tensed hard 's' — tenser than ㅅ", mnemonic:"Double snake hiss — extra tense 'S'", eq:"ss (tensed)", ex:[{k:"씨",r:"ssi",m:"Mr./Ms. (respectful)"},{k:"쓰다",r:"sseu-da",m:"to write / bitter"}] },
    ar:{ name:"سيوت المضاعف", sound:"س صلبة مشددة — أقوى من ㅅ", mnemonic:"صفير ثعبانين — س مضاعفة ومشددة", eq:"س مشددة", ex:[{k:"씨",r:"سي",m:"السيد/السيدة (احترام)"},{k:"쓰다",r:"سو-دا",m:"يكتب / مر"}] },
  },
  { char:"ㅉ", base:"ㅈ", roman:"jj", emoji:"⚡",
    en:{ name:"Double Jieut", sound:"Tensed hard 'j' — no air released", mnemonic:"Double lightning bolt — explosive 'J'", eq:"jj (tensed)", ex:[{k:"짜다",r:"jja-da",m:"salty"},{k:"짝",r:"jjak",m:"pair / partner"}] },
    ar:{ name:"جييوت المضاعف", sound:"ج صلبة مضغوطة — بدون هواء", mnemonic:"برقتان متتاليتان — ج انفجارية", eq:"ج مشددة", ex:[{k:"짜다",r:"جا-دا",m:"مالح"},{k:"짝",r:"جاك",m:"زوج / شريك"}] },
  },
];

function AspiratedAr() {
  return (
    <Page dir="rtl">
      <SHead title="الحروف الساكنة المُشدَّدة (된소리) 💥" subtitle="٥ حروف تُنطق بضغط إضافي — بدون هواء!" />
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.6, marginBottom:"4mm", borderLeft:`3px solid ${Y}`, paddingLeft:"8px" }}>
        ⚠️ <strong>للمبتدئين:</strong> هذه حروف متقدمة — ركز أولاً على الـ١٤ حرفاً الأساسية. ارجع لهذه الصفحة في الأسبوع الثاني!
      </p>
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.6, marginBottom:"5mm" }}>
        الفرق الأساسي: الحروف العادية مع نفخة هواء خفيفة. الحروف المُشدَّدة <strong>بدون</strong> أي هواء — الحلق والفم مضغوطان.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px 16px", marginBottom:"8mm" }}>
        {ASPIRATED.map(a => (
          <div key={a.char} style={{ paddingBottom:"7px", borderBottom:`1px solid ${BD}`, pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"4px" }}>
              <div style={{ border:`1px solid ${BD}`, borderRadius:"4px", width:"50px", height:"50px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:SBG, flexShrink:0 }}>
                <div style={{ fontSize:"32px", color:T1, fontWeight:900, lineHeight:1 }}>{a.char}</div>
                <div style={{ fontSize:"10px", color:T3 }}>{a.roman}</div>
              </div>
              <div>
                <div style={{ fontSize:"12px", fontWeight:800, color:T1 }}>{a.ar.name}</div>
                <div style={{ fontSize:"10px", color:T3 }}>= {a.base} مع ضغط إضافي</div>
              </div>
            </div>
            <div style={{ fontSize:"10px", color:T2, marginBottom:"2px" }}>🔊 {a.ar.sound}</div>
            <div style={{ fontSize:"10px", color:T2, borderRight:`2px solid ${Y}`, paddingRight:"5px", marginBottom:"4px", fontStyle:"italic" }}>{a.ar.mnemonic}</div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", direction:"ltr" }}>
              {a.ar.ex.map((ex, i) => (
                <span key={i} style={{ fontSize:"10px", color:T2 }}>
                  <strong style={{ color:T1 }}>{ex.k}</strong> ({ex.r}) — {ex.m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>🔊 اسمع الفرق بين العادي والمُشدَّد</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio/tensed</div>
        </div>
      </div>
    </Page>
  );
}

/* ── Compound Vowels AR ── */
const COMPOUND_VOWELS = [
  { char:"ㅘ", roman:"wa",  en:"Like 'wa' in water",      ar:"مثل 'وا' في واو",         ex:"봐요 (bwa-yo) = انظر" },
  { char:"ㅙ", roman:"wae", en:"Like 'we' in wet",        ar:"مثل 'ويه' — نادر",         ex:"왜요 (wae-yo) = لماذا؟" },
  { char:"ㅚ", roman:"oe",  en:"Like 'we' (round lips)",  ar:"مثل 'ويه' مع دائري",       ex:"최고 (choe-go) = الأفضل" },
  { char:"ㅝ", roman:"wo",  en:"Like 'wo' in wonder",     ar:"مثل 'وو' ممدودة",          ex:"뭐 (mwo) = ماذا؟" },
  { char:"ㅞ", roman:"we",  en:"Like 'we' in week",       ar:"مثل 'ويه'",                ex:"웨이터 (we-i-teo) = نادل" },
  { char:"ㅟ", roman:"wi",  en:"Like 'wee' in week",      ar:"مثل 'وي' سريعة",           ex:"위험 (wi-heom) = خطر" },
  { char:"ㅢ", roman:"ui",  en:"Like 'eui' — slide ㅡ→ㅣ", ar:"انزلق من 'إي' لـ'ي'",      ex:"의사 (ui-sa) = طبيب" },
  { char:"ㅐ", roman:"ae",  en:"Like 'e' in bed",         ar:"مثل 'إِ' في بيت",          ex:"개 (gae) = كلب" },
  { char:"ㅒ", roman:"yae", en:"Like 'ye' in yes",        ar:"مثل 'يِه'",                ex:"얘기 (yae-gi) = قصة" },
  { char:"ㅔ", roman:"e",   en:"Same as ㅐ today",         ar:"نفس صوت ㅐ تماماً",        ex:"세상 (se-sang) = عالم" },
  { char:"ㅖ", roman:"ye",  en:"Like 'ye' in yes",        ar:"مثل 'يِه'",                ex:"예쁘다 (ye-ppeu-da) = جميل" },
];

function CompoundVowelsAr() {
  return (
    <Page dir="rtl">
      <SHead title="حروف المد المُركَّبة (이중모음) 🔗" subtitle="١١ حرف مد مُركَّب — تُبنى من حرفين بسيطين!" />
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.6, marginBottom:"5mm" }}>
        لا تحفظها كلها الآن! الأكثر استخداماً: <strong>ㅘ ㅝ ㅐ ㅔ ㅢ</strong> — ستقابلهم كثيراً في المسلسلات والأغاني.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px 10px", marginBottom:"8mm" }}>
        {COMPOUND_VOWELS.map(v => (
          <div key={v.char} style={{ display:"flex", gap:"8px", alignItems:"flex-start", paddingBottom:"5px", borderBottom:`1px solid ${BD}`, pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ border:`1px solid ${BD}`, borderRadius:"4px", width:"34px", height:"34px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:SBG, flexShrink:0 }}>
              <div style={{ fontSize:"20px", color:T1, fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"9px", color:T3 }}>{v.roman}</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"10px", color:T2, marginBottom:"2px" }}>{v.ar}</div>
              <div style={{ fontSize:"9px", color:T3 }}>{v.ex}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={40} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>🔊 اسمع نطق حروف المد المركبة</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio/compound</div>
        </div>
      </div>
    </Page>
  );
}

/* ── History page AR ── */
function HistoryAr() {
  return (
    <Page dir="rtl">
      <SHead title="تاريخ اللغة الكورية" subtitle="رحلة ٢٠٠٠ عام من الكلمات والحكايات" />

      {/* Photo header */}
      <div style={{ marginBottom:"10px", borderRadius:"10px", overflow:"hidden" }}>
        <SceneClassroom h={280} radius={10} />
      </div>
      <DancheongBorder />

      {/* Timeline */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"8mm" }}>
        {[
          { era:"قبل ١٠٠٠ م", icon:"🏔️", title:"بدايات اللغة الكورية", body:"تطورت اللغة الكورية على مدى آلاف السنين في شبه الجزيرة الكورية. تُصنَّف اليوم كـ«لغة معزولة» — لا تنتمي لأي مجموعة لغوية أخرى في العالم. ليست صينية، وليست يابانية، وليست عربية — إنها فريدة من نوعها!" },
          { era:"١٠٠٠–١٤٤٢ م", icon:"📜", title:"عصر الهانجا — حروف المستعارة", body:"قبل اختراع الهانغول، كان الكوريون يستخدمون الحروف الصينية (한자 هانجا). كانت صعبة التعلم جداً — فقط النخبة والعلماء كانوا يقرؤون ويكتبون. أكثر من ٩٥٪ من الشعب الكوري كان أمياً بالكامل." },
          { era:"١٤٤٣ م ★", icon:"👑", title:"ثورة الملك سيجونغ", body:"أدرك الملك سيجونغ أن هذا ظلم بيّن. فأسس مجمعاً من ثمانية علماء نوابغ في «قاعة الحكماء» (집현전) وعملوا سنوات في سرية تامة لاختراع أبجدية جديدة تناسب الأصوات الكورية تماماً." },
          { era:"١٤٤٦ م", icon:"📚", title:"إعلان هونمينجونغأوم", body:"أُعلن عن الأبجدية الجديدة تحت اسم «훈민정음» (هونمينجونغأوم) بمعنى «الأصوات الصحيحة لتعليم الشعب». واجه الملك معارضة شديدة من الطبقة الحاكمة — لكنه أصرّ. واليوم يُحتفل بيوم الهانغول كل عام في التاسع من أكتوبر." },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"6px", paddingBottom:"6px", borderBottom:`1px solid ${BD}`, alignItems:"flex-start" }}>
            <div style={{ fontSize:"18px", flexShrink:0, marginTop:"2px" }}>{item.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"10px", fontWeight:600, color:T3, marginBottom:"1px" }}>{item.era}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3px" }}>{item.title}</div>
              <div style={{ fontSize:"11px", color:T2, lineHeight:1.7 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`3px solid ${Y}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3px" }}>حقيقة مذهلة!</div>
        <p style={{ fontSize:"11px", color:T2, lineHeight:1.7, margin:0 }}>
          يتحدث الكورية أكثر من <strong>٨٠ مليون شخص</strong> حول العالم. وقد صنّفت منظمة اليونسكو الهانغول كواحد من أكثر أنظمة الكتابة علمية ومنطقية في التاريخ البشري!
        </p>
      </div>
    </Page>
  );
}

/* ── King Sejong page AR ── */
function SejongAr() {
  return (
    <Page dir="rtl">
      <SHead title="الملك سيجونغ العظيم 👑" subtitle="الرجل الذي غيّر مصير شعب بكلمة واحدة: العدالة" />

      {/* Bio */}
      <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:"14px", marginBottom:"8mm", paddingBottom:"6mm", borderBottom:`1px solid ${BD}` }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <SceneTeacher h={120} radius={0} />
          <div style={{ background:SBG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"6px" }}>
            <div style={{ fontSize:"16px", fontWeight:900, color:T1, direction:"ltr" }}>세종대왕</div>
            <div style={{ fontSize:"10px", color:T3, marginTop:"1px" }}>سيجونغ الكبير</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:"15px", fontWeight:900, color:T1, marginBottom:"8px" }}>سيجونغ الكبير</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            {[
              { icon:"🎂", label:"الميلاد", val:"١٥ مايو ١٣٩٧م" },
              { icon:"👑", label:"الحكم", val:"١٤١٨ – ١٤٥٠م" },
              { icon:"🏛️", label:"الأسرة", val:"أسرة جوسون الملكية" },
              { icon:"📚", label:"إنجازه الأعظم", val:"اختراع الهانغول ١٤٤٣م" },
              { icon:"🌟", label:"لقبه", val:"«أعظم ملوك كوريا»" },
            ].map(r=>(
              <div key={r.label} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"12px" }}>{r.icon}</span>
                <span style={{ fontSize:"10px", color:T3, minWidth:"60px" }}>{r.label}</span>
                <span style={{ fontSize:"10px", color:T2, fontWeight:600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The creation story */}
      <div style={{ marginBottom:"8mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"5mm" }}>كيف صُمِّمت الحروف؟</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px" }}>
          {[
            { icon:"👅", title:"شكل اللسان", body:"كل حرف ساكن صُمِّم بناءً على شكل اللسان والفم لحظة نطق الصوت — علم وفن في آنٍ واحد!" },
            { icon:"🔬", title:"علم صوتي دقيق", body:"ㄱ = قاعدة اللسان ترتفع نحو الحلق. ㄴ = طرف اللسان يلمس سقف الفم. ㅁ = الشفتان منطبقتان." },
            { icon:"🏗️", title:"بنية منطقية", body:"الحروف المشتقة من بعضها تتشابه في الشكل — ㄱ الأصل، ㄲ الشديدة، ㅋ المنفوخة. نظام متكامل ومتسق!" },
          ].map(c=>(
            <div key={c.title} style={{ background:SBG, borderRadius:"6px", padding:"10px", border:`1px solid ${BD}` }}>
              <div style={{ fontSize:"22px", marginBottom:"5px" }}>{c.icon}</div>
              <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>{c.title}</div>
              <div style={{ fontSize:"10px", color:T2, lineHeight:1.7 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div style={{ borderRight:`3px solid ${Y}`, paddingRight:"12px", direction:"rtl" }}>
        <div style={{ fontSize:"12px", color:T2, lineHeight:2, fontStyle:"italic" }}>
          كل إنسان لديه ما يريد أن يقوله، لكن كثيرين لا يجدون طريقة للتعبير. أريد أن يكون كل شخص في مملكتي قادراً على القراءة والكتابة.
        </div>
        <div style={{ fontSize:"11px", color:T3, fontWeight:700, marginTop:"5px" }}>— الملك سيجونغ الكبير، ١٤٤٦م</div>
      </div>
    </Page>
  );
}

/* ── Korean Culture page AR ── */
function CultureAr() {
  return (
    <Page dir="rtl">
      <SHead title="الثقافة الكورية 🌸" subtitle="خمسة آلاف عام من الجمال والفلسفة والفن" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"8mm" }}>

        {/* K-Drama */}
        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", overflow:"hidden" }}>
          <SceneStreet h={160} radius={0} />
          <div style={{ padding:"8px", background:SBG }}>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>المسلسلات الكورية (K-Drama)</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.6 }}>
              من أكثر المحتوى مشاهدةً على Netflix عالمياً. «لعبة الحبّار» غيّرت مفهوم الدراما عالمياً!
            </div>
          </div>
        </div>

        {/* K-Pop */}
        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", overflow:"hidden" }}>
          <SceneConcert h={160} radius={0} />
          <div style={{ padding:"8px", background:SBG }}>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>موسيقى البوب الكوري (K-Pop)</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.6 }}>
              BTS، BLACKPINK، Stray Kids — نجوم عالميون. K-Pop ظاهرة ثقافية شاملة!
            </div>
          </div>
        </div>

        {/* Food */}
        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", overflow:"hidden" }}>
          <SceneFood h={140} radius={0} />
          <div style={{ padding:"8px", background:SBG }}>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>المطبخ الكوري</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.6 }}>
              الكيمتشي، البيبيمباب، التيكبوكي — أطعمة تفاجئك وتُدمنها!
            </div>
          </div>
        </div>

        {/* Values & Spirit */}
        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", background:SBG }}>
          <div style={{ fontSize:"22px", marginBottom:"5px" }}>🌿</div>
          <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"4px" }}>القيم والروح الكورية</div>
          <div style={{ fontSize:"10px", color:T2, lineHeight:1.7 }}>
            <strong>빨리빨리</strong> = «يلا يلا!» — <strong>눈치</strong> = فهم المشاعر دون كلام. <strong>한</strong> = الحنين العميق والمقاومة — روح الشعب الكوري الأبدية.
          </div>
        </div>
      </div>

      {/* 정 Jeong concept */}
      <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", marginBottom:"8mm", background:SBG }}>
        <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
          <div style={{ fontSize:"32px", fontWeight:900, color:T1, lineHeight:1, flexShrink:0, direction:"ltr" }}>정</div>
          <div>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"4px" }}>정 (Jeong) — أعمق مفهوم في الثقافة الكورية</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.8 }}>
              رابطة روحية تتشكّل تدريجياً بين الناس من مشاركة اللحظات اليومية. في المسلسلات الكورية: <strong>«정이 들었어»</strong> = «أصبحت قريباً منك بشكل لم أتوقعه»
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"11px", fontWeight:700, color:T1, marginBottom:"5px" }}>بعد إتمام هذه الكتب الستة ستتمكن من:</div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {["فهم المسلسلات الكورية بدون ترجمة 🎬","التحدث مع الكوريين بثقة 🗣️","قراءة اللافتات في كوريا 🪧","غناء أغاني K-Pop 🎵"].map(t=>(
            <div key={t} style={{ fontSize:"10px", color:T2, padding:"3px 7px", border:`1px solid ${BD}`, borderRadius:"4px" }}>{t}</div>
          ))}
        </div>
      </div>
    </Page>
  );
}

/* ── Course Overview page AR ── */
function CourseAr() {
  return (
    <Page dir="rtl">
      <SHead title="سلسلة كتب Klovers — ٦ كتب إلى الإتقان 📚" subtitle="خارطة رحلتك من الصفر إلى الطلاقة" />

      <p style={{ fontSize:"11px", color:T2, lineHeight:1.8, marginBottom:"6mm" }}>
        صُمِّمت سلسلة Klovers لتأخذك من <strong>لا تعرف حرفاً واحداً</strong> إلى <strong>التحدث والكتابة بطلاقة</strong> — بطريقة ممتعة تعتمد على مسلسلاتك المفضلة وموسيقاك الكورية المحبوبة. كل كتاب يبني على السابق.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"8mm" }}>
        {BOOKS_AR.map((b,i)=>(
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"12px",
            flexDirection:"row-reverse",
            padding:"7px 0", borderBottom:`1px solid ${BD}`,
            background: b.current ? YL : "transparent",
          }}>
            <div style={{
              border: b.current ? `2px solid ${Y}` : `1px solid ${BD}`,
              background: b.current ? Y : SBG,
              color: b.current ? T1 : T3,
              fontWeight:900,
              width:"36px", height:"36px", borderRadius:"6px",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              flexShrink:0, gap:"1px",
            }}>
              <span style={{ fontSize:"9px", fontWeight:700, opacity:0.7 }}>كتاب</span>
              <span style={{ fontSize:"15px", lineHeight:1 }}>{b.n}</span>
            </div>
            <div style={{ fontSize:"18px", flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight: b.current ? 900 : 700, fontSize:"11px", color:T1 }}>{b.title}</div>
              <div style={{ fontSize:"10px", color: b.current ? T2 : T3, marginTop:"1px" }}>
                {b.current ? "📍 أنت هنا — ابدأ رحلتك!" : b.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
        {[
          { icon:"⏱️", title:"١٥–٢٠ دقيقة", sub:"يومياً تكفي" },
          { icon:"🎯", title:"٦ كتب", sub:"من الصفر للطلاقة" },
          { icon:"🎬", title:"لغة حقيقية", sub:"من المسلسلات والحياة" },
        ].map(s=>(
          <div key={s.title} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"10px", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1 }}>{s.title}</div>
            <div style={{ fontSize:"10px", color:T3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function CoverAr() {
  const syllables = "가나다라마바사아자차카타파하갈날달랄말발살알잘찰칼탈팔할감남담람맘밤삼암잠참캄탐팜함강낭당랑망방상앙장창캉탕팡항";
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", background:"#080808",
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      display:"flex", flexDirection:"column",
      direction:"rtl",
    }}>
      {/* Wallpaper — Korean syllables at near-invisible opacity */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        fontSize:"26px", fontWeight:900, color:Y, opacity:0.035,
        lineHeight:1.5, letterSpacing:"6px", padding:"8px",
        wordBreak:"break-all", userSelect:"none", overflow:"hidden",
      }}>{syllables.repeat(35)}</div>

      {/* Radial spotlight behind hero text */}
      <div style={{
        position:"absolute", top:"12%", left:"50%", transform:"translateX(-50%)",
        width:"500px", height:"320px",
        background:"radial-gradient(ellipse at center, rgba(255,255,0,0.18) 0%, rgba(255,255,0,0.06) 45%, transparent 72%)",
        zIndex:1, pointerEvents:"none",
      }} />

      {/* ── CONTENT ── */}
      <div style={{ position:"relative", zIndex:2, flex:1, display:"flex", flexDirection:"column" }}>

        {/* Logo bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", padding:"13mm 16mm 6mm" }}>
          <div style={{ flex:1, height:"1px", background:"rgba(255,255,0,0.22)" }} />
          <img src="/klovers-logo.jpg" alt="Klovers" style={{ height:"38px", objectFit:"contain", borderRadius:"6px" }} />
          <div style={{ flex:1, height:"1px", background:"rgba(255,255,0,0.22)" }} />
        </div>

        {/* Publisher tag */}
        <div style={{ textAlign:"center", marginBottom:"6mm" }}>
          <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", letterSpacing:"3px" }}>KLOVERS KOREAN ACADEMY</span>
        </div>

        {/* ── HERO: 한글 ── */}
        <div style={{ textAlign:"center", padding:"0 10mm", marginBottom:"6mm" }}>
          <div style={{
            fontSize:"172px", fontWeight:900, color:GOLD, lineHeight:0.88,
            textShadow:`0 0 50px rgba(212,175,55,0.75), 0 0 100px rgba(212,175,55,0.35), 0 0 180px rgba(212,175,55,0.18)`,
            marginBottom:"10px",
          }}>한글</div>
          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", letterSpacing:"13px", fontWeight:500 }}>
            H&nbsp;&nbsp;A&nbsp;&nbsp;N&nbsp;&nbsp;G&nbsp;&nbsp;U&nbsp;&nbsp;L
          </div>
        </div>

        {/* Dancheong colour band */}
        <div style={{ display:"flex", height:"5px", overflow:"hidden", marginBottom:"0" }}>
          {(["#C8102E","#0047AB","#FFFF00","#228B22","#C8102E","#0047AB","#FFFF00","#228B22",
             "#C8102E","#0047AB","#FFFF00","#228B22","#C8102E","#0047AB","#FFFF00","#228B22"] as string[]).map((c,i)=>(
            <div key={i} style={{ flex:1, background:c }} />
          ))}
        </div>

        {/* Full-bleed cinematic photo */}
        <div style={{ width:"100%", position:"relative", marginBottom:"0" }}>
          <SceneCover h={240} radius={0} />
        </div>

        {/* Dancheong colour band bottom */}
        <div style={{ display:"flex", height:"5px", overflow:"hidden", marginBottom:"9mm" }}>
          {(["#228B22","#FFFF00","#0047AB","#C8102E","#228B22","#FFFF00","#0047AB","#C8102E",
             "#228B22","#FFFF00","#0047AB","#C8102E","#228B22","#FFFF00","#0047AB","#C8102E"] as string[]).map((c,i)=>(
            <div key={i} style={{ flex:1, background:c }} />
          ))}
        </div>

        {/* Arabic title */}
        <div style={{ textAlign:"center", padding:"0 14mm", marginBottom:"7mm" }}>
          <div style={{ fontSize:"28px", fontWeight:900, color:"#ffffff", lineHeight:1.15, marginBottom:"5px" }}>
            اقرأ الكورية في ٧ أيام
          </div>
          <div style={{ fontSize:"13px", color:`rgba(212,175,55,0.9)`, fontWeight:700, letterSpacing:"1px" }}>
            النسخة العربية–الكورية الحصرية
          </div>
        </div>

        {/* Glassmorphism tags */}
        <div style={{ display:"flex", gap:"7px", justifyContent:"center", flexWrap:"wrap", padding:"0 14mm", marginBottom:"7mm" }}>
          {["🎬 مسلسلات كورية", "🎵 كيبوب", "🌸 ثقافة كورية"].map(t => (
            <span key={t} style={{
              background:"rgba(212,175,55,0.10)", color:`rgba(212,175,55,0.95)`,
              border:`1px solid rgba(212,175,55,0.35)`,
              fontSize:"11px", fontWeight:700, padding:"5px 13px", borderRadius:"20px",
            }}>{t}</span>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* Level badge + alphabet strip + copyright */}
        <div style={{ padding:"0 14mm 11mm" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"8px" }}>
            <div style={{
              border:`1.5px solid rgba(212,175,55,0.6)`, borderRadius:"7px",
              padding:"5px 22px", textAlign:"center",
            }}>
              <span style={{ fontSize:"11px", fontWeight:900, color:`rgba(212,175,55,0.9)`, letterSpacing:"1px" }}>
                المستوى ١ — مبتدئ
              </span>
            </div>
          </div>

          {/* Alphabet strip */}
          <div style={{ display:"flex", gap:"3px", justifyContent:"center", marginBottom:"9px" }}>
            {"ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜ".split("").map((ch,i) => (
              <div key={i} style={{
                width:"21px", height:"21px",
                background:`rgba(212,175,55,${i%3===0?0.14:i%3===1?0.07:0.10})`,
                border:"1px solid rgba(212,175,55,0.22)",
                borderRadius:"4px",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"12px", color:`rgba(212,175,55,0.85)`, fontWeight:700,
              }}>{ch}</div>
            ))}
          </div>

          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.22)", letterSpacing:"1px" }}>
              © 2025 Klovers Korean Academy — klovers.academy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeAr() {
  const plan = [
    { d:"يوم ١", t:"حروف المد ㅏ–ㅜ" }, { d:"يوم ٢", t:"حروف المد ㅡ–ㅕ" },
    { d:"يوم ٣", t:"ساكنة ㄱ–ㄷ" }, { d:"يوم ٤", t:"ساكنة ㄹ–ㅅ" },
    { d:"يوم ٥", t:"ساكنة ㅇ–ㅊ" }, { d:"يوم ٦", t:"ساكنة ㅋ–ㅎ" },
    { d:"يوم ٧", t:"مقاطع + مراجعة 🏆" },
  ];
  return (
    <Page dir="rtl">
      <SHead title="مرحباً بعالم الهانغول!" subtitle="اكتشف جمال الأبجدية الكورية" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"7mm" }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"5px" }}>لماذا الهانغول رائع؟</div>
          <p style={{ fontSize:"10px", lineHeight:1.8, color:T2, margin:0 }}>
            اخترع الملك سيجونغ الهانغول عام ١٤٤٣م. إنها <strong>أبجدية صوتية</strong> — كل حرف يمثل صوتاً واحداً فقط. معظم المتعلمين يستطيعون القراءة في <strong>٢ إلى ٣ أيام</strong> فقط!
          </p>
        </div>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"7px" }}>الأرقام السحرية</div>
          {[{n:"١٤", l:"حرفاً ساكناً أساسياً"},{n:"١٠", l:"حروف مد أساسية"},{n:"∞", l:"مقطع ممكن التكوين"}].map(({n,l})=>(
            <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
              <div style={{ border:`2px solid ${Y}`, color:T1, fontWeight:900, fontSize:"16px", width:"34px", height:"34px", borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:"10px", color:T2, fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Syllable diagram */}
      <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", marginBottom:"7mm", background:SBG }}>
        <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"8px", textAlign:"center" }}>كيف تُبنى الكتلة المقطعية؟</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", flexWrap:"wrap", direction:"ltr" }}>
          {[
            {label:"حرف ساكن", char:"ㅎ", sub:"h"},
            {label:"+", char:"", sub:""},
            {label:"حرف مد", char:"ㅏ", sub:"a"},
            {label:"=", char:"", sub:""},
            {label:"المقطع!", char:"하", sub:"ha"},
          ].map((item,i)=>
            item.char===""?(
              <div key={i} style={{fontSize:"20px",fontWeight:900,color:T3}}>{item.label}</div>
            ):(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"10px",color:T3,marginBottom:"3px",direction:"rtl"}}>{item.label}</div>
                <div style={{border:`1px solid ${BD}`,borderRadius:"6px",padding:"6px 12px",fontSize:"36px",fontWeight:900,color:T1,lineHeight:1,background:i===4?YL:"#fff"}}>{item.char}</div>
                {item.sub&&<div style={{fontSize:"10px",color:T3,marginTop:"3px"}}>{item.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      {/* 7-day plan */}
      <div style={{ fontSize:"10px", fontWeight:700, color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"5px" }}>خطة الدراسة في ٧ أيام</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"6mm" }}>
        {plan.map((p,i)=>(
          <div key={i} style={{ border:`1px solid ${i===6?Y:BD}`, borderRadius:"4px", padding:"5px 3px", textAlign:"center", background:i===6?YL:SBG }}>
            <div style={{ fontSize:"9px", fontWeight:800, color:T1 }}>{p.d}</div>
            <div style={{ fontSize:"9px", color:T3, marginTop:"2px", lineHeight:1.3 }}>{p.t}</div>
          </div>
        ))}
      </div>

      {/* Letter family tree */}
      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"10px", fontWeight:700, color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"5px" }}>عائلات الحروف — كيف تتشابه؟</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", direction:"ltr" }}>
          {[
            { base:"ㄱ", derived:["ㅋ","ㄲ"] },
            { base:"ㄷ", derived:["ㅌ","ㄸ"] },
            { base:"ㅂ", derived:["ㅍ","ㅃ"] },
            { base:"ㅅ", derived:["ㅆ"] },
            { base:"ㅈ", derived:["ㅊ","ㅉ"] },
          ].map(f=>(
            <div key={f.base} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <span style={{ border:`2px solid ${Y}`, color:T1, fontWeight:900, fontSize:"15px", borderRadius:"4px", padding:"2px 6px" }}>{f.base}</span>
              <span style={{ color:T3, fontSize:"10px" }}>→</span>
              {f.derived.map(d=>(
                <span key={d} style={{ border:`1px solid ${BD}`, color:T2, fontWeight:700, fontSize:"13px", borderRadius:"4px", padding:"2px 6px", background:SBG }}>{d}</span>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize:"10px", color:T3, marginTop:"4px" }}>
          الحرف الأساسي (مؤطر) يكتسب شدة بإضافة خطوط — ㄱ→ㅋ (نفخة هواء)، ㄱ→ㄲ (مضاعف/مشدّد)
        </div>
      </div>
    </Page>
  );
}

/* ── Table of Contents AR ── */
function TocAr() {
  const chapters = [
    { n:"١",  title:"خطة الدراسة — ٧ أيام",            icon:"🗓️", page:3,  new:true },
    { n:"٢",  title:"تاريخ اللغة الكورية",              icon:"📜", page:4 },
    { n:"٣",  title:"الملك سيجونغ العظيم",              icon:"👑", page:5 },
    { n:"٤",  title:"الثقافة الكورية",                  icon:"🌸", page:6 },
    { n:"٥",  title:"سلسلة كتب Klovers",                icon:"📚", page:7 },
    { n:"٦",  title:"مرحباً بعالم الهانغول",            icon:"🎉", page:8 },
    { n:"٧",  title:"الحروف الساكنة — الجزء الأول",    icon:"🔤", page:9 },
    { n:"٨",  title:"الحروف الساكنة — الجزء الثاني",   icon:"🔤", page:10 },
    { n:"٩",  title:"حروف المد",                        icon:"🗣️", page:11 },
    { n:"١٠", title:"الحروف الساكنة المُشدَّدة",         icon:"💥", page:12, new:true },
    { n:"١١", title:"حروف المد المُركَّبة",              icon:"🔗", page:13, new:true },
    { n:"١٢", title:"بناء الكتل المقطعية",              icon:"🏗️", page:14 },
    { n:"١٣", title:"الباتشيم — الحرف الساكن الأخير",  icon:"⬇️", page:15 },
    { n:"١٤", title:"الباتشيم المزدوج",                  icon:"✌️", page:16 },
    { n:"١٥", title:"أساسيات المسلسلات الكورية ١",     icon:"🎬", page:17 },
    { n:"١٦", title:"أساسيات المسلسلات الكورية ٢",     icon:"🎬", page:18 },
    { n:"١٧", title:"تمارين تطبيقية",                   icon:"✏️", page:19 },
    { n:"١٨", title:"مفتاح الإجابات والمرجع السريع",   icon:"🏆", page:20 },
    { n:"١٩", title:"ملحق المفردات — أكثر ٥٠ كلمة",   icon:"📖", page:21 },
  ];
  return (
    <Page dir="rtl">
      <div style={{ textAlign:"center", marginBottom:"14px" }}>
        <div style={{ fontSize:"11px", color:"#888", letterSpacing:"4px", marginBottom:"4px" }}>كتاب الهانغول الرسمي — المستوى الأول</div>
        <div style={{ fontSize:"26px", fontWeight:900, color:BK, lineHeight:1.1 }}>محتويات الكتاب</div>
        <div style={{ fontSize:"13px", color:"#666", fontWeight:700, marginTop:"3px" }}>Table of Contents</div>
        <div style={{ marginTop:"8px" }}><DancheongBorder /></div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"8mm" }}>
        {chapters.map((ch, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"10px",
            padding:"6px 0", borderBottom:`1px solid ${BD}`,
          }}>
            <div style={{ fontSize:"10px", fontWeight:700, color:T3, width:"24px", textAlign:"center", flexShrink:0 }}>{ch.n}</div>
            <div style={{ flex:1, fontSize:"11px", fontWeight:700, color:T1, display:"flex", alignItems:"center", gap:"5px" }}>
              {ch.title}
              {(ch as any).new && <span style={{ background:Y, color:T1, fontSize:"8px", fontWeight:900, padding:"0 4px", borderRadius:"2px", flexShrink:0 }}>NEW</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
              <div style={{ width:"30px", borderBottom:"1px dotted #ccc" }} />
              <span style={{ fontSize:"10px", color:T3, width:"16px", textAlign:"left" }}>{ch.page}</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize:"11px", color:T2, lineHeight:1.7, borderTop:`1px solid ${BD}`, paddingTop:"4mm", margin:0 }}>
        اقرأ كل فصل بالترتيب — كل فصل يبني على السابق. في ٧ أيام ستقرأ الكورية!
      </p>
    </Page>
  );
}

function ConsonantsAr({ slice, page }: { slice:[number,number]; page:number }) {
  const count = slice[1] - slice[0];
  const kpopLyrics = page === 1
    ? { lyric:"나비야", rom:"نا-بي-يا", meaning:"يا فراشة", song:"أغنية شعبية كورية" }
    : { lyric:"고마워", rom:"go-ma-wo", meaning:"شكراً", song:"IU — Palette" };
  return (
    <Page dir="rtl" chapter="الحروف الساكنة">
      <SHead title={`الحروف الساكنة (자음) — الجزء ${page===1?"١":"٢"} من ٢`} subtitle="كل مقطع كوري يبدأ بحرف ساكن" />
      <p style={{ fontSize:"11px", color:T2, marginBottom:"4mm", lineHeight:1.6 }}>
        بنهاية هذه الصفحة ستتمكن من قراءة ونطق <strong>{count}</strong> حروف كورية جديدة وكتابتها.
        {page===1 && " هناك ١٤ حرفاً ساكناً أساسياً — تعلّم هذه أولاً."}
      </p>
      <StrokeOrderTip lang="ar" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
        {CONSONANTS.slice(...slice).map(c => <ConsCard key={c.char} c={c} lang="ar" />)}
      </div>
      {/* QR audio — clean book style */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginTop:"5mm",
        borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>استمع للنطق</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio</div>
        </div>
      </div>
      {/* K-Pop context — light style */}
      <div style={{ marginTop:"4mm", paddingTop:"3mm", borderTop:`1px solid ${BD}` }}>
        <span style={{ fontSize:"9px", color:T3, textTransform:"uppercase", letterSpacing:"1px" }}>تعرّفتَ للتو على هذه الكلمة في K-Pop </span>
        <div style={{ marginTop:"2px", fontSize:"16px", fontWeight:900, color:T1, direction:"ltr" }}>
          {kpopLyrics.lyric}
          <span style={{ fontSize:"11px", fontWeight:400, color:T3 }}> [{kpopLyrics.rom}] — {kpopLyrics.meaning}</span>
        </div>
      </div>
      {/* Practice task */}
      <div style={{ marginTop:"4mm" }}>
        <div style={{ fontSize:"10px", color:T3, marginBottom:"3px" }}>جربها الآن — اكتب اسمك بالحروف التي تعلمتها:</div>
        <div style={{ height:"22px", borderBottom:`1px solid ${BD}` }} />
      </div>
    </Page>
  );
}

function MiniReadingStripAr() {
  const words = [
    { k:"나", r:"نا", m:"أنا" },
    { k:"바나나", r:"با-نا-نا", m:"موز" },
    { k:"고기", r:"غو-كي", m:"لحم" },
    { k:"나비", r:"نا-بي", m:"فراشة" },
    { k:"사다", r:"سا-دا", m:"يشتري" },
  ];
  return (
    <div style={{ marginTop:"5mm", paddingTop:"4mm", borderTop:`1px solid ${BD}` }}>
      <div style={{ fontSize:"10px", color:T3, marginBottom:"4px" }}>يمكنك الآن قراءة هذه الكلمات الحقيقية:</div>
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", direction:"ltr" }}>
        {words.map(w => (
          <div key={w.k} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>{w.k}</div>
            <div style={{ fontSize:"9px", color:T3 }}>{w.r}</div>
            <div style={{ fontSize:"9px", color:T2, direction:"rtl" }}>{w.m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniReadingStripEn() {
  const words = [
    { k:"나", r:"na", m:"I / me" },
    { k:"바나나", r:"ba-na-na", m:"banana" },
    { k:"고기", r:"go-gi", m:"meat" },
    { k:"나비", r:"na-bi", m:"butterfly" },
    { k:"사다", r:"sa-da", m:"to buy" },
  ];
  return (
    <div style={{ marginTop:"5mm", paddingTop:"4mm", borderTop:`1px solid ${BD}` }}>
      <div style={{ fontSize:"10px", color:T3, marginBottom:"4px" }}>You can now read these real Korean words:</div>
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
        {words.map(w => (
          <div key={w.k} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>{w.k}</div>
            <div style={{ fontSize:"9px", color:T3 }}>{w.r}</div>
            <div style={{ fontSize:"9px", color:T2 }}>{w.m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VowelsAr() {
  return (
    <Page dir="rtl" chapter="حروف المد">
      <SHead title="حروف المد (모음)" subtitle="حروف المد لا تقف وحدها — تحتاج دائماً حرفاً ساكناً" />
      <p style={{ fontSize:"11px", color:T2, marginBottom:"4mm", lineHeight:1.6 }}>
        بنهاية هذه الصفحة ستتمكن من قراءة ونطق ١٠ حروف مد كورية وتكوين مقاطع كاملة.
        إذا بدأت الكلمة بصوت مدّي، استخدم الحرف الصامت ㅇ أمامه: أ = 아 (ㅇ + ㅏ).
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
        {VOWELS.map(v => <VowCard key={v.char} v={v} lang="ar" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginTop:"5mm",
        borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>استمع لنطق حروف المد</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio</div>
        </div>
      </div>
      <MiniReadingStripAr />
    </Page>
  );
}

function SyllableAr() {
  return (
    <Page dir="rtl" chapter="الكتل المقطعية">
      <SHead title="بناء الكتل المقطعية" subtitle="الطريقة الذكية لتركيب الكورية" />
      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"6mm" }}>
        {[
          { n:"①", t:"كل مقطع يبدأ بحرف ساكن", n2:"إذا بدأ بمدّ، نضع ㅇ الصامت", ex:"아 = ㅇ+ㅏ" },
          { n:"②", t:"حروف المد الطويلة تجلس يميناً", n2:"ㅏ ㅓ ㅣ ㅐ ㅔ ㅑ ㅕ", ex:"가 나 사 바" },
          { n:"③", t:"حروف المد العريضة تجلس أسفل", n2:"ㅗ ㅜ ㅡ ㅛ ㅠ", ex:"고 노 소 도" },
          { n:"④", t:"باتشيم — حرف ساكن أخير تحت الكتلة", n2:"اختياري — يُوضع في الأسفل", ex:"한 = ㅎ+ㅏ+ㄴ" },
        ].map(r=>(
          <div key={r.n} style={{ display:"flex", gap:"10px", alignItems:"baseline",
            paddingBottom:"5px", borderBottom:`1px solid ${BD}` }}>
            <span style={{ fontSize:"13px", fontWeight:900, color:T1, flexShrink:0, width:"18px" }}>{r.n}</span>
            <div>
              <span style={{ fontSize:"11px", fontWeight:700, color:T1 }}>{r.t}</span>
              <span style={{ fontSize:"10px", color:T3 }}> — {r.n2}</span>
              <span style={{ fontSize:"13px", fontWeight:900, color:T1, marginRight:"8px", direction:"ltr", display:"inline-block" }}> {r.ex}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"3mm" }}>أمثلة على المقاطع</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"6px" }}>
        {SYLLABLES.map(s=>(
          <div key={s.b} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"6px 3px", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"9px", color:T3, direction:"ltr" }}>{s.c}+{s.v}</div>
            <div style={{ fontSize:"30px", fontWeight:900, color:T1, lineHeight:1.1 }}>{s.b}</div>
            <div style={{ fontSize:"9px", color:T3 }}>{s.r}</div>
            <div style={{ fontSize:"9px", color:T2 }}>{s.ar}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ── Batchim (Single) AR ── */
function BatchimAr() {
  const FINAL7 = [
    { sound:"ك", chars:["ㄱ","ㄲ","ㅋ"], ex:[{k:"국",r:"غوك",m:"حساء"},{k:"부엌",r:"بو-أوك",m:"مطبخ"}] },
    { sound:"ن", chars:["ㄴ"],           ex:[{k:"눈",r:"نون",m:"عين/ثلج"},{k:"돈",r:"دون",m:"مال"}] },
    { sound:"ت", chars:["ㄷ","ㅅ","ㅆ","ㅈ","ㅊ","ㅌ","ㅎ"], ex:[{k:"옷",r:"أوت",m:"ملابس"},{k:"낮",r:"نات",m:"نهار"}] },
    { sound:"ل/ر", chars:["ㄹ"],         ex:[{k:"달",r:"دال",m:"قمر"},{k:"말",r:"مال",m:"لغة/فرس"}] },
    { sound:"م",  chars:["ㅁ"],          ex:[{k:"봄",r:"بوم",m:"ربيع"},{k:"꿈",r:"كوم",m:"حلم"}] },
    { sound:"ب",  chars:["ㅂ","ㅍ"],     ex:[{k:"밥",r:"باب",m:"أرز"},{k:"잎",r:"إيب",m:"ورقة"}] },
    { sound:"نغ", chars:["ㅇ"],          ex:[{k:"강",r:"غانغ",m:"نهر"},{k:"영",r:"يونغ",m:"روح/صفر"}] },
  ];
  return (
    <Page dir="rtl">
      <SHead title="الباتشيم (받침) — الحرف الساكن الأخير" subtitle="المقطع الكوري قد ينتهي بحرف ساكن تحت الكتلة" />

      {/* What is batchim */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"6mm" }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>ما هو الباتشيم؟</div>
          <p style={{ fontSize:"10px", color:T2, lineHeight:1.8, margin:0, marginBottom:"8px" }}>
            الباتشيم هو الحرف الساكن الذي يجلس <strong>أسفل</strong> الكتلة المقطعية.
            ليس كل مقطع يحتاجه — لكنه ضروري في آلاف الكلمات.
          </p>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", direction:"ltr" }}>
            {[
              {top:"ㅎ", mid:"ㅏ", bot:null, label:"하 (ha)", note:"بدون باتشيم"},
              {top:"ㅎ", mid:"ㅏ", bot:"ㄴ", label:"한 (han)", note:"مع باتشيم ㄴ"},
            ].map((b,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ border:`1px solid ${i===1?Y:BD}`, borderRadius:"6px", padding:"8px 12px", display:"inline-flex", flexDirection:"column", alignItems:"center", width:"52px", background:i===1?YL:"#fff" }}>
                  <div style={{ fontSize:"11px", color:T2 }}>{b.top}</div>
                  <div style={{ fontSize:"11px", color:T2 }}>{b.mid}</div>
                  {b.bot && <div style={{ fontSize:"11px", color:T1, fontWeight:900, borderTop:`1px solid ${BD}`, marginTop:"3px", paddingTop:"3px", width:"100%", textAlign:"center" }}>{b.bot}</div>}
                </div>
                <div style={{ fontSize:"10px", fontWeight:700, color:T1, marginTop:"4px" }}>{b.label}</div>
                <div style={{ fontSize:"9px", color:T3, direction:"rtl" }}>{b.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>القاعدة الذهبية</div>
          <p style={{ fontSize:"10px", color:T2, lineHeight:1.8, margin:0, marginBottom:"8px" }}>
            رغم وجود أكثر من ١٤ حرفاً ساكناً، لا يوجد في الكورية سوى <strong>٧ أصوات نهائية فقط</strong>. كل الحروف الأخرى تُحوَّل إلى أحدها.
          </p>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", direction:"ltr" }}>
            {["ك","ن","ت","ل","م","ب","نغ"].map(s=>(
              <span key={s} style={{ border:`1px solid ${BD}`, color:T1, fontWeight:900, fontSize:"13px", padding:"4px 8px", borderRadius:"4px", background:"#fff" }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize:"10px", fontWeight:700, color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>جدول الأصوات النهائية السبعة</div>
      <div style={{ display:"flex", flexDirection:"column", marginBottom:"6mm" }}>
        {FINAL7.map((row,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"36px 1fr 1fr", gap:"6px", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${BD}` }}>
            <div style={{ border:`1px solid ${BD}`, color:T1, fontWeight:900, fontSize:"14px", textAlign:"center", borderRadius:"4px", padding:"2px", direction:"ltr", background:SBG }}>{row.sound}</div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {row.chars.map(ch=>(
                <span key={ch} style={{ border:`1px solid ${BD}`, color:T1, fontSize:"13px", fontWeight:900, padding:"1px 5px", borderRadius:"3px", direction:"ltr" }}>{ch}</span>
              ))}
            </div>
            <div style={{ fontSize:"10px", color:T2, direction:"rtl" }}>
              {row.ex.map(e=>(<span key={e.k}><strong>{e.k}</strong> {e.r} — {e.m}  </span>))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"5px" }}>قاعدة الربط (연음법칙 يون-إيم)</div>
        <p style={{ fontSize:"10px", color:T2, lineHeight:1.7, marginBottom:"6px" }}>
          إذا جاء بعد الباتشيم مقطع يبدأ بـ <strong>ㅇ</strong> الصامت، ينتقل الباتشيم إلى ذلك المقطع ويُنطق فيه.
        </p>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {[
            {w:"먹어요",before:"موك-أو-يو ❌",after:"مو-غو-يو ✅",m:"آكل"},
            {w:"한국어",before:"هان-غوك-أو ❌",after:"هان-غو-غو ✅",m:"كورية"},
            {w:"없어요",before:"أوبس-أو-يو ❌",after:"أوب-سو-يو ✅",m:"لا يوجد"},
          ].map(e=>(
            <div key={e.w} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"6px 8px", direction:"ltr", background:SBG }}>
              <div style={{ fontSize:"16px", color:T1, fontWeight:900 }}>{e.w}</div>
              <div style={{ fontSize:"10px", color:"#aaa", marginTop:"1px" }}>{e.before}</div>
              <div style={{ fontSize:"10px", color:"#166534", fontWeight:700 }}>{e.after}</div>
              <div style={{ fontSize:"10px", color:T3, direction:"rtl" }}>{e.m}</div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

/* ── Double Batchim AR ── */
function DoubleBatchimAr() {
  const GYEOP = [
    { chars:"ㄳ", read:"ㄱ", ex:"넋", rom:"نوك", m:"روح/أثر" },
    { chars:"ㄵ", read:"ㄴ", ex:"앉다", rom:"أن-تا", m:"يجلس" },
    { chars:"ㄺ", read:"ㄱ", ex:"닭", rom:"داك", m:"دجاجة" },
    { chars:"ㄻ", read:"ㅁ", ex:"삶", rom:"سام", m:"حياة" },
    { chars:"ㄼ", read:"ㄹ", ex:"밟다", rom:"بال-تا", m:"يدوس" },
    { chars:"ㄾ", read:"ㄹ", ex:"핥다", rom:"هال-تا", m:"يلعق" },
    { chars:"ㅀ", read:"ㄹ", ex:"싫다", rom:"سيل-تا", m:"يكره" },
    { chars:"ㅄ", read:"ㅂ", ex:"없다", rom:"أوب-تا", m:"غير موجود" },
  ];
  return (
    <Page dir="rtl">
      <SHead title="الباتشيم المزدوج (겹받침)" subtitle="حرفان ساكنان في الأسفل — اقرأ حرفاً واحداً فقط!" />
      {/* Larsen-Freeman: don't memorize warning */}
      <div style={{ background:"#fff8e1", border:"2px solid #fbbf24", borderRadius:"8px", padding:"7px 12px", fontSize:"11px", color:"#92400e", marginBottom:"8px" }}>
        <strong>⚠️ تنبيه مهم للمبتدئين:</strong> لا تحاول حفظ هذه الجداول كلها الآن! هذا محتوى متقدم — فهم المبدأ يكفي تماماً.
        الباتشيم المزدوج سيصبح طبيعياً جداً بعد قراءة ١٠٠ كلمة فقط. <strong>سيُشرح بالتفصيل في الكتاب الثاني.</strong>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ background:BK, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>ما هو الباتشيم المزدوج؟</div>
          <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.9 }}>
            بعض المقاطع تحمل <strong style={{color:Y}}>حرفين ساكنين معاً</strong> في موضع الباتشيم. عند النطق، تُنطق الأقل شيوعاً (عادةً الأولى) وتصمت الأخرى. حفظ هذا الجدول يُتقن نطقك فوراً!
          </div>
          {/* Visual diagram */}
          <div style={{ marginTop:"10px", direction:"ltr", display:"flex", justifyContent:"center" }}>
            <div style={{ background:Y, borderRadius:"10px", padding:"10px 14px", display:"inline-flex", flexDirection:"column", alignItems:"center", border:`2px solid ${BK}` }}>
              <div style={{ display:"flex", gap:"2px" }}>
                <span style={{ fontSize:"13px", color:BK }}>ㅇ</span>
                <span style={{ fontSize:"13px", color:BK }}>ㅏ</span>
              </div>
              <div style={{ display:"flex", gap:"2px", borderTop:"1px solid rgba(0,0,0,0.3)", marginTop:"3px", paddingTop:"3px" }}>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#0047AB" }}>ㄹ</span>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#C8102E" }}>ㄱ</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:"11px", color:"#aaa", marginTop:"5px" }}>닭 = داك (الدجاجة)</div>
        </div>

        <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"6px" }}>القاعدة الكبرى للربط 🔗</div>
          <div style={{ fontSize:"11px", color:BK2, lineHeight:1.9, marginBottom:"8px" }}>
            إذا جاء بعد الباتشيم المزدوج مقطع يبدأ بـ <strong>ㅇ</strong> الصامت، يتحرك الحرف <strong style={{color:"#C8102E"}}>الأيمن (الثاني)</strong> إلى المقطع التالي!
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {[
              {w:"닭이",r:"달기",m:"الدجاجة (مفعول به)"},
              {w:"없어요",r:"업써요",m:"لا يوجد (جملة)"},
              {w:"앉아요",r:"안자요",m:"يجلس (مؤدب)"},
            ].map(e=>(
              <div key={e.w} style={{ background:BK, borderRadius:"6px", padding:"6px 10px", display:"flex", justifyContent:"space-between", alignItems:"center", direction:"ltr" }}>
                <span style={{ fontSize:"16px", color:Y, fontWeight:900 }}>{e.w}</span>
                <span style={{ fontSize:"11px", color:"#4ade80", fontWeight:700 }}>→ [{e.r}]</span>
                <span style={{ fontSize:"11px", color:"#888", direction:"rtl" }}>{e.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>جدول أشهر الباتشيمات المزدوجة</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"6px" }}>
        {GYEOP.slice(0, 3).map((g,i)=>(
          <div key={i} style={{
            background: i%2===0 ? BK : BK2,
            borderRadius:"10px", padding:"10px 8px",
            border:`2px solid ${Y}44`,
            textAlign:"center",
          }}>
            <div style={{ fontSize:"22px", color:Y, fontWeight:900, direction:"ltr", letterSpacing:"2px" }}>{g.chars}</div>
            <div style={{ fontSize:"11px", color:"#aaa", marginTop:"2px" }}>تُنطق كـ</div>
            <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"18px", borderRadius:"6px", padding:"2px 8px", margin:"4px auto", display:"inline-block", direction:"ltr" }}>{g.read}</div>
            <div style={{ borderTop:`1px solid ${Y}33`, marginTop:"6px", paddingTop:"6px" }}>
              <div style={{ fontSize:"18px", color:Y, fontWeight:900, direction:"ltr" }}>{g.ex}</div>
              <div style={{ fontSize:"11px", color:"#aaa" }}>{g.rom}</div>
              <div style={{ fontSize:"11px", color:"#777" }}>{g.m}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:"11px", color:"#888", textAlign:"center", marginBottom:"6px" }}>
        + 5 more pairs covered in Book 2 →
      </div>

      <div style={{ background:GL, borderRadius:"10px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
        <MugunghwaIcon size={36} color={GD} />
        <div>
          <div style={{ fontWeight:800, fontSize:"11px", color:GD }}>نصيحة الخبراء</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.7 }}>
            لا تحفظ كل هذا فوراً! ابدأ بـ <strong>ㄺ (닭)، ㅄ (없다)، ㄻ (삶)</strong> — هذه الثلاثة تكفي لمستوى المبتدئين. ستتعلم الباقي تلقائياً من خلال القراءة.
          </div>
        </div>
      </div>
    </Page>
  );
}

function KdramaPageAr({ slice, page }: { slice:[number,number]; page:number }) {
  return (
    <Page dir="rtl">
      <SHead title={`أساسيات المسلسلات الكورية 🎬 — الجزء ${page===1?"١":"٢"} من ٢`} subtitle="كلمات سمعتها مئة مرة — اقرأها الآن بالهانغول!" />
      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"10px", marginBottom:"8px", fontSize:"11px", color:T2, fontWeight:700, background:SBG, padding:"7px 10px" }}>
        🎬 {page===1 ? "الكلمات الأساسية — تُسمع في كل حلقة تقريباً!" : "الكلمات المتقدمة — ستبدو كالمحترف!"}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
        {KDRAMA_AR.slice(...slice).map(v=>(
          <div key={v.k} style={{ background:"#fff", border:`1px solid ${BD}`, borderRadius:"8px", padding:"8px 10px", display:"flex", gap:"8px", alignItems:"flex-start", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ fontSize:"22px" }}>{v.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"22px", fontWeight:900, color:T1, background:Y, display:"inline-block", padding:"1px 8px", borderRadius:"4px", marginBottom:"2px", direction:"ltr" }}>{v.k}</div>
              <div style={{ fontSize:"11px", fontWeight:700, color:T3, direction:"ltr" }}>{v.r}</div>
              <div style={{ fontSize:"11px", color:T1, fontWeight:700 }}>{v.m}</div>
              <div style={{ fontSize:"11px", color:T3, fontStyle:"italic" }}>{v.note}</div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
function KdramaAr() { return <KdramaPageAr slice={[0,10]} page={1} />; }

function PracticeAr() {
  return (
    <Page dir="rtl">
      <SHead title="تمارين تطبيقية ✏️" subtitle="اختبر نفسك!" />
      {/* Knowles self-assessment checklist */}
      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px 12px", marginBottom:"10px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"7px" }}>✅ قائمة التحقق الذاتي — هل أنت مستعد للتمارين؟</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px" }}>
          {[
            "أستطيع نطق الـ١٤ حرفاً الساكناً",
            "أستطيع نطق الحروف المدية العشرة",
            "أستطيع بناء مقطع بسيط مثل 가، 나",
            "أعرف ما هو الباتشيم",
            "ألاحظ أن الكورية تُكتب في كتل",
            "فهمت قاعدة الربط الصوتي",
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", gap:"7px", alignItems:"flex-start" }}>
              <div style={{ width:"15px", height:"15px", border:`1px solid ${BD}`, borderRadius:"3px", flexShrink:0, marginTop:"2px" }} />
              <span style={{ fontSize:"10px", color:T2, lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
        {["المستوى ١ — /٥","المستوى ٢ — /٥","المستوى ٣ — /٥"].map((l,i)=>(
          <div key={i} style={{ flex:1, border:`1px solid ${BD}`, borderRadius:"6px", padding:"6px", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"16px" }}>{"⭐".repeat(i+1)}</div>
            <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"8px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>⭐ تحدي المستوى ١ — الصوت الصحيح</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{q:"ㄱ",c:["ن","م","ك","هـ"]},{q:"ㄴ",c:["ك","ن","س","م"]},{q:"ㅁ",c:["هـ","ب","م","ر"]},{q:"ㅅ",c:["س","ك","ج","ب"]},{q:"ㅎ",c:["م","هـ","ن","ك"]}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"28px", color:T1, fontWeight:900 }}>{e.q}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px", marginTop:"4px" }}>
                {e.c.map(ch=><div key={ch} style={{ border:`1px solid ${BD}`, borderRadius:"3px", padding:"2px", fontSize:"11px", color:T2, background:"#fff" }}>{ch}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"8px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>⭐⭐ تحدي المستوى ٢ — اكتب النطق</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{k:"가방",a:"ga-bang"},{k:"사랑",a:"sa-rang"},{k:"한국",a:"han-guk"},{k:"친구",a:"chin-gu"},{k:"고마워",a:"go-ma-wo"}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"6px 4px", fontSize:"20px", color:T1, fontWeight:900, background:"#fff" }}>{e.k}</div>
              <div style={{ marginTop:"4px", border:"1px dashed #aaa", borderRadius:"4px", height:"20px", background:"#fff" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"8px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>⭐⭐⭐ تحدي المستوى ٣ — ابنِ المقطع</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", direction:"ltr" }}>
          {[{eq:"ㅂ+ㅏ=?",a:"바"},{eq:"ㄴ+ㅗ=?",a:"노"},{eq:"ㅅ+ㅣ=?",a:"시"},{eq:"ㅎ+ㅏ=?",a:"하"},{eq:"ㄱ+ㅜ=?",a:"구"}].map((e,i)=>(
            <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"8px 10px", textAlign:"center", background:"#fff" }}>
              <div style={{ fontSize:"12px", color:T1, fontWeight:700 }}>{e.eq}</div>
              <div style={{ marginTop:"4px", border:"1px dashed #aaa", borderRadius:"4px", height:"28px", width:"38px", margin:"4px auto 0" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"5px" }}>✏️ شبكة الكتابة الحرة</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:"3px" }}>
        {Array(32).fill(null).map((_,i)=>(
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"3px", height:"30px", background:"#fff" }} />
        ))}
      </div>
    </Page>
  );
}

function AnswerAr() {
  return (
    <Page dir="rtl">
      <SHead title="مفتاح الإجابات + المرجع السريع" subtitle="تحقق من إجاباتك" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"10px" }}>
        {[
          { t:"تمرين ١", items:[["ㄱ","ك"],["ㄴ","ن"],["ㅁ","م"],["ㅅ","س"],["ㅎ","هـ"]] },
          { t:"تمرين ٢", items:[["가방","ga-bang"],["사랑","sa-rang"],["한국","han-guk"],["친구","chin-gu"],["고마워","go-ma-wo"]] },
          { t:"تمرين ٣", items:[["ㅂ+ㅏ","바"],["ㄴ+ㅗ","노"],["ㅅ+ㅣ","시"],["ㅎ+ㅏ","하"],["ㄱ+ㅜ","구"]] },
        ].map(ex=>(
          <div key={ex.t} style={{ background:"#f8f8f8", borderRadius:"8px", padding:"8px" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"5px" }}>{ex.t}</div>
            {ex.items.map(([q,a])=>(
              <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", padding:"2px 0", borderBottom:"1px solid #eee", direction:"ltr" }}>
                <span style={{ fontWeight:700 }}>{q}</span>
                <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"10px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"7px" }}>جدول المرجع السريع — الحروف الساكنة</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {CONSONANTS.map(c=>(
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color:T1, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"10px", color:T3 }}>{c.roman}</div>
              <div style={{ fontSize:"12px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:BD, margin:"6px 0" }} />
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>حروف المد</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"4px" }}>
          {VOWELS.map(v=>(
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:T1, fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"10px", color:T3 }}>{v.roman}</div>
              <div style={{ fontSize:"11px" }}>{v.emoji}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"16px", textAlign:"center", background:SBG }}>
        <div style={{ fontSize:"32px", marginBottom:"4px" }}>🏆</div>
        <div style={{ fontSize:"20px", fontWeight:900, color:T1 }}>تهانينا! أتممت مستوى الهانغول الأول</div>
        <div style={{ margin:"12px auto", width:"220px", borderBottom:`2px solid ${BD}` }} />
        <div style={{ fontSize:"11px", color:T3 }}>اسم الطالب</div>
        <div style={{ marginTop:"10px", fontSize:"11px", color:T3 }}>Klovers Korean Academy • klovers.academy • 2025</div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════
   BOOK PAGES — English version
══════════════════════════════════════════════════ */

/* ── History page EN ── */
function HistoryEn() {
  return (
    <Page dir="ltr">
      <SHead title="The History of the Korean Language" subtitle="A 2,000-year journey of words, power, and revolution" />

      {/* Photo header */}
      <div style={{ marginBottom:"10px", borderRadius:"10px", overflow:"hidden" }}>
        <SceneClassroom h={280} radius={10} />
      </div>
      <DancheongBorder />

      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"8mm" }}>
        {[
          { era:"Before 1000 AD", icon:"🏔️", title:"Origins of Korean", body:"The Korean language developed over thousands of years on the Korean Peninsula. It is classified today as a language isolate — not related to Chinese, Japanese, or any other language family. It has its own unique grammar, vocabulary, and rhythm unlike any other language on Earth!" },
          { era:"1000–1442 AD", icon:"📜", title:"The Era of Hanja — Borrowed Characters", body:"Before Hangul, Koreans used Chinese characters (漢字 Hanja). They were incredibly difficult to learn — only the elite scholarly class could read and write. Over 95% of the Korean population was completely illiterate." },
          { era:"1443 AD ★", icon:"👑", title:"King Sejong's Revolution", body:"King Sejong recognized this as a profound injustice. He assembled 8 brilliant scholars in the Hall of Worthies (집현전) and they worked for years in secret to invent a new alphabet perfectly suited to Korean sounds." },
          { era:"1446 AD", icon:"📚", title:"Hunminjeongeum Announced", body:"The new alphabet was proclaimed as «훈민정음» (Hunminjeongeum) — 'The Correct Sounds for the Instruction of the People.' The ruling class fiercely opposed it — but the king prevailed. Today, Hangul Day is celebrated every October 9th worldwide." },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"6px", paddingBottom:"6px", borderBottom:`1px solid ${BD}`, alignItems:"flex-start" }}>
            <div style={{ fontSize:"18px", flexShrink:0, marginTop:"2px" }}>{item.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"10px", fontWeight:600, color:T3, marginBottom:"1px" }}>{item.era}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3px" }}>{item.title}</div>
              <div style={{ fontSize:"11px", color:T2, lineHeight:1.7 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`3px solid ${Y}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3px" }}>Amazing Fact!</div>
        <p style={{ fontSize:"11px", color:T2, lineHeight:1.7, margin:0 }}>
          Korean is spoken by over <strong>80 million people</strong> worldwide. UNESCO recognized Hangul as one of the most scientifically designed and logically structured writing systems ever created in human history!
        </p>
      </div>
    </Page>
  );
}

/* ── King Sejong page EN ── */
function SejongEn() {
  return (
    <Page dir="ltr">
      <SHead title="King Sejong the Great 👑" subtitle="The man who changed a nation's destiny with one word: justice" />

      {/* Bio */}
      <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:"14px", marginBottom:"8mm", paddingBottom:"6mm", borderBottom:`1px solid ${BD}` }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <SceneTeacher h={120} radius={0} />
          <div style={{ background:SBG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"6px" }}>
            <div style={{ fontSize:"16px", fontWeight:900, color:T1 }}>세종대왕</div>
            <div style={{ fontSize:"10px", color:T3, marginTop:"1px" }}>Sejong the Great</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:"15px", fontWeight:900, color:T1, marginBottom:"8px" }}>Sejong the Great</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            {[
              { icon:"🎂", label:"Born", val:"May 15, 1397 AD" },
              { icon:"👑", label:"Reign", val:"1418 – 1450 AD" },
              { icon:"🏛️", label:"Dynasty", val:"Joseon Royal Dynasty" },
              { icon:"📚", label:"Greatest Achievement", val:"Invented Hangul in 1443" },
              { icon:"🌟", label:"Title", val:"'Greatest King of Korea'" },
            ].map(r=>(
              <div key={r.label} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"12px" }}>{r.icon}</span>
                <span style={{ fontSize:"10px", color:T3, minWidth:"70px" }}>{r.label}</span>
                <span style={{ fontSize:"10px", color:T2, fontWeight:600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom:"8mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"5mm" }}>How were the letters designed?</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px" }}>
          {[
            { icon:"👅", title:"Tongue & Mouth Shape", body:"Every consonant was designed based on the exact shape of the tongue and mouth when producing that sound — science and art combined!" },
            { icon:"🔬", title:"Precise Phonetics", body:"ㄱ = tongue root rising toward throat. ㄴ = tongue tip touching upper palate. ㅁ = lips pressed together. Each shape mirrors the sound." },
            { icon:"🏗️", title:"Logical Structure", body:"Related letters look alike — ㄱ is the base, ㄲ is doubled, ㅋ has an extra stroke for aspiration. A complete, consistent system." },
          ].map(c=>(
            <div key={c.title} style={{ background:SBG, borderRadius:"6px", padding:"10px", border:`1px solid ${BD}` }}>
              <div style={{ fontSize:"22px", marginBottom:"5px" }}>{c.icon}</div>
              <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>{c.title}</div>
              <div style={{ fontSize:"10px", color:T2, lineHeight:1.7 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"12px" }}>
        <div style={{ fontSize:"12px", color:T2, lineHeight:2, fontStyle:"italic" }}>
            A wise man can acquaint himself with them before the morning is over; a stupid man can learn them in the space of ten days.
          </div>
          <div style={{ fontSize:"11px", color:T3, fontWeight:700, marginTop:"5px" }}>— King Sejong the Great, Hunminjeongeum Preface, 1446 AD</div>
      </div>
    </Page>
  );
}

/* ── Culture page EN ── */
function CultureEn() {
  return (
    <Page dir="ltr">
      <SHead title="Korean Culture 🌸" subtitle="5,000 years of beauty, philosophy, and art" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"8mm" }}>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", overflow:"hidden" }}>
          <SceneStreet h={160} radius={0} />
          <div style={{ padding:"8px", background:SBG }}>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>K-Drama</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.6 }}>
              Among Netflix's most-watched content. Squid Game changed global TV. Korean storytelling captures hearts!
            </div>
          </div>
        </div>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", overflow:"hidden" }}>
          <SceneConcert h={160} radius={0} />
          <div style={{ padding:"8px", background:SBG }}>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>K-Pop</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.6 }}>
              BTS, BLACKPINK, Stray Kids — global superstars. K-Pop is dance, fashion, art, and worldwide fandom!
            </div>
          </div>
        </div>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", overflow:"hidden" }}>
          <SceneFood h={140} radius={0} />
          <div style={{ padding:"8px", background:SBG }}>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"3px" }}>Korean Food</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.6 }}>
              Kimchi, Bibimbap, Tteokbokki — foods that surprise and addict you!
            </div>
          </div>
        </div>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", background:SBG }}>
          <div style={{ fontSize:"22px", marginBottom:"5px" }}>🌿</div>
          <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"4px" }}>Korean Values & Spirit</div>
          <div style={{ fontSize:"10px", color:T2, lineHeight:1.7 }}>
            <strong>빨리빨리</strong> = "hurry hurry" — <strong>눈치</strong> = reading unspoken feelings. <strong>한</strong> = a deep bittersweet longing — the eternal spirit of the Korean people.
          </div>
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", marginBottom:"8mm", background:SBG }}>
        <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
          <div style={{ fontSize:"32px", fontWeight:900, color:T1, lineHeight:1, flexShrink:0 }}>정</div>
          <div>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"4px" }}>정 (Jeong) — The untranslatable heart of Korean culture</div>
            <div style={{ fontSize:"10px", color:T2, lineHeight:1.8 }}>
              A soul-level bond that slowly forms through shared daily moments. In K-dramas you'll constantly hear: <strong>«정이 들었어»</strong> = "I've grown attached to you without realizing it."
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"11px", fontWeight:700, color:T1, marginBottom:"5px" }}>After completing all 6 books you will be able to:</div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {["Watch K-dramas without subtitles 🎬","Speak to Koreans with confidence 🗣️","Read signs in Korea 🪧","Sing along to K-Pop songs 🎵"].map(t=>(
            <div key={t} style={{ fontSize:"10px", color:T2, padding:"3px 7px", border:`1px solid ${BD}`, borderRadius:"4px" }}>{t}</div>
          ))}
        </div>
      </div>
    </Page>
  );
}

/* ── Course Overview page EN ── */
function CourseEn() {
  return (
    <Page dir="ltr">
      <SHead title="The Klovers Series — 6 Books to Fluency 📚" subtitle="Your complete roadmap from zero to confident Korean" />

      <p style={{ fontSize:"11px", color:T2, lineHeight:1.8, marginBottom:"6mm" }}>
        The Klovers series takes you from <strong>knowing nothing</strong> to <strong>speaking and writing fluently</strong> — using the K-dramas and music you already love as your learning material. Each book builds on the last.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"8mm" }}>
        {BOOKS_EN.map((b,i)=>(
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"12px",
            padding:"7px 0", borderBottom:`1px solid ${BD}`,
            background: b.current ? YL : "transparent",
          }}>
            <div style={{
              border: b.current ? `2px solid ${Y}` : `1px solid ${BD}`,
              background: b.current ? Y : SBG,
              color: b.current ? T1 : T3,
              fontWeight:900,
              width:"40px", height:"36px", borderRadius:"6px",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              flexShrink:0, gap:"1px",
            }}>
              <span style={{ fontSize:"9px", fontWeight:700, opacity:0.7 }}>Book</span>
              <span style={{ fontSize:"15px", lineHeight:1 }}>{b.n}</span>
            </div>
            <div style={{ fontSize:"18px", flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight: b.current ? 900 : 700, fontSize:"11px", color:T1 }}>{b.title}</div>
              <div style={{ fontSize:"10px", color: b.current ? T2 : T3, marginTop:"1px" }}>
                {b.current ? "📍 You are here — start your journey!" : b.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
        {[
          { icon:"⏱️", title:"15–20 min", sub:"per day is enough" },
          { icon:"🎯", title:"6 Books", sub:"zero to fluency" },
          { icon:"🎬", title:"Real Language", sub:"from dramas & life" },
        ].map(s=>(
          <div key={s.title} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"10px", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:"11px", color:T1 }}>{s.title}</div>
            <div style={{ fontSize:"10px", color:T3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function CoverEn() {
  const syllables = "가나다라마바사아자차카타파하갈날달랄말발살알잘찰칼탈팔할감남담람맘밤삼암잠참캄탐팜함강낭당랑망방상앙장창캉탕팡항";
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", background:"#080808",
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      display:"flex", flexDirection:"column",
      direction:"ltr",
    }}>
      {/* Wallpaper — Korean syllables at near-invisible opacity */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        fontSize:"26px", fontWeight:900, color:Y, opacity:0.035,
        lineHeight:1.5, letterSpacing:"6px", padding:"8px",
        wordBreak:"break-all", userSelect:"none", overflow:"hidden",
      }}>{syllables.repeat(35)}</div>

      {/* Radial spotlight behind hero text */}
      <div style={{
        position:"absolute", top:"12%", left:"50%", transform:"translateX(-50%)",
        width:"500px", height:"320px",
        background:"radial-gradient(ellipse at center, rgba(255,255,0,0.18) 0%, rgba(255,255,0,0.06) 45%, transparent 72%)",
        zIndex:1, pointerEvents:"none",
      }} />

      {/* ── CONTENT ── */}
      <div style={{ position:"relative", zIndex:2, flex:1, display:"flex", flexDirection:"column" }}>

        {/* Logo bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", padding:"13mm 16mm 6mm" }}>
          <div style={{ flex:1, height:"1px", background:"rgba(255,255,0,0.22)" }} />
          <img src="/klovers-logo.jpg" alt="Klovers" style={{ height:"38px", objectFit:"contain", borderRadius:"6px" }} />
          <div style={{ flex:1, height:"1px", background:"rgba(255,255,0,0.22)" }} />
        </div>

        {/* Publisher tag */}
        <div style={{ textAlign:"center", marginBottom:"6mm" }}>
          <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", letterSpacing:"3px" }}>KLOVERS KOREAN ACADEMY</span>
        </div>

        {/* ── HERO: 한글 ── */}
        <div style={{ textAlign:"center", padding:"0 10mm", marginBottom:"6mm" }}>
          <div style={{
            fontSize:"172px", fontWeight:900, color:GOLD, lineHeight:0.88,
            textShadow:`0 0 50px rgba(212,175,55,0.75), 0 0 100px rgba(212,175,55,0.35), 0 0 180px rgba(212,175,55,0.18)`,
            marginBottom:"10px",
          }}>한글</div>
          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", letterSpacing:"13px", fontWeight:500 }}>
            H&nbsp;&nbsp;A&nbsp;&nbsp;N&nbsp;&nbsp;G&nbsp;&nbsp;U&nbsp;&nbsp;L
          </div>
        </div>

        {/* Dancheong colour band */}
        <div style={{ display:"flex", height:"5px", overflow:"hidden" }}>
          {(["#C8102E","#0047AB","#FFFF00","#228B22","#C8102E","#0047AB","#FFFF00","#228B22",
             "#C8102E","#0047AB","#FFFF00","#228B22","#C8102E","#0047AB","#FFFF00","#228B22"] as string[]).map((c,i)=>(
            <div key={i} style={{ flex:1, background:c }} />
          ))}
        </div>

        {/* Full-bleed cinematic photo */}
        <div style={{ width:"100%", position:"relative" }}>
          <SceneCover h={240} radius={0} />
        </div>

        {/* Dancheong colour band bottom */}
        <div style={{ display:"flex", height:"5px", overflow:"hidden", marginBottom:"9mm" }}>
          {(["#228B22","#FFFF00","#0047AB","#C8102E","#228B22","#FFFF00","#0047AB","#C8102E",
             "#228B22","#FFFF00","#0047AB","#C8102E","#228B22","#FFFF00","#0047AB","#C8102E"] as string[]).map((c,i)=>(
            <div key={i} style={{ flex:1, background:c }} />
          ))}
        </div>

        {/* English title */}
        <div style={{ textAlign:"center", padding:"0 14mm", marginBottom:"7mm" }}>
          <div style={{ fontSize:"28px", fontWeight:900, color:"#ffffff", lineHeight:1.15, marginBottom:"5px" }}>
            Read Korean in 7 Days
          </div>
          <div style={{ fontSize:"13px", color:`rgba(212,175,55,0.9)`, fontWeight:700, letterSpacing:"1px" }}>
            Exclusive English–Korean Edition
          </div>
        </div>

        {/* Glassmorphism tags */}
        <div style={{ display:"flex", gap:"7px", justifyContent:"center", flexWrap:"wrap", padding:"0 14mm", marginBottom:"7mm" }}>
          {["🎬 K-Drama", "🎵 K-Pop", "🌸 Korean Culture"].map(t => (
            <span key={t} style={{
              background:"rgba(212,175,55,0.10)", color:`rgba(212,175,55,0.95)`,
              border:`1px solid rgba(212,175,55,0.35)`,
              fontSize:"11px", fontWeight:700, padding:"5px 13px", borderRadius:"20px",
            }}>{t}</span>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* Level badge + alphabet strip + copyright */}
        <div style={{ padding:"0 14mm 11mm" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"8px" }}>
            <div style={{
              border:`1.5px solid rgba(212,175,55,0.6)`, borderRadius:"7px",
              padding:"5px 22px", textAlign:"center",
            }}>
              <span style={{ fontSize:"11px", fontWeight:900, color:`rgba(212,175,55,0.9)`, letterSpacing:"1px" }}>
                Level 1 — Beginner
              </span>
            </div>
          </div>

          {/* Alphabet strip */}
          <div style={{ display:"flex", gap:"3px", justifyContent:"center", marginBottom:"9px" }}>
            {"ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜ".split("").map((ch,i) => (
              <div key={i} style={{
                width:"21px", height:"21px",
                background:`rgba(212,175,55,${i%3===0?0.14:i%3===1?0.07:0.10})`,
                border:"1px solid rgba(212,175,55,0.22)",
                borderRadius:"4px",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"12px", color:`rgba(212,175,55,0.85)`, fontWeight:700,
              }}>{ch}</div>
            ))}
          </div>

          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.22)", letterSpacing:"1px" }}>
              © 2025 Klovers Korean Academy — klovers.academy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudyPlanEn() {
  const days = [
    { d:"Day 1", icon:"🔤", task:"Consonants — Part 1 (ㄱ–ㅅ)", tip:"Repeat each letter 10 times out loud", color:"#fef9ec" },
    { d:"Day 2", icon:"🔤", task:"Consonants — Part 2 (ㅇ–ㅎ)", tip:"Write each letter 5 times in a notebook", color:"#fef9ec" },
    { d:"Day 3", icon:"🗣️", task:"Vowels (ㅏ–ㅕ) + Tensed Consonants", tip:"Listen to pronunciation via QR then repeat", color:"#f0fff4" },
    { d:"Day 4", icon:"🏗️", task:"Syllable Blocks + Batchim", tip:"Try spelling your name in Korean!", color:"#f0fff4" },
    { d:"Day 5", icon:"✏️", task:"Practice Exercises (Levels 1–3)", tip:"Set aside 30 minutes — phone off!", color:"#fffef0" },
    { d:"Day 6", icon:"🎬", task:"K-Drama Vocabulary (20 words)", tip:"Link each word to a scene you remember", color:"#fffef0" },
    { d:"Day 7", icon:"🏆", task:"Full Review + Vocabulary Test", tip:"Read 5 random Korean words aloud!", color:"#f0f4ff" },
  ];
  return (
    <Page dir="ltr">
      <SHead title="7-Day Study Plan" subtitle="Follow this plan and you'll read Korean in one week!" />
      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"10px", marginBottom:"8mm", background:SBG, padding:"8px 10px" }}>
        <div style={{ fontSize:"12px", fontWeight:800, color:T1, marginBottom:"2px" }}>🎯 Goal: Read Hangul in 7 Days</div>
        <div style={{ fontSize:"11px", color:T3, lineHeight:1.6 }}>30–45 minutes daily is enough. Consistency beats quantity!</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", marginBottom:"8mm" }}>
        {days.map((day, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"54px 1fr", gap:"10px", padding:"7px 0", borderBottom:`1px solid ${BD}`, alignItems:"baseline" }}>
            <div style={{ fontSize:"10px", fontWeight:900, color: i===6 ? T1 : T3, background: i===6 ? Y : "transparent", padding: i===6 ? "1px 5px" : "0", borderRadius:"3px", display:"inline-block" }}>{day.d}</div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>{day.task}</div>
              <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>{day.tip}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.7, borderTop:`1px solid ${BD}`, paddingTop:"4mm", margin:0 }}>
        🔑 <strong>The secret to success:</strong> Don't move to the next day until you've mastered the current day's letters. Quality always beats speed!
      </p>
    </Page>
  );
}

function AspiratedEn() {
  return (
    <Page dir="ltr">
      <SHead title="Tensed Consonants (된소리) 💥" subtitle="5 consonants pronounced with extra tension — no air!" />
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.6, marginBottom:"4mm", borderLeft:`3px solid ${Y}`, paddingLeft:"8px" }}>
        ⚠️ <strong>Beginner note:</strong> These are advanced — master the 14 basic consonants first. Come back to this page in Week 2!
      </p>
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.6, marginBottom:"5mm" }}>
        Key difference: regular consonants release a puff of air. Tensed consonants release <strong>no</strong> air — throat and mouth are compressed.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px 16px", marginBottom:"8mm" }}>
        {ASPIRATED.map(a => (
          <div key={a.char} style={{ paddingBottom:"7px", borderBottom:`1px solid ${BD}`, pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"4px" }}>
              <div style={{ border:`1px solid ${BD}`, borderRadius:"4px", width:"50px", height:"50px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:SBG, flexShrink:0 }}>
                <div style={{ fontSize:"32px", color:T1, fontWeight:900, lineHeight:1 }}>{a.char}</div>
                <div style={{ fontSize:"10px", color:T3 }}>{a.roman}</div>
              </div>
              <div>
                <div style={{ fontSize:"12px", fontWeight:800, color:T1 }}>{a.en.name}</div>
                <div style={{ fontSize:"10px", color:T3 }}>= {a.base} + extra tension</div>
              </div>
            </div>
            <div style={{ fontSize:"10px", color:T2, marginBottom:"2px" }}>🔊 {a.en.sound}</div>
            <div style={{ fontSize:"10px", color:T2, borderLeft:`2px solid ${Y}`, paddingLeft:"5px", marginBottom:"4px", fontStyle:"italic" }}>{a.en.mnemonic}</div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {a.en.ex.map((ex, i) => (
                <span key={i} style={{ fontSize:"10px", color:T2 }}>
                  <strong style={{ color:T1 }}>{ex.k}</strong> ({ex.r}) — {ex.m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>🔊 Hear the difference: regular vs tensed</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio/tensed</div>
        </div>
      </div>
    </Page>
  );
}

function CompoundVowelsEn() {
  return (
    <Page dir="ltr">
      <SHead title="Compound Vowels (이중모음) 🔗" subtitle="11 diphthongs built from two simple vowels!" />
      <p style={{ fontSize:"11px", color:T2, lineHeight:1.6, marginBottom:"5mm" }}>
        Don't memorize them all now! Most common: <strong>ㅘ ㅝ ㅐ ㅔ ㅢ</strong> — you'll meet these constantly in K-dramas and songs.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px 10px", marginBottom:"8mm" }}>
        {COMPOUND_VOWELS.map(v => (
          <div key={v.char} style={{ display:"flex", gap:"8px", alignItems:"flex-start", paddingBottom:"5px", borderBottom:`1px solid ${BD}`, pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ border:`1px solid ${BD}`, borderRadius:"4px", width:"34px", height:"34px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:SBG, flexShrink:0 }}>
              <div style={{ fontSize:"20px", color:T1, fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"9px", color:T3 }}>{v.roman}</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"10px", color:T2, marginBottom:"2px" }}>{v.en}</div>
              <div style={{ fontSize:"9px", color:T3 }}>{v.ex}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={40} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>🔊 Hear compound vowel pronunciation</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio/compound</div>
        </div>
      </div>
    </Page>
  );
}

function WelcomeEn() {
  const plan = [
    {d:"Day 1",t:"Vowels ㅏ–ㅜ"},{d:"Day 2",t:"Vowels ㅡ–ㅕ"},
    {d:"Day 3",t:"Cons. ㄱ–ㄷ"},{d:"Day 4",t:"Cons. ㄹ–ㅅ"},
    {d:"Day 5",t:"Cons. ㅇ–ㅊ"},{d:"Day 6",t:"Cons. ㅋ–ㅎ"},
    {d:"Day 7",t:"Syllables + Review 🏆"},
  ];
  return (
    <Page dir="ltr">
      <SHead title="Welcome to Hangul!" subtitle="Discover the beauty of the Korean alphabet" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"7mm" }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"5px" }}>Why Hangul is Brilliant</div>
          <p style={{ fontSize:"10px", lineHeight:1.8, color:T2, margin:0 }}>
            King Sejong invented Hangul in 1443. It is a <strong>phonetic alphabet</strong> — each letter represents exactly one sound. Most learners can read in just <strong>2–3 days</strong> of focused practice!
          </p>
        </div>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"7px" }}>The Magic Numbers</div>
          {[{n:"14",l:"basic consonants"},{n:"10",l:"basic vowels"},{n:"∞",l:"possible syllables"}].map(({n,l})=>(
            <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
              <div style={{ border:`2px solid ${Y}`, color:T1, fontWeight:900, fontSize:"16px", width:"34px", height:"34px", borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:"10px", color:T2, fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"12px", marginBottom:"7mm", background:SBG }}>
        <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"8px", textAlign:"center" }}>How a Syllable Block Works</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", flexWrap:"wrap" }}>
          {[
            {label:"Consonant",char:"ㅎ",sub:"h"},
            {label:"+",char:"",sub:""},
            {label:"Vowel",char:"ㅏ",sub:"a"},
            {label:"=",char:"",sub:""},
            {label:"Syllable!",char:"하",sub:"ha"},
          ].map((item,i)=>
            item.char===""?(
              <div key={i} style={{fontSize:"20px",fontWeight:900,color:T3}}>{item.label}</div>
            ):(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"10px",color:T3,marginBottom:"3px"}}>{item.label}</div>
                <div style={{border:`1px solid ${BD}`,borderRadius:"6px",padding:"6px 12px",fontSize:"36px",fontWeight:900,color:T1,lineHeight:1,background:i===4?YL:"#fff"}}>{item.char}</div>
                {item.sub&&<div style={{fontSize:"10px",color:T3,marginTop:"3px"}}>{item.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      <div style={{ fontSize:"10px", fontWeight:700, color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"5px" }}>7-Day Study Plan</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"6mm" }}>
        {plan.map((p,i)=>(
          <div key={i} style={{ border:`1px solid ${i===6?Y:BD}`, borderRadius:"4px", padding:"5px 3px", textAlign:"center", background:i===6?YL:SBG }}>
            <div style={{ fontSize:"9px", fontWeight:800, color:T1 }}>{p.d}</div>
            <div style={{ fontSize:"9px", color:T3, marginTop:"2px", lineHeight:1.3 }}>{p.t}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"10px", fontWeight:700, color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"5px" }}>Letter families — how they're related</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {[
            { base:"ㄱ", derived:["ㅋ","ㄲ"] },
            { base:"ㄷ", derived:["ㅌ","ㄸ"] },
            { base:"ㅂ", derived:["ㅍ","ㅃ"] },
            { base:"ㅅ", derived:["ㅆ"] },
            { base:"ㅈ", derived:["ㅊ","ㅉ"] },
          ].map(f=>(
            <div key={f.base} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <span style={{ border:`2px solid ${Y}`, color:T1, fontWeight:900, fontSize:"15px", borderRadius:"4px", padding:"2px 6px" }}>{f.base}</span>
              <span style={{ color:T3, fontSize:"10px" }}>→</span>
              {f.derived.map(d=>(
                <span key={d} style={{ border:`1px solid ${BD}`, color:T2, fontWeight:700, fontSize:"13px", borderRadius:"4px", padding:"2px 6px", background:SBG }}>{d}</span>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize:"10px", color:T3, marginTop:"4px" }}>
          The base letter (outlined) gains strokes for more force — ㄱ→ㅋ (aspirated), ㄱ→ㄲ (tense/doubled)
        </div>
      </div>
    </Page>
  );
}

/* ── Table of Contents EN ── */
function TocEn() {
  const chapters = [
    { n:"1",  title:"7-Day Study Plan",                    icon:"🗓️", page:3,  new:true },
    { n:"2",  title:"The History of the Korean Language",  icon:"📜", page:4 },
    { n:"3",  title:"King Sejong the Great",               icon:"👑", page:5 },
    { n:"4",  title:"Korean Culture",                      icon:"🌸", page:6 },
    { n:"5",  title:"The Klovers Book Series",             icon:"📚", page:7 },
    { n:"6",  title:"Welcome to Hangul!",                  icon:"🎉", page:8 },
    { n:"7",  title:"Consonants — Part 1 of 2",            icon:"🔤", page:9 },
    { n:"8",  title:"Consonants — Part 2 of 2",            icon:"🔤", page:10 },
    { n:"9",  title:"Vowels",                              icon:"🗣️", page:11 },
    { n:"10", title:"Tensed Consonants (된소리)",            icon:"💥", page:12, new:true },
    { n:"11", title:"Compound Vowels (이중모음)",            icon:"🔗", page:13, new:true },
    { n:"12", title:"Building Syllable Blocks",            icon:"🏗️", page:14 },
    { n:"13", title:"Batchim — The Final Consonant",       icon:"⬇️", page:15 },
    { n:"14", title:"Double Batchim (겹받침)",              icon:"✌️", page:16 },
    { n:"15", title:"K-Drama Essentials — Part 1",         icon:"🎬", page:17 },
    { n:"16", title:"K-Drama Essentials — Part 2",         icon:"🎬", page:18 },
    { n:"17", title:"Practice Exercises",                  icon:"✏️", page:19 },
    { n:"18", title:"Answer Key & Quick Reference",        icon:"🏆", page:20 },
    { n:"19", title:"Vocabulary Appendix — Top 50 Words",  icon:"📖", page:21 },
  ];
  return (
    <Page dir="ltr">
      <div style={{ textAlign:"center", marginBottom:"14px" }}>
        <div style={{ fontSize:"11px", color:"#888", letterSpacing:"4px", marginBottom:"4px" }}>KLOVERS OFFICIAL HANGUL BOOK — LEVEL 1</div>
        <div style={{ fontSize:"26px", fontWeight:900, color:BK, lineHeight:1.1 }}>Table of Contents</div>
        <div style={{ fontSize:"13px", color:"#666", fontWeight:700, marginTop:"3px" }}>محتويات الكتاب</div>
        <div style={{ marginTop:"8px" }}><DancheongBorder /></div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"8mm" }}>
        {chapters.map((ch, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"10px",
            padding:"6px 0", borderBottom:`1px solid ${BD}`,
          }}>
            <div style={{ fontSize:"10px", fontWeight:700, color:T3, width:"24px", textAlign:"left", flexShrink:0 }}>{ch.n}</div>
            <div style={{ flex:1, fontSize:"11px", fontWeight:700, color:T1, display:"flex", alignItems:"center", gap:"5px" }}>
              {ch.title}
              {(ch as any).new && <span style={{ background:Y, color:T1, fontSize:"8px", fontWeight:900, padding:"0 4px", borderRadius:"2px", flexShrink:0 }}>NEW</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
              <div style={{ width:"30px", borderBottom:"1px dotted #ccc" }} />
              <span style={{ fontSize:"10px", color:T3, width:"16px", textAlign:"right" }}>{ch.page}</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize:"11px", color:T2, lineHeight:1.7, borderTop:`1px solid ${BD}`, paddingTop:"4mm", margin:0 }}>
        Read each chapter in order — every chapter builds on the last. In 7 days you'll be reading Korean!
      </p>
    </Page>
  );
}

function ConsonantsEn({ slice, page }: { slice:[number,number]; page:number }) {
  const count = slice[1] - slice[0];
  const kpopLyrics = page === 1
    ? { lyric:"나비야", rom:"na-bi-ya", meaning:"Oh butterfly", song:"Korean folk song" }
    : { lyric:"고마워", rom:"go-ma-wo", meaning:"Thank you", song:"IU — Palette" };
  return (
    <Page dir="ltr" chapter="Consonants">
      <SHead title={`Consonants (자음) — Part ${page} of 2`} subtitle="Every Korean syllable begins with a consonant" />
      <p style={{ fontSize:"11px", color:T2, marginBottom:"4mm", lineHeight:1.6 }}>
        By the end of this page you will be able to read, pronounce, and write <strong>{count}</strong> new Korean letters.
        {page===1 && " There are 14 basic consonants — master these before the aspirated forms."}
      </p>
      <StrokeOrderTip lang="en" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
        {CONSONANTS.slice(...slice).map(c=><ConsCard key={c.char} c={c} lang="en" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginTop:"5mm",
        borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>Listen to pronunciation</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio</div>
        </div>
      </div>
      <div style={{ marginTop:"4mm", paddingTop:"3mm", borderTop:`1px solid ${BD}` }}>
        <span style={{ fontSize:"9px", color:T3, textTransform:"uppercase", letterSpacing:"1px" }}>K-Pop lyric you can now read </span>
        <div style={{ marginTop:"2px", fontSize:"16px", fontWeight:900, color:T1 }}>
          {kpopLyrics.lyric}
          <span style={{ fontSize:"11px", fontWeight:400, color:T3 }}> [{kpopLyrics.rom}] — {kpopLyrics.meaning}</span>
        </div>
      </div>
      <div style={{ marginTop:"4mm" }}>
        <div style={{ fontSize:"10px", color:T3, marginBottom:"3px" }}>Now try it — spell your name in Korean:</div>
        <div style={{ height:"22px", borderBottom:`1px solid ${BD}` }} />
      </div>
    </Page>
  );
}

function VowelsEn() {
  return (
    <Page dir="ltr" chapter="Vowels">
      <SHead title="Vowels (모음)" subtitle="Vowels never stand alone — they always need a consonant" />
      <p style={{ fontSize:"11px", color:T2, marginBottom:"4mm", lineHeight:1.6 }}>
        By the end of this page you will be able to read and pronounce all 10 Korean vowels and form complete syllables.
        When a syllable starts with a vowel sound, use silent ㅇ as a placeholder — e.g., "a" = 아.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
        {VOWELS.map(v=><VowCard key={v.char} v={v} lang="en" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginTop:"5mm",
        borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, color:T1 }}>Hear all vowel sounds</div>
          <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>klovers.academy/audio</div>
        </div>
      </div>
      <MiniReadingStripEn />
    </Page>
  );
}

function SyllableEn() {
  return (
    <Page dir="ltr" chapter="Syllable Blocks">
      <SHead title="Building Syllable Blocks" subtitle="The smart way Korean combines letters" />
      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"6mm" }}>
        {[
          {n:"①",t:"Every syllable starts with a consonant",n2:"Use silent ㅇ if starting with a vowel sound",ex:"아 = ㅇ+ㅏ"},
          {n:"②",t:"Tall vowels sit to the RIGHT",n2:"ㅏ ㅓ ㅣ ㅐ ㅔ ㅑ ㅕ",ex:"가 나 사 바"},
          {n:"③",t:"Wide vowels sit BELOW",n2:"ㅗ ㅜ ㅡ ㅛ ㅠ",ex:"고 노 소 도"},
          {n:"④",t:"받침 — final consonant goes under the block",n2:"Optional — sits at the bottom",ex:"한 = ㅎ+ㅏ+ㄴ"},
        ].map(r=>(
          <div key={r.n} style={{ display:"flex", gap:"10px", alignItems:"baseline",
            paddingBottom:"5px", borderBottom:`1px solid ${BD}` }}>
            <span style={{ fontSize:"13px", fontWeight:900, color:T1, flexShrink:0, width:"18px" }}>{r.n}</span>
            <div>
              <span style={{ fontSize:"11px", fontWeight:700, color:T1 }}>{r.t}</span>
              <span style={{ fontSize:"10px", color:T3 }}> — {r.n2}</span>
              <span style={{ fontSize:"13px", fontWeight:900, color:T1, marginLeft:"8px", display:"inline-block" }}> {r.ex}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"3mm" }}>Syllable Examples</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"6px" }}>
        {SYLLABLES.map(s=>(
          <div key={s.b} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"6px 3px", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"9px", color:T3 }}>{s.c}+{s.v}</div>
            <div style={{ fontSize:"30px", fontWeight:900, color:T1, lineHeight:1.1 }}>{s.b}</div>
            <div style={{ fontSize:"9px", color:T3 }}>{s.r}</div>
            <div style={{ fontSize:"9px", color:T2 }}>{s.en}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ── Batchim (Single) EN ── */
function BatchimEn() {
  const FINAL7 = [
    { sound:"k",  chars:["ㄱ","ㄲ","ㅋ"], ex:[{k:"국",r:"guk",m:"soup"},{k:"부엌",r:"bu-eok",m:"kitchen"}] },
    { sound:"n",  chars:["ㄴ"],           ex:[{k:"눈",r:"nun",m:"eye/snow"},{k:"돈",r:"don",m:"money"}] },
    { sound:"t",  chars:["ㄷ","ㅅ","ㅆ","ㅈ","ㅊ","ㅌ","ㅎ"], ex:[{k:"옷",r:"ot",m:"clothes"},{k:"낮",r:"nat",m:"daytime"}] },
    { sound:"l",  chars:["ㄹ"],          ex:[{k:"달",r:"dal",m:"moon"},{k:"말",r:"mal",m:"language/horse"}] },
    { sound:"m",  chars:["ㅁ"],          ex:[{k:"봄",r:"bom",m:"spring"},{k:"꿈",r:"kkum",m:"dream"}] },
    { sound:"p",  chars:["ㅂ","ㅍ"],     ex:[{k:"밥",r:"bap",m:"rice"},{k:"잎",r:"ip",m:"leaf"}] },
    { sound:"ng", chars:["ㅇ"],          ex:[{k:"강",r:"gang",m:"river"},{k:"영",r:"yeong",m:"spirit/zero"}] },
  ];
  return (
    <Page dir="ltr">
      <SHead title="Batchim (받침) — The Final Consonant" subtitle="A syllable block can end with a consonant sitting below" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>What is Batchim?</div>
          <div style={{ fontSize:"11px", color:T2, lineHeight:1.9 }}>
            Batchim is the consonant that sits <strong>underneath</strong> the syllable block. Not every syllable has one — but it appears in thousands of Korean words.
          </div>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", marginTop:"10px" }}>
            {[
              {top:"ㅎ", mid:"ㅏ", bot:null, label:"하 (ha)", note:"No batchim"},
              {top:"ㅎ", mid:"ㅏ", bot:"ㄴ", label:"한 (han)", note:"Batchim = ㄴ"},
            ].map((b,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ background: i===1?Y:SBG, borderRadius:"6px", padding:"10px 14px", border:`1px solid ${BD}`, display:"inline-flex", flexDirection:"column", alignItems:"center", width:"60px" }}>
                  <div style={{ fontSize:"11px", color:T2 }}>{b.top}</div>
                  <div style={{ fontSize:"11px", color:T2 }}>{b.mid}</div>
                  {b.bot && <div style={{ fontSize:"11px", color:T1, fontWeight:900, borderTop:`1px solid ${BD}`, marginTop:"3px", paddingTop:"3px", width:"100%", textAlign:"center" }}>{b.bot}</div>}
                </div>
                <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginTop:"5px" }}>{b.label}</div>
                <div style={{ fontSize:"10px", color:T3 }}>{b.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>The Golden Rule 🥇</div>
          <div style={{ fontSize:"11px", color:T2, lineHeight:1.9 }}>
            Even though there are 14+ consonants, only <strong>7 final sounds</strong> can be pronounced in batchim position. Every other consonant reduces to one of these seven.
          </div>
          <div style={{ padding:"8px", marginTop:"8px", textAlign:"center" }}>
            <div style={{ display:"flex", gap:"6px", justifyContent:"center", flexWrap:"wrap" }}>
              {["k","n","t","l","m","p","ng"].map(s=>(
                <span key={s} style={{ border:`1px solid ${BD}`, color:T1, fontWeight:900, fontSize:"13px", padding:"4px 8px", borderRadius:"4px", background:"#fff" }}>{s}</span>
              ))}
            </div>
            <div style={{ fontSize:"10px", color:T3, marginTop:"5px" }}>The 7 final sounds</div>
          </div>
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"6px" }}>The 7 Final Sound Groups</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0", marginBottom:"10px" }}>
        {FINAL7.map((row,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"36px 1fr 1fr", gap:"6px", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${BD}` }}>
            <div style={{ border:`1px solid ${BD}`, color:T1, fontWeight:900, fontSize:"14px", textAlign:"center", borderRadius:"4px", padding:"4px", background:SBG }}>{row.sound}</div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {row.chars.map(ch=>(
                <span key={ch} style={{ border:`1px solid ${BD}`, color:T1, fontSize:"15px", fontWeight:900, padding:"2px 7px", borderRadius:"4px", background:"#fff" }}>{ch}</span>
              ))}
            </div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {row.ex.map(e=>(
                <span key={e.k} style={{ fontSize:"11px", color:T2 }}>
                  <span style={{fontWeight:800, color:T1}}>{e.k}</span> [{e.r}] {e.m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`3px solid ${Y}`, paddingTop:"8px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
        <KoreanLanternIcon size={36} color={T3} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:T1, marginBottom:"5px" }}>Linking Rule — 연음법칙 (Yeon-eum)</div>
          <div style={{ fontSize:"11px", color:T2, lineHeight:1.9, marginBottom:"6px" }}>
            When batchim is followed by a syllable starting with <strong>ㅇ</strong> (silent), the batchim <strong>moves</strong> to that next syllable and is pronounced there.
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {[
              {w:"먹어요",wrong:"meok-eo-yo ❌",right:"meo-geo-yo ✅",m:"I eat"},
              {w:"한국어",wrong:"han-guk-eo ❌",right:"han-gu-geo ✅",m:"Korean language"},
              {w:"없어요",wrong:"eops-eo-yo ❌",right:"eop-seo-yo ✅",m:"There isn't"},
            ].map(e=>(
              <div key={e.w} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"8px 10px", background:"#fff" }}>
                <div style={{ fontSize:"16px", color:T1, fontWeight:900 }}>{e.w}</div>
                <div style={{ fontSize:"11px", color:T3, marginTop:"2px" }}>{e.wrong}</div>
                <div style={{ fontSize:"11px", color:"#166534", fontWeight:700 }}>{e.right}</div>
                <div style={{ fontSize:"10px", color:T3 }}>{e.m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ── Double Batchim EN ── */
function DoubleBatchimEn() {
  const GYEOP = [
    { chars:"ㄳ", read:"ㄱ", ex:"넋", rom:"neok", m:"soul/trace" },
    { chars:"ㄵ", read:"ㄴ", ex:"앉다", rom:"an-da", m:"to sit" },
    { chars:"ㄺ", read:"ㄱ", ex:"닭", rom:"dak", m:"chicken" },
    { chars:"ㄻ", read:"ㅁ", ex:"삶", rom:"sam", m:"life" },
    { chars:"ㄼ", read:"ㄹ", ex:"밟다", rom:"bal-da", m:"to step on" },
    { chars:"ㄾ", read:"ㄹ", ex:"핥다", rom:"hal-da", m:"to lick" },
    { chars:"ㅀ", read:"ㄹ", ex:"싫다", rom:"sil-ta", m:"to dislike" },
    { chars:"ㅄ", read:"ㅂ", ex:"없다", rom:"eop-da", m:"to not exist" },
  ];
  return (
    <Page dir="ltr">
      <SHead title="Double Batchim — 겹받침 (Gyeop-batchim)" subtitle="Two consonants at the bottom — only one is pronounced!" />
      {/* Larsen-Freeman: don't memorize warning */}
      <div style={{ background:"#fff8e1", border:"2px solid #fbbf24", borderRadius:"8px", padding:"7px 12px", fontSize:"11px", color:"#92400e", marginBottom:"8px" }}>
        <strong>⚠️ Beginner notice:</strong> Don't try to memorize all of this right now! Understanding the principle is enough.
        Double batchim becomes natural after reading just 100 Korean words. <strong>This will be covered in depth in Book 2.</strong>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>What is Gyeop-batchim?</div>
          <div style={{ fontSize:"11px", color:T2, lineHeight:1.9 }}>
            Some syllable blocks hold <strong>two consonants together</strong> in the batchim position. When speaking, usually the <strong>left (first)</strong> one is pronounced and the second is silent.
          </div>
          <div style={{ marginTop:"10px", display:"flex", justifyContent:"center" }}>
            <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"10px 14px", display:"inline-flex", flexDirection:"column", alignItems:"center", background:"#fff" }}>
              <div style={{ display:"flex", gap:"2px" }}>
                <span style={{ fontSize:"13px", color:T2 }}>ㄷ</span>
                <span style={{ fontSize:"13px", color:T2 }}>ㅏ</span>
              </div>
              <div style={{ display:"flex", gap:"2px", borderTop:`1px solid ${BD}`, marginTop:"3px", paddingTop:"3px" }}>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#0047AB" }}>ㄹ</span>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#C8102E" }}>ㄱ</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:"10px", color:T3, marginTop:"5px" }}>닭 = dak (chicken) — ㄱ sounds, ㄹ is silent</div>
        </div>

        <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"12px", background:SBG }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>Linking Rule for Double Batchim 🔗</div>
          <div style={{ fontSize:"11px", color:T2, lineHeight:1.9, marginBottom:"8px" }}>
            When followed by a syllable starting with <strong>ㅇ</strong>, the <strong style={{color:"#C8102E"}}>right (second)</strong> consonant moves to the next syllable!
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            {[
              {w:"닭이",r:"[dal-gi]",m:"chicken (object)"},
              {w:"없어요",r:"[eop-seo-yo]",m:"there isn't (polite)"},
              {w:"앉아요",r:"[an-ja-yo]",m:"sits (polite)"},
            ].map(e=>(
              <div key={e.w} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"5px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff" }}>
                <span style={{ fontSize:"15px", color:T1, fontWeight:900 }}>{e.w}</span>
                <span style={{ fontSize:"11px", color:"#166534", fontWeight:700 }}>{e.r}</span>
                <span style={{ fontSize:"10px", color:T3 }}>{e.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"6px" }}>Most Common Double Batchim Pairs</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"6px" }}>
        {GYEOP.slice(0, 3).map((g,i)=>(
          <div key={i} style={{
            border:`1px solid ${BD}`,
            borderRadius:"8px", padding:"10px 8px",
            background:SBG, textAlign:"center",
          }}>
            <div style={{ fontSize:"22px", color:T1, fontWeight:900, letterSpacing:"2px" }}>{g.chars}</div>
            <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>sounds like</div>
            <div style={{ border:`1px solid ${BD}`, color:T1, fontWeight:900, fontSize:"18px", borderRadius:"4px", padding:"2px 8px", margin:"4px auto", display:"inline-block", background:"#fff" }}>{g.read}</div>
            <div style={{ borderTop:`1px solid ${BD}`, marginTop:"6px", paddingTop:"6px" }}>
              <div style={{ fontSize:"18px", color:T1, fontWeight:900 }}>{g.ex}</div>
              <div style={{ fontSize:"10px", color:T3 }}>[{g.rom}]</div>
              <div style={{ fontSize:"10px", color:T2 }}>{g.m}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:"10px", color:T3, textAlign:"center", marginBottom:"6px" }}>
        + 5 more pairs covered in Book 2 →
      </div>

      <div style={{ borderTop:`3px solid ${Y}`, paddingTop:"8px", display:"flex", alignItems:"flex-start", gap:"10px" }}>
        <MugunghwaIcon size={32} color={T3} />
        <div>
          <div style={{ fontWeight:800, fontSize:"11px", color:T1 }}>Expert Tip</div>
          <div style={{ fontSize:"11px", color:T2, lineHeight:1.7 }}>
            Don't memorize all of these at once! Start with <strong>ㄺ (닭), ㅄ (없다), ㄻ (삶)</strong> — these three cover 80% of double batchim you'll meet at beginner level. The rest will come naturally through reading.
          </div>
        </div>
      </div>
    </Page>
  );
}

function KdramaPageEn({ slice, page }: { slice:[number,number]; page:number }) {
  return (
    <Page dir="ltr">
      <SHead title={`K-Drama Essentials 🎬 — Part ${page} of 2`} subtitle="Words you've heard 100 times — now read them in Hangul!" />
      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"10px", marginBottom:"8px", fontSize:"11px", color:T2, fontWeight:700, background:SBG, padding:"7px 10px" }}>
        🎬 {page===1 ? "Core vocabulary — heard in almost every episode!" : "Advanced words — use these to sound like a native!"}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
        {KDRAMA_EN.slice(...slice).map(v=>(
          <div key={v.k} style={{ background:"#fff", border:`1px solid ${BD}`, borderRadius:"8px", padding:"8px 10px", display:"flex", gap:"8px", alignItems:"flex-start", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ fontSize:"22px" }}>{v.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"22px", fontWeight:900, color:T1, background:Y, display:"inline-block", padding:"1px 8px", borderRadius:"4px", marginBottom:"2px" }}>{v.k}</div>
              <div style={{ fontSize:"11px", fontWeight:700, color:T3 }}>{v.r}</div>
              <div style={{ fontSize:"11px", color:T1, fontWeight:700 }}>{v.m}</div>
              <div style={{ fontSize:"11px", color:T3, fontStyle:"italic" }}>{v.note}</div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
function KdramaEn() { return <KdramaPageEn slice={[0,10]} page={1} />; }

function PracticeEn() {
  return (
    <Page dir="ltr">
      <SHead title="Practice Exercises ✏️" subtitle="Test yourself!" />
      {/* Knowles self-assessment checklist */}
      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px 12px", marginBottom:"10px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"7px" }}>✅ Self-Assessment Checklist — Ready for the exercises?</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px" }}>
          {[
            "I can pronounce all 14 consonants",
            "I can pronounce all 10 vowels",
            "I can build a syllable like 가, 나, 사",
            "I know what batchim is",
            "I notice Korean is written in blocks",
            "I understand the linking sound rule",
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", gap:"7px", alignItems:"flex-start" }}>
              <div style={{ width:"15px", height:"15px", border:`1px solid ${BD}`, borderRadius:"3px", flexShrink:0, marginTop:"2px" }} />
              <span style={{ fontSize:"10px", color:T2, lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
        {["Level 1 — /5","Level 2 — /5","Level 3 — /5"].map((l,i)=>(
          <div key={i} style={{ flex:1, border:`1px solid ${BD}`, borderRadius:"6px", padding:"6px", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"16px" }}>{"⭐".repeat(i+1)}</div>
            <div style={{ fontSize:"10px", color:T3, marginTop:"2px" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"8px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>⭐ Level 1 Challenge — Spot the Sound</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{q:"ㄱ",c:["n","m","g","h"]},{q:"ㄴ",c:["g","n","s","m"]},{q:"ㅁ",c:["h","b","m","r"]},{q:"ㅅ",c:["s","k","j","p"]},{q:"ㅎ",c:["m","h","n","g"]}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"28px", color:T1, fontWeight:900 }}>{e.q}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px", marginTop:"4px" }}>
                {e.c.map(ch=><div key={ch} style={{ border:`1px solid ${BD}`, borderRadius:"3px", padding:"2px", fontSize:"11px", color:T2, background:"#fff" }}>{ch}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"8px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>⭐⭐ Level 2 Challenge — Write the Romanization</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{k:"가방",a:"ga-bang"},{k:"사랑",a:"sa-rang"},{k:"한국",a:"han-guk"},{k:"친구",a:"chin-gu"},{k:"고마워",a:"go-ma-wo"}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"6px 4px", fontSize:"20px", color:T1, fontWeight:900, background:"#fff" }}>{e.k}</div>
              <div style={{ marginTop:"4px", border:"1px dashed #aaa", borderRadius:"4px", height:"20px", background:"#fff" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"8px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>⭐⭐⭐ Level 3 Challenge — Build the Syllable</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {[{eq:"ㅂ+ㅏ=?",a:"바"},{eq:"ㄴ+ㅗ=?",a:"노"},{eq:"ㅅ+ㅣ=?",a:"시"},{eq:"ㅎ+ㅏ=?",a:"하"},{eq:"ㄱ+ㅜ=?",a:"구"}].map((e,i)=>(
            <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"8px 10px", textAlign:"center", background:"#fff" }}>
              <div style={{ fontSize:"12px", color:T1, fontWeight:700 }}>{e.eq}</div>
              <div style={{ marginTop:"4px", border:"1px dashed #aaa", borderRadius:"4px", height:"28px", width:"38px", margin:"4px auto 0" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:T1, marginBottom:"5px" }}>✏️ Free Writing Grid</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:"3px" }}>
        {Array(32).fill(null).map((_,i)=>(
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"3px", height:"30px", background:"#fff" }} />
        ))}
      </div>
    </Page>
  );
}

function AnswerEn() {
  return (
    <Page dir="ltr">
      <SHead title="Answer Key + Quick Reference" subtitle="Check your answers" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"10px" }}>
        {[
          {t:"Exercise 1",items:[["ㄱ","g"],["ㄴ","n"],["ㅁ","m"],["ㅅ","s"],["ㅎ","h"]]},
          {t:"Exercise 2",items:[["가방","ga-bang"],["사랑","sa-rang"],["한국","han-guk"],["친구","chin-gu"],["고마워","go-ma-wo"]]},
          {t:"Exercise 3",items:[["ㅂ+ㅏ","바"],["ㄴ+ㅗ","노"],["ㅅ+ㅣ","시"],["ㅎ+ㅏ","하"],["ㄱ+ㅜ","구"]]},
        ].map(ex=>(
          <div key={ex.t} style={{ background:"#f8f8f8", borderRadius:"8px", padding:"8px" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"5px" }}>{ex.t}</div>
            {ex.items.map(([q,a])=>(
              <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", padding:"2px 0", borderBottom:"1px solid #eee" }}>
                <span style={{ fontWeight:700 }}>{q}</span>
                <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"10px", marginBottom:"10px", background:SBG }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"7px" }}>Quick Reference — All Consonants</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {CONSONANTS.map(c=>(
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color:T1, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"10px", color:T3 }}>{c.roman}</div>
              <div style={{ fontSize:"12px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:BD, margin:"6px 0" }} />
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"6px" }}>All Vowels</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"4px" }}>
          {VOWELS.map(v=>(
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:T1, fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"10px", color:T3 }}>{v.roman}</div>
              <div style={{ fontSize:"11px" }}>{v.emoji}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${BD}`, borderRadius:"8px", padding:"16px", textAlign:"center", background:SBG }}>
        <div style={{ fontSize:"32px", marginBottom:"4px" }}>🏆</div>
        <div style={{ fontSize:"20px", fontWeight:900, color:T1 }}>Hangul Level 1 — Complete!</div>
        <div style={{ margin:"12px auto", width:"220px", borderBottom:`2px solid ${BD}` }} />
        <div style={{ fontSize:"11px", color:T3 }}>Student Name</div>
        <div style={{ marginTop:"10px", fontSize:"11px", color:T3 }}>Klovers Korean Academy • klovers.academy • 2025</div>
      </div>
    </Page>
  );
}

/* ── Back Cover AR ── */
function BackCoverAr() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", background:BK,
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      display:"flex", flexDirection:"column",
      padding:"16mm 16mm 12mm", direction:"rtl",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", left:0, width:"8px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", right:0, width:"8px", background:Y }} />

      {/* Logo */}
      <div style={{ display:"flex", justifyContent:"center", marginTop:"4mm", marginBottom:"6mm" }}>
        <img src="/klovers-logo.jpg" alt="Klovers" style={{ height:"52px", objectFit:"contain", borderRadius:"8px" }} />
      </div>

      <DancheongBorder />

      {/* Book description */}
      <div style={{ color:"#ccc", fontSize:"12px", lineHeight:1.9, marginBottom:"7mm" }}>
        <div style={{ color:Y, fontWeight:900, fontSize:"15px", marginBottom:"8px" }}>كتاب الهانغول الرسمي — المستوى الأول</div>
        ابدأ رحلتك في تعلم الكورية مع <strong style={{color:Y}}>Klovers</strong> — الكتاب الأول في سلسلة من ٦ كتب تأخذك من الصفر إلى الطلاقة.
        ستتعلم الأبجدية الكورية كاملةً، قواعد القراءة، وأكثر الكلمات شيوعاً في المسلسلات الكورية والحياة اليومية.
        كل حرف مع صورة ذهنية تُثبّته في ذاكرتك!
      </div>

      {/* What you'll learn */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"7mm" }}>
        {[
          { icon:"🔤", text:"١٤ حرفاً ساكناً + أصواتها وأمثلتها" },
          { icon:"🗣️", text:"١٠ حروف مد + الكتل المقطعية" },
          { icon:"⬇️", text:"قواعد الباتشيم — الحرف الأخير" },
          { icon:"🎬", text:"مفردات أساسية من المسلسلات الكورية" },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", background:"#1a1a1a", borderRadius:"8px", padding:"9px 12px" }}>
            <span style={{ fontSize:"16px" }}>{item.icon}</span>
            <span style={{ fontSize:"11px", color:"#ddd" }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Series strip */}
      <div style={{ marginBottom:"8mm" }}>
        <div style={{ fontSize:"11px", color:"#777", marginBottom:"6px" }}>سلسلة Klovers الكاملة — ٦ كتب من الصفر للطلاقة:</div>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {["① الهانغول","② التحيات","③ الأرقام","④ القواعد","⑤ المحادثة","⑥ الطلاقة"].map((b, i) => (
            <div key={i} style={{
              background: i===0 ? Y : "#222",
              color: i===0 ? BK : "#666",
              fontSize:"11px", fontWeight:700,
              padding:"5px 11px", borderRadius:"20px",
              border:`1px solid ${i===0?Y:"#444"}`,
            }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Cialdini: social proof testimonial */}
      <div style={{ background:"#1a1a1a", borderRadius:"10px", padding:"12px 14px", marginBottom:"6mm" }}>
        <div style={{ fontSize:"22px", color:Y, lineHeight:1 }}>"</div>
        <div style={{ fontSize:"11px", color:"#ddd", lineHeight:1.8, fontStyle:"italic", marginTop:"-4px" }}>
          في أسبوع واحد بس كنت أقدر أقرأ اسمي بالكورية وأفهم كلمات من المسلسلات — مش صدقت نفسي!
        </div>
        <div style={{ fontSize:"10px", color:Y, fontWeight:700, marginTop:"6px" }}>— سارة م. | القاهرة ⭐⭐⭐⭐⭐</div>
      </div>

      {/* Bottom: QR + website + barcode */}
      <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:"12px" }}>
        <QRPlaceholder size={72} label="للصوت والنطق" />
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"14px", color:Y, fontWeight:900 }}>klovers.academy</div>
          <div style={{ fontSize:"11px", color:"#555", marginTop:"4px" }}>تعلّم الكورية مجاناً</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"8px" }}>© 2025 Klovers Korean Academy</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"2px" }}>رسومات أصلية — حقوق النشر محفوظة لـ Klovers</div>
        </div>
        <div style={{ background:"#fff", padding:"8px", borderRadius:"8px" }}>
          <BarcodeIcon />
        </div>
      </div>
    </div>
  );
}

/* ── Back Cover EN ── */
function BackCoverEn() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", background:BK,
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      display:"flex", flexDirection:"column",
      padding:"16mm 16mm 12mm",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", left:0, width:"8px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", right:0, width:"8px", background:Y }} />

      {/* Logo */}
      <div style={{ display:"flex", justifyContent:"center", marginTop:"4mm", marginBottom:"6mm" }}>
        <img src="/klovers-logo.jpg" alt="Klovers" style={{ height:"52px", objectFit:"contain", borderRadius:"8px" }} />
      </div>

      <DancheongBorder />

      {/* Book description */}
      <div style={{ color:"#ccc", fontSize:"12px", lineHeight:1.9, marginBottom:"7mm" }}>
        <div style={{ color:Y, fontWeight:900, fontSize:"15px", marginBottom:"8px" }}>Official Hangul Starter Book — Level 1</div>
        Begin your Korean journey with <strong style={{color:Y}}>Klovers</strong> — Book 1 in a 6-book series that takes you from zero to fluency.
        Learn the complete Korean alphabet, reading rules, and the most common words from K-dramas and daily life.
        Every letter comes with a visual mnemonic to lock it in your memory!
      </div>

      {/* What you'll learn */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"7mm" }}>
        {[
          { icon:"🔤", text:"14 consonants with sounds and examples" },
          { icon:"🗣️", text:"10 vowels + how syllable blocks work" },
          { icon:"⬇️", text:"Batchim rules — final consonants" },
          { icon:"🎬", text:"Essential K-drama vocabulary" },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", background:"#1a1a1a", borderRadius:"8px", padding:"9px 12px" }}>
            <span style={{ fontSize:"16px" }}>{item.icon}</span>
            <span style={{ fontSize:"11px", color:"#ddd" }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Series strip */}
      <div style={{ marginBottom:"8mm" }}>
        <div style={{ fontSize:"11px", color:"#777", marginBottom:"6px" }}>The complete Klovers Series — 6 books from zero to fluency:</div>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {["① Hangul","② Greetings","③ Numbers","④ Grammar","⑤ Conversation","⑥ Fluency"].map((b, i) => (
            <div key={i} style={{
              background: i===0 ? Y : "#222",
              color: i===0 ? BK : "#666",
              fontSize:"11px", fontWeight:700,
              padding:"5px 11px", borderRadius:"20px",
              border:`1px solid ${i===0?Y:"#444"}`,
            }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Cialdini: social proof testimonial */}
      <div style={{ background:"#1a1a1a", borderRadius:"10px", padding:"12px 14px", marginBottom:"6mm" }}>
        <div style={{ fontSize:"22px", color:Y, lineHeight:1 }}>"</div>
        <div style={{ fontSize:"11px", color:"#ddd", lineHeight:1.8, fontStyle:"italic", marginTop:"-4px" }}>
          In just one week I could read my name in Korean and recognize words from K-dramas. I couldn't believe it!
        </div>
        <div style={{ fontSize:"10px", color:Y, fontWeight:700, marginTop:"6px" }}>— Sara M., Cairo ⭐⭐⭐⭐⭐</div>
      </div>

      {/* Bottom: QR + website + barcode */}
      <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:"12px" }}>
        <QRPlaceholder size={72} label="Scan for audio" />
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"14px", color:Y, fontWeight:900 }}>klovers.academy</div>
          <div style={{ fontSize:"11px", color:"#555", marginTop:"4px" }}>Learn Korean Free Online</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"8px" }}>© 2025 Klovers Korean Academy</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"2px" }}>Original illustrations — © Klovers Korean Academy</div>
        </div>
        <div style={{ background:"#fff", padding:"8px", borderRadius:"8px" }}>
          <BarcodeIcon />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   VOCABULARY APPENDIX
══════════════════════════════════════════════════ */
function VocabAppendixAr() {
  const words = [
    { k:"나", r:"나", m:"أنا", freq:1 },
    { k:"이", r:"이", m:"هذا", freq:2 },
    { k:"은/는", r:"은/는", m:"(موضوع)", freq:3 },
    { k:"하다", r:"하-다", m:"يفعل", freq:4 },
    { k:"있다", r:"있-다", m:"يوجد", freq:5 },
    { k:"없다", r:"없-다", m:"لا يوجد", freq:6 },
    { k:"가다", r:"가-다", m:"يذهب", freq:7 },
    { k:"오다", r:"오-다", m:"يأتي", freq:8 },
    { k:"먹다", r:"먹-다", m:"يأكل", freq:9 },
    { k:"보다", r:"보-다", m:"يرى", freq:10 },
    { k:"사랑", r:"사-랑", m:"حب", freq:11 },
    { k:"친구", r:"친-구", m:"صديق", freq:12 },
    { k:"학교", r:"학-교", m:"مدرسة", freq:13 },
    { k:"선생님", r:"선-생-님", m:"معلم", freq:14 },
    { k:"물", r:"물", m:"ماء", freq:15 },
    { k:"밥", r:"밥", m:"أرز / طعام", freq:16 },
    { k:"집", r:"집", m:"بيت", freq:17 },
    { k:"사람", r:"사-람", m:"إنسان", freq:18 },
    { k:"나라", r:"나-라", m:"بلد", freq:19 },
    { k:"한국", r:"한-국", m:"كوريا", freq:20 },
    { k:"서울", r:"서-울", m:"سيول", freq:21 },
    { k:"이름", r:"이-름", m:"اسم", freq:22 },
    { k:"시간", r:"시-간", m:"وقت", freq:23 },
    { k:"돈", r:"돈", m:"مال", freq:24 },
    { k:"일", r:"일", m:"عمل / يوم", freq:25 },
    { k:"말", r:"말", m:"كلام / لغة", freq:26 },
    { k:"눈", r:"눈", m:"عين / ثلج", freq:27 },
    { k:"손", r:"손", m:"يد", freq:28 },
    { k:"마음", r:"마-음", m:"قلب", freq:29 },
    { k:"길", r:"길", m:"طريق", freq:30 },
    { k:"나무", r:"나-무", m:"شجرة", freq:31 },
    { k:"하늘", r:"하-늘", m:"سماء", freq:32 },
    { k:"바다", r:"바-다", m:"بحر", freq:33 },
    { k:"산", r:"산", m:"جبل", freq:34 },
    { k:"강", r:"강", m:"نهر", freq:35 },
    { k:"꽃", r:"꽃", m:"زهرة", freq:36 },
    { k:"음악", r:"음-악", m:"موسيقى", freq:37 },
    { k:"영화", r:"영-화", m:"فيلم", freq:38 },
    { k:"음식", r:"음-식", m:"طعام", freq:39 },
    { k:"날씨", r:"날-씨", m:"طقس", freq:40 },
    { k:"오늘", r:"오-늘", m:"اليوم", freq:41 },
    { k:"내일", r:"내-일", m:"غداً", freq:42 },
    { k:"어제", r:"어-제", m:"أمس", freq:43 },
    { k:"지금", r:"지-금", m:"الآن", freq:44 },
    { k:"여기", r:"여-기", m:"هنا", freq:45 },
    { k:"거기", r:"거-기", m:"هناك", freq:46 },
    { k:"왜", r:"왜", m:"لماذا", freq:47 },
    { k:"어떻게", r:"어-떻-게", m:"كيف", freq:48 },
    { k:"얼마", r:"얼-마", m:"بكم", freq:49 },
    { k:"감사합니다", r:"감-사-함-니-다", m:"شكراً جزيلاً", freq:50 },
  ];
  return (
    <Page dir="rtl">
      <SHead title="ملحق المفردات — أكثر ٥٠ كلمة شيوعاً 📖" subtitle="مرتبة حسب التكرار في اللغة الكورية اليومية" />
      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"10px", marginBottom:"8px", fontSize:"11px", color:T2, background:SBG, padding:"7px 10px" }}>
        💡 هذه الكلمات تُشكّل أكثر من <strong>٧٠٪</strong> من اللغة الكورية اليومية. احفظ أول ٢٠ كلمة وستفهم نصف ما يُقال حولك!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px" }}>
        {words.map(w => (
          <div key={w.freq} style={{
            background: w.freq <= 10 ? SBG : "#fff",
            border: `1px solid ${w.freq <= 10 ? T1 : BD}`,
            borderRadius:"6px", padding:"6px 5px", textAlign:"center",
          }}>
            <div style={{ fontSize:"9px", color: w.freq <= 10 ? T3 : T3, marginBottom:"1px" }}>#{w.freq}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color: T1, lineHeight:1 }}>{w.k}</div>
            <div style={{ fontSize:"9px", color: T3, marginTop:"1px" }}>{w.r}</div>
            <div style={{ fontSize:"9px", color: T2, marginTop:"1px" }}>{w.m}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function VocabAppendixEn() {
  const words = [
    { k:"나", r:"na", m:"I / me", freq:1 },
    { k:"이", r:"i", m:"this", freq:2 },
    { k:"은/는", r:"eun/neun", m:"(topic)", freq:3 },
    { k:"하다", r:"ha-da", m:"to do", freq:4 },
    { k:"있다", r:"it-da", m:"to exist", freq:5 },
    { k:"없다", r:"eop-da", m:"to not exist", freq:6 },
    { k:"가다", r:"ga-da", m:"to go", freq:7 },
    { k:"오다", r:"o-da", m:"to come", freq:8 },
    { k:"먹다", r:"meok-da", m:"to eat", freq:9 },
    { k:"보다", r:"bo-da", m:"to see", freq:10 },
    { k:"사랑", r:"sa-rang", m:"love", freq:11 },
    { k:"친구", r:"chin-gu", m:"friend", freq:12 },
    { k:"학교", r:"hak-gyo", m:"school", freq:13 },
    { k:"선생님", r:"seon-saeng-nim", m:"teacher", freq:14 },
    { k:"물", r:"mul", m:"water", freq:15 },
    { k:"밥", r:"bap", m:"rice / meal", freq:16 },
    { k:"집", r:"jip", m:"house", freq:17 },
    { k:"사람", r:"sa-ram", m:"person", freq:18 },
    { k:"나라", r:"na-ra", m:"country", freq:19 },
    { k:"한국", r:"han-guk", m:"Korea", freq:20 },
    { k:"서울", r:"seo-ul", m:"Seoul", freq:21 },
    { k:"이름", r:"i-reum", m:"name", freq:22 },
    { k:"시간", r:"si-gan", m:"time", freq:23 },
    { k:"돈", r:"don", m:"money", freq:24 },
    { k:"일", r:"il", m:"work / day", freq:25 },
    { k:"말", r:"mal", m:"speech / horse", freq:26 },
    { k:"눈", r:"nun", m:"eye / snow", freq:27 },
    { k:"손", r:"son", m:"hand", freq:28 },
    { k:"마음", r:"ma-eum", m:"heart / mind", freq:29 },
    { k:"길", r:"gil", m:"road", freq:30 },
    { k:"나무", r:"na-mu", m:"tree", freq:31 },
    { k:"하늘", r:"ha-neul", m:"sky", freq:32 },
    { k:"바다", r:"ba-da", m:"sea", freq:33 },
    { k:"산", r:"san", m:"mountain", freq:34 },
    { k:"강", r:"gang", m:"river", freq:35 },
    { k:"꽃", r:"kkot", m:"flower", freq:36 },
    { k:"음악", r:"eum-ak", m:"music", freq:37 },
    { k:"영화", r:"yeong-hwa", m:"movie", freq:38 },
    { k:"음식", r:"eum-sik", m:"food", freq:39 },
    { k:"날씨", r:"nal-ssi", m:"weather", freq:40 },
    { k:"오늘", r:"o-neul", m:"today", freq:41 },
    { k:"내일", r:"nae-il", m:"tomorrow", freq:42 },
    { k:"어제", r:"eo-je", m:"yesterday", freq:43 },
    { k:"지금", r:"ji-geum", m:"now", freq:44 },
    { k:"여기", r:"yeo-gi", m:"here", freq:45 },
    { k:"거기", r:"geo-gi", m:"there", freq:46 },
    { k:"왜", r:"wae", m:"why", freq:47 },
    { k:"어떻게", r:"eo-tteo-ke", m:"how", freq:48 },
    { k:"얼마", r:"eol-ma", m:"how much", freq:49 },
    { k:"감사합니다", r:"gam-sa-ham-ni-da", m:"thank you (formal)", freq:50 },
  ];
  return (
    <Page dir="ltr">
      <SHead title="Vocabulary Appendix — Top 50 Most Common Words 📖" subtitle="Ranked by frequency in everyday Korean speech" />
      <div style={{ borderLeft:`3px solid ${Y}`, paddingLeft:"10px", marginBottom:"8px", fontSize:"11px", color:T2, background:SBG, padding:"7px 10px" }}>
        💡 These 50 words make up over <strong>70%</strong> of everyday Korean. Master the first 20 and you'll understand half of what's said around you!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px" }}>
        {words.map(w => (
          <div key={w.freq} style={{
            background: w.freq <= 10 ? SBG : "#fff",
            border: `1px solid ${w.freq <= 10 ? T1 : BD}`,
            borderRadius:"6px", padding:"6px 5px", textAlign:"center",
          }}>
            <div style={{ fontSize:"9px", color: T3, marginBottom:"1px" }}>#{w.freq}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color: T1, lineHeight:1 }}>{w.k}</div>
            <div style={{ fontSize:"9px", color: T3, marginTop:"1px" }}>{w.r}</div>
            <div style={{ fontSize:"9px", color: T2, marginTop:"1px" }}>{w.m}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function HangulBookPage() {
  const [preview, setPreview] = useState<Lang>("ar");
  const [access, setAccess] = useState<"loading" | "granted" | "denied">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      // Admin-only preview — only users with role=admin may access this page
      const { data: adminRow } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!cancelled) setAccess(adminRow ? "granted" : "denied");
    })();
    return () => { cancelled = true; };
  }, []);

  if (access === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (access === "denied") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="text-2xl font-black">الكتاب غير متاح بعد</h1>
      <p className="text-muted-foreground max-w-sm">
        سيُفتح هذا الكتاب لك أسبوعاً واحداً قبل بدء مجموعتك. يُرجى التواصل مع الإدارة إذا كنت تعتقد أن هناك خطأ.
      </p>
      <p className="text-sm text-muted-foreground">
        The book unlocks one week before your class group starts.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );

  const printVersion = (lang: Lang) => {
    setPreview(lang);
    setTimeout(() => window.print(), 400);
  };

  const isAr = preview === "ar";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&family=Cairo:wght@400;700;900&display=swap');

        @media print {
          body * { visibility: hidden !important; }
          #hangul-book, #hangul-book * { visibility: visible !important; }
          #hangul-book { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .book-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }

        @media screen {
          /* Each page looks like a real book page */
          .book-page {
            box-shadow:
              -6px 0 18px rgba(0,0,0,0.25),
              6px 4px 20px rgba(0,0,0,0.2),
              0 8px 32px rgba(0,0,0,0.3),
              inset -3px 0 8px rgba(0,0,0,0.08);
            margin: 0 auto 48px;
            position: relative;
          }
          /* Left binding shadow — spine effect */
          .book-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 22px;
            height: 100%;
            background: linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 60%, transparent 100%);
            z-index: 10;
            pointer-events: none;
            border-radius: 2px 0 0 2px;
          }
          /* Right page curl shadow */
          .book-page::after {
            content: counter(book-page);
            position: absolute;
            bottom: 7px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 9px;
            font-weight: 700;
            color: rgba(255,255,255,0.65);
            font-family: 'Noto Sans KR', sans-serif;
            letter-spacing: 1px;
            pointer-events: none;
            z-index: 5;
          }
        }

        #hangul-book {
          /* Dark wood desk look */
          background: radial-gradient(ellipse at center, #2a1a0e 0%, #1a0e08 60%, #0d0804 100%);
          font-family: 'Cairo', 'Noto Sans KR', system-ui, sans-serif;
          counter-reset: book-page;
          padding: 20px 40px 40px;
        }

        .book-page {
          counter-increment: book-page;
          /* Cream paper instead of pure white */
          background: #fffdf8 !important;
        }

        /* Override white backgrounds on page content */
        .book-page > div[style*="background:#fff"],
        .book-page > div[style*='background: #fff'] {
          background: #fffdf8 !important;
        }

        /* Book title ribbon at top of viewer */
        #book-title-ribbon {
          text-align: center;
          padding: 14px 0 20px;
          font-size: 13px;
          font-weight: 900;
          color: #FFFF00;
          letter-spacing: 6px;
          text-transform: uppercase;
          opacity: 0.5;
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:1000,
        background:BK, borderBottom:`3px solid ${Y}`,
        padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 16px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"22px" }}>🍀</span>
          <span style={{ fontWeight:900, color:Y, fontSize:"17px", letterSpacing:"2px" }}>KLOVERS</span>
          <span style={{ color:"#555", fontSize:"12px" }}>Hangul Book</span>
        </div>

        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {/* Preview toggle */}
          <div style={{ display:"flex", background:"#1a1a1a", borderRadius:"8px", overflow:"hidden", border:`1px solid ${Y}44` }}>
            {(["ar","en"] as Lang[]).map(l=>(
              <button key={l} onClick={()=>setPreview(l)} style={{
                padding:"6px 16px", fontSize:"12px", fontWeight:700,
                background: preview===l ? Y : "transparent",
                color: preview===l ? BK : "#777",
                border:"none", cursor:"pointer",
              }}>
                {l==="ar" ? "🇦🇪 Preview Arabic" : "🇬🇧 Preview English"}
              </button>
            ))}
          </div>

          <button onClick={()=>window.history.back()} style={{ background:"#2a2a2a", color:"#ccc", border:"none", borderRadius:"8px", padding:"7px 14px", fontSize:"12px", cursor:"pointer" }}>
            ← Back
          </button>

          <button onClick={()=>printVersion("ar")} style={{
            background:Y, color:BK, border:"none",
            borderRadius:"8px", padding:"7px 16px", fontSize:"12px",
            fontWeight:800, cursor:"pointer",
          }}>
            ⬇ تحميل النسخة العربية
          </button>

          <button onClick={()=>printVersion("en")} style={{
            background:"#fff", color:BK, border:`2px solid ${Y}`,
            borderRadius:"8px", padding:"7px 16px", fontSize:"12px",
            fontWeight:800, cursor:"pointer",
          }}>
            ⬇ Download English Version
          </button>
        </div>
      </div>

      {/* Book — renders only the selected language */}
      <div id="hangul-book" style={{ paddingTop:"64px", paddingBottom:"40px", minHeight:"100vh" }}>
        <div id="book-title-ribbon" className="no-print">📖 KLOVERS HANGUL BOOK 🇰🇷</div>
        {isAr ? (
          <>
            <CoverAr />
            <StoryPageAr />
            <TocAr />
            <StudyPlanAr />
            <HistoryAr />
            <SejongAr />
            <CultureAr />
            <CourseAr />
            <WelcomeAr />
            <ConsonantsAr slice={[0,7]} page={1} />
            <ConsonantsAr slice={[7,14]} page={2} />
            <VowelsAr />
            <AspiratedAr />
            <CompoundVowelsAr />
            <SyllableAr />
            <BatchimAr />
            <DoubleBatchimAr />
            <KdramaPageAr slice={[0,10]} page={1} />
            <KdramaPageAr slice={[10,20]} page={2} />
            <PracticeAr />
            <AnswerAr />
            <VocabAppendixAr />
            <BackCoverAr />
          </>
        ) : (
          <>
            <CoverEn />
            <StoryPageEn />
            <TocEn />
            <StudyPlanEn />
            <HistoryEn />
            <SejongEn />
            <CultureEn />
            <CourseEn />
            <WelcomeEn />
            <ConsonantsEn slice={[0,7]} page={1} />
            <ConsonantsEn slice={[7,14]} page={2} />
            <VowelsEn />
            <AspiratedEn />
            <CompoundVowelsEn />
            <SyllableEn />
            <BatchimEn />
            <DoubleBatchimEn />
            <KdramaPageEn slice={[0,10]} page={1} />
            <KdramaPageEn slice={[10,20]} page={2} />
            <PracticeEn />
            <AnswerEn />
            <VocabAppendixEn />
            <BackCoverEn />
          </>
        )}
      </div>
    </>
  );
}
