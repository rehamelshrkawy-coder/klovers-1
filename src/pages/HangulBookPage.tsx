import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

/* ─── Brand tokens ─────────────────────────────── */
const Y    = "#FFFF00";   // primary yellow (accents, borders, page stripes)
const YL   = "#FFFFBB";   // light yellow (warm accent)
const GL   = "#C8FFD4";   // light mint green (clover accent)
const GD   = "#166534";   // dark green (green on green)
const BK   = "#111111";
const BK2  = "#222222";
const GOLD = "#D4AF37";   // Pantone-safe print gold — cover hero text
const CREAM = "#FFFEF0";  // warm cream — large background accents

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
type LessonProps = { lesson: number; slice: [number, number]; lang: Lang };

/* ─── Course workbook tokens ─── */
const T1  = "#111111";
const T2  = "#444444";
const T3  = "#777777";
const BD  = "#DDDDDD";
const SBG = "#F8F8F8";

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
  return (
    <div
      className="book-page"
      style={{
        width:"210mm", minHeight:"297mm", padding:"14mm 13mm",
        boxSizing:"border-box", background:"#fff",
        position:"relative",
        pageBreakAfter:"always", breakAfter:"page",
        direction: dir,
      }}
    >
      {/* yellow top stripe */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:Y }} />
      {/* black bottom stripe */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:BK }} />
      {/* yellow side bar — right edge for RTL, left edge for LTR */}
      <div style={{ position:"absolute", top:"9px", bottom:"6px", [dir === "rtl" ? "right" : "left"]:0, width:"5px", background:Y }} />
      {chapter && (
        <div style={{ position:"absolute", top:"14px", [dir === "rtl" ? "left" : "right"]:"14mm", fontSize:"9px", fontWeight:800, color:BK, letterSpacing:"2px", textTransform:"uppercase" }}>
          {chapter}
        </div>
      )}

      <div style={{ marginTop:"8mm" }}>{children}</div>
    </div>
  );
}

function SHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
      <div style={{ width:"6px", height:"34px", background:Y, borderRadius:"3px", flexShrink:0 }} />
      <div>
        <div style={{ fontSize:"19px", fontWeight:900, color:BK, lineHeight:1.1 }}>{title}</div>
        {subtitle && <div style={{ fontSize:"11px", color:"#777", marginTop:"2px" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STROKE ORDER TIP
══════════════════════════════════════════════════ */
function StrokeOrderTip({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  return (
    <div style={{ background:"#fff9f0", border:"2px solid #f97316", borderRadius:"8px", padding:"7px 12px", fontSize:"11px", color:"#9a3412", marginBottom:"7px" }}>
      <strong>✍️ {isAr ? "ترتيب الكتابة الصحيح:" : "Correct stroke order:"}</strong>{" "}
      {isAr
        ? "اكتب دائماً من الأعلى للأسفل ← ثم من اليسار لليمين. هذا هو ترتيب كل الحروف الكورية بدون استثناء."
        : "Always write top → bottom, then left → right. This rule applies to every single Korean letter without exception."}
      <div style={{ display:"flex", gap:"10px", marginTop:"5px", direction:"ltr" }}>
        {["ㄱ(2)","ㄴ(2)","ㄷ(3)","ㄹ(5)","ㅁ(4)","ㅂ(4)","ㅅ(2)"].map(c=>(
          <span key={c} style={{ background:"#f97316", color:"#fff", fontSize:"10px", fontWeight:700, padding:"2px 6px", borderRadius:"4px" }}>{c}</span>
        ))}
        {isAr ? null : <span style={{ fontSize:"10px", color:"#9a3412" }}>(number = stroke count)</span>}
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
      display:"grid", gridTemplateColumns:"70px 1fr", gap:"8px",
      background:"#f9f9f9", border:`2px solid ${Y}`,
      borderRadius:"10px", padding:"8px",
      pageBreakInside:"avoid", breakInside:"avoid",
      marginBottom:"6px",
      direction: isAr ? "rtl" : "ltr",
    }}>
      {/* Character */}
      <div style={{
        background:BK, borderRadius:"8px",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        minHeight:"72px", padding:"6px",
      }}>
        <div style={{ fontSize:"44px", color:Y, fontWeight:900, lineHeight:1 }}>{c.char}</div>
        <div style={{ fontSize:"11px", color:"#ccc", marginTop:"1px" }}>{c.roman}</div>
        <ShapeMnemonic char={c.char} />
        <div style={{ display:"flex", gap:"2px", flexWrap:"wrap", marginTop:"2px", justifyContent:"center" }}>
          {c.strokes.map((s, si) => (
            <span key={si} style={{
              background:"#f97316", color:"#fff", fontSize:"8px",
              fontWeight:700, padding:"1px 3px", borderRadius:"2px", lineHeight:1.3,
            }}>{s}</span>
          ))}
        </div>
      </div>
      {/* Info — pure target language */}
      <div>
        <div style={{ fontWeight:900, fontSize:"13px", color:BK, marginBottom:"2px" }}>{d.name}</div>
        <div style={{
          background: isAr ? YL : "#f0f0f0",
          borderRadius:"6px", padding:"3px 7px",
          fontSize:"11px", color:"#444", marginBottom:"3px",
        }}>🔊 {d.sound}</div>
        <div style={{
          background:YL, borderRadius:"6px",
          padding:"3px 7px", fontSize:"11px", color:"#555", marginBottom:"4px",
        }}>💡 {d.mnemonic}</div>
        {d.eq && (
          <div style={{
            background:"#EEF4FF", border:"1px solid #93c5fd", borderRadius:"6px",
            padding:"3px 7px", fontSize:"11px", color:"#1e3a8a",
            marginBottom:"4px", fontWeight:800, direction:"ltr",
          }}>
            🔤 {isAr ? "يشبه حرف: " : "Arabic eq: "}
            <span style={{ fontSize:"14px" }}>{d.eq}</span>
          </div>
        )}
        {c.arDialect && isAr && (
          <div style={{
            background:"#fef9ec", border:"1px solid #f59e0b", borderRadius:"5px",
            padding:"2px 7px", fontSize:"10px", color:"#92400e", marginBottom:"4px",
          }}>
            🇪🇬 {c.arDialect}
          </div>
        )}
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {d.ex.map((ex, i) => (
            <div key={i} style={{
              background:BK2, borderRadius:"5px",
              padding:"3px 7px", fontSize:"11px", color:"#fff",
            }}>
              <span style={{ color:Y, fontWeight:800 }}>{ex.k}</span>
              {" "}({ex.r}) — {ex.m}
            </div>
          ))}
        </div>
        {/* Writing practice lines — Aleksandrova method */}
        <div style={{ marginTop:"5px", borderTop:"1px dashed #ddd", paddingTop:"4px" }}>
          <div style={{ fontSize:"10px", color:"#999", marginBottom:"3px" }}>{isAr ? "✏️ تدرب على الكتابة:" : "✏️ Practice writing:"}</div>
          <div style={{ display:"flex", gap:"3px" }}>
            <div style={{ position:"relative", width:"28px", height:"28px", border:"1px dashed #ccc", borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:"19px", color:"rgba(0,0,0,0.09)", fontWeight:900, position:"absolute", lineHeight:1 }}>{c.char}</span>
            </div>
            {[1,2,3,4,5].map(n=>(
              <div key={n} style={{ width:"28px", height:"28px", border:"1px dashed #ccc", borderRadius:"4px", flexShrink:0 }} />
            ))}
          </div>
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
      background:"#f9f9f9", border:`2px solid ${GL}`,
      borderRadius:"10px", padding:"8px",
      display:"grid", gridTemplateColumns:"58px 1fr", gap:"8px",
      pageBreakInside:"avoid", breakInside:"avoid", marginBottom:"6px",
      direction: isAr ? "rtl" : "ltr",
    }}>
      <div style={{
        background:GL, borderRadius:"8px",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        minHeight:"64px", padding:"6px",
      }}>
        <div style={{ fontSize:"40px", fontWeight:900, color:GD, lineHeight:1 }}>{v.char}</div>
        <div style={{ fontSize:"11px", fontWeight:700, color:GD, marginTop:"2px" }}>{v.roman}</div>
        <div style={{ fontSize:"15px" }}>{v.emoji}</div>
      </div>
      <div>
        <div style={{ fontWeight:900, fontSize:"12px", color:BK, marginBottom:"2px" }}>{d.name}</div>
        <div style={{
          background: isAr ? YL : "#f0f0f0",
          borderRadius:"6px", padding:"3px 6px",
          fontSize:"11px", color:"#444", marginBottom:"3px",
        }}>🔊 {d.sound}</div>
        <div style={{ background:GL, borderRadius:"6px", padding:"3px 6px", fontSize:"11px", color:GD, marginBottom:"4px" }}>
          💡 {d.mnemonic}
        </div>
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"4px" }}>
          {d.ex.map((ex, i) => (
            <div key={i} style={{
              background:BK2, borderRadius:"5px",
              padding:"2px 6px", fontSize:"11px", color:"#fff",
            }}>
              <span style={{ color:Y, fontWeight:800 }}>{ex.k}</span> — {ex.m}
            </div>
          ))}
        </div>
        {(d as any).eq && (
          <div style={{
            background:"#EEF4FF", border:"1px solid #93c5fd", borderRadius:"5px",
            padding:"2px 6px", fontSize:"10px", color:"#1e3a8a", fontWeight:800, direction:"ltr",
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
      <SHead title="خطة الدراسة — ٧ أيام 🗓️" subtitle="اتبع هذه الخطة وستقرأ الكورية في أسبوع واحد!" />
      <div style={{ background:BK, borderRadius:"12px", padding:"10px 14px", marginBottom:"10px", display:"flex", gap:"10px", alignItems:"center" }}>
        <div style={{ fontSize:"28px" }}>🎯</div>
        <div>
          <div style={{ fontSize:"13px", fontWeight:900, color:GOLD, marginBottom:"2px" }}>الهدف: قراءة الهانغول في ٧ أيام</div>
          <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.6 }}>٣٠–٤٥ دقيقة يومياً تكفي. الاستمرارية أهم من الكم!</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"10px" }}>
        {days.map((day, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 1fr", gap:"8px", background:day.color, border:`1px solid ${i===6 ? GOLD+"88" : "#e5e7eb"}`, borderRadius:"10px", padding:"8px 10px" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"18px" }}>{day.icon}</div>
              <div style={{ fontSize:"10px", fontWeight:900, color:BK, background:i===6 ? GOLD : Y, borderRadius:"4px", padding:"1px 4px", marginTop:"2px" }}>{day.d}</div>
            </div>
            <div>
              <div style={{ fontSize:"12px", fontWeight:800, color:BK, marginBottom:"2px" }}>{day.task}</div>
              <div style={{ fontSize:"10px", color:"#666", display:"flex", gap:"4px", alignItems:"center" }}>
                <span style={{ color:"#f97316" }}>💡</span>{day.tip}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:GL, borderRadius:"10px", padding:"10px 14px", display:"flex", gap:"10px", alignItems:"center" }}>
        <TaegeukIcon size={36} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:900, color:GD, marginBottom:"2px" }}>🔑 سر النجاح</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.6 }}>لا تنتقل لليوم التالي قبل أن تتقن حروف اليوم الحالي. الجودة تتفوق على السرعة دائماً!</div>
        </div>
      </div>
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
      <div style={{ background:"#fff3cd", border:"2px solid #f59e0b", borderRadius:"8px", padding:"8px 12px", marginBottom:"8px", fontSize:"11px", color:"#78350f", fontWeight:700 }}>
        ⚠️ <strong>للمبتدئين:</strong> هذه حروف متقدمة — ركز أولاً على الـ١٤ حرفاً الأساسية. ارجع لهذه الصفحة في الأسبوع الثاني!
      </div>
      <div style={{ background:GL, borderRadius:"8px", padding:"8px 12px", marginBottom:"10px", fontSize:"11px", color:GD, fontWeight:700 }}>
        💡 الفرق الأساسي: الحروف العادية مع نفخة هواء خفيفة. الحروف المُشدَّدة <strong>بدون</strong> أي هواء — الحلق والفم مضغوطان.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"10px" }}>
        {ASPIRATED.map(a => (
          <div key={a.char} style={{ background:"#f9f9f9", border:`2px solid #f97316`, borderRadius:"10px", padding:"8px", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"5px" }}>
              <div style={{ background:BK, borderRadius:"6px", width:"50px", height:"50px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:"32px", color:GOLD, fontWeight:900, lineHeight:1 }}>{a.char}</div>
                <div style={{ fontSize:"10px", color:"#aaa" }}>{a.roman}</div>
              </div>
              <div>
                <div style={{ fontSize:"12px", fontWeight:900, color:BK }}>{a.ar.name}</div>
                <div style={{ fontSize:"10px", color:"#666", background:"#fff3cd", padding:"1px 5px", borderRadius:"4px" }}>
                  = {a.base} مع ضغط إضافي
                </div>
              </div>
            </div>
            <div style={{ background:"#fff9ec", borderRadius:"5px", padding:"3px 7px", fontSize:"10px", color:"#9a3412", marginBottom:"3px" }}>🔊 {a.ar.sound}</div>
            <div style={{ background:YL, borderRadius:"5px", padding:"3px 7px", fontSize:"10px", color:"#555", marginBottom:"4px" }}>💡 {a.ar.mnemonic}</div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {a.ar.ex.map((ex, i) => (
                <div key={i} style={{ background:BK2, borderRadius:"4px", padding:"2px 6px", fontSize:"10px", color:"#fff" }}>
                  <span style={{ color:Y, fontWeight:800 }}>{ex.k}</span> ({ex.r}) — {ex.m}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:BK, borderRadius:"10px", padding:"10px 14px", display:"flex", gap:"10px", alignItems:"center" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:800, color:GOLD }}>🔊 اسمع الفرق بين العادي والمُشدَّد</div>
          <div style={{ fontSize:"10px", color:"#888", marginTop:"2px" }}>klovers.academy/audio/tensed</div>
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
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"8px", fontWeight:700 }}>
        💡 لا تحفظها كلها الآن! الأكثر استخداماً: <strong style={{ fontSize:"13px" }}>ㅘ ㅝ ㅐ ㅔ ㅢ</strong> — ستقابلهم كثيراً في المسلسلات والأغاني.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"10px" }}>
        {COMPOUND_VOWELS.map(v => (
          <div key={v.char} style={{ background:"#f9f9f9", border:`2px solid ${GL}`, borderRadius:"8px", padding:"7px", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ display:"flex", gap:"6px", alignItems:"center", marginBottom:"4px" }}>
              <div style={{ background:GD, borderRadius:"6px", width:"36px", height:"36px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <div style={{ fontSize:"22px", color:"#fff", fontWeight:900, lineHeight:1 }}>{v.char}</div>
                <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.7)" }}>{v.roman}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"10px", color:"#555" }}>{v.ar}</div>
              </div>
            </div>
            <div style={{ background:GL, borderRadius:"4px", padding:"2px 5px", fontSize:"9px", color:GD, fontWeight:700 }}>{v.ex}</div>
          </div>
        ))}
      </div>
      <div style={{ background:BK, borderRadius:"10px", padding:"8px 12px", display:"flex", gap:"8px", alignItems:"center" }}>
        <QRPlaceholder size={40} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:800, color:GOLD }}>🔊 اسمع نطق حروف المد المركبة</div>
          <div style={{ fontSize:"10px", color:"#888", marginTop:"2px" }}>klovers.academy/audio/compound</div>
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
      <div style={{ position:"relative", marginBottom:"12px" }}>
        {/* vertical line */}
        <div style={{ position:"absolute", right:"18px", top:0, bottom:0, width:"3px", background:Y, borderRadius:"2px" }} />

        {[
          { era:"قبل ١٠٠٠ م", icon:"🏔️", title:"بدايات اللغة الكورية", body:"تطورت اللغة الكورية على مدى آلاف السنين في شبه الجزيرة الكورية. تُصنَّف اليوم كـ«لغة معزولة» — لا تنتمي لأي مجموعة لغوية أخرى في العالم. ليست صينية، وليست يابانية، وليست عربية — إنها فريدة من نوعها!" },
          { era:"١٠٠٠–١٤٤٢ م", icon:"📜", title:"عصر الهانجا — حروف المستعارة", body:"قبل اختراع الهانغول، كان الكوريون يستخدمون الحروف الصينية (한자 هانجا). كانت صعبة التعلم جداً — فقط النخبة والعلماء كانوا يقرؤون ويكتبون. أكثر من ٩٥٪ من الشعب الكوري كان أمياً بالكامل. القوانين والعقود والأدب — كلها كانت مكتوبة بحروف لا يفهمها الغالبية!" },
          { era:"١٤٤٣ م 🌟", icon:"👑", title:"ثورة الملك سيجونغ", body:"أدرك الملك سيجونغ أن هذا ظلم بيّن. قال: «كيف يمكن لشعب أن يحكم نفسه إذا لم يستطع القراءة؟» فأسس مجمعاً من ثمانية علماء نوابغ في «قاعة الحكماء» (집현전) وعملوا سنوات في سرية تامة لاختراع أبجدية جديدة تناسب الأصوات الكورية تماماً." },
          { era:"١٤٤٦ م", icon:"📚", title:"إعلان هونمينجونغأوم", body:"أُعلن عن الأبجدية الجديدة تحت اسم «훈민정음» (هونمينجونغأوم) بمعنى «الأصوات الصحيحة لتعليم الشعب». واجه الملك معارضة شديدة من الطبقة الحاكمة التي أرادت الإبقاء على امتيازاتها — لكنه أصرّ. واليوم يُحتفل بيوم الهانغول كل عام في التاسع من أكتوبر." },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px", alignItems:"flex-start" }}>
            <div style={{ width:"36px", height:"36px", background:Y, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, zIndex:1 }}>{item.icon}</div>
            <div style={{ flex:1, background: i===2?"#111":"#f9f9f9", border:`2px solid ${i===2?Y:"#e5e5e5"}`, borderRadius:"10px", padding:"10px 12px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:i===2?Y:"#888", marginBottom:"2px" }}>{item.era}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color:i===2?"#fff":BK, marginBottom:"4px" }}>{item.title}</div>
              <div style={{ fontSize:"11px", color:i===2?"#ccc":"#555", lineHeight:1.8 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fun fact strip */}
      <div style={{ background:Y, borderRadius:"10px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
        <MugunghwaIcon size={36} color={BK} />
        <div>
          <div style={{ fontWeight:800, fontSize:"11px", color:BK }}>حقيقة مذهلة!</div>
          <div style={{ fontSize:"11px", color:BK2, lineHeight:1.6 }}>
            يتحدث الكورية أكثر من <strong>٨٠ مليون شخص</strong> حول العالم. وقد صنّفت منظمة اليونسكو الهانغول كواحد من أكثر أنظمة الكتابة علمية ومنطقية في التاريخ البشري!
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ── King Sejong page AR ── */
function SejongAr() {
  return (
    <Page dir="rtl">
      <SHead title="الملك سيجونغ العظيم 👑" subtitle="الرجل الذي غيّر مصير شعب بكلمة واحدة: العدالة" />

      {/* Hero portrait area */}
      <div style={{ background:BK, borderRadius:"14px", padding:"16px", marginBottom:"12px", display:"grid", gridTemplateColumns:"120px 1fr", gap:"14px" }}>
        {/* Portrait — real palace photo */}
        <div style={{ borderRadius:"10px", overflow:"hidden", border:`3px solid ${Y}`, display:"flex", flexDirection:"column", minHeight:"130px" }}>
          <SceneTeacher h={260} radius={0} />
          <div style={{ background:"#1a1a00", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"6px", flex:1 }}>
            <div style={{ fontSize:"18px", fontWeight:900, color:Y, direction:"ltr" }}>세종대왕</div>
            <div style={{ fontSize:"11px", color:"#888", marginTop:"1px" }}>سيجونغ الكبير</div>
          </div>
        </div>
        {/* Bio */}
        <div style={{ color:"#fff" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
            <PalaceRoofIcon size={28} color={Y} />
            <div style={{ fontSize:"16px", fontWeight:900, color:Y }}>سيجونغ الكبير</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {[
              { icon:"🎂", label:"الميلاد", val:"١٥ مايو ١٣٩٧م" },
              { icon:"👑", label:"الحكم", val:"١٤١٨ – ١٤٥٠م" },
              { icon:"🏛️", label:"الأسرة", val:"أسرة جوسون الملكية" },
              { icon:"📚", label:"إنجازه الأعظم", val:"اختراع الهانغول ١٤٤٣م" },
              { icon:"🌟", label:"لقبه", val:"«أعظم ملوك كوريا»" },
            ].map(r=>(
              <div key={r.label} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"13px" }}>{r.icon}</span>
                <span style={{ fontSize:"11px", color:"#888", minWidth:"60px" }}>{r.label}</span>
                <span style={{ fontSize:"11px", color:"#ddd", fontWeight:600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The creation story */}
      <div style={{ marginBottom:"10px" }}>
        <div style={{ fontWeight:800, fontSize:"12px", color:BK, marginBottom:"7px", display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ background:Y, padding:"2px 8px", borderRadius:"6px" }}>القصة</span>
          كيف صُمِّمت الحروف؟
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px" }}>
          {[
            { icon:"👅", title:"شكل اللسان", body:"كل حرف ساكن صُمِّم بناءً على شكل اللسان والفم لحظة نطق الصوت — علم وفن في آنٍ واحد!" },
            { icon:"🔬", title:"علم صوتي دقيق", body:"ㄱ = قاعدة اللسان ترتفع نحو الحلق. ㄴ = طرف اللسان يلمس سقف الفم. ㅁ = الشفتان منطبقتان." },
            { icon:"🏗️", title:"بنية منطقية", body:"الحروف المشتقة من بعضها تتشابه في الشكل — ㄱ الأصل، ㄲ الشديدة، ㅋ المنفوخة. نظام متكامل ومتسق!" },
          ].map(c=>(
            <div key={c.title} style={{ background:YL, borderRadius:"10px", padding:"10px", border:`1px solid ${Y}` }}>
              <div style={{ fontSize:"24px", marginBottom:"5px" }}>{c.icon}</div>
              <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"4px" }}>{c.title}</div>
              <div style={{ fontSize:"11px", color:"#555", lineHeight:1.7 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div style={{ background:BK, borderRadius:"12px", padding:"14px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
        <div style={{ fontSize:"36px", color:Y, fontWeight:900, lineHeight:1, flexShrink:0 }}>"</div>
        <div>
          <div style={{ fontSize:"12px", color:"#fff", lineHeight:1.9, fontStyle:"italic" }}>
            كل إنسان لديه ما يريد أن يقوله، لكن كثيرين لا يجدون طريقة للتعبير. أريد أن يكون كل شخص في مملكتي قادراً على القراءة والكتابة.
          </div>
          <div style={{ fontSize:"11px", color:Y, fontWeight:700, marginTop:"6px" }}>— الملك سيجونغ الكبير، ١٤٤٦م</div>
        </div>
      </div>
    </Page>
  );
}

/* ── Korean Culture page AR ── */
function CultureAr() {
  return (
    <Page dir="rtl">
      <SHead title="الثقافة الكورية 🌸" subtitle="خمسة آلاف عام من الجمال والفلسفة والفن" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>

        {/* K-Drama */}
        <div style={{ background:BK, borderRadius:"12px", overflow:"hidden" }}>
          <SceneStreet h={220} radius={0} />
          <div style={{ padding:"10px" }}>
            <div style={{ fontWeight:800, fontSize:"12px", color:Y, marginBottom:"4px" }}>المسلسلات الكورية (K-Drama)</div>
            <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.7 }}>
              من أكثر المحتوى مشاهدةً على Netflix عالمياً. «لعبة الحبّار» غيّرت مفهوم الدراما عالمياً!
            </div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
              {["❤️ رومانسي", "🕵️ إثارة", "😂 كوميدي"].map(t=>(
                <span key={t} style={{ background:"#222", color:Y, fontSize:"11px", padding:"2px 5px", borderRadius:"10px" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* K-Pop */}
        <div style={{ background:"#1a1a00", border:`2px solid ${Y}`, borderRadius:"12px", overflow:"hidden" }}>
          <SceneConcert h={220} radius={0} />
          <div style={{ padding:"10px" }}>
            <div style={{ fontWeight:800, fontSize:"12px", color:Y, marginBottom:"4px" }}>موسيقى البوب الكوري (K-Pop)</div>
            <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.7 }}>
              BTS، BLACKPINK، Stray Kids — نجوم عالميون. K-Pop ظاهرة ثقافية شاملة!
            </div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
              {["BTS 💜", "BLACKPINK 🖤", "Stray Kids 🐺"].map(t=>(
                <span key={t} style={{ background:BK, color:Y, fontSize:"11px", padding:"2px 5px", borderRadius:"10px" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Food */}
        <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"12px", overflow:"hidden" }}>
          <SceneFood h={200} radius={0} />
          <div style={{ padding:"10px" }}>
          <div style={{ fontWeight:800, fontSize:"12px", color:BK, marginBottom:"4px" }}>المطبخ الكوري</div>
          <div style={{ fontSize:"11px", color:"#555", lineHeight:1.8 }}>
            الكيمتشي، البيبيمباب، التيكبوكي، السامجيوبسال — أطعمة تفاجئك وتُدمنها! المطبخ الكوري يعتمد على التوازن بين الحامض والحار والأومامي. وليس هناك وجبة كاملة بدون كيمتشي!
          </div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"7px" }}>
            {["🥬 김치","🍚 비빔밥","🌶️ 떡볶이","🥩 삼겹살"].map(t=>(
              <span key={t} style={{ background:BK, color:Y, fontSize:"11px", padding:"2px 6px", borderRadius:"10px" }}>{t}</span>
            ))}
          </div>
          </div>
        </div>

        {/* Values & Spirit */}
        <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"28px", marginBottom:"6px" }}>🌿</div>
          <div style={{ fontWeight:800, fontSize:"12px", color:GD, marginBottom:"5px" }}>القيم والروح الكورية</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.8 }}>
            <strong>빨리빨리 (بالي-بالي)</strong> = «يلا يلا!» — الكوريون يحبون السرعة والإتقان معاً. <strong>눈치 (نونتشي)</strong> = فهم المشاعر دون كلام. <strong>한 (هان)</strong> = إحساس عميق بالحنين والمقاومة — روح الشعب الكوري الأبدية.
          </div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"7px" }}>
            {["👴 احترام الكبار", "👨‍👩‍👧 الأسرة أولاً", "📚 التعليم مقدس"].map(t=>(
              <span key={t} style={{ background:BK, color:Y, fontSize:"11px", padding:"2px 6px", borderRadius:"10px" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Diamond — 정(jeong) concept: 5th culture card */}
      <div style={{ background:"#2d1b4e", border:"2px solid #a78bfa", borderRadius:"12px", padding:"12px", marginBottom:"10px" }}>
        <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
          <div style={{ fontSize:"36px", color:"#a78bfa", fontWeight:900, lineHeight:1, flexShrink:0, direction:"ltr" }}>정</div>
          <div>
            <div style={{ fontWeight:800, fontSize:"12px", color:"#a78bfa", marginBottom:"4px" }}>정 (Jeong) — أعمق مفهوم في الثقافة الكورية</div>
            <div style={{ fontSize:"11px", color:"#d8b4fe", lineHeight:1.8 }}>
              <strong style={{color:"#a78bfa"}}>정 (جيونغ)</strong> هي كلمة لا تُترجم بسهولة — إنها ذلك الشعور العميق بالارتباط والألفة الذي يتشكّل تدريجياً بين الناس. ليست حباً عاطفياً بالضرورة — بل رابطة روحية تنشأ من مشاركة اللحظات اليومية. في المسلسلات الكورية، ستسمع: <span style={{color:"#fff",fontWeight:800,direction:"ltr"}}>«정이 들었어»</span> = «أصبحت قريباً منك بشكل لم أتوقعه»
            </div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"7px" }}>
              {["💜 رابطة عاطفية", "🕰️ تتشكل مع الوقت", "🎬 قلب الدراما الكورية"].map(t=>(
                <span key={t} style={{ background:"rgba(167,139,250,0.2)", color:"#a78bfa", fontSize:"11px", padding:"2px 6px", borderRadius:"10px", border:"1px solid rgba(167,139,250,0.4)" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Korean sentence teaser */}
      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"14px", alignItems:"center" }}>
        <KoreanLanternIcon size={40} color={Y} />
        <div>
          <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"4px" }}>بعد إتمام هذه الكتب الستة ستتمكن من:</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {["فهم المسلسلات الكورية بدون ترجمة 🎬","التحدث مع الكوريين بثقة 🗣️","قراءة اللافتات في كوريا 🪧","غناء أغاني K-Pop 🎵"].map(t=>(
              <div key={t} style={{ background:"#222", color:"#ddd", fontSize:"11px", padding:"4px 8px", borderRadius:"8px" }}>{t}</div>
            ))}
          </div>
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

      <div style={{ background:BK, borderRadius:"12px", padding:"14px", marginBottom:"12px" }}>
        <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.9 }}>
          صُمِّمت سلسلة Klovers لتأخذك من <span style={{color:Y,fontWeight:800}}>لا تعرف حرفاً واحداً</span> إلى <span style={{color:Y,fontWeight:800}}>التحدث والكتابة بطلاقة</span> — بطريقة ممتعة تعتمد على مسلسلاتك المفضلة وموسيقاك الكورية المحبوبة. كل كتاب يبني على السابق.
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
        {BOOKS_AR.map((b,i)=>(
          <div key={i} style={{
            background: b.current ? Y : "#f9f9f9",
            border: `2px solid ${b.current ? Y : "#e5e5e5"}`,
            borderRadius:"10px", padding:"10px 14px",
            display:"flex", alignItems:"center", gap:"12px",
            flexDirection:"row-reverse",
          }}>
            <div style={{
              background: b.current ? BK : "#e0e0e0",
              color: b.current ? Y : "#999",
              fontWeight:900,
              width:"40px", height:"40px", borderRadius:"8px",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              flexShrink:0, gap:"1px",
            }}>
              <span style={{ fontSize:"9px", fontWeight:700, opacity:0.7 }}>كتاب</span>
              <span style={{ fontSize:"18px", lineHeight:1 }}>{b.n}</span>
            </div>
            <div style={{ fontSize:"22px", flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:"12px", color: b.current ? BK : "#444" }}>{b.title}</div>
              <div style={{ fontSize:"11px", color: b.current ? BK2 : "#999", marginTop:"2px" }}>
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
          <div key={s.title} style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"10px", padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize:"24px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:"11px", color:BK }}>{s.title}</div>
            <div style={{ fontSize:"11px", color:"#666" }}>{s.sub}</div>
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

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ background:BK, borderRadius:"12px", padding:"14px", color:"#fff" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y, marginBottom:"7px" }}>لماذا الهانغول رائع؟</div>
          <p style={{ fontSize:"11px", lineHeight:2, color:"#ddd", margin:0 }}>
            اخترع الملك سيجونغ الهانغول عام ١٤٤٣م. إنها <strong style={{color:Y}}>أبجدية صوتية</strong> — كل حرف يمثل صوتاً واحداً فقط. معظم المتعلمين يستطيعون القراءة في <strong style={{color:Y}}>٢ إلى ٣ أيام</strong> فقط!
          </p>
        </div>
        <div style={{ background:GL, borderRadius:"12px", padding:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:GD, marginBottom:"7px" }}>الأرقام السحرية</div>
          {[{n:"١٤", l:"حرفاً ساكناً أساسياً"},{n:"١٠", l:"حروف مد أساسية"},{n:"∞", l:"مقطع ممكن التكوين"}].map(({n,l})=>(
            <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"7px" }}>
              <div style={{ background:GD, color:Y, fontWeight:900, fontSize:"18px", width:"36px", height:"36px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:"11px", color:GD, fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Syllable diagram */}
      <div style={{ border:`3px solid ${Y}`, borderRadius:"12px", padding:"12px", marginBottom:"10px", background:YL }}>
        <div style={{ fontWeight:800, fontSize:"12px", color:BK, marginBottom:"8px", textAlign:"center" }}>كيف تُبنى الكتلة المقطعية؟</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", flexWrap:"wrap", direction:"ltr" }}>
          {[
            {label:"حرف ساكن", char:"ㅎ", sub:"h", bg:BK, fg:Y},
            {label:"+", char:"", sub:"", bg:"", fg:Y},
            {label:"حرف مد", char:"ㅏ", sub:"a", bg:Y, fg:BK},
            {label:"=", char:"", sub:"", bg:"", fg:BK},
            {label:"المقطع!", char:"하", sub:"ha", bg:BK, fg:Y},
          ].map((item,i)=>
            item.char===""?(
              <div key={i} style={{fontSize:"24px",fontWeight:900,color:BK}}>{item.label}</div>
            ):(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"11px",color:"#555",marginBottom:"3px",direction:"rtl"}}>{item.label}</div>
                <div style={{background:item.bg,borderRadius:"10px",padding:"8px 14px",fontSize:"40px",fontWeight:900,color:item.fg,lineHeight:1,border:item.bg==="transparent"?"none":`2px solid ${Y}`}}>{item.char}</div>
                {item.sub&&<div style={{fontSize:"11px",color:"#555",marginTop:"3px"}}>{item.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      {/* 7-day plan */}
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>📅 خطة الدراسة في ٧ أيام</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
        {plan.map((p,i)=>(
          <div key={i} style={{ background:i===6?Y:BK, borderRadius:"8px", padding:"7px 3px", textAlign:"center" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color:i===6?BK:Y }}>{p.d}</div>
            <div style={{ fontSize:"11px", color:i===6?BK2:"#aaa", marginTop:"3px", lineHeight:1.4 }}>{p.t}</div>
          </div>
        ))}
      </div>

      {/* Buzan: letter family tree */}
      <div style={{ marginTop:"8px", background:BK, borderRadius:"10px", padding:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>🧬 عائلات الحروف — كيف تتشابه؟</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", direction:"ltr" }}>
          {[
            { base:"ㄱ", derived:["ㅋ","ㄲ"], label:"g-family" },
            { base:"ㄷ", derived:["ㅌ","ㄸ"], label:"d-family" },
            { base:"ㅂ", derived:["ㅍ","ㅃ"], label:"b-family" },
            { base:"ㅅ", derived:["ㅆ"], label:"s-family" },
            { base:"ㅈ", derived:["ㅊ","ㅉ"], label:"j-family" },
          ].map(f=>(
            <div key={f.base} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"16px", borderRadius:"6px", padding:"4px 8px" }}>{f.base}</div>
              <span style={{ color:"#555", fontSize:"11px" }}>→</span>
              {f.derived.map(d=>(
                <div key={d} style={{ background:"#222", color:"#ccc", fontWeight:900, fontSize:"14px", borderRadius:"6px", padding:"3px 7px", border:`1px solid ${Y}44` }}>{d}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize:"10px", color:"#666", marginTop:"5px" }}>
          الحرف الأساسي (أصفر) يكتسب شدة بإضافة خطوط — ㄱ→ㅋ (نفخة هواء)، ㄱ→ㄲ (مضاعف/مشدّد)
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

      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"16px" }}>
        {chapters.map((ch, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"10px",
            padding:"8px 12px", borderRadius:"10px",
            background: i % 2 === 0 ? "#f9f9f9" : "#fff",
            border:`1px solid ${i % 2 === 0 ? Y + "55" : "#eee"}`,
          }}>
            <div style={{
              background:BK, color:Y, fontWeight:900, fontSize:"11px",
              width:"30px", height:"30px", borderRadius:"6px",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>{ch.n}</div>
            <div style={{ fontSize:"18px", flexShrink:0 }}>{ch.icon}</div>
            <div style={{ flex:1, fontSize:"12px", fontWeight:700, color:BK, display:"flex", alignItems:"center", gap:"5px" }}>
              {ch.title}
              {(ch as any).new && <span style={{ background:"#22c55e", color:"#fff", fontSize:"8px", fontWeight:900, padding:"1px 4px", borderRadius:"3px", flexShrink:0 }}>NEW</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
              <div style={{ width:"40px", borderBottom:"1px dashed #ccc" }} />
              <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"11px", padding:"2px 8px", borderRadius:"6px" }}>{ch.page}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"12px", alignItems:"center" }}>
        <TaegeukIcon size={42} />
        <div>
          <div style={{ fontSize:"13px", fontWeight:900, color:GOLD, marginBottom:"3px" }}>رحلتك تبدأ من هنا 🚀</div>
          <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.6 }}>اقرأ كل فصل بالترتيب — كل فصل يبني على السابق. في ٧ أيام ستقرأ الكورية!</div>
        </div>
      </div>
    </Page>
  );
}

function ConsonantsAr({ slice, page }: { slice:[number,number]; page:number }) {
  const count = slice[1] - slice[0];
  const kpopLyrics = page === 1
    ? { lyric:"나비야", rom:"نا-بي-يا", meaning:"يا فراشة", song:"أغنية شعبية كورية" }
    : { lyric:"고마워", rom:"go-ma-wo", meaning:"شكراً", song:"IU — Palette" };
  return (
    <Page dir="rtl">
      <SHead title={`الحروف الساكنة (자음) — الجزء ${page===1?"١":"٢"} من ٢`} subtitle="كل مقطع كوري يبدأ بحرف ساكن" />
      {/* Marzano "I can..." learning objective */}
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"7px", fontWeight:700 }}>
        ✅ بنهاية هذه الصفحة ستتمكن من: قراءة ونطق <strong>{count}</strong> حروف كورية جديدة وكتابتها بنفسك!
      </div>
      <StrokeOrderTip lang="ar" />
      <div style={{ background:YL, borderRadius:"8px", padding:"6px 10px", fontSize:"11px", color:BK2, marginBottom:"8px" }}>
        💡 هناك ١٤ حرفاً ساكناً أساسياً، و٥ حروف ساكنة مُشدَّدة (مع نفخة هواء). تعلّم الأساسية أولاً!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {CONSONANTS.slice(...slice).map(c => <ConsCard key={c.char} c={c} lang="ar" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"#111", borderRadius:"10px", padding:"10px 14px", marginTop:"8px" }}>
        <QRPlaceholder size={50} label="" />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y }}>🔊 اسمع النطق الصحيح</div>
          <div style={{ fontSize:"11px", color:"#888", marginTop:"3px" }}>امسح الكود أو زر: <span style={{color:Y}}>klovers.academy/audio</span></div>
        </div>
      </div>
      {/* Mogi K-Pop lyric strip */}
      <div style={{ background:"#1a1a00", border:`2px solid ${Y}`, borderRadius:"8px", padding:"7px 12px", marginTop:"6px", display:"flex", gap:"10px", alignItems:"center" }}>
        <div style={{ fontSize:"20px" }}>🎵</div>
        <div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,0,0.65)", marginBottom:"2px", fontWeight:700 }}>كلمات K-Pop بالحروف التي تعلمتها للتو:</div>
          <span style={{ fontSize:"18px", color:Y, fontWeight:900, direction:"ltr" }}>{kpopLyrics.lyric}</span>
          <span style={{ fontSize:"11px", color:"#aaa", marginRight:"6px" }}> [{kpopLyrics.rom}] = {kpopLyrics.meaning}</span>
          <span style={{ fontSize:"10px", color:"#555" }}>— {kpopLyrics.song}</span>
        </div>
      </div>
      {/* Nunan micro-task */}
      <div style={{ background:GL, border:`1px solid ${GD}`, borderRadius:"8px", padding:"8px 10px", marginTop:"6px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"3px" }}>📝 جربها الآن!</div>
        <div style={{ fontSize:"11px", color:GD, marginBottom:"5px" }}>حاول كتابة اسمك الأول بالحروف الكورية التي تعلمتها:</div>
        <div style={{ height:"24px", border:"1px dashed #aaa", borderRadius:"4px", background:"#fff" }} />
      </div>
      <div style={{ background:"#fef9ec", border:"1px solid #f59e0b", borderRadius:"6px", padding:"5px 10px", marginTop:"4px", fontSize:"10px", color:"#78350f" }}>
        🇪🇬 <strong>نصيحة ذهبية:</strong> ابحث عن علم 🇪🇬 في كل بطاقة — ده مكتوب خصيصاً بالعامية المصرية عشانك!
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
    <div style={{ background:"#1a2744", border:"2px solid #60a5fa", borderRadius:"10px", padding:"10px 12px", marginTop:"8px" }}>
      <div style={{ fontSize:"11px", fontWeight:800, color:"#93c5fd", marginBottom:"6px" }}>
        🎉 يمكنك الآن قراءة كلمات حقيقية! جرّب:
      </div>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", direction:"ltr" }}>
        {words.map(w => (
          <div key={w.k} style={{ background:"#0f172a", borderRadius:"8px", padding:"6px 10px", textAlign:"center" }}>
            <div style={{ fontSize:"20px", color:"#fbbf24", fontWeight:900 }}>{w.k}</div>
            <div style={{ fontSize:"10px", color:"#60a5fa" }}>{w.r}</div>
            <div style={{ fontSize:"10px", color:"#94a3b8", direction:"rtl" }}>{w.m}</div>
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
    <div style={{ background:"#1a2744", border:"2px solid #60a5fa", borderRadius:"10px", padding:"10px 12px", marginTop:"8px" }}>
      <div style={{ fontSize:"11px", fontWeight:800, color:"#93c5fd", marginBottom:"6px" }}>
        🎉 You can now read real Korean words! Try these:
      </div>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
        {words.map(w => (
          <div key={w.k} style={{ background:"#0f172a", borderRadius:"8px", padding:"6px 10px", textAlign:"center" }}>
            <div style={{ fontSize:"20px", color:"#fbbf24", fontWeight:900 }}>{w.k}</div>
            <div style={{ fontSize:"10px", color:"#60a5fa" }}>{w.r}</div>
            <div style={{ fontSize:"10px", color:"#94a3b8" }}>{w.m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VowelsAr() {
  return (
    <Page dir="rtl">
      <SHead title="حروف المد (모음)" subtitle="حروف المد لا تقف وحدها — تحتاج دائماً حرفاً ساكناً" />
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"7px", fontWeight:700 }}>
        ✅ بنهاية هذه الصفحة ستتمكن من: قراءة ونطق ١٠ حروف مد كورية وتكوين مقاطع كاملة!
      </div>
      <div style={{ background:GL, borderRadius:"8px", padding:"6px 10px", fontSize:"11px", color:GD, marginBottom:"8px", fontWeight:700 }}>
        🌟 إذا بدأت الكلمة بصوت مدّي، نضع الحرف الصامت ㅇ أمامه: مثال → أ = 아 (ㅇ + ㅏ)
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {VOWELS.map(v => <VowCard key={v.char} v={v} lang="ar" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"#111", borderRadius:"10px", padding:"10px 14px", marginTop:"8px" }}>
        <QRPlaceholder size={50} label="" />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y }}>🔊 اسمع نطق حروف المد</div>
          <div style={{ fontSize:"11px", color:"#888", marginTop:"3px" }}>امسح الكود أو زر: <span style={{color:Y}}>klovers.academy/audio</span></div>
        </div>
      </div>
      <MiniReadingStripAr />
    </Page>
  );
}

function SyllableAr() {
  return (
    <Page dir="rtl">
      <SHead title="بناء الكتل المقطعية" subtitle="الطريقة الذكية لتركيب الكورية" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        {[
          { n:"①", t:"كل مقطع يبدأ بحرف ساكن", n2:"إذا بدأ بمدّ، نضع ㅇ الصامت", ex:"아 = ㅇ+ㅏ" },
          { n:"②", t:"حروف المد الطويلة تجلس يميناً", n2:"ㅏ ㅓ ㅣ ㅐ ㅔ ㅑ ㅕ", ex:"가 나 사 바" },
          { n:"③", t:"حروف المد العريضة تجلس أسفل", n2:"ㅗ ㅜ ㅡ ㅛ ㅠ", ex:"고 노 소 도" },
          { n:"④", t:"باتشيم — حرف ساكن أخير تحت الكتلة", n2:"اختياري — يُوضع في الأسفل", ex:"한 = ㅎ+ㅏ+ㄴ" },
        ].map(r=>(
          <div key={r.n} style={{ background:BK, borderRadius:"10px", padding:"10px" }}>
            <div style={{ fontSize:"22px", color:Y, fontWeight:900 }}>{r.n}</div>
            <div style={{ fontSize:"11px", fontWeight:700, color:"#fff", lineHeight:1.6, marginBottom:"3px" }}>{r.t}</div>
            <div style={{ fontSize:"11px", color:"#aaa", marginBottom:"4px" }}>{r.n2}</div>
            <div style={{ fontSize:"14px", color:Y, fontWeight:800 }}>{r.ex}</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>🔤 أمثلة على المقاطع</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"5px" }}>
        {SYLLABLES.map(s=>(
          <div key={s.b} style={{ background:BK, borderRadius:"8px", padding:"7px 4px", textAlign:"center" }}>
            <div style={{ fontSize:"11px", color:"#555", direction:"ltr" }}>{s.c}+{s.v}</div>
            <div style={{ fontSize:"32px", fontWeight:900, color:Y, lineHeight:1 }}>{s.b}</div>
            <div style={{ fontSize:"11px", color:"#aaa" }}>{s.r}</div>
            <div style={{ fontSize:"11px", color:"#888" }}>{s.ar}</div>
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
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ background:BK, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>ما هو الباتشيم؟</div>
          <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.9 }}>
            الباتشيم هو الحرف الساكن الذي يجلس <strong style={{color:Y}}>أسفل</strong> الكتلة المقطعية.
            ليس كل مقطع يحتاجه — لكنه ضروري في آلاف الكلمات.
          </div>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", marginTop:"10px", direction:"ltr" }}>
            {[
              {top:"ㅎ", mid:"ㅏ", bot:null, label:"하 (ha)", note:"بدون باتشيم"},
              {top:"ㅎ", mid:"ㅏ", bot:"ㄴ", label:"한 (han)", note:"مع باتشيم ㄴ"},
            ].map((b,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ background: i===1?Y:YL, borderRadius:"10px", padding:"10px 14px", border:`2px solid ${Y}`, display:"inline-flex", flexDirection:"column", alignItems:"center", width:"60px" }}>
                  <div style={{ fontSize:"11px", color:i===1?BK:"#666" }}>{b.top}</div>
                  <div style={{ fontSize:"11px", color:i===1?BK:"#666" }}>{b.mid}</div>
                  {b.bot && <div style={{ fontSize:"11px", color:BK, fontWeight:900, borderTop:"1px solid rgba(0,0,0,0.2)", marginTop:"3px", paddingTop:"3px", width:"100%", textAlign:"center" }}>{b.bot}</div>}
                </div>
                <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginTop:"5px" }}>{b.label}</div>
                <div style={{ fontSize:"11px", color:"#777", direction:"rtl" }}>{b.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"6px" }}>القاعدة الذهبية 🥇</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.9 }}>
            رغم وجود أكثر من ١٤ حرفاً ساكناً، لا يوجد في اللغة الكورية سوى <strong>٧ أصوات نهائية فقط</strong> يمكن نطقها في نهاية المقطع. كل الحروف الأخرى تُحوَّل إلى أحد هذه الأصوات السبعة.
          </div>
          <div style={{ background:BK, borderRadius:"8px", padding:"8px", marginTop:"8px", textAlign:"center" }}>
            <div style={{ display:"flex", gap:"6px", justifyContent:"center", flexWrap:"wrap" }}>
              {["ك","ن","ت","ل","م","ب","نغ"].map(s=>(
                <div key={s} style={{ background:Y, color:BK, fontWeight:900, fontSize:"14px", width:"32px", height:"32px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center" }}>{s}</div>
              ))}
            </div>
            <div style={{ fontSize:"11px", color:"#aaa", marginTop:"5px" }}>الأصوات النهائية السبعة</div>
          </div>
        </div>
      </div>

      {/* 7 final sounds table */}
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>جدول الأصوات النهائية السبعة</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"10px" }}>
        {FINAL7.map((row,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"40px 1fr 1fr", gap:"6px", alignItems:"center", background:i%2===0?"#f9f9f9":"#fff", borderRadius:"8px", padding:"6px 10px", border:`1px solid ${Y}44` }}>
            <div style={{ background:BK, color:Y, fontWeight:900, fontSize:"16px", textAlign:"center", borderRadius:"6px", padding:"4px", direction:"ltr" }}>{row.sound}</div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {row.chars.map(ch=>(
                <span key={ch} style={{ background:Y, color:BK, fontSize:"15px", fontWeight:900, padding:"2px 7px", borderRadius:"6px", direction:"ltr" }}>{ch}</span>
              ))}
            </div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {row.ex.map(e=>(
                <span key={e.k} style={{ background:BK2, color:"#ddd", fontSize:"11px", padding:"2px 5px", borderRadius:"4px", direction:"rtl" }}>
                  <span style={{color:Y,fontWeight:800}}>{e.k}</span> {e.r} — {e.m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Linking rule */}
      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
        <KoreanLanternIcon size={42} color={Y} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y, marginBottom:"5px" }}>قاعدة الربط (연음법칙 يون-إيم)</div>
          <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.9, marginBottom:"6px" }}>
            إذا جاء بعد الباتشيم مقطع يبدأ بـ <strong style={{color:Y}}>ㅇ</strong> الصامت، ينتقل الباتشيم إلى ذلك المقطع ويُنطق فيه.
          </div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            {[
              {w:"먹어요",before:"موك-أو-يو ❌",after:"مو-غو-يو ✅",m:"آكل"},
              {w:"한국어",before:"هان-غوك-أو ❌",after:"هان-غو-غو ✅",m:"كورية"},
              {w:"없어요",before:"أوبس-أو-يو ❌",after:"أوب-سو-يو ✅",m:"لا يوجد"},
            ].map(e=>(
              <div key={e.w} style={{ background:"#1a1a1a", borderRadius:"8px", padding:"8px 10px", direction:"ltr" }}>
                <div style={{ fontSize:"16px", color:Y, fontWeight:900 }}>{e.w}</div>
                <div style={{ fontSize:"11px", color:"#666", marginTop:"2px" }}>{e.before}</div>
                <div style={{ fontSize:"11px", color:"#4ade80", fontWeight:700 }}>{e.after}</div>
                <div style={{ fontSize:"11px", color:"#888", direction:"rtl" }}>{e.m}</div>
              </div>
            ))}
          </div>
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
      <div style={{ background:"#1a1a00", border:`2px solid ${Y}`, borderRadius:"8px", padding:"7px 12px", marginBottom:"8px", fontSize:"11px", color:"rgba(212,175,55,0.9)", fontWeight:700 }}>
        🎬 {page===1 ? "الكلمات الأساسية — تُسمع في كل حلقة تقريباً!" : "الكلمات المتقدمة — ستبدو كالمحترف!"}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
        {KDRAMA_AR.slice(...slice).map(v=>(
          <div key={v.k} style={{ background:"#f9f9f9", border:`2px solid ${Y}`, borderRadius:"10px", padding:"8px 10px", display:"flex", gap:"8px", alignItems:"flex-start", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ fontSize:"22px" }}>{v.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"22px", fontWeight:900, color:BK, background:Y, display:"inline-block", padding:"1px 8px", borderRadius:"6px", marginBottom:"2px", direction:"ltr" }}>{v.k}</div>
              <div style={{ fontSize:"11px", fontWeight:700, color:"#777", direction:"ltr" }}>{v.r}</div>
              <div style={{ fontSize:"11px", color:BK, fontWeight:700 }}>{v.m}</div>
              <div style={{ fontSize:"11px", color:"#888", fontStyle:"italic" }}>{v.note}</div>
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
      <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"10px", padding:"10px 12px", marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"7px" }}>✅ قائمة التحقق الذاتي — هل أنت مستعد للتمارين؟</div>
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
              <div style={{ width:"16px", height:"16px", border:`2px solid ${GD}`, borderRadius:"3px", flexShrink:0, marginTop:"1px" }} />
              <span style={{ fontSize:"10px", color:GD, lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
        {["المستوى ١ — /٥","المستوى ٢ — /٥","المستوى ٣ — /٥"].map((l,i)=>(
          <div key={i} style={{ flex:1, background:"#111", border:`1px solid ${Y}33`, borderRadius:"8px", padding:"6px", textAlign:"center" }}>
            <div style={{ fontSize:"16px" }}>{"⭐".repeat(i+1)}</div>
            <div style={{ fontSize:"10px", color:"#666", marginTop:"2px" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>⭐ تحدي المستوى ١ — الصوت الصحيح</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{q:"ㄱ",c:["ن","م","ك","هـ"]},{q:"ㄴ",c:["ك","ن","س","م"]},{q:"ㅁ",c:["هـ","ب","م","ر"]},{q:"ㅅ",c:["س","ك","ج","ب"]},{q:"ㅎ",c:["م","هـ","ن","ك"]}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"30px", color:Y, fontWeight:900 }}>{e.q}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px", marginTop:"4px" }}>
                {e.c.map(ch=><div key={ch} style={{ background:"#222", borderRadius:"4px", padding:"2px", fontSize:"11px", color:"#ccc" }}>{ch}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>⭐⭐ تحدي المستوى ٢ — اكتب النطق</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{k:"가방",a:"ga-bang"},{k:"사랑",a:"sa-rang"},{k:"한국",a:"han-guk"},{k:"친구",a:"chin-gu"},{k:"고마워",a:"go-ma-wo"}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ background:BK, borderRadius:"8px", padding:"8px 4px", fontSize:"20px", color:Y, fontWeight:900 }}>{e.k}</div>
              <div style={{ marginTop:"4px", border:"1px dashed #aaa", borderRadius:"4px", height:"20px", background:"#fff" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"#f9f9f9", border:`2px solid #E6E600`, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>⭐⭐⭐ تحدي المستوى ٣ — ابنِ المقطع</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", direction:"ltr" }}>
          {[{eq:"ㅂ+ㅏ=?",a:"바"},{eq:"ㄴ+ㅗ=?",a:"노"},{eq:"ㅅ+ㅣ=?",a:"시"},{eq:"ㅎ+ㅏ=?",a:"하"},{eq:"ㄱ+ㅜ=?",a:"구"}].map((e,i)=>(
            <div key={i} style={{ background:BK, borderRadius:"8px", padding:"8px 10px", textAlign:"center" }}>
              <div style={{ fontSize:"12px", color:Y, fontWeight:700 }}>{e.eq}</div>
              <div style={{ marginTop:"4px", border:`1px dashed ${Y}`, borderRadius:"4px", height:"28px", width:"38px", margin:"4px auto 0" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"5px" }}>✏️ شبكة الكتابة الحرة</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:"3px" }}>
        {Array(32).fill(null).map((_,i)=>(
          <div key={i} style={{ border:`1px solid ${Y}`, borderRadius:"4px", height:"30px", background:"#fffffe" }} />
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

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"7px" }}>جدول المرجع السريع — الحروف الساكنة</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {CONSONANTS.map(c=>(
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color:Y, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"11px", color:"#aaa" }}>{c.roman}</div>
              <div style={{ fontSize:"12px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:"#333", margin:"6px 0" }} />
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>حروف المد</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"4px" }}>
          {VOWELS.map(v=>(
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:"#fff9c4", fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"11px", color:"#aaa" }}>{v.roman}</div>
              <div style={{ fontSize:"11px" }}>{v.emoji}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`4px solid ${Y}`, borderRadius:"14px", padding:"16px", textAlign:"center", background:`linear-gradient(135deg,${YL} 0%,#fff 60%,${YL} 100%)` }}>
        <div style={{ fontSize:"32px", marginBottom:"4px" }}>🏆</div>
        <div style={{ fontSize:"20px", fontWeight:900, color:BK }}>تهانينا! أتممت مستوى الهانغول الأول</div>
        <div style={{ margin:"12px auto", width:"220px", borderBottom:`2px solid ${BK}` }} />
        <div style={{ fontSize:"11px", color:"#888" }}>اسم الطالب</div>
        <div style={{ marginTop:"10px", fontSize:"11px", color:"#aaa" }}>Klovers Korean Academy • klovers.academy • 2025</div>
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

      <div style={{ position:"relative", marginBottom:"12px" }}>
        <div style={{ position:"absolute", left:"18px", top:0, bottom:0, width:"3px", background:Y, borderRadius:"2px" }} />

        {[
          { era:"Before 1000 AD", icon:"🏔️", title:"Origins of Korean", body:"The Korean language developed over thousands of years on the Korean Peninsula. It is classified today as a language isolate — not related to Chinese, Japanese, or any other language family. It has its own unique grammar, vocabulary, and rhythm unlike any other language on Earth!" },
          { era:"1000–1442 AD", icon:"📜", title:"The Era of Hanja — Borrowed Characters", body:"Before Hangul, Koreans used Chinese characters (漢字 Hanja). They were incredibly difficult to learn — only the elite scholarly class could read and write. Over 95% of the Korean population was completely illiterate. Laws, contracts, and all literature were written in a script most people could not understand." },
          { era:"1443 AD 🌟", icon:"👑", title:"King Sejong's Revolution", body:"King Sejong the Great recognized this as a profound injustice. He said: 'How can a people govern themselves if they cannot read?' He assembled 8 brilliant scholars in the Hall of Worthies (집현전) and they worked for years in secret to invent a new alphabet perfectly suited to Korean sounds." },
          { era:"1446 AD", icon:"📚", title:"Hunminjeongeum Announced", body:"The new alphabet was proclaimed as «훈민정음» (Hunminjeongeum) — 'The Correct Sounds for the Instruction of the People.' The ruling class fiercely opposed it, fearing loss of power — but the king prevailed. Today, Hangul Day is celebrated every October 9th worldwide." },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px", alignItems:"flex-start" }}>
            <div style={{ width:"36px", height:"36px", background:Y, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, zIndex:1 }}>{item.icon}</div>
            <div style={{ flex:1, background: i===2 ? "#111" : "#f9f9f9", border:`2px solid ${i===2?Y:"#e5e5e5"}`, borderRadius:"10px", padding:"10px 12px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:i===2?Y:"#888", marginBottom:"2px" }}>{item.era}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color:i===2?"#fff":BK, marginBottom:"4px" }}>{item.title}</div>
              <div style={{ fontSize:"11px", color:i===2?"#ccc":"#555", lineHeight:1.8 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:Y, borderRadius:"10px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
        <MugunghwaIcon size={36} color={BK} />
        <div>
          <div style={{ fontWeight:800, fontSize:"11px", color:BK }}>Amazing Fact!</div>
          <div style={{ fontSize:"11px", color:BK2, lineHeight:1.6 }}>
            Korean is spoken by over <strong>80 million people</strong> worldwide. UNESCO recognized Hangul as one of the most scientifically designed and logically structured writing systems ever created in human history!
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ── King Sejong page EN ── */
function SejongEn() {
  return (
    <Page dir="ltr">
      <SHead title="King Sejong the Great 👑" subtitle="The man who changed a nation's destiny with one word: justice" />

      <div style={{ background:BK, borderRadius:"14px", padding:"16px", marginBottom:"12px", display:"grid", gridTemplateColumns:"120px 1fr", gap:"14px" }}>
        <div style={{ borderRadius:"10px", overflow:"hidden", border:`3px solid ${Y}`, display:"flex", flexDirection:"column", minHeight:"130px" }}>
          <SceneTeacher h={260} radius={0} />
          <div style={{ background:"#1a1a00", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"6px", flex:1 }}>
            <div style={{ fontSize:"18px", fontWeight:900, color:Y }}>세종대왕</div>
            <div style={{ fontSize:"11px", color:"#888", marginTop:"1px" }}>Sejong the Great</div>
          </div>
        </div>
        <div style={{ color:"#fff" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
            <PalaceRoofIcon size={28} color={Y} />
            <div style={{ fontSize:"16px", fontWeight:900, color:Y }}>Sejong the Great</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {[
              { icon:"🎂", label:"Born", val:"May 15, 1397 AD" },
              { icon:"👑", label:"Reign", val:"1418 – 1450 AD" },
              { icon:"🏛️", label:"Dynasty", val:"Joseon Royal Dynasty" },
              { icon:"📚", label:"Greatest Achievement", val:"Invented Hangul in 1443" },
              { icon:"🌟", label:"Title", val:"'Greatest King of Korea'" },
            ].map(r=>(
              <div key={r.label} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"13px" }}>{r.icon}</span>
                <span style={{ fontSize:"11px", color:"#888", minWidth:"70px" }}>{r.label}</span>
                <span style={{ fontSize:"11px", color:"#ddd", fontWeight:600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom:"10px" }}>
        <div style={{ fontWeight:800, fontSize:"12px", color:BK, marginBottom:"7px", display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ background:Y, padding:"2px 8px", borderRadius:"6px" }}>The Story</span>
          How were the letters designed?
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px" }}>
          {[
            { icon:"👅", title:"Tongue & Mouth Shape", body:"Every consonant was designed based on the exact shape of the tongue and mouth when producing that sound — science and art combined!" },
            { icon:"🔬", title:"Precise Phonetics", body:"ㄱ = tongue root rising toward throat. ㄴ = tongue tip touching upper palate. ㅁ = lips pressed together. Each shape mirrors the sound." },
            { icon:"🏗️", title:"Logical Structure", body:"Related letters look alike — ㄱ is the base, ㄲ is doubled, ㅋ has an extra stroke for aspiration. A complete, consistent system." },
          ].map(c=>(
            <div key={c.title} style={{ background:YL, borderRadius:"10px", padding:"10px", border:`1px solid ${Y}` }}>
              <div style={{ fontSize:"24px", marginBottom:"5px" }}>{c.icon}</div>
              <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"4px" }}>{c.title}</div>
              <div style={{ fontSize:"11px", color:"#555", lineHeight:1.7 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"14px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
        <div style={{ fontSize:"36px", color:Y, fontWeight:900, lineHeight:1, flexShrink:0 }}>"</div>
        <div>
          <div style={{ fontSize:"12px", color:"#fff", lineHeight:1.9, fontStyle:"italic" }}>
            A wise man can acquaint himself with them before the morning is over; a stupid man can learn them in the space of ten days.
          </div>
          <div style={{ fontSize:"11px", color:Y, fontWeight:700, marginTop:"6px" }}>— King Sejong the Great, Hunminjeongeum Preface, 1446 AD</div>
        </div>
      </div>
    </Page>
  );
}

/* ── Culture page EN ── */
function CultureEn() {
  return (
    <Page dir="ltr">
      <SHead title="Korean Culture 🌸" subtitle="5,000 years of beauty, philosophy, and art" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ background:BK, borderRadius:"12px", overflow:"hidden" }}>
          <SceneStreet h={220} radius={0} />
          <div style={{ padding:"10px" }}>
            <div style={{ fontWeight:800, fontSize:"12px", color:Y, marginBottom:"4px" }}>K-Drama</div>
            <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.7 }}>
              Among Netflix's most-watched content. Squid Game changed global TV. Korean storytelling captures hearts!
            </div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
              {["❤️ Romance","🕵️ Thriller","😂 Comedy"].map(t=>(
                <span key={t} style={{ background:"#222", color:Y, fontSize:"11px", padding:"2px 5px", borderRadius:"10px" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:"#1a1a00", border:`2px solid ${Y}`, borderRadius:"12px", overflow:"hidden" }}>
          <SceneConcert h={220} radius={0} />
          <div style={{ padding:"10px" }}>
            <div style={{ fontWeight:800, fontSize:"12px", color:Y, marginBottom:"4px" }}>K-Pop</div>
            <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.7 }}>
              BTS, BLACKPINK, Stray Kids — global superstars. K-Pop is dance, fashion, art, and worldwide fandom!
            </div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
              {["BTS 💜","BLACKPINK 🖤","Stray Kids 🐺"].map(t=>(
                <span key={t} style={{ background:BK, color:Y, fontSize:"11px", padding:"2px 5px", borderRadius:"10px" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"12px", overflow:"hidden" }}>
          <SceneFood h={200} radius={0} />
          <div style={{ padding:"10px" }}>
          <div style={{ fontWeight:800, fontSize:"12px", color:BK, marginBottom:"4px" }}>Korean Food</div>
          <div style={{ fontSize:"11px", color:"#555", lineHeight:1.7 }}>
            Kimchi, Bibimbap, Tteokbokki — foods that surprise and addict you! Korean cuisine balances sour, spicy, and umami.
          </div>
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"6px" }}>
            {["🥬 김치","🍚 비빔밥","🌶️ 떡볶이","🥩 삼겹살"].map(t=>(
              <span key={t} style={{ background:BK, color:Y, fontSize:"11px", padding:"2px 5px", borderRadius:"10px" }}>{t}</span>
            ))}
          </div>
          </div>
        </div>

        <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"28px", marginBottom:"6px" }}>🌿</div>
          <div style={{ fontWeight:800, fontSize:"12px", color:GD, marginBottom:"5px" }}>Korean Values & Spirit</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.8 }}>
            <strong>빨리빨리 (Ppalli-ppalli)</strong> = "hurry hurry" — Koreans value speed and excellence together. <strong>눈치 (Nunchi)</strong> = reading unspoken feelings. <strong>한 (Han)</strong> = a deep bittersweet longing — the eternal spirit of the Korean people.
          </div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"7px" }}>
            {["👴 Respect Elders","👨‍👩‍👧 Family First","📚 Education Sacred"].map(t=>(
              <span key={t} style={{ background:BK, color:Y, fontSize:"11px", padding:"2px 6px", borderRadius:"10px" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Diamond — 정(jeong) concept: 5th culture card */}
      <div style={{ background:"#2d1b4e", border:"2px solid #a78bfa", borderRadius:"12px", padding:"12px", marginBottom:"10px" }}>
        <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
          <div style={{ fontSize:"36px", color:"#a78bfa", fontWeight:900, lineHeight:1, flexShrink:0 }}>정</div>
          <div>
            <div style={{ fontWeight:800, fontSize:"12px", color:"#a78bfa", marginBottom:"4px" }}>정 (Jeong) — The untranslatable heart of Korean culture</div>
            <div style={{ fontSize:"11px", color:"#d8b4fe", lineHeight:1.8 }}>
              <strong style={{color:"#a78bfa"}}>정 (Jeong)</strong> has no direct English equivalent — it's the deep emotional bond that slowly forms between people through shared daily moments. Not romantic love exactly, but a soul-level attachment. In K-dramas you'll constantly hear: <span style={{color:"#fff",fontWeight:800}}>«정이 들었어»</span> = "I've grown attached to you without realizing it."
            </div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"7px" }}>
              {["💜 Emotional bond","🕰️ Grows over time","🎬 Heart of K-Drama"].map(t=>(
                <span key={t} style={{ background:"rgba(167,139,250,0.2)", color:"#a78bfa", fontSize:"11px", padding:"2px 6px", borderRadius:"10px", border:"1px solid rgba(167,139,250,0.4)" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"14px", alignItems:"center" }}>
        <KoreanLanternIcon size={40} color={Y} />
        <div>
          <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"4px" }}>After completing all 6 books you will be able to:</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {["Watch K-dramas without subtitles 🎬","Speak to Koreans with confidence 🗣️","Read signs in Korea 🪧","Sing along to K-Pop songs 🎵"].map(t=>(
              <div key={t} style={{ background:"#222", color:"#ddd", fontSize:"11px", padding:"4px 8px", borderRadius:"8px" }}>{t}</div>
            ))}
          </div>
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

      <div style={{ background:BK, borderRadius:"12px", padding:"14px", marginBottom:"12px" }}>
        <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.9 }}>
          The Klovers series takes you from <span style={{color:Y,fontWeight:800}}>knowing nothing</span> to <span style={{color:Y,fontWeight:800}}>speaking and writing fluently</span> — using the K-dramas and music you already love as your learning material. Each book builds on the last.
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
        {BOOKS_EN.map((b,i)=>(
          <div key={i} style={{
            background: b.current ? Y : "#f9f9f9",
            border:`2px solid ${b.current ? Y : "#e5e5e5"}`,
            borderRadius:"10px", padding:"10px 14px",
            display:"flex", alignItems:"center", gap:"12px",
          }}>
            <div style={{
              background: b.current ? BK : "#e0e0e0",
              color: b.current ? Y : "#999",
              fontWeight:900,
              width:"44px", height:"40px", borderRadius:"8px",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              flexShrink:0, gap:"1px",
            }}>
              <span style={{ fontSize:"9px", fontWeight:700, opacity:0.7 }}>Book</span>
              <span style={{ fontSize:"18px", lineHeight:1 }}>{b.n}</span>
            </div>
            <div style={{ fontSize:"22px", flexShrink:0 }}>{b.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:"12px", color: b.current ? BK : "#444" }}>{b.title}</div>
              <div style={{ fontSize:"11px", color: b.current ? BK2 : "#999", marginTop:"2px" }}>
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
          <div key={s.title} style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"10px", padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize:"24px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:"11px", color:BK }}>{s.title}</div>
            <div style={{ fontSize:"11px", color:"#666" }}>{s.sub}</div>
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
      <SHead title="7-Day Study Plan 🗓️" subtitle="Follow this plan and you'll read Korean in one week!" />
      <div style={{ background:BK, borderRadius:"12px", padding:"10px 14px", marginBottom:"10px", display:"flex", gap:"10px", alignItems:"center" }}>
        <div style={{ fontSize:"28px" }}>🎯</div>
        <div>
          <div style={{ fontSize:"13px", fontWeight:900, color:GOLD, marginBottom:"2px" }}>Goal: Read Hangul in 7 Days</div>
          <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.6 }}>30–45 minutes daily is enough. Consistency beats quantity!</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"10px" }}>
        {days.map((day, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"60px 1fr", gap:"8px", background:day.color, border:`1px solid ${i===6 ? GOLD+"88" : "#e5e7eb"}`, borderRadius:"10px", padding:"8px 10px" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"18px" }}>{day.icon}</div>
              <div style={{ fontSize:"10px", fontWeight:900, color:BK, background:i===6 ? GOLD : Y, borderRadius:"4px", padding:"1px 4px", marginTop:"2px" }}>{day.d}</div>
            </div>
            <div>
              <div style={{ fontSize:"12px", fontWeight:800, color:BK, marginBottom:"2px" }}>{day.task}</div>
              <div style={{ fontSize:"10px", color:"#666", display:"flex", gap:"4px", alignItems:"center" }}>
                <span style={{ color:"#f97316" }}>💡</span>{day.tip}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:GL, borderRadius:"10px", padding:"10px 14px", display:"flex", gap:"10px", alignItems:"center" }}>
        <TaegeukIcon size={36} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:900, color:GD, marginBottom:"2px" }}>🔑 The Secret to Success</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.6 }}>Don't move to the next day until you've mastered the current day's letters. Quality always beats speed!</div>
        </div>
      </div>
    </Page>
  );
}

function AspiratedEn() {
  return (
    <Page dir="ltr">
      <SHead title="Tensed Consonants (된소리) 💥" subtitle="5 consonants pronounced with extra tension — no air!" />
      <div style={{ background:"#fff3cd", border:"2px solid #f59e0b", borderRadius:"8px", padding:"8px 12px", marginBottom:"8px", fontSize:"11px", color:"#78350f", fontWeight:700 }}>
        ⚠️ <strong>Beginner note:</strong> These are advanced — master the 14 basic consonants first. Come back to this page in Week 2!
      </div>
      <div style={{ background:GL, borderRadius:"8px", padding:"8px 12px", marginBottom:"10px", fontSize:"11px", color:GD, fontWeight:700 }}>
        💡 Key difference: regular consonants release a puff of air. Tensed consonants release <strong>no</strong> air — throat and mouth are compressed.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"10px" }}>
        {ASPIRATED.map(a => (
          <div key={a.char} style={{ background:"#f9f9f9", border:`2px solid #f97316`, borderRadius:"10px", padding:"8px", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"5px" }}>
              <div style={{ background:BK, borderRadius:"6px", width:"50px", height:"50px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:"32px", color:GOLD, fontWeight:900, lineHeight:1 }}>{a.char}</div>
                <div style={{ fontSize:"10px", color:"#aaa" }}>{a.roman}</div>
              </div>
              <div>
                <div style={{ fontSize:"12px", fontWeight:900, color:BK }}>{a.en.name}</div>
                <div style={{ fontSize:"10px", color:"#666", background:"#fff3cd", padding:"1px 5px", borderRadius:"4px" }}>
                  = {a.base} + extra tension
                </div>
              </div>
            </div>
            <div style={{ background:"#fff9ec", borderRadius:"5px", padding:"3px 7px", fontSize:"10px", color:"#9a3412", marginBottom:"3px" }}>🔊 {a.en.sound}</div>
            <div style={{ background:YL, borderRadius:"5px", padding:"3px 7px", fontSize:"10px", color:"#555", marginBottom:"4px" }}>💡 {a.en.mnemonic}</div>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {a.en.ex.map((ex, i) => (
                <div key={i} style={{ background:BK2, borderRadius:"4px", padding:"2px 6px", fontSize:"10px", color:"#fff" }}>
                  <span style={{ color:Y, fontWeight:800 }}>{ex.k}</span> ({ex.r}) — {ex.m}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:BK, borderRadius:"10px", padding:"10px 14px", display:"flex", gap:"10px", alignItems:"center" }}>
        <QRPlaceholder size={44} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:800, color:GOLD }}>🔊 Hear the difference: regular vs tensed</div>
          <div style={{ fontSize:"10px", color:"#888", marginTop:"2px" }}>klovers.academy/audio/tensed</div>
        </div>
      </div>
    </Page>
  );
}

function CompoundVowelsEn() {
  return (
    <Page dir="ltr">
      <SHead title="Compound Vowels (이중모음) 🔗" subtitle="11 diphthongs built from two simple vowels!" />
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"8px", fontWeight:700 }}>
        💡 Don't memorize them all now! Most common: <strong style={{ fontSize:"13px" }}>ㅘ ㅝ ㅐ ㅔ ㅢ</strong> — you'll meet these constantly in K-dramas and songs.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"10px" }}>
        {COMPOUND_VOWELS.map(v => (
          <div key={v.char} style={{ background:"#f9f9f9", border:`2px solid ${GL}`, borderRadius:"8px", padding:"7px", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ display:"flex", gap:"6px", alignItems:"center", marginBottom:"4px" }}>
              <div style={{ background:GD, borderRadius:"6px", width:"36px", height:"36px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <div style={{ fontSize:"22px", color:"#fff", fontWeight:900, lineHeight:1 }}>{v.char}</div>
                <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.7)" }}>{v.roman}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"10px", color:"#555" }}>{v.en}</div>
              </div>
            </div>
            <div style={{ background:GL, borderRadius:"4px", padding:"2px 5px", fontSize:"9px", color:GD, fontWeight:700 }}>{v.ex}</div>
          </div>
        ))}
      </div>
      <div style={{ background:BK, borderRadius:"10px", padding:"8px 12px", display:"flex", gap:"8px", alignItems:"center" }}>
        <QRPlaceholder size={40} label="" />
        <div>
          <div style={{ fontSize:"11px", fontWeight:800, color:GOLD }}>🔊 Hear compound vowel pronunciation</div>
          <div style={{ fontSize:"10px", color:"#888", marginTop:"2px" }}>klovers.academy/audio/compound</div>
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

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div style={{ background:BK, borderRadius:"12px", padding:"14px", color:"#fff" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y, marginBottom:"7px" }}>Why Hangul is Brilliant</div>
          <p style={{ fontSize:"11px", lineHeight:2, color:"#ddd", margin:0 }}>
            King Sejong invented Hangul in 1443. It is a <strong style={{color:Y}}>phonetic alphabet</strong> — each letter represents exactly one sound. Most learners can read in just <strong style={{color:Y}}>2–3 days</strong> of focused practice!
          </p>
        </div>
        <div style={{ background:GL, borderRadius:"12px", padding:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:GD, marginBottom:"7px" }}>The Magic Numbers</div>
          {[{n:"14",l:"basic consonants"},{n:"10",l:"basic vowels"},{n:"∞",l:"possible syllables"}].map(({n,l})=>(
            <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"7px" }}>
              <div style={{ background:GD, color:Y, fontWeight:900, fontSize:"18px", width:"36px", height:"36px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:"11px", color:GD, fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`3px solid ${Y}`, borderRadius:"12px", padding:"12px", marginBottom:"10px", background:YL }}>
        <div style={{ fontWeight:800, fontSize:"12px", color:BK, marginBottom:"8px", textAlign:"center" }}>How a Syllable Block Works</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", flexWrap:"wrap" }}>
          {[
            {label:"Consonant",char:"ㅎ",sub:"h",bg:BK,fg:Y},
            {label:"+",char:"",sub:"",bg:"",fg:Y},
            {label:"Vowel",char:"ㅏ",sub:"a",bg:Y,fg:BK},
            {label:"=",char:"",sub:"",bg:"",fg:BK},
            {label:"Syllable!",char:"하",sub:"ha",bg:BK,fg:Y},
          ].map((item,i)=>
            item.char===""?(
              <div key={i} style={{fontSize:"24px",fontWeight:900,color:BK}}>{item.label}</div>
            ):(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"11px",color:"#555",marginBottom:"3px"}}>{item.label}</div>
                <div style={{background:item.bg,borderRadius:"10px",padding:"8px 14px",fontSize:"40px",fontWeight:900,color:item.fg,lineHeight:1,border:`2px solid ${Y}`}}>{item.char}</div>
                {item.sub&&<div style={{fontSize:"11px",color:"#555",marginTop:"3px"}}>{item.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>📅 7-Day Study Plan</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
        {plan.map((p,i)=>(
          <div key={i} style={{ background:i===6?Y:BK, borderRadius:"8px", padding:"7px 3px", textAlign:"center" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color:i===6?BK:Y }}>{p.d}</div>
            <div style={{ fontSize:"11px", color:i===6?BK2:"#aaa", marginTop:"3px", lineHeight:1.4 }}>{p.t}</div>
          </div>
        ))}
      </div>

      {/* Buzan: letter family tree */}
      <div style={{ marginTop:"8px", background:BK, borderRadius:"10px", padding:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>🧬 Letter families — how they're related</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", direction:"ltr" }}>
          {[
            { base:"ㄱ", derived:["ㅋ","ㄲ"], label:"g-family" },
            { base:"ㄷ", derived:["ㅌ","ㄸ"], label:"d-family" },
            { base:"ㅂ", derived:["ㅍ","ㅃ"], label:"b-family" },
            { base:"ㅅ", derived:["ㅆ"], label:"s-family" },
            { base:"ㅈ", derived:["ㅊ","ㅉ"], label:"j-family" },
          ].map(f=>(
            <div key={f.base} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"16px", borderRadius:"6px", padding:"4px 8px" }}>{f.base}</div>
              <span style={{ color:"#555", fontSize:"11px" }}>→</span>
              {f.derived.map(d=>(
                <div key={d} style={{ background:"#222", color:"#ccc", fontWeight:900, fontSize:"14px", borderRadius:"6px", padding:"3px 7px", border:`1px solid ${Y}44` }}>{d}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize:"10px", color:"#666", marginTop:"5px" }}>
          The base letter (yellow) gains strokes for more force — ㄱ→ㅋ (aspirated), ㄱ→ㄲ (tense/doubled)
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

      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"16px" }}>
        {chapters.map((ch, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:"10px",
            padding:"8px 12px", borderRadius:"10px",
            background: i % 2 === 0 ? "#f9f9f9" : "#fff",
            border:`1px solid ${i % 2 === 0 ? Y + "55" : "#eee"}`,
          }}>
            <div style={{
              background:BK, color:Y, fontWeight:900, fontSize:"11px",
              width:"30px", height:"30px", borderRadius:"6px",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>{ch.n}</div>
            <div style={{ fontSize:"18px", flexShrink:0 }}>{ch.icon}</div>
            <div style={{ flex:1, fontSize:"12px", fontWeight:700, color:BK, display:"flex", alignItems:"center", gap:"5px" }}>
              {ch.title}
              {(ch as any).new && <span style={{ background:"#22c55e", color:"#fff", fontSize:"8px", fontWeight:900, padding:"1px 4px", borderRadius:"3px", flexShrink:0 }}>NEW</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
              <div style={{ width:"40px", borderBottom:"1px dashed #ccc" }} />
              <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"11px", padding:"2px 8px", borderRadius:"6px" }}>{ch.page}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"12px", alignItems:"center" }}>
        <TaegeukIcon size={42} />
        <div>
          <div style={{ fontSize:"13px", fontWeight:900, color:GOLD, marginBottom:"3px" }}>Your journey starts here 🚀</div>
          <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.6 }}>Read each chapter in order — every chapter builds on the last. In 7 days you'll be reading Korean!</div>
        </div>
      </div>
    </Page>
  );
}

function ConsonantsEn({ slice, page }: { slice:[number,number]; page:number }) {
  const count = slice[1] - slice[0];
  const kpopLyrics = page === 1
    ? { lyric:"나비야", rom:"na-bi-ya", meaning:"Oh butterfly", song:"Korean folk song" }
    : { lyric:"고마워", rom:"go-ma-wo", meaning:"Thank you", song:"IU — Palette" };
  return (
    <Page dir="ltr">
      <SHead title={`Consonants (자음) — Part ${page} of 2`} subtitle="Every Korean syllable begins with a consonant" />
      {/* Marzano "I can..." learning objective */}
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"7px", fontWeight:700 }}>
        ✅ By the end of this page you will be able to: read, pronounce, and write <strong>{count}</strong> new Korean letters!
      </div>
      <StrokeOrderTip lang="en" />
      <div style={{ background:YL, borderRadius:"8px", padding:"6px 10px", fontSize:"11px", color:BK2, marginBottom:"8px" }}>
        💡 There are 14 basic consonants plus 5 aspirated (with a puff of air). Master the basics first!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {CONSONANTS.slice(...slice).map(c=><ConsCard key={c.char} c={c} lang="en" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"#111", borderRadius:"10px", padding:"10px 14px", marginTop:"8px" }}>
        <QRPlaceholder size={50} label="" />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y }}>🔊 Hear the correct pronunciation</div>
          <div style={{ fontSize:"11px", color:"#888", marginTop:"3px" }}>Scan or visit: <span style={{color:Y}}>klovers.academy/audio</span></div>
        </div>
      </div>
      {/* Mogi K-Pop lyric strip */}
      <div style={{ background:"#1a1a00", border:`2px solid ${Y}`, borderRadius:"8px", padding:"7px 12px", marginTop:"6px", display:"flex", gap:"10px", alignItems:"center" }}>
        <div style={{ fontSize:"20px" }}>🎵</div>
        <div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,0,0.65)", marginBottom:"2px", fontWeight:700 }}>K-Pop lyric using letters you just learned:</div>
          <span style={{ fontSize:"18px", color:Y, fontWeight:900 }}>{kpopLyrics.lyric}</span>
          <span style={{ fontSize:"11px", color:"#aaa", marginLeft:"6px" }}>[{kpopLyrics.rom}] = "{kpopLyrics.meaning}"</span>
          <span style={{ fontSize:"10px", color:"#555", marginLeft:"4px" }}>— {kpopLyrics.song}</span>
        </div>
      </div>
      {/* Nunan micro-task */}
      <div style={{ background:GL, border:`1px solid ${GD}`, borderRadius:"8px", padding:"8px 10px", marginTop:"6px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"3px" }}>📝 Now try it!</div>
        <div style={{ fontSize:"11px", color:GD, marginBottom:"5px" }}>Try spelling your first name using the Korean letters you just learned:</div>
        <div style={{ height:"24px", border:"1px dashed #aaa", borderRadius:"4px", background:"#fff" }} />
      </div>
    </Page>
  );
}

function VowelsEn() {
  return (
    <Page dir="ltr">
      <SHead title="Vowels (모음)" subtitle="Vowels never stand alone — they always need a consonant" />
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"7px", fontWeight:700 }}>
        ✅ By the end of this page you will be able to: read and pronounce all 10 Korean vowels and form complete syllables!
      </div>
      <div style={{ background:GL, borderRadius:"8px", padding:"6px 10px", fontSize:"11px", color:GD, marginBottom:"8px", fontWeight:700 }}>
        🌟 If a syllable starts with a vowel sound, use the silent ㅇ as a placeholder: e.g., "a" = 아 (ㅇ + ㅏ)
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {VOWELS.map(v=><VowCard key={v.char} v={v} lang="en" />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"#111", borderRadius:"10px", padding:"10px 14px", marginTop:"8px" }}>
        <QRPlaceholder size={50} label="" />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y }}>🔊 Hear all vowel sounds</div>
          <div style={{ fontSize:"11px", color:"#888", marginTop:"3px" }}>Scan or visit: <span style={{color:Y}}>klovers.academy/audio</span></div>
        </div>
      </div>
      <MiniReadingStripEn />
    </Page>
  );
}

function SyllableEn() {
  return (
    <Page dir="ltr">
      <SHead title="Building Syllable Blocks" subtitle="The smart way Korean combines letters" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        {[
          {n:"①",t:"Every syllable starts with a consonant",n2:"Use silent ㅇ if starting with a vowel sound",ex:"아 = ㅇ+ㅏ"},
          {n:"②",t:"Tall vowels sit to the RIGHT",n2:"ㅏ ㅓ ㅣ ㅐ ㅔ ㅑ ㅕ",ex:"가 나 사 바"},
          {n:"③",t:"Wide vowels sit BELOW",n2:"ㅗ ㅜ ㅡ ㅛ ㅠ",ex:"고 노 소 도"},
          {n:"④",t:"받침 — final consonant goes under the block",n2:"Optional — sits at the bottom",ex:"한 = ㅎ+ㅏ+ㄴ"},
        ].map(r=>(
          <div key={r.n} style={{ background:BK, borderRadius:"10px", padding:"10px" }}>
            <div style={{ fontSize:"22px", color:Y, fontWeight:900 }}>{r.n}</div>
            <div style={{ fontSize:"11px", fontWeight:700, color:"#fff", lineHeight:1.6, marginBottom:"3px" }}>{r.t}</div>
            <div style={{ fontSize:"11px", color:"#aaa", marginBottom:"4px" }}>{r.n2}</div>
            <div style={{ fontSize:"14px", color:Y, fontWeight:800 }}>{r.ex}</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>🔤 Syllable Examples</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"5px" }}>
        {SYLLABLES.map(s=>(
          <div key={s.b} style={{ background:BK, borderRadius:"8px", padding:"7px 4px", textAlign:"center" }}>
            <div style={{ fontSize:"11px", color:"#555" }}>{s.c}+{s.v}</div>
            <div style={{ fontSize:"32px", fontWeight:900, color:Y, lineHeight:1 }}>{s.b}</div>
            <div style={{ fontSize:"11px", color:"#aaa" }}>{s.r}</div>
            <div style={{ fontSize:"11px", color:"#888" }}>{s.en}</div>
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
        <div style={{ background:BK, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>What is Batchim?</div>
          <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.9 }}>
            Batchim is the consonant that sits <strong style={{color:Y}}>underneath</strong> the syllable block. Not every syllable has one — but it appears in thousands of Korean words.
          </div>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", marginTop:"10px" }}>
            {[
              {top:"ㅎ", mid:"ㅏ", bot:null, label:"하 (ha)", note:"No batchim"},
              {top:"ㅎ", mid:"ㅏ", bot:"ㄴ", label:"한 (han)", note:"Batchim = ㄴ"},
            ].map((b,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ background: i===1?Y:YL, borderRadius:"10px", padding:"10px 14px", border:`2px solid ${Y}`, display:"inline-flex", flexDirection:"column", alignItems:"center", width:"60px" }}>
                  <div style={{ fontSize:"11px", color:i===1?BK:"#666" }}>{b.top}</div>
                  <div style={{ fontSize:"11px", color:i===1?BK:"#666" }}>{b.mid}</div>
                  {b.bot && <div style={{ fontSize:"11px", color:BK, fontWeight:900, borderTop:"1px solid rgba(0,0,0,0.2)", marginTop:"3px", paddingTop:"3px", width:"100%", textAlign:"center" }}>{b.bot}</div>}
                </div>
                <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginTop:"5px" }}>{b.label}</div>
                <div style={{ fontSize:"11px", color:"#777" }}>{b.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"6px" }}>The Golden Rule 🥇</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.9 }}>
            Even though there are 14+ consonants, only <strong>7 final sounds</strong> can be pronounced in batchim position. Every other consonant reduces to one of these seven.
          </div>
          <div style={{ background:BK, borderRadius:"8px", padding:"8px", marginTop:"8px", textAlign:"center" }}>
            <div style={{ display:"flex", gap:"6px", justifyContent:"center", flexWrap:"wrap" }}>
              {["k","n","t","l","m","p","ng"].map(s=>(
                <div key={s} style={{ background:Y, color:BK, fontWeight:900, fontSize:"13px", padding:"4px 8px", borderRadius:"8px" }}>{s}</div>
              ))}
            </div>
            <div style={{ fontSize:"11px", color:"#aaa", marginTop:"5px" }}>The 7 final sounds</div>
          </div>
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>The 7 Final Sound Groups</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"10px" }}>
        {FINAL7.map((row,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"36px 1fr 1fr", gap:"6px", alignItems:"center", background:i%2===0?"#f9f9f9":"#fff", borderRadius:"8px", padding:"6px 10px", border:`1px solid ${Y}44` }}>
            <div style={{ background:BK, color:Y, fontWeight:900, fontSize:"14px", textAlign:"center", borderRadius:"6px", padding:"4px" }}>{row.sound}</div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {row.chars.map(ch=>(
                <span key={ch} style={{ background:Y, color:BK, fontSize:"15px", fontWeight:900, padding:"2px 7px", borderRadius:"6px" }}>{ch}</span>
              ))}
            </div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {row.ex.map(e=>(
                <span key={e.k} style={{ background:BK2, color:"#ddd", fontSize:"11px", padding:"2px 5px", borderRadius:"4px" }}>
                  <span style={{color:Y,fontWeight:800}}>{e.k}</span> [{e.r}] {e.m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
        <KoreanLanternIcon size={42} color={Y} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:800, color:Y, marginBottom:"5px" }}>Linking Rule — 연음법칙 (Yeon-eum)</div>
          <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.9, marginBottom:"6px" }}>
            When batchim is followed by a syllable starting with <strong style={{color:Y}}>ㅇ</strong> (silent), the batchim <strong style={{color:Y}}>moves</strong> to that next syllable and is pronounced there.
          </div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            {[
              {w:"먹어요",wrong:"meok-eo-yo ❌",right:"meo-geo-yo ✅",m:"I eat"},
              {w:"한국어",wrong:"han-guk-eo ❌",right:"han-gu-geo ✅",m:"Korean language"},
              {w:"없어요",wrong:"eops-eo-yo ❌",right:"eop-seo-yo ✅",m:"There isn't"},
            ].map(e=>(
              <div key={e.w} style={{ background:"#1a1a1a", borderRadius:"8px", padding:"8px 10px" }}>
                <div style={{ fontSize:"16px", color:Y, fontWeight:900 }}>{e.w}</div>
                <div style={{ fontSize:"11px", color:"#666", marginTop:"2px" }}>{e.wrong}</div>
                <div style={{ fontSize:"11px", color:"#4ade80", fontWeight:700 }}>{e.right}</div>
                <div style={{ fontSize:"11px", color:"#888" }}>{e.m}</div>
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
        <div style={{ background:BK, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>What is Gyeop-batchim?</div>
          <div style={{ fontSize:"11px", color:"#ccc", lineHeight:1.9 }}>
            Some syllable blocks hold <strong style={{color:Y}}>two consonants together</strong> in the batchim position. When speaking, usually the <strong style={{color:Y}}>left (first)</strong> one is pronounced and the second is silent.
          </div>
          <div style={{ marginTop:"10px", display:"flex", justifyContent:"center" }}>
            <div style={{ background:Y, borderRadius:"10px", padding:"10px 14px", display:"inline-flex", flexDirection:"column", alignItems:"center", border:`2px solid ${BK}` }}>
              <div style={{ display:"flex", gap:"2px" }}>
                <span style={{ fontSize:"13px", color:BK }}>ㄷ</span>
                <span style={{ fontSize:"13px", color:BK }}>ㅏ</span>
              </div>
              <div style={{ display:"flex", gap:"2px", borderTop:"1px solid rgba(0,0,0,0.3)", marginTop:"3px", paddingTop:"3px" }}>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#0047AB" }}>ㄹ</span>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#C8102E" }}>ㄱ</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:"11px", color:"#aaa", marginTop:"5px" }}>닭 = dak (chicken) — ㄱ sounds, ㄹ is silent</div>
        </div>

        <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"12px", padding:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"6px" }}>Linking Rule for Double Batchim 🔗</div>
          <div style={{ fontSize:"11px", color:BK2, lineHeight:1.9, marginBottom:"8px" }}>
            When followed by a syllable starting with <strong>ㅇ</strong>, the <strong style={{color:"#C8102E"}}>right (second)</strong> consonant moves to the next syllable!
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {[
              {w:"닭이",r:"[dal-gi]",m:"chicken (object)"},
              {w:"없어요",r:"[eop-seo-yo]",m:"there isn't (polite)"},
              {w:"앉아요",r:"[an-ja-yo]",m:"sits (polite)"},
            ].map(e=>(
              <div key={e.w} style={{ background:BK, borderRadius:"6px", padding:"6px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"16px", color:Y, fontWeight:900 }}>{e.w}</span>
                <span style={{ fontSize:"11px", color:"#4ade80", fontWeight:700 }}>{e.r}</span>
                <span style={{ fontSize:"11px", color:"#888" }}>{e.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>Most Common Double Batchim Pairs</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"6px", marginBottom:"6px" }}>
        {GYEOP.slice(0, 3).map((g,i)=>(
          <div key={i} style={{
            background: i%2===0 ? BK : BK2,
            borderRadius:"10px", padding:"10px 8px",
            border:`2px solid ${Y}44`, textAlign:"center",
          }}>
            <div style={{ fontSize:"22px", color:Y, fontWeight:900, letterSpacing:"2px" }}>{g.chars}</div>
            <div style={{ fontSize:"11px", color:"#aaa", marginTop:"2px" }}>sounds like</div>
            <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"18px", borderRadius:"6px", padding:"2px 8px", margin:"4px auto", display:"inline-block" }}>{g.read}</div>
            <div style={{ borderTop:`1px solid ${Y}33`, marginTop:"6px", paddingTop:"6px" }}>
              <div style={{ fontSize:"18px", color:Y, fontWeight:900 }}>{g.ex}</div>
              <div style={{ fontSize:"11px", color:"#aaa" }}>[{g.rom}]</div>
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
          <div style={{ fontWeight:800, fontSize:"11px", color:GD }}>Expert Tip</div>
          <div style={{ fontSize:"11px", color:GD, lineHeight:1.7 }}>
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
      <div style={{ background:"#1a1a00", border:`2px solid ${Y}`, borderRadius:"8px", padding:"7px 12px", marginBottom:"8px", fontSize:"11px", color:`rgba(212,175,55,0.9)`, fontWeight:700 }}>
        🎬 {page===1 ? "Core vocabulary — heard in almost every episode!" : "Advanced words — use these to sound like a native!"}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
        {KDRAMA_EN.slice(...slice).map(v=>(
          <div key={v.k} style={{ background:"#f9f9f9", border:`2px solid ${Y}`, borderRadius:"10px", padding:"8px 10px", display:"flex", gap:"8px", alignItems:"flex-start", pageBreakInside:"avoid", breakInside:"avoid" }}>
            <div style={{ fontSize:"22px" }}>{v.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"22px", fontWeight:900, color:BK, background:Y, display:"inline-block", padding:"1px 8px", borderRadius:"6px", marginBottom:"2px" }}>{v.k}</div>
              <div style={{ fontSize:"11px", fontWeight:700, color:"#777" }}>{v.r}</div>
              <div style={{ fontSize:"11px", color:BK, fontWeight:700 }}>{v.m}</div>
              <div style={{ fontSize:"11px", color:"#888", fontStyle:"italic" }}>{v.note}</div>
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
      <div style={{ background:GL, border:`2px solid ${GD}`, borderRadius:"10px", padding:"10px 12px", marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:GD, marginBottom:"7px" }}>✅ Self-Assessment Checklist — Ready for the exercises?</div>
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
              <div style={{ width:"16px", height:"16px", border:`2px solid ${GD}`, borderRadius:"3px", flexShrink:0, marginTop:"1px" }} />
              <span style={{ fontSize:"10px", color:GD, lineHeight:1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
        {["Level 1 — /5","Level 2 — /5","Level 3 — /5"].map((l,i)=>(
          <div key={i} style={{ flex:1, background:"#111", border:`1px solid ${Y}33`, borderRadius:"8px", padding:"6px", textAlign:"center" }}>
            <div style={{ fontSize:"16px" }}>{"⭐".repeat(i+1)}</div>
            <div style={{ fontSize:"10px", color:"#666", marginTop:"2px" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>⭐ Level 1 Challenge — Spot the Sound</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{q:"ㄱ",c:["n","m","g","h"]},{q:"ㄴ",c:["g","n","s","m"]},{q:"ㅁ",c:["h","b","m","r"]},{q:"ㅅ",c:["s","k","j","p"]},{q:"ㅎ",c:["m","h","n","g"]}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"30px", color:Y, fontWeight:900 }}>{e.q}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px", marginTop:"4px" }}>
                {e.c.map(ch=><div key={ch} style={{ background:"#222", borderRadius:"4px", padding:"2px", fontSize:"11px", color:"#ccc" }}>{ch}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>⭐⭐ Level 2 Challenge — Write the Romanization</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{k:"가방",a:"ga-bang"},{k:"사랑",a:"sa-rang"},{k:"한국",a:"han-guk"},{k:"친구",a:"chin-gu"},{k:"고마워",a:"go-ma-wo"}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ background:BK, borderRadius:"8px", padding:"8px 4px", fontSize:"20px", color:Y, fontWeight:900 }}>{e.k}</div>
              <div style={{ marginTop:"4px", border:"1px dashed #aaa", borderRadius:"4px", height:"20px", background:"#fff" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"#f9f9f9", border:`2px solid #E6E600`, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>⭐⭐⭐ Level 3 Challenge — Build the Syllable</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {[{eq:"ㅂ+ㅏ=?",a:"바"},{eq:"ㄴ+ㅗ=?",a:"노"},{eq:"ㅅ+ㅣ=?",a:"시"},{eq:"ㅎ+ㅏ=?",a:"하"},{eq:"ㄱ+ㅜ=?",a:"구"}].map((e,i)=>(
            <div key={i} style={{ background:BK, borderRadius:"8px", padding:"8px 10px", textAlign:"center" }}>
              <div style={{ fontSize:"12px", color:Y, fontWeight:700 }}>{e.eq}</div>
              <div style={{ marginTop:"4px", border:`1px dashed ${Y}`, borderRadius:"4px", height:"28px", width:"38px", margin:"4px auto 0" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"5px" }}>✏️ Free Writing Grid</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:"3px" }}>
        {Array(32).fill(null).map((_,i)=>(
          <div key={i} style={{ border:`1px solid ${Y}`, borderRadius:"4px", height:"30px", background:"#fffffe" }} />
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

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"7px" }}>Quick Reference — All Consonants</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {CONSONANTS.map(c=>(
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color:Y, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"11px", color:"#aaa" }}>{c.roman}</div>
              <div style={{ fontSize:"12px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:"#333", margin:"6px 0" }} />
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>All Vowels</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"4px" }}>
          {VOWELS.map(v=>(
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:"#fff9c4", fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"11px", color:"#aaa" }}>{v.roman}</div>
              <div style={{ fontSize:"11px" }}>{v.emoji}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`4px solid ${Y}`, borderRadius:"14px", padding:"16px", textAlign:"center", background:`linear-gradient(135deg,${YL} 0%,#fff 60%,${YL} 100%)` }}>
        <div style={{ fontSize:"32px", marginBottom:"4px" }}>🏆</div>
        <div style={{ fontSize:"20px", fontWeight:900, color:BK }}>Hangul Level 1 — Complete!</div>
        <div style={{ margin:"12px auto", width:"220px", borderBottom:`2px solid ${BK}` }} />
        <div style={{ fontSize:"11px", color:"#888" }}>Student Name</div>
        <div style={{ marginTop:"10px", fontSize:"11px", color:"#aaa" }}>Klovers Korean Academy • klovers.academy • 2025</div>
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
      <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"8px", padding:"7px 12px", fontSize:"11px", color:BK2, marginBottom:"8px" }}>
        💡 هذه الكلمات تُشكّل أكثر من <strong>٧٠٪</strong> من اللغة الكورية اليومية. احفظ أول ٢٠ كلمة وستفهم نصف ما يُقال حولك!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px" }}>
        {words.map(w => (
          <div key={w.freq} style={{
            background: w.freq <= 10 ? BK : w.freq <= 25 ? "#1a1a1a" : "#f9f9f9",
            border: `1px solid ${w.freq <= 10 ? Y : w.freq <= 25 ? Y+"44" : "#e5e5e5"}`,
            borderRadius:"8px", padding:"6px 5px", textAlign:"center",
          }}>
            <div style={{ fontSize:"9px", color: w.freq <= 25 ? "#555" : "#aaa", marginBottom:"1px" }}>#{w.freq}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color: w.freq <= 25 ? Y : BK, lineHeight:1 }}>{w.k}</div>
            <div style={{ fontSize:"9px", color: w.freq <= 25 ? "#aaa" : "#888", marginTop:"1px" }}>{w.r}</div>
            <div style={{ fontSize:"9px", color: w.freq <= 25 ? "#ccc" : "#666", marginTop:"1px" }}>{w.m}</div>
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
      <div style={{ background:YL, border:`2px solid ${Y}`, borderRadius:"8px", padding:"7px 12px", fontSize:"11px", color:BK2, marginBottom:"8px" }}>
        💡 These 50 words make up over <strong>70%</strong> of everyday Korean. Master the first 20 and you'll understand half of what's said around you!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px" }}>
        {words.map(w => (
          <div key={w.freq} style={{
            background: w.freq <= 10 ? BK : w.freq <= 25 ? "#1a1a1a" : "#f9f9f9",
            border: `1px solid ${w.freq <= 10 ? Y : w.freq <= 25 ? Y+"44" : "#e5e5e5"}`,
            borderRadius:"8px", padding:"6px 5px", textAlign:"center",
          }}>
            <div style={{ fontSize:"9px", color: w.freq <= 25 ? "#555" : "#aaa", marginBottom:"1px" }}>#{w.freq}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color: w.freq <= 25 ? Y : BK, lineHeight:1 }}>{w.k}</div>
            <div style={{ fontSize:"9px", color: w.freq <= 25 ? "#aaa" : "#888", marginTop:"1px" }}>{w.r}</div>
            <div style={{ fontSize:"9px", color: w.freq <= 25 ? "#ccc" : "#666", marginTop:"1px" }}>{w.m}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}


/* ════════════════════════════════════════════════════════════════
   4-WEEK COURSE WORKBOOK PACK
═════════════════════════════════════════════════════════════════ */

const VOWEL_PARTS: Record<1|2|3, { chars:string[]; en:string; ar:string }> = {
  1: { chars:["ㅏ","ㅓ","ㅗ","ㅜ"], en:"Vowels Part 1 — ㅏ ㅓ ㅗ ㅜ", ar:"حروف المد — الجزء ١" },
  2: { chars:["ㅡ","ㅣ","ㅐ","ㅔ"], en:"Vowels Part 2 — ㅡ ㅣ ㅐ ㅔ", ar:"حروف المد — الجزء ٢" },
  3: { chars:["ㅑ","ㅕ","ㅛ","ㅠ"], en:"Vowels Part 3 — ㅑ ㅕ + review", ar:"حروف المد — الجزء ٣ + مراجعة" },
};
const VOWEL_ROMAN: Record<string,string> = { "ㅏ":"a","ㅓ":"eo","ㅗ":"o","ㅜ":"u","ㅡ":"eu","ㅣ":"i","ㅐ":"ae","ㅔ":"e","ㅑ":"ya","ㅕ":"yeo","ㅛ":"yo","ㅠ":"yu" };

function CoursePlan({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const weeks = [
    { n: isAr ? "الأسبوع ١" : "Week 1", title: isAr ? "الحروف الساكنة — الجزء ١" : "Basic Consonants — Part 1", letters: "ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ", goal: isAr ? "يتعرّف الطالب على الحروف الستة الأولى ويستطيع نطقها وكتابتها." : "Students recognize, pronounce, and write the first 6 consonants." },
    { n: isAr ? "الأسبوع ٢" : "Week 2", title: isAr ? "إكمال الحروف الساكنة" : "Complete Basic Consonants", letters: "ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ", goal: isAr ? "يستطيع الطالب نطق وكتابة جميع الـ١٤ حرفاً ساكناً." : "Students recognize, pronounce, and write all 14 basic consonants." },
    { n: isAr ? "الأسبوع ٣" : "Week 3", title: isAr ? "حروف المد + المقاطع" : "Vowels + Syllable Blocks", letters: "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ ㅐ ㅔ ㅑ ㅕ", goal: isAr ? "يجمع الطالب بين الساكن والمد ليقرأ مقاطع بسيطة مثل 가، 나، 바، 고." : "Students combine consonants + vowels to read simple syllables (가, 나, 바, 고)." },
    { n: isAr ? "الأسبوع ٤" : "Week 4", title: isAr ? "الباتشيم + تدريب القراءة" : "Batchim + Reading Practice", letters: isAr ? "الحروف النهائية + كلمات بسيطة" : "Final consonants + simple Korean words", goal: isAr ? "يقرأ الطالب كلمات كورية مبدئية ويفهم فكرة الحرف النهائي (الباتشيم)." : "Students read beginner Korean words and understand final consonants." },
  ];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "خطة الكورس" : "Course Plan"}>
      <SHead title={isAr ? "خطة مستوى الهانغول خلال ٤ أسابيع" : "4-Week Hangul Course Plan"} subtitle={isAr ? "حصة واحدة في الأسبوع · ٩٠ دقيقة لكل حصة · واجب وتدريب يومي" : "1 class per week · 90 minutes per class · Homework + daily practice included"} />
      <div style={{ display:"flex", flexDirection:"column", gap:"5mm", marginBottom:"7mm" }}>
        {weeks.map((w,i) => (
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"5mm", background:i===0?"#fffdf3":SBG }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"10px", marginBottom:"3mm", borderBottom:`1px solid ${BD}`, paddingBottom:"3mm" }}>
              <div style={{ fontSize:"10px", color:T3, fontWeight:800, letterSpacing:"2px", textTransform:"uppercase" }}>{w.n}</div>
              <div style={{ fontSize:"15px", fontWeight:900, color:T1 }}>{w.title}</div>
            </div>
            <div style={{ fontSize:"22px", fontWeight:900, color:T1, letterSpacing:"3px", marginBottom:"3mm", direction:"ltr", textAlign:isAr?"right":"left" }}>{w.letters}</div>
            <div style={{ fontSize:"11px", color:T2, lineHeight:1.6 }}>
              <span style={{ fontWeight:800, color:T1 }}>{isAr?"الهدف:":"Goal:"}</span> {w.goal}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr ? "هذا الكورس يعطي أفضل نتائج عندما يلتزم الطالب بحلّ الواجب وتطبيق التدريب اليومي (٥–١٠ دقائق) بين الحصص." : "This course works best when students complete the homework and the daily 5–10 minute practice tasks between classes."}
      </div>
    </Page>
  );
}

function InClassExercise({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const items = isAr
    ? ["كرّر بعد المعلم.", "طابق الحرف بالصوت.", "اكتب الحرف من الذاكرة.", "اقرأ بصوت عالٍ واحداً تلو الآخر.", "تحدي السرعة: من يتعرّف على الحرف أوّلاً؟"]
    : ["Repeat after the teacher.", "Match the letter with the sound.", "Write the letter from memory.", "Read aloud one by one.", "Speed challenge: who can recognize the letter first?"];
  return (
    <div style={{ marginTop:"7mm", border:`1px solid ${BD}`, borderLeft:`3px solid ${Y}`, borderRadius:"4px", padding:"4mm 5mm", background:"#fffdf3" }}>
      <div style={{ fontSize:"10px", fontWeight:800, color:T1, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
        {isAr ? "تدريب داخل الحصة" : "In-Class Exercise"}
      </div>
      <ul style={{ margin:0, paddingInlineStart:"18px", fontSize:"11px", color:T2, lineHeight:1.8 }}>
        {items.map((t,i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function HwSection({ letter, title, body }: { letter:string; title:string; body:string }) {
  return (
    <div style={{ marginBottom:"3mm" }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:"6px", marginBottom:"2mm" }}>
        <span style={{ fontSize:"11px", fontWeight:900, color:T1, background:Y, padding:"1px 6px", borderRadius:"3px" }}>{letter}</span>
        <span style={{ fontSize:"13px", fontWeight:800, color:T1 }}>{title}</span>
      </div>
      {body && <div style={{ fontSize:"11px", color:T2, lineHeight:1.7, marginBottom:"3mm" }}>{body}</div>}
    </div>
  );
}

function buildSyllable(c: string, v: string): string {
  const cI = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"].indexOf(c);
  const vI = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"].indexOf(v);
  return cI>=0 && vI>=0 ? String.fromCodePoint(0xAC00 + cI*588 + vI*28) : c + v;
}

function Homework({ lesson, slice, lang }: LessonProps) {
  const isAr = lang === "ar";
  const letters = CONSONANTS.slice(...slice);
  const syllables = letters.flatMap(c => ["ㅏ","ㅓ","ㅗ"].map(v => buildSyllable(c.char, v)));
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "الواجب" : "Homework"}>
      <div style={{ marginBottom:"6mm", paddingBottom:"4mm", borderBottom:`1px solid ${BD}` }}>
        <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"2px", marginBottom:"3px" }}>
          {isAr ? `واجب الدرس ${["١","٢","٣","٤","٥"][lesson-1]}` : `Lesson ${lesson} Homework`}
        </div>
        <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>
          {isAr ? "واجب البيت" : "Homework"}
        </div>
      </div>

      <HwSection letter="A" title={isAr ? "تدريب الكتابة" : "Writing Practice"} body={isAr ? "اكتب كل حرف ١٠ مرات في كرّاسك." : "Write each letter 10 times in your notebook."} />
      <div style={{ display:"flex", gap:"8px", marginBottom:"6mm", flexWrap:"wrap" }}>
        {letters.map(c => (
          <div key={c.char} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"3mm 5mm", fontSize:"30px", fontWeight:900, color:T1, background:"#fff" }}>{c.char}</div>
        ))}
      </div>

      <HwSection letter="B" title={isAr ? "تدريب النطق" : "Speaking Practice"} body={isAr ? "سجّل voice note وأنت تنطق الحروف والمقاطع." : "Record yourself reading the letters and syllables aloud."} />

      <HwSection letter="C" title={isAr ? "تدريب القراءة" : "Reading Practice"} body={isAr ? "اقرأ المقاطع التالية بصوت عالٍ:" : "Read the following syllables aloud:"} />
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"6mm", direction:"ltr" }}>
        {syllables.map((s,i) => (
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"4mm 5mm", fontSize:"22px", fontWeight:900, color:T1, background:"#fff" }}>{s}</div>
        ))}
      </div>

      <HwSection letter="D" title={isAr ? "تحدي صغير" : "Mini Challenge"} body={isAr ? "حاول قراءة أو كتابة كلمة كورية بسيطة باستخدام حروف اليوم." : "Try to read or write one simple Korean word using today's letters."} />
      <div style={{ height:"14mm", border:`1px dashed ${BD}`, borderRadius:"4px", marginBottom:"6mm" }} />

      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"10px", fontWeight:800, color:T1, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
          {isAr ? "متابعة ولي الأمر / المعلم" : "Parent / Teacher Check"}
        </div>
        {(isAr
          ? ["أكمل تدريب الكتابة","أكمل voice note","أكمل تدريب القراءة","يحتاج تدريباً إضافياً"]
          : ["Completed writing","Completed voice note","Completed reading","Needs more practice"]
        ).map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"11px", color:T2, marginBottom:"3px" }}>
            <span style={{ width:"12px", height:"12px", border:`1.5px solid ${T2}`, borderRadius:"2px", display:"inline-block" }} /> {t}
          </div>
        ))}
      </div>
    </Page>
  );
}

function DailyPractice({ lesson, lang }: { lesson:number; lang: Lang }) {
  const isAr = lang === "ar";
  const days = isAr
    ? ["اكتب حروف اليوم ٥ مرات.","سجّل صوتك وأنت تقرأ الحروف.","اقرأ المقاطع بصوت عالٍ.","امزج بين الحروف القديمة والجديدة.","اختبار سريع: غطِّ الإجابات واختبر نفسك.","اقرأ ٣ كلمات كورية بسيطة.","راجع كل شيء قبل الحصة القادمة."]
    : ["Write today's letters 5 times.","Record your voice reading the letters.","Read the syllables aloud.","Mix old + new letters.","Mini quiz: cover the answers and test yourself.","Read 3 simple Korean words.","Review everything before the next class."];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "تدريب يومي" : "Daily Practice"}>
      <div style={{ marginBottom:"6mm", paddingBottom:"4mm", borderBottom:`1px solid ${BD}` }}>
        <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"2px", marginBottom:"3px" }}>
          {isAr ? `بعد الدرس ${["١","٢","٣","٤","٥"][lesson-1]}` : `After Lesson ${lesson}`}
        </div>
        <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>
          {isAr ? "تدريب يومي — من ٥ إلى ١٠ دقائق" : "Daily Practice — 5 to 10 Minutes"}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:"3mm", marginBottom:"6mm" }}>
        {days.map((task,i) => (
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"3mm", background:SBG }}>
            <div style={{ fontSize:"9px", color:T3, fontWeight:800, letterSpacing:"1px", marginBottom:"3mm" }}>
              {isAr ? `يوم ${["١","٢","٣","٤","٥","٦","٧"][i]}` : `DAY ${i+1}`}
            </div>
            <div style={{ fontSize:"11px", color:T1, lineHeight:1.5, fontWeight:600 }}>{task}</div>
            <div style={{ marginTop:"3mm", width:"14px", height:"14px", border:`1.5px solid ${T2}`, borderRadius:"3px" }} />
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr ? "✓ علّم على المربّع الصغير عند إنهاء مهمة كل يوم." : "✓ Tick the small box when you finish each day's task."}
      </div>
    </Page>
  );
}

function WeeklyCheckpoint({ week, lang }: { week:1|2|3|4; lang: Lang }) {
  const isAr = lang === "ar";
  const data = {
    1: { ar: ["تقرأ ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ","تكتب كل حرف من الذاكرة","تقرأ 가 나 다 라 마 바","ترسل voice note واحدة"], en: ["Read ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ","Write each letter from memory","Read 가 나 다 라 마 바","Send one voice note"] },
    2: { ar: ["تقرأ جميع الـ١٤ حرفاً ساكناً","تميّز بين الحروف المتشابهة","تقرأ مقاطع بسيطة","تكمل تدريب الإملاء"], en: ["Read all 14 consonants","Identify similar letters","Read simple syllables","Complete dictation practice"] },
    3: { ar: ["تقرأ جميع حروف المد الأساسية","تركّب كتل المقاطع","تقرأ كلمات مثل 나، 바나나، 고기","تفهم ㅇ الصامتة"], en: ["Read all basic vowels","Build syllable blocks","Read words like 나, 바나나, 고기","Understand silent ㅇ"] },
    4: { ar: ["تفهم الباتشيم","تقرأ كلمات مثل 한국، 밥، 물، 사랑","تكمل اختبار القراءة النهائي","جاهز للانتقال إلى المستوى ١"], en: ["Understand batchim","Read words like 한국, 밥, 물, 사랑","Complete the final reading test","Ready to move to Level 1"] },
  } as const;
  const items = data[week][isAr ? "ar" : "en"];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "نقطة مراجعة" : "Checkpoint"}>
      <div style={{ marginBottom:"7mm", paddingBottom:"5mm", borderBottom:`2px solid ${T1}` }}>
        <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"3px", marginBottom:"3px" }}>
          {isAr ? `الأسبوع ${["١","٢","٣","٤"][week-1]}` : `Week ${week}`}
        </div>
        <div style={{ fontSize:"28px", fontWeight:900, color:T1 }}>
          {isAr ? "نقطة مراجعة" : "Checkpoint"}
        </div>
        <div style={{ fontSize:"12px", color:T2, marginTop:"2mm" }}>
          {isAr ? "بنهاية هذا الأسبوع، يجب أن يكون الطالب قادراً على:" : "By the end of this week, the student should be able to:"}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"5mm" }}>
        {items.map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", border:`1px solid ${BD}`, borderRadius:"4px", padding:"4mm 5mm", background:SBG }}>
            <span style={{ width:"18px", height:"18px", border:`2px solid ${T1}`, borderRadius:"3px", flexShrink:0 }} />
            <span style={{ fontSize:"13px", color:T1, fontWeight:600, lineHeight:1.5 }}>{t}</span>
          </div>
        ))}
      </div>
    </Page>
  );
}

function VowelsLesson({ part, lang }: { part: 1|2|3; lang: Lang }) {
  const isAr = lang === "ar";
  const data = VOWEL_PARTS[part];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "حروف المد" : "Vowels"}>
      <SHead title={isAr ? data.ar : data.en} subtitle={isAr ? "اقرأ الحرف، استمع للصوت، وانطقه بوضوح" : "Read each vowel, listen to the sound, say it clearly"} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"5mm", marginBottom:"6mm" }}>
        {data.chars.map(ch => (
          <div key={ch} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"5mm", textAlign:"center", background:"#fff" }}>
            <div style={{ fontSize:"72px", fontWeight:900, color:T1, lineHeight:1, marginBottom:"3mm" }}>{ch}</div>
            <div style={{ fontSize:"12px", color:T3, fontWeight:700, letterSpacing:"2px" }}>[ {VOWEL_ROMAN[ch]} ]</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:"10px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
        {isAr ? "اكتب كل حرف ٤ مرات" : "Write each vowel 4 times"}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"3mm", marginBottom:"6mm" }}>
        {Array(8).fill(null).map((_,i) => (
          <div key={i} style={{ border:`1px solid ${BD}`, height:"20mm", borderRadius:"4px", background:"#fff" }} />
        ))}
      </div>
      <InClassExercise lang={lang} />
    </Page>
  );
}

function BatchimLesson({ part, lang }: { part: 1|2|3; lang: Lang }) {
  const isAr = lang === "ar";
  const titles = {
    1: { en:"Batchim Part 1 — What is Batchim?", ar:"الباتشيم — الجزء ١: ما هو الباتشيم؟" },
    2: { en:"Batchim Part 2 — The 7 Final Sounds", ar:"الباتشيم — الجزء ٢: الأصوات السبعة النهائية" },
    3: { en:"Batchim Part 3 — Linking Rule", ar:"الباتشيم — الجزء ٣: قاعدة الوصل" },
  };
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "الباتشيم" : "Batchim"}>
      <SHead title={titles[part][isAr?"ar":"en"]} />
      {part === 1 && (
        <>
          <p style={{ fontSize:"12px", color:T2, lineHeight:1.8, marginBottom:"5mm" }}>
            {isAr
              ? "الباتشيم هو الحرف الساكن الذي يأتي في نهاية المقطع الكوري. مثلاً في كلمة 한 الحرف ㄴ هو الباتشيم. لا تنطقه بقوة — فقط اقفل الصوت بلطف."
              : "Batchim is the final consonant at the bottom of a Korean syllable. In 한, the ㄴ is the batchim. Don't release it loudly — just close the sound gently."}
          </p>
          <div style={{ display:"flex", gap:"10mm", justifyContent:"center", margin:"6mm 0" }}>
            {[{w:"한",r:"han"},{w:"밥",r:"bap"},{w:"물",r:"mul"}].map(({w,r}) => (
              <div key={w} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"60px", fontWeight:900, color:T1, lineHeight:1 }}>{w}</div>
                <div style={{ fontSize:"12px", color:T3, marginTop:"2mm" }}>[{r}]</div>
              </div>
            ))}
          </div>
        </>
      )}
      {part === 2 && (
        <>
          <p style={{ fontSize:"12px", color:T2, lineHeight:1.8, marginBottom:"5mm" }}>
            {isAr ? "كل حروف الباتشيم في الكورية تُنطق بسبعة أصوات نهائية فقط." : "All batchim consonants reduce to just seven final sounds."}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"3mm", marginBottom:"5mm" }}>
            {[
              { sound:"ㄱ", letters:"ㄱ ㅋ ㄲ", ex:"악" },
              { sound:"ㄴ", letters:"ㄴ", ex:"안" },
              { sound:"ㄷ", letters:"ㄷ ㅅ ㅈ ㅊ ㅌ ㅎ", ex:"낫" },
              { sound:"ㄹ", letters:"ㄹ", ex:"알" },
              { sound:"ㅁ", letters:"ㅁ", ex:"감" },
              { sound:"ㅂ", letters:"ㅂ ㅍ", ex:"입" },
              { sound:"ㅇ", letters:"ㅇ", ex:"강" },
            ].map(({sound,letters,ex}) => (
              <div key={sound} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"3mm 4mm", background:"#fff", display:"flex", alignItems:"center", gap:"4mm" }}>
                <div style={{ fontSize:"30px", fontWeight:900, color:T1 }}>{sound}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"11px", color:T2 }}>{letters}</div>
                  <div style={{ fontSize:"10px", color:T3, marginTop:"1mm" }}>{isAr?"مثال":"Example"}: <span style={{ fontWeight:800, color:T1 }}>{ex}</span></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {part === 3 && (
        <>
          <p style={{ fontSize:"12px", color:T2, lineHeight:1.8, marginBottom:"5mm" }}>
            {isAr ? "عندما يأتي بعد الباتشيم حرف مد (ㅇ في بداية المقطع التالي)، ينتقل صوت الباتشيم إلى المقطع الجديد." : "When a batchim is followed by a vowel (ㅇ-starting syllable), the batchim sound carries over to the next syllable."}
          </p>
          <div style={{ display:"flex", gap:"10mm", justifyContent:"center", margin:"6mm 0", flexWrap:"wrap" }}>
            {[{w:"한국어",r:"han-gu-geo",note:isAr?"يُقرأ هكذا":"reads like this"},{w:"음악",r:"eu-mak",note:""}].map(({w,r,note}) => (
              <div key={w} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"50px", fontWeight:900, color:T1, lineHeight:1 }}>{w}</div>
                <div style={{ fontSize:"12px", color:T3, marginTop:"2mm" }}>[{r}]</div>
                {note && <div style={{ fontSize:"10px", color:T3, marginTop:"1mm" }}>{note}</div>}
              </div>
            ))}
          </div>
        </>
      )}
      <InClassExercise lang={lang} />
    </Page>
  );
}

function ReadingPractice({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const words = [
    { k:"한국", r:"han-guk", m: isAr?"كوريا":"Korea" },
    { k:"사랑", r:"sa-rang", m: isAr?"حب":"love" },
    { k:"친구", r:"chin-gu", m: isAr?"صديق":"friend" },
    { k:"고마워", r:"go-ma-wo", m: isAr?"شكراً":"thank you" },
    { k:"바나나", r:"ba-na-na", m: isAr?"موزة":"banana" },
    { k:"물", r:"mul", m: isAr?"ماء":"water" },
    { k:"밥", r:"bap", m: isAr?"رز / أكل":"rice/meal" },
    { k:"안녕", r:"an-nyeong", m: isAr?"مرحباً":"hello" },
  ];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "تدريب القراءة" : "Reading Practice"}>
      <SHead title={isAr ? "تدريب القراءة" : "Reading Practice"} subtitle={isAr ? "اقرأ كل كلمة بصوت عالٍ ثم ترجمها" : "Read each word aloud, then translate it"} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"4mm", marginBottom:"6mm" }}>
        {words.map(w => (
          <div key={w.k} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"4mm 5mm", background:"#fff", direction:"ltr" }}>
            <div style={{ fontSize:"30px", fontWeight:900, color:T1, lineHeight:1 }}>{w.k}</div>
            <div style={{ fontSize:"11px", color:T3, marginTop:"2mm" }}>[{w.r}]</div>
            <div style={{ fontSize:"11px", color:T2, marginTop:"1mm", direction:isAr?"rtl":"ltr" }}>— {w.m}</div>
          </div>
        ))}
      </div>
      <InClassExercise lang={lang} />
    </Page>
  );
}

function FinalTest({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "الاختبار النهائي" : "Final Test"}>
      <div style={{ marginBottom:"7mm", paddingBottom:"5mm", borderBottom:`2px solid ${T1}` }}>
        <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"3px", marginBottom:"3px" }}>
          {isAr ? "نهاية الكورس" : "End of Course"}
        </div>
        <div style={{ fontSize:"28px", fontWeight:900, color:T1 }}>
          {isAr ? "اختبار الهانغول النهائي" : "Final Hangul Test"}
        </div>
      </div>

      <HwSection letter="A" title={isAr ? "اقرأ بصوت عالٍ" : "Read aloud"} body="" />
      <div style={{ fontSize:"24px", fontWeight:900, color:T1, marginBottom:"6mm", letterSpacing:"4px", direction:"ltr" }}>가 나 다 라 마 바 사 자 차 카 타 파 하</div>

      <HwSection letter="B" title={isAr ? "اقرأ الكلمات" : "Read words"} body="" />
      <div style={{ display:"flex", gap:"4mm", flexWrap:"wrap", marginBottom:"6mm", direction:"ltr" }}>
        {["한국","사랑","친구","고마워","바나나","물","밥"].map(w => (
          <div key={w} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"3mm 5mm", fontSize:"22px", fontWeight:900, color:T1, background:"#fff" }}>{w}</div>
        ))}
      </div>

      <HwSection letter="C" title={isAr ? "اكتب المقطع الكوري" : "Write the Korean syllable"} body="" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"3mm", marginBottom:"6mm" }}>
        {["ba","na","go","ha","sa"].map(s => (
          <div key={s} style={{ border:`1px solid ${BD}`, borderRadius:"4px", padding:"3mm", textAlign:"center", background:SBG }}>
            <div style={{ fontSize:"13px", color:T3, fontWeight:700, marginBottom:"2mm" }}>{s} =</div>
            <div style={{ height:"14mm", border:`1px dashed ${BD}`, borderRadius:"3px", background:"#fff" }} />
          </div>
        ))}
      </div>

      <HwSection letter="D" title={isAr ? "إملاء من المعلم" : "Teacher Dictation"} body={isAr ? "ينطق المعلم ٥ أصوات أو مقاطع، ويكتبها الطالب." : "Teacher says 5 sounds/syllables, student writes them."} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"3mm", marginBottom:"6mm" }}>
        {[1,2,3,4,5].map(n => (
          <div key={n} style={{ border:`1px solid ${BD}`, height:"16mm", borderRadius:"4px", background:"#fff", position:"relative" }}>
            <span style={{ position:"absolute", top:"2px", insetInlineStart:"4px", fontSize:"9px", color:T3, fontWeight:700 }}>{n}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`1px solid ${BD}`, paddingTop:"4mm" }}>
        <div style={{ fontSize:"10px", fontWeight:800, color:T1, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
          {isAr ? "النتيجة النهائية" : "Final Result"}
        </div>
        {(isAr
          ? ["ممتاز — جاهز للمستوى ١","جيد — يحتاج مراجعة بسيطة","يحتاج إلى تدريب إضافي على الهانغول"]
          : ["Excellent — ready for Level 1","Good — needs light review","Needs more Hangul practice"]
        ).map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"12px", color:T2, marginBottom:"3px" }}>
            <span style={{ width:"14px", height:"14px", border:`1.5px solid ${T2}`, borderRadius:"3px", display:"inline-block" }} /> {t}
          </div>
        ))}
      </div>
    </Page>
  );
}

function Certificate({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "شهادة" : "Certificate"}>
      <div style={{ border:`3px solid ${GOLD}`, borderRadius:"6px", padding:"18mm 12mm", textAlign:"center", background:"#fffdf3", marginTop:"15mm" }}>
        <div style={{ fontSize:"11px", color:T3, fontWeight:800, letterSpacing:"4px", textTransform:"uppercase", marginBottom:"5mm" }}>
          {isAr ? "أكاديمية كلوفرز" : "Klovers Korean Academy"}
        </div>
        <div style={{ fontSize:"36px", fontWeight:900, color:GOLD, lineHeight:1.2, marginBottom:"5mm" }}>
          {isAr ? "مبروك!" : "Congratulations!"}
        </div>
        <div style={{ fontSize:"22px", fontWeight:800, color:T1, marginBottom:"8mm" }}>
          {isAr ? "أنهيت مستوى الهانغول" : "Hangul Level Complete"}
        </div>
        <div style={{ width:"60px", height:"2px", background:GOLD, margin:"0 auto 8mm" }} />
        <div style={{ fontSize:"13px", color:T2, lineHeight:1.8, maxWidth:"140mm", margin:"0 auto" }}>
          {isAr
            ? "أصبحت قادراً على قراءة الحروف الكورية الأساسية والمقاطع والكلمات المبدئية. أنت الآن جاهز للبدء في كورس الكورية المستوى ١ مع كلوفرز."
            : "You can now read basic Korean letters, syllables, and beginner words. You are ready to start Korean Level 1 with Klovers."}
        </div>
        <div style={{ marginTop:"15mm", display:"flex", justifyContent:"space-between", gap:"10mm" }}>
          <div style={{ flex:1 }}>
            <div style={{ borderTop:`1px solid ${T2}`, paddingTop:"2mm", fontSize:"10px", color:T3, letterSpacing:"1px", textTransform:"uppercase" }}>
              {isAr ? "اسم الطالب" : "Student Name"}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ borderTop:`1px solid ${T2}`, paddingTop:"2mm", fontSize:"10px", color:T3, letterSpacing:"1px", textTransform:"uppercase" }}>
              {isAr ? "توقيع المعلم" : "Teacher Signature"}
            </div>
          </div>
        </div>
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
            <CoursePlan lang="ar" />
            <HistoryAr />
            <SejongAr />
            <CultureAr />
            <CourseAr />
            <WelcomeAr />
            {/* WEEK 1 — Consonants Part 1 */}
            <ConsonantsAr slice={[0,7]} page={1} />
            <Homework lesson={1} slice={[0,7]} lang="ar" />
            <DailyPractice lesson={1} lang="ar" />
            <WeeklyCheckpoint week={1} lang="ar" />
            {/* WEEK 2 — Consonants Part 2 */}
            <ConsonantsAr slice={[7,14]} page={2} />
            <Homework lesson={2} slice={[7,14]} lang="ar" />
            <DailyPractice lesson={2} lang="ar" />
            <WeeklyCheckpoint week={2} lang="ar" />
            {/* WEEK 3 — Vowels + Syllables */}
            <VowelsLesson part={1} lang="ar" />
            <VowelsLesson part={2} lang="ar" />
            <VowelsLesson part={3} lang="ar" />
            <SyllableAr />
            <Homework lesson={3} slice={[0,7]} lang="ar" />
            <DailyPractice lesson={3} lang="ar" />
            <WeeklyCheckpoint week={3} lang="ar" />
            {/* WEEK 4 — Batchim + Reading */}
            <BatchimLesson part={1} lang="ar" />
            <BatchimLesson part={2} lang="ar" />
            <BatchimLesson part={3} lang="ar" />
            <ReadingPractice lang="ar" />
            <KdramaPageAr slice={[0,10]} page={1} />
            <KdramaPageAr slice={[10,20]} page={2} />
            <FinalTest lang="ar" />
            <WeeklyCheckpoint week={4} lang="ar" />
            <Certificate lang="ar" />
            {/* ADVANCED / BONUS */}
            <AspiratedAr />
            <CompoundVowelsAr />
            <DoubleBatchimAr />
            {/* APPENDIX */}
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
            <CoursePlan lang="en" />
            <HistoryEn />
            <SejongEn />
            <CultureEn />
            <CourseEn />
            <WelcomeEn />
            {/* WEEK 1 — Consonants Part 1 */}
            <ConsonantsEn slice={[0,7]} page={1} />
            <Homework lesson={1} slice={[0,7]} lang="en" />
            <DailyPractice lesson={1} lang="en" />
            <WeeklyCheckpoint week={1} lang="en" />
            {/* WEEK 2 — Consonants Part 2 */}
            <ConsonantsEn slice={[7,14]} page={2} />
            <Homework lesson={2} slice={[7,14]} lang="en" />
            <DailyPractice lesson={2} lang="en" />
            <WeeklyCheckpoint week={2} lang="en" />
            {/* WEEK 3 — Vowels + Syllables */}
            <VowelsLesson part={1} lang="en" />
            <VowelsLesson part={2} lang="en" />
            <VowelsLesson part={3} lang="en" />
            <SyllableEn />
            <Homework lesson={3} slice={[0,7]} lang="en" />
            <DailyPractice lesson={3} lang="en" />
            <WeeklyCheckpoint week={3} lang="en" />
            {/* WEEK 4 — Batchim + Reading */}
            <BatchimLesson part={1} lang="en" />
            <BatchimLesson part={2} lang="en" />
            <BatchimLesson part={3} lang="en" />
            <ReadingPractice lang="en" />
            <KdramaPageEn slice={[0,10]} page={1} />
            <KdramaPageEn slice={[10,20]} page={2} />
            <FinalTest lang="en" />
            <WeeklyCheckpoint week={4} lang="en" />
            <Certificate lang="en" />
            {/* ADVANCED / BONUS */}
            <AspiratedEn />
            <CompoundVowelsEn />
            <DoubleBatchimEn />
            {/* APPENDIX */}
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
