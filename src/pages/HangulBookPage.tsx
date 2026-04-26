import { useState, useEffect, Fragment } from "react";
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
    <img src="/book-photos/cover.jpg"
      alt="Gyeongbokgung Palace, Seoul"
      style={{ width:"100%", height:`${h}px`, objectFit:"cover", display:"block", borderRadius:`${radius}px` }}
      loading="lazy"
    />
  );
}

/* ── Scene: Classroom — "Study Time!" ── */
function SceneClassroom({ h = 280, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <img src="/book-photos/classroom.jpg"
      alt="Hunminjeongeum — original Hangul manuscript"
      style={{ width:"100%", height:`${h}px`, objectFit:"cover", display:"block", borderRadius:`${radius}px` }}
      loading="lazy"
    />
  );
}
/* ── Scene: Street — "Seoul at Night!" ── */
function SceneStreet({ h = 220, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <img src="/book-photos/street.jpg"
      alt="Bukchon Hanok Village street, Seoul"
      style={{ width:"100%", height:`${h}px`, objectFit:"cover", display:"block", borderRadius:`${radius}px` }}
      loading="lazy"
    />
  );
}
/* ── Scene: Concert — "K-Pop Night!" ── */
function SceneConcert({ h = 220, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <img src="/book-photos/concert.jpg"
      alt="K-pop live concert stage"
      style={{ width:"100%", height:`${h}px`, objectFit:"cover", display:"block", borderRadius:`${radius}px` }}
      loading="lazy"
    />
  );
}
/* ── Scene: Teacher — "Junho Teaches 가나다!" ── */
function SceneTeacher({ h = 260, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <img src="/book-photos/teacher.jpg"
      alt="King Sejong statue, Gwanghwamun Square"
      style={{ width:"100%", height:`${h}px`, objectFit:"cover", display:"block", borderRadius:`${radius}px` }}
      loading="lazy"
    />
  );
}
/* ── Scene: Food — "Let's Eat Korean Food!" ── */
function SceneFood({ h = 200, radius = 0 }: { h?: number; radius?: number }) {
  return (
    <img src="/book-photos/food.jpg"
      alt="Bibimbap with Korean side dishes"
      style={{ width:"100%", height:`${h}px`, objectFit:"cover", display:"block", borderRadius:`${radius}px` }}
      loading="lazy"
    />
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
    en:{ name:"Digeut", sound:"Like 'd' in door; 't' at end", mnemonic:"An open DOOR frame viewed from above", eq:"d / t", ex:[{k:"다리",r:"da-ri",m:"leg / bridge"},{k:"도시",r:"do-si",m:"city"}] },
    ar:{ name:"ديغوت", sound:"مثل 'د' في دار / 'ت' في النهاية", mnemonic:"إطار باب مفتوح ينظر إليه من الأعلى", eq:"د / ت", ex:[{k:"다리",r:"دا-ري",m:"ساق / جسر"},{k:"도시",r:"دو-سي",m:"مدينة"}] },
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
    en:{ name:"Siot", sound:"Like 's' in sun", mnemonic:"A mountain PEAK — the Sun shines from the top", eq:"s", ex:[{k:"사과",r:"sa-gwa",m:"apple"},{k:"스타",r:"seu-ta",m:"star"}] },
    ar:{ name:"سييوت", sound:"مثل 'س' في سماء", mnemonic:"قمة جبل — الشمس تسطع من الأعلى", eq:"س", ex:[{k:"사과",r:"سا-غوا",m:"تفاح"},{k:"스타",r:"سو-تا",m:"نجم"}] },
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
    en:{ name:"Jieut", sound:"Like 'j' in juice", mnemonic:"A star shape with a hat — JUMPING star", eq:"j", ex:[{k:"지도",r:"ji-do",m:"map"},{k:"좋아요",r:"jo-a-yo",m:"I like it"}] },
    ar:{ name:"جييوت", sound:"مثل 'ج' في جميل", mnemonic:"نجمة بقبعة — نجمة قافزة", eq:"ج", ex:[{k:"지도",r:"جي-دو",m:"خريطة"},{k:"좋아요",r:"جو-أ-يو",m:"أحبه"}] },
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
    en:{ name:"Kieuk", sound:"Aspirated 'k' — ㄱ with a strong puff of air", mnemonic:"ㄱ with an extra KICK bar — harder K", eq:"k (aspirated)", ex:[{k:"카메라",r:"ka-me-ra",m:"camera"},{k:"코",r:"ko",m:"nose"}] },
    ar:{ name:"كييوك", sound:"'ك' مع نفخة هواء قوية — ㄱ أقوى", mnemonic:"ㄱ مع خط إضافي — 'ك' أشد وأقوى", eq:"ك (مع نفخة)", ex:[{k:"카메라",r:"كا-مي-را",m:"كاميرا"},{k:"코",r:"كو",m:"أنف"}] },
  },
  {
    char:"ㅌ", roman:"t", emoji:"🌬️",
    strokes:["① →","② →","③ ↓","④ →"],
    arDialect:"زي 'ت' في تفاح — بس مع نفخة قوية من الفم",
    en:{ name:"Tieut", sound:"Aspirated 't' — ㄷ with a strong puff of air", mnemonic:"ㄷ with a middle BAR — a door frame reinforced", eq:"t (aspirated)", ex:[{k:"토마토",r:"to-ma-to",m:"tomato"},{k:"토끼",r:"to-kki",m:"rabbit"}] },
    ar:{ name:"تييوت", sound:"'ت' مع نفخة هواء قوية — ㄷ أقوى", mnemonic:"ㄷ مع خط وسطي — إطار باب مُعزَّز", eq:"ت (مع نفخة)", ex:[{k:"토마토",r:"تو-ما-تو",m:"طماطم"},{k:"토끼",r:"تو-كي",m:"أرنب"}] },
  },
  {
    char:"ㅍ", roman:"p", emoji:"🦅",
    strokes:["① ↓","② ↓","③ →","④ →","⑤ →"],
    arDialect:"زي 'ب' في بابا — بس مع نفخة قوية (زي P إنجليزي)",
    en:{ name:"Pieup", sound:"Aspirated 'p' — ㅂ with a strong puff of air", mnemonic:"Two arms wide open — PUFFING with energy", eq:"p (aspirated)", ex:[{k:"피자",r:"pi-ja",m:"pizza"},{k:"편의점",r:"pyeo-ni-jeom",m:"convenience store"}] },
    ar:{ name:"بييوب الكبير", sound:"'ب' مع نفخة هواء قوية — ㅂ أقوى", mnemonic:"ذراعان مفتوحتان على مصراعيهما — 'ب' مع قوة", eq:"ب (مع نفخة)", ex:[{k:"피자",r:"بي-جا",m:"بيتزا"},{k:"편의점",r:"بيو-ني-جوم",m:"دكان صغير"}] },
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
    en:{ name:"A", sound:"Like 'a' in father — wide open mouth", mnemonic:"Vertical line + branch pointing RIGHT → open 'AH'", ex:[{k:"아기",r:"a-gi",m:"baby"},{k:"바나나",r:"ba-na-na",m:"banana"}] },
    ar:{ name:"آ", sound:"مثل 'آ' — افتح فمك على اتساعه", mnemonic:"خط عمودي وفرع يشير لليمين → 'آ' مفتوح", ex:[{k:"아기",r:"أ-غي",m:"طفل رضيع"},{k:"바나나",r:"با-نا-نا",m:"موز"}] },
  },
  {
    char:"ㅓ", roman:"eo", emoji:"😕",
    en:{ name:"EO", sound:"Like 'u' in but — pulled back 'uh'", mnemonic:"Vertical line + branch pointing LEFT → pulled back 'UH'", ex:[{k:"어머니",r:"eo-meo-ni",m:"mother"},{k:"서울",r:"seo-ul",m:"Seoul"}] },
    ar:{ name:"أُ (eo)", sound:"مثل 'أُ' — ممدودة نحو الخلف", mnemonic:"خط عمودي وفرع يشير لليسار → 'أُ' للخلف", ex:[{k:"어머니",r:"أو-مو-ني",m:"أم"},{k:"서울",r:"سو-أول",m:"سيول"}] },
  },
  {
    char:"ㅗ", roman:"o", emoji:"⬆️",
    en:{ name:"O", sound:"Like 'o' in go — round your lips", mnemonic:"Horizontal line + branch pointing UP → round 'OH'", ex:[{k:"오이",r:"o-i",m:"cucumber"},{k:"고마워",r:"go-ma-wo",m:"thank you (casual)"}] },
    ar:{ name:"أو", sound:"مثل 'أو' — دوّر شفتيك", mnemonic:"خط أفقي وفرع لأعلى → 'أو' مستدير", ex:[{k:"오이",r:"أو-إي",m:"خيار"},{k:"고마워",r:"غو-ما-وو",m:"شكراً (غير رسمي)"}] },
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
    en:{ name:"I", sound:"Like 'ee' in see — tall and clear", mnemonic:"A single tall vertical line — stands like 'EE'", ex:[{k:"이",r:"i",m:"tooth / this"},{k:"기다려",r:"gi-da-ryeo",m:"wait for me"}] },
    ar:{ name:"إي", sound:"مثل 'إي' في ييه — طويل وواضح", mnemonic:"خط عمودي وحيد — يقف منتصباً مثل 'إي'", ex:[{k:"이",r:"إي",m:"سن / هذا"},{k:"기다려",r:"كي-دا-ريو",m:"انتظرني"}] },
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
function Page({ children, dir = "ltr", chapter, bgColor = "#FFF5F5" }: { children: React.ReactNode; dir?: "ltr" | "rtl"; chapter?: string; bgColor?: string }) {
  const isRtl = dir === "rtl";
  return (
    <div
      className="book-page"
      style={{
        width:"210mm", minHeight:"297mm", padding:"13mm 16mm 12mm",
        boxSizing:"border-box", background:bgColor,
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
                  <strong style={{ color:T1 }}>{ex.k}</strong>
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

function KidsCover({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  const decoChars = ["ㄱ","ㅏ","ㄴ","ㅓ","ㄷ","ㅗ","ㄹ","ㅜ","ㅁ","ㅡ","ㅂ","ㅣ","ㅅ","ㅎ"];
  const features = isAr
    ? [
        { icon:"📖", label:"٧ دروس متدرجة" },
        { icon:"✍️", label:"تدريبات كتابة TOPIK" },
        { icon:"🎬", label:"كلمات مسلسلات + كيبوب" },
        { icon:"🇰🇷", label:"عربي ⇄ كوري" },
      ]
    : [
        { icon:"📖", label:"7 Structured Lessons" },
        { icon:"✍️", label:"TOPIK-style Writing" },
        { icon:"🎬", label:"K-Drama + K-Pop Vocab" },
        { icon:"🇰🇷", label:"Bilingual AR ⇄ EN" },
      ];
  const title = isAr ? "اقرأ الكورية" : "Read Korean";
  const titleSub = isAr ? "في ٧ أيام" : "in 7 Days";
  const subtitle = isAr
    ? "دليل المبتدئين لتعلّم الهانغول من الصفر — مستوحى من المسلسلات والكيبوب"
    : "The beginner's guide to Hangul — inspired by K-drama and K-pop";
  const levelLabel = isAr ? "المستوى ١ · مبتدئ" : "Level 1 · Beginner";
  const academy = isAr ? "أكاديمية كلوفرز للغة الكورية" : "Klovers Korean Academy";
  const bookOf = isAr ? "كتاب رقم ١" : "Book One";

  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm",
      background:`linear-gradient(160deg, #FFE5E5 0%, ${KIDS_PINK} 50%, #FFF1E0 100%)`,
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      direction: isAr ? "rtl" : "ltr",
      fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      padding:"14mm 14mm",
    }}>
      {/* Decorative scattered hangul characters */}
      {decoChars.map((ch, i) => {
        const positions = [
          { top:"6%",  left:"4%",  size:30, op:0.10 },
          { top:"3%",  left:"22%", size:22, op:0.12 },
          { top:"8%",  left:"82%", size:28, op:0.10 },
          { top:"14%", left:"94%", size:20, op:0.12 },
          { top:"42%", left:"2%",  size:26, op:0.10 },
          { top:"50%", left:"96%", size:24, op:0.10 },
          { top:"68%", left:"6%",  size:22, op:0.12 },
          { top:"75%", left:"92%", size:30, op:0.10 },
          { top:"88%", left:"14%", size:24, op:0.12 },
          { top:"92%", left:"78%", size:26, op:0.10 },
          { top:"22%", left:"8%",  size:20, op:0.12 },
          { top:"30%", left:"90%", size:18, op:0.12 },
          { top:"58%", left:"3%",  size:18, op:0.12 },
          { top:"82%", left:"50%", size:18, op:0.10 },
        ];
        const p = positions[i % positions.length];
        return (
          <div key={i} style={{
            position:"absolute", top:p.top, left:p.left,
            fontSize:`${p.size}px`, fontWeight:900,
            color:KIDS_RED, opacity:p.op, pointerEvents:"none",
          }}>{ch}</div>
        );
      })}

      {/* Top brand bar with real Klovers logo */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:"6mm", direction: isAr ? "rtl" : "ltr",
      }}>
        <div style={{
          background:"#fff", borderRadius:"22px",
          padding:"4px 14px 4px 4px", display:"flex", alignItems:"center", gap:"8px",
          border:`2px solid ${KIDS_RED}`, boxShadow:"0 3px 0 rgba(0,0,0,0.05)",
        }}>
          <img src="/klovers-logo.jpg" alt="Klovers"
            style={{ width:"34px", height:"34px", borderRadius:"50%", objectFit:"cover", display:"block" }} />
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1 }}>
            <span style={{ fontSize:"13px", fontWeight:900, color:KIDS_RED, letterSpacing:"2px" }}>KLOVERS</span>
            <span style={{ fontSize:"9px", fontWeight:700, color:"#888", letterSpacing:"1.5px", marginTop:"2px" }}>클로버스 · KOREAN</span>
          </div>
        </div>
        <div style={{
          background:"#fff", border:`2px solid ${GOLD}`, color:GOLD,
          fontSize:"10px", fontWeight:900, padding:"5px 12px",
          borderRadius:"22px", letterSpacing:"1.5px",
        }}>{levelLabel}</div>
      </div>

      {/* Hero hangul + title */}
      <div style={{
        background:"#fff", borderRadius:"24px",
        border:`3px dashed ${KIDS_RED}`,
        padding:"16mm 8mm 10mm",
        textAlign:"center",
        boxShadow:"0 8px 0 rgba(0,0,0,0.04)",
        marginBottom:"6mm",
        position:"relative",
      }}>
        {/* Korean flag corner */}
        <div style={{
          position:"absolute", top:"-12px", insetInlineEnd:"20px",
          background:"#fff", border:`2px solid ${KIDS_RED}`,
          padding:"3px 10px", borderRadius:"14px",
          fontSize:"15px",
        }}>🇰🇷</div>

        {/* Klovers mascot peeking from corner */}
        <img src="/klovers-mascot.png" alt=""
          style={{ position:"absolute", top:"-18px", insetInlineStart:"18px",
            width:"56px", height:"56px", objectFit:"contain",
            filter:"drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }} />

        <div style={{
          fontSize:"150px", fontWeight:900, lineHeight:0.9,
          color:KIDS_RED, letterSpacing:"-4px",
          textShadow:`6px 6px 0 ${GOLD}, 12px 12px 0 rgba(212,175,55,0.2)`,
          marginBottom:"8mm",
        }}>한글</div>

        <div style={{
          fontSize:"36px", fontWeight:900, color:"#222", lineHeight:1.1,
          marginBottom:"3mm",
        }}>{title}</div>
        <div style={{
          fontSize:"42px", fontWeight:900, color:KIDS_RED, lineHeight:1,
          marginBottom:"6mm",
        }}>{titleSub}</div>

        <div style={{
          fontSize:"13px", color:"#444", fontWeight:600,
          lineHeight:1.6, maxWidth:"140mm", margin:"0 auto",
        }}>{subtitle}</div>
      </div>

      {/* Character + features */}
      <div style={{
        display:"flex", gap:"8mm", alignItems:"center",
        marginBottom:"6mm", direction: isAr ? "rtl" : "ltr",
      }}>
        <img src="/characters/hanbok-pair.jpg" alt=""
          style={{ width:"75mm", height:"auto", borderRadius:"14px",
            boxShadow:"0 6px 0 rgba(0,0,0,0.06)" }} />
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background:"#fff", border:`2px solid ${KIDS_GREEN}`,
              borderRadius:"12px", padding:"8px 10px",
              display:"flex", alignItems:"center", gap:"8px",
              boxShadow:"0 3px 0 rgba(0,0,0,0.04)",
            }}>
              <span style={{ fontSize:"22px" }}>{f.icon}</span>
              <span style={{ fontSize:"11px", fontWeight:800, color:"#222", lineHeight:1.3 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom strip: book number + brand + QR */}
      <div style={{
        background:"#fff", border:`2px solid ${KIDS_BLUE}`,
        borderRadius:"14px", padding:"8px 14px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        direction: isAr ? "rtl" : "ltr",
      }}>
        <div>
          <div style={{ fontSize:"10px", color:KIDS_BLUE, fontWeight:900, letterSpacing:"2px" }}>{bookOf}</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#222" }}>{academy}</div>
          <div style={{ fontSize:"10px", color:"#666", fontWeight:600, marginTop:"2px" }}>kloversegy.com</div>
        </div>
        <div style={{
          width:"40px", height:"40px", background:"#fff",
          border:`2px solid ${KIDS_RED}`, borderRadius:"6px",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"22px",
        }}>📱</div>
      </div>
    </div>
  );
}

function CoverAr() { return <KidsCover lang="ar" />; }

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
    { n:"١",  title:"خطة الكورس داخل الفصل — ٤ أسابيع",          icon:"🗓️", page:3,  new:true },
    { n:"٢",  title:"كيفية استخدام هذا الكتاب",                    icon:"📖", page:4,  new:true },
    { n:"٣",  title:"تاريخ اللغة الكورية",                         icon:"📜", page:5 },
    { n:"٤",  title:"الملك سيجونغ العظيم",                         icon:"👑", page:6 },
    { n:"٥",  title:"الثقافة الكورية",                             icon:"🌸", page:7 },
    { n:"٦",  title:"مرحباً بعالم الهانغول",                       icon:"🎉", page:8 },
    { n:"٧",  title:"الدرس ١ — ㄱ ㄴ ㄷ + ㅏ ㅓ",                  icon:"🔤", page:9 },
    { n:"٨",  title:"الدرس ٢ — ㄹ ㅁ ㅂ + ㅗ ㅜ",                  icon:"🔤", page:12 },
    { n:"٩",  title:"الدرس ٣ — ㅅ ㅇ ㅈ + ㅡ ㅣ",                  icon:"🔤", page:15 },
    { n:"١٠", title:"الدرس ٤ — ㅊ ㅋ ㅌ",                          icon:"🔤", page:18 },
    { n:"١١", title:"الدرس ٥ — ㅍ ㅎ",                             icon:"🔤", page:21 },
    { n:"١٢", title:"الدرس ٦ — مراجعة شاملة + قراءة + إملاء",    icon:"✅", page:24 },
    { n:"١٣", title:"الدرس ٧ — حروف المد المُركَّبة",              icon:"🔗", page:26, new:true },
    { n:"١٤", title:"الدرس ٨ — الباتشيم (الحرف النهائي)",         icon:"⬇️", page:28 },
    { n:"١٥", title:"أساسيات المسلسلات الكورية",                   icon:"🎬", page:30 },
    { n:"١٦", title:"الاختبار النهائي",                            icon:"🏆", page:32 },
    { n:"١٧", title:"شهادة الإتمام",                               icon:"🎓", page:33 },
    { n:"١٨", title:"تمارين تطبيقية ومفتاح الإجابات",             icon:"✏️", page:34 },
    { n:"١٩", title:"ملحق المفردات — أكثر ٥٠ كلمة",              icon:"📚", page:36 },
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
        اقرأ كل درس بالترتيب — كل درس يبني على السابق. في ٤ أسابيع ستقرأ الكورية بثقة كاملة!
      </p>
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
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════
   KIDS-STYLE TEXTBOOK COMPONENTS
   Soft pastel cards, character + speech bubble, numbered pill rows.
   Used to give the book the look of a Korean children's workbook.
   ════════════════════════════════════════════════════════════ */
const KIDS_PINK = "#FFF5F5";
const KIDS_RED  = "#E94B4B";
const KIDS_GREEN= "#3FB984";
const KIDS_BLUE = "#4D9EE8";
const KIDS_YELL = "#FFC93C";
const KIDS_PURPLE="#9B6BC9";
const KIDS_ORANGE="#FF8C42";

function CharImg({ size = 110, style }: { size?: number; style?: React.CSSProperties }) {
  return <img src="/characters/hanbok-pair.jpg" alt="" style={{ width:size, height:"auto", borderRadius:"8px", ...style }} />;
}

function SpeechBubble({ children, dir="rtl", color=KIDS_RED }:{ children:React.ReactNode; dir?:"rtl"|"ltr"; color?:string }) {
  return (
    <div style={{
      position:"relative", background:"#fff", border:`2px solid ${color}`,
      borderRadius:"14px", padding:"7px 12px", fontSize:"11px", fontWeight:700,
      color:"#333", lineHeight:1.5, direction:dir, maxWidth:"180px",
    }}>
      {children}
    </div>
  );
}

function SectionBadge({ icon, label, color=KIDS_GREEN, dir="rtl" }:{ icon:string; label:string; color?:string; dir?:"rtl"|"ltr" }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:"6px", direction:dir,
      background:color, color:"#fff", padding:"4px 14px",
      borderRadius:"22px", fontSize:"13px", fontWeight:900,
      boxShadow:"0 2px 0 rgba(0,0,0,0.08)",
    }}>
      <span style={{ fontSize:"15px" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function KidsPanel({ children, color=KIDS_RED, bg=KIDS_PINK, dir="rtl" }:{ children:React.ReactNode; color?:string; bg?:string; dir?:"rtl"|"ltr" }) {
  return (
    <div style={{
      border:`2px dashed ${color}`, background:bg,
      borderRadius:"14px", padding:"12px 14px",
      direction:dir, marginBottom:"6mm",
    }}>
      {children}
    </div>
  );
}

function NumCircle({ n, color=KIDS_RED }:{ n:number|string; color?:string }) {
  return (
    <div style={{
      width:"26px", height:"26px", borderRadius:"50%",
      background:color, color:"#fff", display:"flex",
      alignItems:"center", justifyContent:"center",
      fontSize:"13px", fontWeight:900, flexShrink:0,
      boxShadow:"0 2px 0 rgba(0,0,0,0.12)",
    }}>{n}</div>
  );
}

function Pill({ children, bg, color="#222" }:{ children:React.ReactNode; bg:string; color?:string }) {
  return (
    <span style={{
      background:bg, color, padding:"3px 12px",
      borderRadius:"8px", fontSize:"15px", fontWeight:900,
      direction:"ltr", display:"inline-block", letterSpacing:"1px",
    }}>{children}</span>
  );
}

function RuleRow({ n, ncolor, pillBg, pillChars, arrow, arabicRule, exampleK, exampleR, exRColor=KIDS_GREEN }:{
  n:number; ncolor:string; pillBg:string; pillChars:string;
  arrow?:string; arabicRule:string; exampleK:string; exampleR:string; exRColor?:string;
}) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"30px 1.1fr 18px 1.4fr 1fr",
      alignItems:"center", gap:"8px", padding:"6px 4px",
      direction:"rtl",
    }}>
      <NumCircle n={n} color={ncolor} />
      <div style={{ direction:"ltr", textAlign:"center" }}><Pill bg={pillBg}>{pillChars}</Pill></div>
      <div style={{ color:KIDS_RED, fontSize:"18px", fontWeight:900, textAlign:"center" }}>{arrow ?? "←"}</div>
      <div style={{ fontSize:"12px", color:"#222", fontWeight:700 }}>{arabicRule}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:"6px", direction:"ltr", justifyContent:"flex-start" }}>
        <span style={{ fontSize:"22px", fontWeight:900, color:"#222" }}>{exampleK}</span>
        <span style={{ fontSize:"11px", fontWeight:700, color:exRColor }}>({exampleR})</span>
      </div>
    </div>
  );
}

function KidsPage({ children, dir="rtl", chapter }:{ children:React.ReactNode; dir?:"rtl"|"ltr"; chapter?:string }) {
  return (
    <Page dir={dir} chapter={chapter} bgColor={KIDS_PINK}>
      {children}
    </Page>
  );
}

/* ── Batchim (Single) AR — kids-style rebuild ── */
function BatchimAr() {
  const FINAL7: { n:number; ncolor:string; pillBg:string; pillChars:string; rule:string; exK:string; exR:string }[] = [
    { n:1, ncolor:KIDS_RED,    pillBg:"#FFE2C0", pillChars:"ㄱ / ㄲ / ㅋ", rule:"تُنطق: ك (k)", exK:"박", exR:"bak" },
    { n:2, ncolor:KIDS_GREEN,  pillBg:"#D7EFD0", pillChars:"ㄴ",            rule:"تُنطق: ن (n)", exK:"산", exR:"san" },
    { n:3, ncolor:KIDS_RED,    pillBg:"#FFD7D7", pillChars:"ㄷ / ㅅ / ㅆ / ㅈ / ㅊ / ㅌ / ㅎ", rule:"تُنطق: ت (t) مقطوعة", exK:"옷", exR:"ot" },
    { n:4, ncolor:KIDS_BLUE,   pillBg:"#D6E9F8", pillChars:"ㄹ",            rule:"تُنطق: ل (l)", exK:"달", exR:"dal" },
    { n:5, ncolor:KIDS_PURPLE, pillBg:"#E5D8F0", pillChars:"ㅁ",            rule:"تُنطق: م (m)", exK:"밤", exR:"bam" },
    { n:6, ncolor:KIDS_PURPLE, pillBg:"#FAD9E8", pillChars:"ㅂ / ㅍ",       rule:"تُنطق: ب (p)", exK:"밥", exR:"bap" },
    { n:7, ncolor:KIDS_RED,    pillBg:"#FBD9D9", pillChars:"ㅇ",            rule:"تُنطق: نغ (ng) (غنة)", exK:"강", exR:"gang" },
  ];

  return (
    <Page dir="rtl" bgColor={KIDS_PINK}>
      {/* Title bar */}
      <div style={{
        background:KIDS_RED, color:"#fff", borderRadius:"30px",
        padding:"10px 20px", display:"flex", justifyContent:"center",
        alignItems:"center", gap:"10px", marginBottom:"6mm",
        boxShadow:"0 4px 0 rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize:"22px", fontWeight:900 }}>الباتشيم في اللغة الكورية</div>
        <div style={{ fontSize:"18px", fontWeight:900, opacity:0.95 }}>(받침)</div>
        <div style={{ marginInlineStart:"auto", display:"flex", flexDirection:"column", lineHeight:1 }}>
          <span style={{ background:"#fff", color:KIDS_RED, fontSize:"10px", fontWeight:900, padding:"3px 8px", borderRadius:"4px" }}>🇰🇷</span>
        </div>
      </div>

      {/* Definition panel + character */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"6mm", alignItems:"flex-start" }}>
        <KidsPanel color={KIDS_GREEN} bg="#FFF8F1">
          <div style={{ marginBottom:"6px" }}>
            <SectionBadge icon="📗" label="تعريف" color={KIDS_GREEN} />
          </div>
          <p style={{ fontSize:"12px", color:"#222", lineHeight:1.8, margin:0, fontWeight:600 }}>
            الباتشيم (<span style={{ color:KIDS_RED, fontWeight:900 }}>받침</span>) هو الحرف الساكن
            الذي يأتي في نهاية المقطع الكوري، ويؤثّر بشكل كبير على النطق.
          </p>
        </KidsPanel>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, gap:"4px", width:"170px" }}>
          <SpeechBubble color={KIDS_RED}>
            الباتشيم يؤثّر على النطق والقواعد!
          </SpeechBubble>
          <CharImg size={140} />
        </div>
      </div>

      {/* Rule banner */}
      <div style={{ marginBottom:"4mm" }}>
        <SectionBadge icon="💡" label="قاعدة" color={KIDS_ORANGE} />
      </div>
      <p style={{ fontSize:"12px", color:"#222", textAlign:"center", marginBottom:"5mm", fontWeight:700 }}>
        رغم وجود حروف كثيرة، إلا أن نطق الباتشيم يُختصر إلى{" "}
        <span style={{ color:KIDS_RED, fontWeight:900, textDecoration:"underline" }}>٧ أصوات أساسية فقط.</span>
      </p>

      {/* The 7 sounds */}
      <KidsPanel color={KIDS_BLUE} bg="#fff">
        <div style={{ marginBottom:"6px" }}>
          <SectionBadge icon="🔊" label="الأصوات السبعة" color={KIDS_BLUE} />
        </div>
        <div>
          {FINAL7.map(r => (
            <RuleRow key={r.n} {...r} ncolor={r.ncolor} pillBg={r.pillBg}
              pillChars={r.pillChars} arabicRule={r.rule}
              exampleK={r.exK} exampleR={r.exR} />
          ))}
        </div>
      </KidsPanel>

      {/* Note */}
      <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
        <KidsPanel color={KIDS_BLUE} bg="#F5FAFE">
          <div style={{ marginBottom:"6px" }}>
            <SectionBadge icon="📘" label="ملاحظة" color={KIDS_BLUE} />
          </div>
          <p style={{ fontSize:"11.5px", color:"#222", lineHeight:1.8, margin:0, fontWeight:600 }}>
            الباتشيم يُكتب في نهاية المقطع، لكنه لا يظهر منفصلاً.
            ويُساعد على معرفة <span style={{ color:KIDS_RED, fontWeight:900 }}>النطق الصحيح</span> للكلمة.
          </p>
        </KidsPanel>
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

function CoverEn() { return <KidsCover lang="en" />; }

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
                  <strong style={{ color:T1 }}>{ex.k}</strong>
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
    { n:"1",  title:"4-Week Classroom Study Plan",               icon:"🗓️", page:3,  new:true },
    { n:"2",  title:"How to Use This Book",                      icon:"📖", page:4,  new:true },
    { n:"3",  title:"The History of the Korean Language",        icon:"📜", page:5 },
    { n:"4",  title:"King Sejong the Great",                     icon:"👑", page:6 },
    { n:"5",  title:"Korean Culture",                            icon:"🌸", page:7 },
    { n:"6",  title:"Welcome to Hangul!",                        icon:"🎉", page:8 },
    { n:"7",  title:"Lesson 1 — ㄱ ㄴ ㄷ + ㅏ ㅓ",               icon:"🔤", page:9 },
    { n:"8",  title:"Lesson 2 — ㄹ ㅁ ㅂ + ㅗ ㅜ",               icon:"🔤", page:12 },
    { n:"9",  title:"Lesson 3 — ㅅ ㅇ ㅈ + ㅡ ㅣ",               icon:"🔤", page:15 },
    { n:"10", title:"Lesson 4 — ㅊ ㅋ ㅌ",                       icon:"🔤", page:18 },
    { n:"11", title:"Lesson 5 — ㅍ ㅎ",                          icon:"🔤", page:21 },
    { n:"12", title:"Lesson 6 — Full Review + Reading + Dictation", icon:"✅", page:24 },
    { n:"13", title:"Lesson 7 — Compound Vowels (이중모음)",      icon:"🔗", page:26, new:true },
    { n:"14", title:"Lesson 8 — Batchim: Final Consonants",      icon:"⬇️", page:28 },
    { n:"15", title:"K-Drama Essentials",                        icon:"🎬", page:30 },
    { n:"16", title:"Final Test",                                icon:"🏆", page:32 },
    { n:"17", title:"Completion Certificate",                    icon:"🎓", page:33 },
    { n:"18", title:"Practice Exercises & Answer Key",           icon:"✏️", page:34 },
    { n:"19", title:"Vocabulary Appendix — Top 50 Words",        icon:"📚", page:36 },
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
        Read each lesson in order — every lesson builds on the last. In 4 weeks you'll be reading Korean with confidence!
      </p>
    </Page>
  );
}

/* ════════════════════════════════════════════════════════════════
   NEW WORKBOOK LESSON COMPONENTS — Teach / Practice / Review
   Each lesson covers 2–3 consonants. One clear goal per page.
═════════════════════════════════════════════════════════════════ */

type LessonProps = { lesson: number; slice: [number, number]; lang: Lang };

function LessonHeader({ lesson, kind, lang }: { lesson: number; kind: "teach"|"practice"|"review"; lang: Lang }) {
  const isAr = lang === "ar";
  const num = isAr ? ["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1] : String(lesson);
  const kindLabel = isAr
    ? { teach:"تعلّم", practice:"تدريب", review:"مراجعة" }[kind]
    : { teach:"Learn", practice:"Practice", review:"Review" }[kind];
  return (
    <div style={{ marginBottom:"8mm", paddingBottom:"4mm", borderBottom:`1px solid ${BD}` }}>
      <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"2px", marginBottom:"3px" }}>
        {isAr ? `الدرس ${num}` : `Lesson ${num}`}
      </div>
      <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>{kindLabel}</div>
    </div>
  );
}

function TeachLetters({ lesson, slice, lang }: LessonProps) {
  const isAr = lang === "ar";
  const letters = CONSONANTS.slice(...slice);
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "الحروف الساكنة" : "Consonants"}>
      <LessonHeader lesson={lesson} kind="teach" lang={lang} />

      <div style={{ fontSize:"12px", color:T2, marginBottom:"7mm", lineHeight:1.7 }}>
        {isAr
          ? `في هذه الصفحة ستتعرّف على ${letters.length === 2 ? "حرفين جديدين" : "ثلاثة حروف جديدة"}. اقرأ الاسم، استمع للصوت، وانظر إلى الشكل بعناية.`
          : `On this page you will meet ${letters.length} new letter${letters.length>1?"s":""}. Read the name, hear the sound, study the shape.`}
      </div>

      {letters.map((c, idx) => {
        const d = isAr ? c.ar : c.en;
        return (
          <div key={c.char} style={{
            paddingTop: idx === 0 ? "0" : "8mm",
            paddingBottom: "8mm",
            borderTop: idx === 0 ? "none" : `1px solid ${BD}`,
            display:"grid", gridTemplateColumns:"110px 1fr", gap:"14mm", alignItems:"start",
          }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"96px", fontWeight:900, color:T1, lineHeight:1, marginBottom:"4mm" }}>{c.char}</div>
              <div style={{ fontSize:"11px", color:T3, fontWeight:700, letterSpacing:"1px" }}>{c.roman.toUpperCase()}</div>
              <div style={{ fontSize:"10px", color:T2, marginTop:"2mm" }}>{d.name}</div>
            </div>

            <div>
              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>
                {isAr ? "الصوت" : "Sound"}
              </div>
              <div style={{ fontSize:"13px", color:T1, fontWeight:700, marginBottom:"5mm" }}>{d.sound}</div>

              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>
                {isAr ? "تذكّره هكذا" : "Remember it"}
              </div>
              <div style={{ fontSize:"12px", color:T2, lineHeight:1.7, fontStyle:"italic", borderLeft:`2px solid ${Y}`, paddingLeft:"8px", marginBottom:"5mm" }}>{d.mnemonic}</div>

              {isAr && c.arDialect && (
                <>
                  <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>🇪🇬 بالمصري</div>
                  <div style={{ fontSize:"12px", color:T2, lineHeight:1.7, marginBottom:"5mm" }}>{c.arDialect}</div>
                </>
              )}

              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"3px" }}>
                {isAr ? "ترتيب الكتابة" : "Stroke order"}
              </div>
              <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"4mm" }}>
                {c.strokes.map((s, i) => (
                  <span key={i} style={{ border:`1px solid ${BD}`, color:T1, fontSize:"11px", fontWeight:700, padding:"3px 8px", borderRadius:"3px", background:"#fff" }}>{s}</span>
                ))}
              </div>

              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"3px" }}>
                {isAr ? "مثال" : "Example"}
              </div>
              <div style={{ display:"flex", gap:"10px", alignItems:"baseline", direction:"ltr" }}>
                <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>{d.ex[0].k}</div>
              </div>
            </div>
          </div>
        );
      })}
    </Page>
  );
}

// TOPIK-style manuscript-paper grid: tight uniform cells, one character per cell.
function TopikGrid({ rows, cols = 14, fill, fillArr, cellMm = 7 }: { rows: number; cols?: number; fill?: string; fillArr?: string[]; cellMm?: number }) {
  const chars = fillArr ?? Array.from(fill || "");
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:`repeat(${cols}, 1fr)`,
      border:`1px solid ${T2}`,
      borderRight:"none",
      borderBottom:"none",
      direction:"ltr",
      background:"#fff",
    }}>
      {Array(rows*cols).fill(null).map((_, i) => (
        <div key={i} style={{
          height:`${cellMm}mm`,
          borderRight:`1px solid ${T2}`,
          borderBottom:`1px solid ${T2}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:`${Math.round(cellMm*2.4)}px`, fontWeight:900,
          color:"#E8E8E8", lineHeight:1,
        }}>{(chars[i] && chars[i] !== " ") ? chars[i] : ""}</div>
      ))}
    </div>
  );
}

function PracticeLetters({ lesson, slice, lang }: LessonProps) {
  const isAr = lang === "ar";
  const letters = CONSONANTS.slice(...slice);
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "تدريب الكتابة" : "Writing Practice"}>
      <LessonHeader lesson={lesson} kind="practice" lang={lang} />

      <div style={{ fontSize:"12px", color:T2, marginBottom:"6mm", lineHeight:1.7 }}>
        {isAr
          ? "تتبّع كل حرف ٤ مرات (الصف الأول)، ثم اكتبه من ذاكرتك ٤ مرات (الصف الثاني)."
          : "Trace each letter 4 times (top row), then write it from memory 4 times (bottom row)."}
      </div>

      {letters.map((c, idx) => (
        <div key={c.char} style={{ marginBottom: idx === letters.length - 1 ? "0" : "9mm" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"10px", marginBottom:"3mm" }}>
            <div style={{ fontSize:"32px", fontWeight:900, color:T1 }}>{c.char}</div>
            <div style={{ fontSize:"11px", color:T3, letterSpacing:"1px" }}>{c.roman.toUpperCase()} · {(isAr ? c.ar : c.en).name}</div>
          </div>

          <div style={{ fontSize:"9px", color:T3, marginBottom:"2mm", textTransform:"uppercase", letterSpacing:"1px" }}>
            {isAr ? "تتبّع" : "Trace"}
          </div>
          <div style={{ marginBottom:"4mm" }}>
            <TopikGrid rows={2} cols={14} fill={c.char.repeat(28)} />
          </div>

          <div style={{ fontSize:"9px", color:T3, marginBottom:"2mm", textTransform:"uppercase", letterSpacing:"1px" }}>
            {isAr ? `اكتب كلمات سهلة بحرف ${c.char}` : `Write easy words using ${c.char}`}
          </div>
          {(() => {
            const ex = (isAr ? c.ar : c.en).ex || [];
            const cols = 14;
            return (
              <div>
                {ex.slice(0,2).map((w, wi) => {
                  const k = Array.from(w.k);
                  const fillArr: string[] = [];
                  for (let i = 0; i < cols; i++) fillArr.push(i < k.length ? k[i] : " ");
                  return (
                    <div key={wi} style={{ marginBottom: wi === ex.slice(0,2).length-1 ? 0 : "3mm" }}>
                      <div style={{ fontSize:"14px", fontWeight:900, color:T1, marginBottom:"1.5mm", direction: isAr ? "rtl" : "ltr" }}>
                        {w.k}
                      </div>
                      <TopikGrid rows={1} cols={cols} fillArr={fillArr} />
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ))}
    </Page>
  );
}

function ReviewLetters({ lesson, slice, lang }: LessonProps) {
  const isAr = lang === "ar";
  const letters = CONSONANTS.slice(...slice);
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "مراجعة" : "Review"}>
      <LessonHeader lesson={lesson} kind="review" lang={lang} />

      <div style={{ fontSize:"12px", color:T2, marginBottom:"7mm", lineHeight:1.7 }}>
        {isAr ? "تأكّد ممّا تتذكّره قبل المتابعة للدرس التالي." : "Make sure you remember before moving on."}
      </div>

      {/* Task 1 — Match character to sound */}
      <div style={{ marginBottom:"9mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"2mm" }}>
          1. {isAr ? "صل الحرف بصوته" : "Match the letter to its sound"}
        </div>
        <div style={{ fontSize:"10px", color:T3, marginBottom:"4mm" }}>
          {isAr ? "ارسم خطاً بين الحرف والصوت الصحيح." : "Draw a line between each letter and its sound."}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4mm 30mm", direction:"ltr" }}>
          {letters.map(c => (
            <div key={"L"+c.char} style={{ fontSize:"34px", fontWeight:900, color:T1, textAlign:"center", border:`1px solid ${BD}`, padding:"6mm 0", borderRadius:"4px" }}>{c.char}</div>
          ))}
          {[...letters].reverse().map(c => (
            <div key={"R"+c.char} style={{ fontSize:"16px", fontWeight:700, color:T1, textAlign:"center", border:`1px solid ${BD}`, padding:"10mm 0", borderRadius:"4px" }}>{c.roman.toUpperCase()}</div>
          ))}
        </div>
      </div>

      {/* Task 2 — Write the sound under each letter */}
      <div style={{ marginBottom:"9mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"2mm" }}>
          2. {isAr ? "اكتب الصوت تحت كل حرف" : "Write the sound under each letter"}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${letters.length}, 1fr)`, gap:"6mm", marginTop:"3mm" }}>
          {letters.map(c => (
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"42px", fontWeight:900, color:T1, marginBottom:"3mm" }}>{c.char}</div>
              <div style={{ borderBottom:`1px solid ${T2}`, height:"12mm" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Task 3 — Read these syllables */}
      <div style={{ marginBottom:"9mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"2mm" }}>
          3. {isAr ? "اقرأ هذه المقاطع بصوت عالٍ" : "Read these syllables out loud"}
        </div>
        <div style={{ display:"flex", gap:"8mm", flexWrap:"wrap", marginTop:"3mm", direction:"ltr" }}>
          {letters.map(c => (
            <div key={c.char} style={{ fontSize:"42px", fontWeight:900, color:T1 }}>{c.char + "ㅏ"}</div>
          ))}
        </div>
      </div>

      {/* Completion */}
      <div style={{ marginTop:"auto", paddingTop:"6mm", borderTop:`1px solid ${BD}`, display:"flex", alignItems:"center", gap:"10px" }}>
        <div style={{ width:"18px", height:"18px", border:`2px solid ${T1}`, borderRadius:"3px", flexShrink:0 }} />
        <span style={{ fontSize:"12px", color:T1, fontWeight:700 }}>
          {isAr ? `أتممتُ الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `I completed Lesson ${lesson}`}
        </span>
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
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ── Batchim (Single) EN ── */
function BatchimEn() {
  const FINAL7: { n:number; ncolor:string; pillBg:string; pillChars:string; rule:string; exK:string; exR:string }[] = [
    { n:1, ncolor:KIDS_RED,    pillBg:"#FFE2C0", pillChars:"ㄱ / ㄲ / ㅋ", rule:"Pronounced: k", exK:"박", exR:"bak" },
    { n:2, ncolor:KIDS_GREEN,  pillBg:"#D7EFD0", pillChars:"ㄴ",            rule:"Pronounced: n", exK:"산", exR:"san" },
    { n:3, ncolor:KIDS_RED,    pillBg:"#FFD7D7", pillChars:"ㄷ / ㅅ / ㅆ / ㅈ / ㅊ / ㅌ / ㅎ", rule:"Pronounced: hard t (no release)", exK:"옷", exR:"ot" },
    { n:4, ncolor:KIDS_BLUE,   pillBg:"#D6E9F8", pillChars:"ㄹ",            rule:"Pronounced: l", exK:"달", exR:"dal" },
    { n:5, ncolor:KIDS_PURPLE, pillBg:"#E5D8F0", pillChars:"ㅁ",            rule:"Pronounced: m", exK:"밤", exR:"bam" },
    { n:6, ncolor:KIDS_PURPLE, pillBg:"#FAD9E8", pillChars:"ㅂ / ㅍ",       rule:"Pronounced: p", exK:"밥", exR:"bap" },
    { n:7, ncolor:KIDS_RED,    pillBg:"#FBD9D9", pillChars:"ㅇ",            rule:"Pronounced: ng (nasal)", exK:"강", exR:"gang" },
  ];
  return (
    <Page dir="ltr" bgColor={KIDS_PINK}>
      <div style={{
        background:KIDS_RED, color:"#fff", borderRadius:"30px",
        padding:"10px 20px", display:"flex", justifyContent:"center",
        alignItems:"center", gap:"10px", marginBottom:"6mm",
        boxShadow:"0 4px 0 rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize:"22px", fontWeight:900 }}>Batchim in Korean</div>
        <div style={{ fontSize:"18px", fontWeight:900, opacity:0.95 }}>(받침)</div>
      </div>

      <div style={{ display:"flex", gap:"10px", marginBottom:"6mm", alignItems:"flex-start" }}>
        <KidsPanel color={KIDS_GREEN} bg="#FFF8F1" dir="ltr">
          <div style={{ marginBottom:"6px" }}>
            <SectionBadge icon="📗" label="Definition" color={KIDS_GREEN} dir="ltr" />
          </div>
          <p style={{ fontSize:"12px", color:"#222", lineHeight:1.8, margin:0, fontWeight:600 }}>
            Batchim (<span style={{ color:KIDS_RED, fontWeight:900 }}>받침</span>) is the final
            consonant at the end of a Korean syllable block — and it strongly affects how the word is pronounced.
          </p>
        </KidsPanel>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, gap:"4px", width:"170px" }}>
          <SpeechBubble dir="ltr" color={KIDS_RED}>
            Batchim shapes pronunciation and grammar!
          </SpeechBubble>
          <CharImg size={140} />
        </div>
      </div>

      <div style={{ marginBottom:"4mm" }}>
        <SectionBadge icon="💡" label="Rule" color={KIDS_ORANGE} dir="ltr" />
      </div>
      <p style={{ fontSize:"12px", color:"#222", textAlign:"center", marginBottom:"5mm", fontWeight:700 }}>
        Many consonants exist, but batchim collapses them into{" "}
        <span style={{ color:KIDS_RED, fontWeight:900, textDecoration:"underline" }}>just 7 final sounds.</span>
      </p>

      <KidsPanel color={KIDS_BLUE} bg="#fff" dir="ltr">
        <div style={{ marginBottom:"6px" }}>
          <SectionBadge icon="🔊" label="The 7 Sounds" color={KIDS_BLUE} dir="ltr" />
        </div>
        <div style={{ direction:"ltr" }}>
          {FINAL7.map(r => (
            <div key={r.n} style={{
              display:"grid", gridTemplateColumns:"30px 1.1fr 18px 1.4fr 1fr",
              alignItems:"center", gap:"8px", padding:"6px 4px",
            }}>
              <NumCircle n={r.n} color={r.ncolor} />
              <div style={{ textAlign:"center" }}><Pill bg={r.pillBg}>{r.pillChars}</Pill></div>
              <div style={{ color:KIDS_RED, fontSize:"18px", fontWeight:900, textAlign:"center" }}>→</div>
              <div style={{ fontSize:"12px", color:"#222", fontWeight:700 }}>{r.rule}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"6px" }}>
                <span style={{ fontSize:"22px", fontWeight:900, color:"#222" }}>{r.exK}</span>
                <span style={{ fontSize:"11px", fontWeight:700, color:KIDS_GREEN }}>({r.exR})</span>
              </div>
            </div>
          ))}
        </div>
      </KidsPanel>

      <KidsPanel color={KIDS_BLUE} bg="#F5FAFE" dir="ltr">
        <div style={{ marginBottom:"6px" }}>
          <SectionBadge icon="📘" label="Note" color={KIDS_BLUE} dir="ltr" />
        </div>
        <p style={{ fontSize:"11.5px", color:"#222", lineHeight:1.8, margin:0, fontWeight:600 }}>
          Batchim is written at the bottom of the syllable block but is not separated as a standalone letter.
          It is the key to <span style={{ color:KIDS_RED, fontWeight:900 }}>correct pronunciation</span> of Korean words.
        </p>
      </KidsPanel>
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
            <div style={{ fontSize:"9px", color: T2, marginTop:"1px" }}>{w.m}</div>
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
    {
      n: isAr ? "الأسبوع ١" : "Week 1",
      title: isAr ? "الدرس ١ + الدرس ٢" : "Lesson 1 + Lesson 2",
      letters: "ㄱ ㄴ ㄷ + ㅏ ㅓ  /  ㄹ ㅁ ㅂ + ㅗ ㅜ",
      goal: isAr
        ? "يتعرّف الطالب على ٦ حروف ساكنة و٤ حروف مد. يجمع مقاطع بسيطة ويقرأ كلمات: 가방، 나비، 밥، 물."
        : "6 consonants + 4 vowels. Students combine syllables and read simple words: 가방 (bag), 나비 (butterfly), 밥 (rice), 물 (water).",
      lessons: isAr ? ["الدرس ١: ㄱ ㄴ ㄷ + ㅏ ㅓ","الدرس ٢: ㄹ ㅁ ㅂ + ㅗ ㅜ"] : ["Lesson 1: ㄱ ㄴ ㄷ + ㅏ ㅓ","Lesson 2: ㄹ ㅁ ㅂ + ㅗ ㅜ"],
    },
    {
      n: isAr ? "الأسبوع ٢" : "Week 2",
      title: isAr ? "الدرس ٣ + الدرس ٤" : "Lesson 3 + Lesson 4",
      letters: "ㅅ ㅇ ㅈ + ㅡ ㅣ  /  ㅊ ㅋ ㅌ",
      goal: isAr
        ? "يكمل الطالب ١١ حرفاً ساكناً. يتعلّم المد المحايد والطويل. يقرأ: 사과، 지도، 카메라."
        : "11 consonants learned. Students read: 사과 (apple), 지도 (map), 카메라 (camera). Pair reading drill every class.",
      lessons: isAr ? ["الدرس ٣: ㅅ ㅇ ㅈ + ㅡ ㅣ","الدرس ٤: ㅊ ㅋ ㅌ"] : ["Lesson 3: ㅅ ㅇ ㅈ + ㅡ ㅣ","Lesson 4: ㅊ ㅋ ㅌ"],
    },
    {
      n: isAr ? "الأسبوع ٣" : "Week 3",
      title: isAr ? "الدرس ٥ + الدرس ٦" : "Lesson 5 + Lesson 6",
      letters: "ㅍ ㅎ  /  مراجعة شاملة",
      goal: isAr
        ? "يكمل الطالب الـ١٤ حرفاً الساكنة كلها. الدرس ٦ مراجعة شاملة + قراءة + إملاء كبير."
        : "All 14 consonants complete. Lesson 6 is a full review + reading practice + dictation test.",
      lessons: isAr ? ["الدرس ٥: ㅍ ㅎ","الدرس ٦: مراجعة + قراءة + إملاء"] : ["Lesson 5: ㅍ ㅎ","Lesson 6: Full Review + Reading + Dictation"],
    },
    {
      n: isAr ? "الأسبوع ٤" : "Week 4",
      title: isAr ? "الدرس ٧ + الدرس ٨" : "Lesson 7 + Lesson 8",
      letters: "حروف المد المركبة  /  الباتشيم",
      goal: isAr
        ? "يتعلّم الطالب حروف المد المركبة (ㅐ ㅔ ㅑ ㅕ ㅘ ㅝ...) والباتشيم (الحرف النهائي). يقرأ كلمات كاملة: 한국، 밥، 물."
        : "Compound vowels (ㅐ ㅔ ㅑ ㅕ ㅘ ㅝ...) and Batchim (final consonants). Students read complete Korean words: 한국, 밥, 물.",
      lessons: isAr ? ["الدرس ٧: حروف المد المركبة","الدرس ٨: الباتشيم — الحرف النهائي"] : ["Lesson 7: Compound Vowels","Lesson 8: Batchim — Final Consonants"],
    },
  ];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "خطة الكورس" : "Course Plan"}>
      <SHead title={isAr ? "خطة كورس الهانغول داخل الفصل — ٤ أسابيع" : "4-Week Classroom Hangul Course Plan"} subtitle={isAr ? "حصتان في الأسبوع · ٩٠ دقيقة لكل حصة · إملاء في كل حصة · واجب بعد كل درس" : "2 lessons per week · 90 minutes each · dictation every class · homework after every lesson"} />
      <div style={{ display:"flex", flexDirection:"column", gap:"5mm", marginBottom:"7mm" }}>
        {weeks.map((w,i) => (
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"6px", padding:"5mm", background:i===0?"#fffdf3":SBG }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:"10px", marginBottom:"3mm", borderBottom:`1px solid ${BD}`, paddingBottom:"3mm" }}>
              <div style={{ fontSize:"10px", color:T3, fontWeight:800, letterSpacing:"2px", textTransform:"uppercase" }}>{w.n}</div>
              <div style={{ fontSize:"15px", fontWeight:900, color:T1 }}>{w.title}</div>
            </div>
            <div style={{ display:"flex", gap:"6mm", marginBottom:"3mm", flexWrap:"wrap" }}>
              {(w as any).lessons?.map((l:string, li:number) => (
                <div key={li} style={{ background:Y, color:T1, fontSize:"10px", fontWeight:900, padding:"2px 8px", borderRadius:"3px" }}>{l}</div>
              ))}
            </div>
            <div style={{ fontSize:"11px", color:T2, lineHeight:1.6 }}>
              <span style={{ fontWeight:800, color:T1 }}>{isAr?"الهدف:":"Goal:"}</span> {w.goal}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr ? "هذا الكورس يعطي أفضل نتائج عندما يلتزم الطالب بحلّ الواجب وتطبيق الإملاء والتدريب اليومي (٥–١٠ دقائق) بين الحصص. الإملاء واجب في كل حصة — لا تتخطّه أبداً." : "This course works best when students complete the homework, dictation drills, and 5–10 minute daily practice between classes. Dictation is required every class — never skip it."}
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

function HowToUse({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const items = isAr
    ? [
        { icon:"🔊", title:"الصوت + الشكل أولاً", body:"تعلّم كل حرف من خلال صوته وشكله معاً. لا تحفظ بالترتيب — افهم الشكل من الصوت." },
        { icon:"🖼️", title:"تعلّم بالصور والكلمات", body:"كل حرف مربوط بكلمة وصورة. مثال: ㄱ = 가방 (حقيبة). اربط الحرف بالشيء، مش بالقاعدة." },
        { icon:"✍️", title:"تعلّم بالكتابة التطبيقية", body:"اكتب، انطق، اقرأ — التطبيق أهم من الشرح. لا تتجاوز تمارين التتبع والكتابة من الذاكرة." },
        { icon:"🗣️", title:"الإملاء واجب كل حصة", body:"ينطق المعلم حروفاً ومقاطع وكلمات، والطالب يكتب ما يسمع. هذا أهم تدريب على الإطلاق — لا تتخطّه." },
        { icon:"🎤", title:"النطق والتكرار مع زميل", body:"كرّر بصوت عالٍ بعد المعلم، اقرأ مع زميلك، سجّل صوتك واستمع له. النطق الصحيح يجي من التكرار." },
        { icon:"📖", title:"اقرأ كلمات حقيقية من الدرس ١", body:"لا تنتظر حتى تنتهي من الكتاب. من الدرس الأول ستقرأ كلمات حقيقية: 가방، 나비، 밥، 물. كل درس يضيف كلمات جديدة." },
      ]
    : [
        { icon:"🔊", title:"Sound + Shape first", body:"Learn every letter through its sound and its shape together. Don't memorize in order — understand the shape from the sound." },
        { icon:"🖼️", title:"Learn through images and words", body:"Every letter is anchored to a word and a picture. Example: ㄱ = 가방 (bag). Tie the letter to the object, not a grammar rule." },
        { icon:"✍️", title:"Practice-based writing", body:"Write, say, read — practice beats theory. Never skip the tracing and write-from-memory exercises." },
        { icon:"🗣️", title:"Dictation every class", body:"The teacher says letters/syllables/words; students write what they hear. This is the single most important drill — never skip it." },
        { icon:"🎤", title:"Speaking and partner repetition", body:"Repeat after the teacher out loud, read with a partner, record yourself and listen back. Correct pronunciation comes from repetition." },
        { icon:"📖", title:"Read real words from Lesson 1", body:"Don't wait until you finish the book. From Lesson 1 you will read real words: 가방, 나비, 밥, 물. Each lesson adds more." },
      ];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "كيفية استخدام الكتاب" : "How to Use This Book"}>
      <SHead title={isAr ? "كيفية استخدام هذا الكتاب" : "How to Use This Book"} subtitle={isAr ? "ستة مبادئ تجعل تعلّم الهانغول سريعاً وفعّالاً داخل الفصل" : "Six principles that make classroom Hangul learning fast and effective"} />
      <div style={{ display:"flex", flexDirection:"column", gap:"4mm", marginBottom:"6mm" }}>
        {items.map((it,i) => (
          <div key={i} style={{ display:"flex", gap:"4mm", border:`1px solid ${BD}`, borderRadius:"6px", padding:"4mm 5mm", background: i===2?"#fffdf3":SBG, alignItems:"flex-start" }}>
            <div style={{ fontSize:"32px", lineHeight:1, flexShrink:0 }}>{it.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"13px", fontWeight:900, color:T1, marginBottom:"2mm" }}>{it.title}</div>
              <div style={{ fontSize:"11px", color:T2, lineHeight:1.7 }}>{it.body}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr
          ? "كل درس يتبع نفس التسلسل الثابت: أ. تعلّم → ب. كلمات بالصور → ج. تطبيق الكتابة → د. تدريب النطق → هـ. إملاء → و. قراءة قصيرة → ز. مراجعة. اتّبع الترتيب دائماً — هكذا صُمِّم الكتاب."
          : "Every lesson follows the same fixed flow: A. Learn → B. Visual Words → C. Writing Practice → D. Speaking Drill → E. Dictation → F. Mini Reading → G. Review. Always follow this order — the book is designed this way."}
      </div>
    </Page>
  );
}

function SpeakingDrill({ lesson, slice, lang }: LessonProps) {
  const isAr = lang === "ar";
  const letters = CONSONANTS.slice(...slice);
  // Use vowels already taught by this lesson: L1→ㅏㅓ, L2→+ㅗㅜ, L3→+ㅡㅣ, L4-5→all 6
  const drillVowels = lesson <= 1 ? ["ㅏ","ㅓ"] : lesson <= 2 ? ["ㅏ","ㅓ","ㅗ","ㅜ"] : ["ㅏ","ㅓ","ㅗ","ㅜ","ㅡ","ㅣ"];
  const syllables = letters.flatMap(c => drillVowels.slice(0,3).map(v => buildSyllable(c.char, v)));
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "تدريب النطق" : "Speaking Drill"}>
      <SHead title={isAr ? `تدريب النطق — الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `Speaking Drill — Lesson ${lesson}`} subtitle={isAr ? "كرّر بصوت عالٍ، ثم اقرأ مع زميلك" : "Say each one aloud, then read with a partner"} />
      <div style={{ marginBottom:"5mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
          {isAr ? "١. كرّر بعد المعلم" : "1. Repeat after the teacher"}
        </div>
        <div style={{ display:"flex", gap:"6mm", justifyContent:"center", flexWrap:"wrap", border:`1px solid ${BD}`, borderRadius:"6px", padding:"6mm", background:"#fff" }}>
          {letters.map(c => (
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"56px", fontWeight:900, color:T1, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"11px", color:T3, marginTop:"2mm" }}>[{c.roman}]</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:"5mm" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
          {isAr ? "٢. قراءة المقاطع بصوت عالٍ" : "2. Read syllables aloud"}
        </div>
        <div style={{ display:"flex", gap:"4mm", flexWrap:"wrap", border:`1px solid ${BD}`, borderRadius:"6px", padding:"5mm", background:"#fff", direction:"ltr" }}>
          {syllables.map((s,i) => (
            <div key={i} style={{ fontSize:"32px", fontWeight:900, color:T1 }}>{s}</div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize:"11px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
          {isAr ? "٣. قراءة جماعية مع زميل" : "3. Pair reading with a partner"}
        </div>
        <ul style={{ margin:0, paddingInlineStart:"18px", fontSize:"11px", color:T2, lineHeight:1.8 }}>
          {(isAr
            ? ["الطالب أ يقرأ الحرف، الطالب ب يكرّر بصوت أعلى.","تبادلوا الأدوار كل ٣٠ ثانية.","ركّز على المخارج: المعلم يصحّح النطق."]
            : ["Student A reads the letter, Student B repeats louder.","Switch roles every 30 seconds.","Focus on pronunciation — teacher corrects mouth shape."]
          ).map((t,i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
    </Page>
  );
}

const DICTATION_WORDS: Record<number, string[]> = {
  1: ["가","나","다","거","너","더","가다","나가다","가나","나가","다가","가나다","나","너","다","가","거","더","가다","나가다"],
  2: ["라","마","바","로","무","두","나무","바다","도로","두부","부모","보다","모두","나라","고모","도구","고무","머루","무","노루"],
  3: ["사","아","지","스","이","나","가방","나비","다리","머리","아이","오이","지도","어머니","누나","사다","자다","시소","비","사자"],
  4: ["차","카","토","코","키","치","차","카드","코","키","토마토","치마","보트","노트","마트","코트","키스","가방","나비","치마"],
  5: ["파","하","피","호","피자","한국","하나","호두","포도","하마","피","코피","하루","하다","하늘","가방","나비","어머니","아이","한국"],
  6: ["가방","나비","다리","머리","아이","오이","지도","어머니","나무","바다","피자","한국","하나","호두","포도","하마","차","토마토","카드","사자"],
};

function Dictation({ lesson, slice, lang }: LessonProps) {
  const isAr = lang === "ar";
  const letters = CONSONANTS.slice(...slice);
  const dictWords = DICTATION_WORDS[lesson] || letters.flatMap(c => (c[isAr?"ar":"en"].ex || []).slice(0,1).map(w => w.k));
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "إملاء" : "Dictation"}>
      <SHead title={isAr ? `إملاء — الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `Dictation — Lesson ${lesson}`} subtitle={isAr ? "ينطق المعلم بصوت واضح، والطالب يكتب في المربعات" : "The teacher reads aloud; the student writes in the boxes"} />
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"3mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7, marginBottom:"5mm" }}>
        <strong>{isAr ? "للمعلم: " : "Teacher: "}</strong>
        {isAr
          ? `انطق ببطء — أولاً الحروف، ثم المقاطع، ثم الكلمات: ${dictWords.join(" / ")}`
          : `Speak slowly — letters first, syllables, then words: ${dictWords.join(" / ")}`}
      </div>

      <div style={{ fontSize:"11px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
        {isAr ? "أ. حروف منفردة" : "A. Single letters"}
      </div>
      <div style={{ marginBottom:"5mm" }}>
        <TopikGrid rows={1} cols={14} />
      </div>

      <div style={{ fontSize:"11px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
        {isAr ? "ب. مقاطع بسيطة" : "B. Simple syllables"}
      </div>
      <div style={{ marginBottom:"5mm" }}>
        <TopikGrid rows={2} cols={14} />
      </div>

      <div style={{ fontSize:"11px", fontWeight:800, color:T3, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"3mm" }}>
        {isAr ? "ج. كلمات بسيطة" : "C. Simple words"}
      </div>
      <div style={{ marginBottom:"5mm" }}>
        <TopikGrid rows={3} cols={14} />
      </div>
    </Page>
  );
}

// Mini-reading word sets — only words built from letters taught so far
const MINI_READ_WORDS: Record<number, { k:string; r:string; m_en:string; m_ar:string }[]> = {
  1: [
    { k:"가",   r:"ga",     m_en:"go (root)",   m_ar:"يذهب (جذر)" },
    { k:"나",   r:"na",     m_en:"I / me",      m_ar:"أنا" },
    { k:"다",   r:"da",     m_en:"all",         m_ar:"كل" },
    { k:"너",   r:"neo",    m_en:"you",         m_ar:"أنتَ" },
    { k:"가다", r:"ga-da",  m_en:"to go",       m_ar:"يذهب" },
    { k:"나가다", r:"na-ga-da", m_en:"to go out", m_ar:"يخرج" },
  ],
  2: [
    { k:"나무", r:"na-mu",  m_en:"tree",        m_ar:"شجرة" },
    { k:"바다", r:"ba-da",  m_en:"sea",         m_ar:"بحر" },
    { k:"도로", r:"do-ro",  m_en:"road",        m_ar:"طريق" },
    { k:"두부", r:"du-bu",  m_en:"tofu",        m_ar:"توفو" },
    { k:"부모", r:"bu-mo",  m_en:"parents",     m_ar:"الوالدان" },
    { k:"보다", r:"bo-da",  m_en:"to see",      m_ar:"يرى" },
  ],
  3: [
    { k:"가방",   r:"ga-bang",   m_en:"bag",       m_ar:"حقيبة" },
    { k:"나비",   r:"na-bi",     m_en:"butterfly", m_ar:"فراشة" },
    { k:"다리",   r:"da-ri",     m_en:"bridge / leg", m_ar:"جسر / ساق" },
    { k:"아이",   r:"a-i",       m_en:"child",     m_ar:"طفل" },
    { k:"지도",   r:"ji-do",     m_en:"map",       m_ar:"خريطة" },
    { k:"어머니", r:"eo-meo-ni", m_en:"mother",    m_ar:"أم" },
  ],
  4: [
    { k:"차",     r:"cha",       m_en:"car / tea", m_ar:"سيارة / شاي" },
    { k:"카드",   r:"ka-deu",    m_en:"card",      m_ar:"بطاقة" },
    { k:"코",     r:"ko",        m_en:"nose",      m_ar:"أنف" },
    { k:"키",     r:"ki",        m_en:"key / height", m_ar:"مفتاح / طول" },
    { k:"토마토", r:"to-ma-to",  m_en:"tomato",    m_ar:"طماطم" },
    { k:"치마",   r:"chi-ma",    m_en:"skirt",     m_ar:"تنورة" },
  ],
  5: [
    { k:"피자", r:"pi-ja",  m_en:"pizza",   m_ar:"بيتزا" },
    { k:"한국", r:"han-guk", m_en:"Korea",  m_ar:"كوريا" },
    { k:"하나", r:"ha-na",  m_en:"one",     m_ar:"واحد" },
    { k:"호두", r:"ho-du",  m_en:"walnut",  m_ar:"جوز" },
    { k:"포도", r:"po-do",  m_en:"grape",   m_ar:"عنب" },
    { k:"하마", r:"ha-ma",  m_en:"hippo",   m_ar:"فرس النهر" },
  ],
};

function MiniReading({ lesson, lang }: LessonProps) {
  const isAr = lang === "ar";
  const words = LESSON_WORDS[lesson] || [];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "قراءة قصيرة" : "Mini Reading"}>
      <SHead title={isAr ? `قراءة قصيرة — الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `Mini Reading — Lesson ${lesson}`} subtitle={isAr ? `${words.length} كلمة — كلها مكوّنة من حروف ومدّ سبق دراستها` : `${words.length} words — all built from letters and vowels you've already learned`} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"3mm", marginBottom:"5mm" }}>
        {words.map((w,i) => (
          <div key={i} style={{ border:`1px solid ${BD}`, borderRadius:"5px", padding:"3mm", background:"#fff", textAlign:"center", direction:"ltr" }}>
            <div style={{ fontSize:"22px", fontWeight:900, color:T1, lineHeight:1.1 }}>{w.k}</div>
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr ? "💬 اسأل كل طالب أن يقرأ كلمة، ثم يستخدمها في جملة عربية بسيطة (مثال: عندي حقيبة)." : "💬 Ask each student to read one word and use it in a simple sentence (e.g., \"I have a bag\")."}
      </div>
    </Page>
  );
}

const LESSON_VOWEL_INDICES: Record<number, [number, number]> = {
  1: [0, 2],  // ㅏ ㅓ
  2: [2, 4],  // ㅗ ㅜ
  3: [4, 6],  // ㅡ ㅣ
};

type LessonWord = { k: string; r: string; en: string; ar: string; emoji: string };

// Map each English word/phrase to a single safe-search keyword for the photo CDN.
// LoremFlickr serves CC-licensed Flickr photos by keyword — no API key needed.
function photoKeyword(en: string): string {
  return en
    .split("/")[0]            // "car / tea" -> "car "
    .split("(")[0]            // "go (root)" -> "go "
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)              // keep keyword short for better matches
    .join(",");
}

function WordIllustration({ emoji, alt, en, size = 64 }: { emoji: string; alt: string; en: string; size?: number }) {
  const kw = photoKeyword(en);
  const photo = `https://loremflickr.com/${size*3}/${size*3}/${kw || "object"}?lock=${Math.abs([...kw].reduce((a,c)=>a+c.charCodeAt(0),0))}`;
  return (
    <img
      src={photo}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={(e) => {
        // graceful fallback to a styled emoji span if photo CDN is blocked
        const parent = (e.currentTarget as HTMLImageElement).parentElement;
        if (parent && !parent.dataset.fallback) {
          parent.dataset.fallback = "1";
          parent.innerHTML = `<span style="font-size:${size*0.7}px;line-height:1">${emoji}</span>`;
        }
      }}
      style={{ display:"block", objectFit:"cover", borderRadius:"4px", width:`${size}px`, height:`${size}px` }}
    />
  );
}

const LESSON_WORDS: Record<number, LessonWord[]> = {
  1: [
    { k:"가",       r:"ga",         en:"go (root)",      ar:"يذهب (جذر)",       emoji:"➡️" },
    { k:"나",       r:"na",         en:"I / me",         ar:"أنا",              emoji:"🙋" },
    { k:"다",       r:"da",         en:"all",            ar:"كل",               emoji:"📚" },
    { k:"거",       r:"geo",        en:"thing",         ar:"شيء",              emoji:"📦" },
    { k:"너",       r:"neo",        en:"you",            ar:"أنتَ",              emoji:"👉" },
    { k:"더",       r:"deo",        en:"more",           ar:"أكثر",             emoji:"➕" },
    { k:"가다",     r:"ga-da",      en:"to go",          ar:"يذهب",             emoji:"🚶" },
    { k:"나가다",   r:"na-ga-da",   en:"to go out",      ar:"يخرج",             emoji:"🚪" },
    { k:"나가",     r:"na-ga",      en:"go out!",        ar:"اخرج!",            emoji:"👋" },
    { k:"다가",     r:"da-ga",      en:"approaching",    ar:"يقترب",            emoji:"🤏" },
    { k:"가나",     r:"ga-na",      en:"Ghana",          ar:"غانا",             emoji:"🌍" },
    { k:"가나다",   r:"ga-na-da",   en:"Korean ABCs",    ar:"الأبجدية الكورية", emoji:"🔤" },
  ],
  2: [
    { k:"나",       r:"na",         en:"I / me",         ar:"أنا",              emoji:"🙋" },
    { k:"너",       r:"neo",        en:"you",            ar:"أنتَ",              emoji:"👉" },
    { k:"더",       r:"deo",        en:"more",           ar:"أكثر",             emoji:"➕" },
    { k:"가다",     r:"ga-da",      en:"to go",          ar:"يذهب",             emoji:"🚶" },
    { k:"나가다",   r:"na-ga-da",   en:"to go out",      ar:"يخرج",             emoji:"🚪" },
    { k:"나무",     r:"na-mu",      en:"tree",           ar:"شجرة",             emoji:"🌳" },
    { k:"바다",     r:"ba-da",      en:"sea",            ar:"بحر",              emoji:"🌊" },
    { k:"도로",     r:"do-ro",      en:"road",           ar:"طريق",             emoji:"🛣️" },
    { k:"두부",     r:"du-bu",      en:"tofu",           ar:"توفو",             emoji:"🟦" },
    { k:"부모",     r:"bu-mo",      en:"parents",        ar:"الوالدان",          emoji:"👪" },
    { k:"보다",     r:"bo-da",      en:"to see",         ar:"يرى",              emoji:"👁️" },
    { k:"모두",     r:"mo-du",      en:"everyone",       ar:"الجميع",           emoji:"👥" },
    { k:"나라",     r:"na-ra",      en:"country",        ar:"دولة",             emoji:"🌐" },
    { k:"고모",     r:"go-mo",      en:"aunt (paternal)", ar:"عمة",             emoji:"👵" },
    { k:"도구",     r:"do-gu",      en:"tool",           ar:"أداة",             emoji:"🛠️" },
    { k:"고구마",   r:"go-gu-ma",   en:"sweet potato",   ar:"بطاطا حلوة",        emoji:"🍠" },
    { k:"고무",     r:"go-mu",      en:"rubber",         ar:"مطاط",             emoji:"🟢" },
    { k:"머루",     r:"meo-ru",     en:"wild grape",     ar:"عنب بري",          emoji:"🍇" },
    { k:"무",       r:"mu",         en:"radish",         ar:"فجل",              emoji:"🥕" },
    { k:"노루",     r:"no-ru",      en:"roe deer",       ar:"غزال",             emoji:"🦌" },
  ],
  3: [
    { k:"가방",     r:"ga-bang",    en:"bag",            ar:"حقيبة",            emoji:"🎒" },
    { k:"나비",     r:"na-bi",      en:"butterfly",      ar:"فراشة",            emoji:"🦋" },
    { k:"다리",     r:"da-ri",      en:"bridge / leg",   ar:"جسر / ساق",         emoji:"🦵" },
    { k:"머리",     r:"meo-ri",     en:"head",           ar:"رأس",              emoji:"🧠" },
    { k:"아이",     r:"a-i",        en:"child",          ar:"طفل",              emoji:"👶" },
    { k:"오이",     r:"o-i",        en:"cucumber",       ar:"خيار",             emoji:"🥒" },
    { k:"지도",     r:"ji-do",      en:"map",            ar:"خريطة",            emoji:"🗺️" },
    { k:"어머니",   r:"eo-meo-ni",  en:"mother",         ar:"أم",               emoji:"👩" },
    { k:"누나",     r:"nu-na",      en:"older sister",   ar:"الأخت الكبرى",       emoji:"👧" },
    { k:"사다",     r:"sa-da",      en:"to buy",         ar:"يشتري",            emoji:"🛒" },
    { k:"자다",     r:"ja-da",      en:"to sleep",       ar:"ينام",             emoji:"😴" },
    { k:"시소",     r:"si-so",      en:"seesaw",         ar:"أرجوحة",           emoji:"🛝" },
    { k:"비",       r:"bi",         en:"rain",           ar:"مطر",              emoji:"🌧️" },
    { k:"자",       r:"ja",         en:"ruler",          ar:"مسطرة",            emoji:"📏" },
    { k:"도시",     r:"do-si",      en:"city",           ar:"مدينة",            emoji:"🏙️" },
    { k:"가구",     r:"ga-gu",      en:"furniture",      ar:"أثاث",             emoji:"🛋️" },
    { k:"모자",     r:"mo-ja",      en:"hat",            ar:"قبعة",             emoji:"🎩" },
    { k:"사자",     r:"sa-ja",      en:"lion",           ar:"أسد",              emoji:"🦁" },
    { k:"나무",     r:"na-mu",      en:"tree",           ar:"شجرة",             emoji:"🌳" },
    { k:"바다",     r:"ba-da",      en:"sea",            ar:"بحر",              emoji:"🌊" },
  ],
  4: [
    { k:"차",       r:"cha",        en:"car / tea",      ar:"سيارة / شاي",       emoji:"🚗" },
    { k:"카드",     r:"ka-deu",     en:"card",           ar:"بطاقة",            emoji:"💳" },
    { k:"코",       r:"ko",         en:"nose",           ar:"أنف",              emoji:"👃" },
    { k:"키",       r:"ki",         en:"key / height",   ar:"مفتاح / طول",       emoji:"🔑" },
    { k:"토마토",   r:"to-ma-to",   en:"tomato",         ar:"طماطم",            emoji:"🍅" },
    { k:"치마",     r:"chi-ma",     en:"skirt",          ar:"تنورة",            emoji:"👗" },
    { k:"보트",     r:"bo-teu",     en:"boat",           ar:"قارب",             emoji:"🚤" },
    { k:"노트",     r:"no-teu",     en:"notebook",       ar:"دفتر",             emoji:"📓" },
    { k:"마트",     r:"ma-teu",     en:"mart / store",   ar:"متجر",             emoji:"🏪" },
    { k:"코트",     r:"ko-teu",     en:"coat",           ar:"معطف",             emoji:"🧥" },
    { k:"키스",     r:"ki-seu",     en:"kiss",           ar:"قبلة",             emoji:"💋" },
    { k:"가르치다", r:"ga-reu-chi-da", en:"to teach",     ar:"يعلّم",             emoji:"👩‍🏫" },
    { k:"가방",     r:"ga-bang",    en:"bag",            ar:"حقيبة",            emoji:"🎒" },
    { k:"나비",     r:"na-bi",      en:"butterfly",      ar:"فراشة",            emoji:"🦋" },
    { k:"다리",     r:"da-ri",      en:"bridge / leg",   ar:"جسر / ساق",         emoji:"🦵" },
    { k:"머리",     r:"meo-ri",     en:"head",           ar:"رأس",              emoji:"🧠" },
    { k:"아이",     r:"a-i",        en:"child",          ar:"طفل",              emoji:"👶" },
    { k:"지도",     r:"ji-do",      en:"map",            ar:"خريطة",            emoji:"🗺️" },
    { k:"누나",     r:"nu-na",      en:"older sister",   ar:"الأخت الكبرى",       emoji:"👧" },
    { k:"사자",     r:"sa-ja",      en:"lion",           ar:"أسد",              emoji:"🦁" },
  ],
  5: [
    { k:"피자",     r:"pi-ja",      en:"pizza",          ar:"بيتزا",            emoji:"🍕" },
    { k:"한국",     r:"han-guk",    en:"Korea",          ar:"كوريا",            emoji:"🇰🇷" },
    { k:"하나",     r:"ha-na",      en:"one",            ar:"واحد",             emoji:"1️⃣" },
    { k:"호두",     r:"ho-du",      en:"walnut",         ar:"جوز",              emoji:"🥜" },
    { k:"포도",     r:"po-do",      en:"grape",          ar:"عنب",              emoji:"🍇" },
    { k:"하마",     r:"ha-ma",      en:"hippo",          ar:"فرس النهر",         emoji:"🦛" },
    { k:"피",       r:"pi",         en:"blood",          ar:"دم",               emoji:"🩸" },
    { k:"코피",     r:"ko-pi",      en:"nose bleed / coffee", ar:"رعاف / قهوة", emoji:"☕" },
    { k:"하루",     r:"ha-ru",      en:"one day",        ar:"يوم واحد",         emoji:"📅" },
    { k:"하다",     r:"ha-da",      en:"to do",          ar:"يفعل",             emoji:"✅" },
    { k:"하늘",     r:"ha-neul",    en:"sky",            ar:"سماء",             emoji:"☁️" },
    { k:"가방",     r:"ga-bang",    en:"bag",            ar:"حقيبة",            emoji:"🎒" },
    { k:"나비",     r:"na-bi",      en:"butterfly",      ar:"فراشة",            emoji:"🦋" },
    { k:"다리",     r:"da-ri",      en:"bridge / leg",   ar:"جسر / ساق",         emoji:"🦵" },
    { k:"어머니",   r:"eo-meo-ni",  en:"mother",         ar:"أم",               emoji:"👩" },
    { k:"아이",     r:"a-i",        en:"child",          ar:"طفل",              emoji:"👶" },
    { k:"지도",     r:"ji-do",      en:"map",            ar:"خريطة",            emoji:"🗺️" },
    { k:"차",       r:"cha",        en:"car / tea",      ar:"سيارة / شاي",       emoji:"🚗" },
    { k:"토마토",   r:"to-ma-to",   en:"tomato",         ar:"طماطم",            emoji:"🍅" },
    { k:"카드",     r:"ka-deu",     en:"card",           ar:"بطاقة",            emoji:"💳" },
  ],
};

// Cumulative dictation lists — only letters taught up to and including the lesson
const LESSON_DICTATION: Record<number, { letters: string[]; words: string[] }> = {
  1: { letters:["ㄱ","ㄴ","ㄷ","ㅏ","ㅓ"],         words:["가","나","다","너","가다"] },
  2: { letters:["ㄹ","ㅁ","ㅂ","ㅗ","ㅜ"],         words:["나무","바다","도로","두부"] },
  3: { letters:["ㅅ","ㅇ","ㅈ","ㅡ","ㅣ"],         words:["가방","나비","다리","아이","지도"] },
  4: { letters:["ㅊ","ㅋ","ㅌ"],                   words:["차","카드","코","토마토"] },
  5: { letters:["ㅍ","ㅎ"],                         words:["피자","한국","하나","포도"] },
  6: { letters:[],                                  words:["가방","나비","다리","아이","지도","한국","피자","오이"] },
};

function LessonVowels({ lesson, lang }: { lesson: number; lang: Lang }) {
  const isAr = lang === "ar";
  const range = LESSON_VOWEL_INDICES[lesson];
  if (!range) return null;
  const vowels = VOWELS.slice(range[0], range[1]);
  const num = isAr ? ["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1] : String(lesson);
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "حروف المد" : "Vowels"}>
      <SHead
        title={isAr ? `حروف المد — الدرس ${num}` : `Vowels — Lesson ${lesson}`}
        subtitle={isAr ? "تعلّم صوتي مد جديدين لتكوين أول مقاطع كورية" : "Two new vowels — combine them with today's consonants to form your first syllables"}
      />
      {vowels.map((v, idx) => {
        const d = isAr ? v.ar : v.en;
        return (
          <div key={v.char} style={{
            paddingTop: idx === 0 ? "0" : "6mm",
            paddingBottom: "6mm",
            borderTop: idx === 0 ? "none" : `1px solid ${BD}`,
            display:"grid", gridTemplateColumns:"100px 1fr", gap:"12mm", alignItems:"start",
          }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"82px", fontWeight:900, color:T1, lineHeight:1, marginBottom:"3mm" }}>{v.char}</div>
              <div style={{ fontSize:"11px", color:T3, fontWeight:700, letterSpacing:"1px" }}>[ {VOWEL_ROMAN[v.char]} ]</div>
              <div style={{ fontSize:"10px", color:T2, marginTop:"2mm" }}>{d.name}</div>
            </div>
            <div>
              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>
                {isAr ? "الصوت" : "Sound"}
              </div>
              <div style={{ fontSize:"13px", color:T1, fontWeight:700, marginBottom:"4mm" }}>{d.sound}</div>
              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>
                {isAr ? "تذكّره هكذا" : "Remember it"}
              </div>
              <div style={{ fontSize:"12px", color:T2, lineHeight:1.7, fontStyle:"italic", borderLeft:`2px solid ${Y}`, paddingLeft:"8px", marginBottom:"4mm" }}>{d.mnemonic}</div>
              <div style={{ fontSize:"10px", color:T3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"2px" }}>
                {isAr ? "كلمة بسيطة" : "Simple word"}
              </div>
              <div style={{ display:"flex", gap:"10px", alignItems:"baseline", direction:"ltr" }}>
                <div style={{ fontSize:"22px", fontWeight:900, color:T1 }}>{d.ex[0].k}</div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:"4mm", borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr ? "💡 جرّب الآن: ضع حروف اليوم الساكنة قبل كل صوت مد لتكوين مقاطع جديدة." : "💡 Try it: place today's consonants before each vowel to build new syllables."}
      </div>
    </Page>
  );
}

function LessonReviewAll({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const allCons = CONSONANTS.map(c => c.char).join("  ");
  const allVow = ["ㅏ","ㅓ","ㅗ","ㅜ","ㅡ","ㅣ"].join("  ");
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "مراجعة شاملة" : "Full Review"}>
      <SHead
        title={isAr ? "الدرس ٦ — مراجعة شاملة + قراءة + إملاء" : "Lesson 6 — Full Review + Reading + Dictation"}
        subtitle={isAr ? "ثبّت كل ما تعلمته في الدروس ١–٥" : "Consolidate everything from Lessons 1–5"}
      />
      <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3mm" }}>
        1. {isAr ? "اقرأ كل الحروف الساكنة بصوت عالٍ" : "Read every consonant out loud"}
      </div>
      <div style={{ fontSize:"34px", fontWeight:900, color:T1, lineHeight:1.4, textAlign:"center", border:`1px solid ${BD}`, borderRadius:"6px", padding:"6mm", background:"#fff", marginBottom:"7mm" }}>{allCons}</div>
      <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3mm" }}>
        2. {isAr ? "اقرأ كل حروف المد" : "Read every vowel"}
      </div>
      <div style={{ fontSize:"34px", fontWeight:900, color:T1, lineHeight:1.4, textAlign:"center", border:`1px solid ${BD}`, borderRadius:"6px", padding:"6mm", background:"#fff", marginBottom:"7mm" }}>{allVow}</div>
      <div style={{ fontSize:"11px", fontWeight:800, color:T1, marginBottom:"3mm" }}>
        3. {isAr ? "إملاء — اكتب ما يقوله المعلم" : "Dictation — write what the teacher says"}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4mm", marginBottom:"6mm" }}>
        {Array(10).fill(null).map((_,i)=>(
          <div key={i} style={{ border:`1px solid ${BD}`, height:"18mm", borderRadius:"4px", background:"#fff", display:"flex", alignItems:"flex-end", justifyContent:"flex-start", padding:"2mm 3mm", fontSize:"9px", color:T3 }}>{i+1}</div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr
          ? "💬 المعلم يقرأ ببطء: 가 / 나 / 다 / 라 / 마 / 바 / 사 / 아 / 자 / 차 → ثم كلمات: 가방 / 나비 / 다리 / 라면 / 물 / 밥 / 사과 / 아이 / 지도 / 한국"
          : "💬 Teacher reads slowly: 가 / 나 / 다 / 라 / 마 / 바 / 사 / 아 / 자 / 차 → then words: 가방 / 나비 / 다리 / 라면 / 물 / 밥 / 사과 / 아이 / 지도 / 한국"}
      </div>
    </Page>
  );
}

function PictureWords({ lesson, lang }: LessonProps) {
  const isAr = lang === "ar";
  const words = LESSON_WORDS[lesson] || [];
  return (
    <Page dir={isAr ? "rtl" : "ltr"} chapter={isAr ? "كلمات بالصور" : "Picture Words"}>
      <SHead title={isAr ? `كلمات بالصور — الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `Picture Words — Lesson ${lesson}`} subtitle={isAr ? "كل كلمة هنا مكوّنة فقط من الحروف ومدّ الصوت التي درستَها حتى الآن" : "Every word below uses only consonants and vowels you have already learned"} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"3mm", marginBottom:"5mm" }}>
        {words.map((w, i) => (
          <div key={`${w.k}-${i}`} style={{ border:`1px solid ${BD}`, borderRadius:"5px", padding:"2.5mm", background:"#fff", direction:isAr?"rtl":"ltr", textAlign:"center" }}>
            <div style={{ height:"15mm", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5mm" }}>
              <WordIllustration emoji={w.emoji} en={w.en} alt={isAr ? w.ar : w.en} size={56} />
            </div>
            <div style={{ fontSize:"17px", fontWeight:900, color:T1, lineHeight:1.1, direction:"ltr" }}>{w.k}</div>
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`3px solid ${Y}`, padding:"4mm 5mm", background:"#fffdf3", fontSize:"11px", color:T2, lineHeight:1.7 }}>
        {isAr
          ? "✍️ اطلب من الطلاب رسم الصورة في المربع الفارغ — كل الحروف ومدّ الصوت في هذه الكلمات سبق شرحها، فلا توجد مفاجآت."
          : "✍️ Ask students to draw the object in the placeholder box — every consonant and vowel here has already been taught, so nothing is unfamiliar."}
      </div>
    </Page>
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

function SyllableWritingGrid({ vowels, consonants, fillFirstRow = true, color = "#7ED957" }:{
  vowels: string[]; consonants: string[]; fillFirstRow?: boolean; color?: string;
}) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:`56px repeat(${vowels.length}, 1fr)`,
      border:`2px solid #fff`,
      background:color,
      borderRadius:"6px",
      overflow:"hidden",
      direction:"ltr",
    }}>
      {/* Top-left empty corner */}
      <div style={{ background:color, borderRight:"2px solid #fff", borderBottom:"2px solid #fff", height:"34px" }} />
      {/* Vowel header row */}
      {vowels.map(v => (
        <div key={"vh-"+v} style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          height:"34px", fontSize:"22px", fontWeight:900, color:"#111",
          borderRight:"2px solid #fff", borderBottom:"2px solid #fff",
        }}>{v}</div>
      ))}
      {/* Body rows */}
      {consonants.map((c, ci) => (
        <Fragment key={"row-"+c}>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            height:"34px", fontSize:"22px", fontWeight:900, color:"#111",
            borderRight:"2px solid #fff", borderBottom:"2px solid #fff",
          }}>{c}</div>
          {vowels.map(v => (
            <div key={"cell-"+c+v} style={{
              display:"flex", alignItems:"center", justifyContent:"center",
              height:"34px", fontSize:"20px", fontWeight:900, color:"#111",
              borderRight:"2px solid #fff", borderBottom:"2px solid #fff",
              background: ci === 0 && fillFirstRow ? "#A8E690" : color,
            }}>{ci === 0 && fillFirstRow ? buildSyllable(c, v) : ""}</div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function SyllableWritingPage({ lang, mode }:{ lang:"ar"|"en"; mode:"basic"|"compound" }) {
  const isAr = lang === "ar";
  const consonants = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅇ","ㅁ","ㅂ","ㅅ","ㅈ","ㅎ"];
  const basicVowels = ["ㅏ","ㅑ","ㅓ","ㅕ","ㅗ","ㅛ","ㅜ","ㅠ","ㅡ","ㅣ"];
  const compoundVowels = ["ㅐ","ㅔ","ㅒ","ㅖ","ㅚ","ㅟ","ㅢ","ㅘ","ㅝ","ㅙ","ㅞ"];
  const vowels = mode === "basic" ? basicVowels : compoundVowels;
  const titleAr = mode === "basic" ? "음절 — اجمع المد مع الحروف الساكنة" : "اجمع المد المُركَّب مع الحروف الساكنة";
  const titleEn = mode === "basic" ? "음절 — Combine the vowels and consonants" : "Combine the compound vowels and consonants";
  const instructAr = mode === "basic"
    ? "الصف الأول مكتمل كمثال. أكمل المربعات الفارغة بدمج الحرف الساكن مع حرف المد."
    : "الصف الأول مكتمل كمثال. أكمل المربعات الفارغة بدمج الحرف الساكن مع حرف المد المُركَّب.";
  const instructEn = mode === "basic"
    ? "Row 1 is filled in as an example. Complete the blank cells by combining each consonant with each vowel."
    : "Row 1 is filled in as an example. Complete the blank cells by combining each consonant with each compound vowel.";
  return (
    <Page dir={isAr ? "rtl" : "ltr"} bgColor={KIDS_PINK}>
      <div style={{
        background:KIDS_RED, color:"#fff", borderRadius:"30px",
        padding:"10px 20px", display:"flex", justifyContent:"center",
        alignItems:"center", gap:"10px", marginBottom:"5mm",
        boxShadow:"0 4px 0 rgba(0,0,0,0.08)",
      }}>
        <div style={{ fontSize:"20px", fontWeight:900 }}>{isAr ? titleAr : titleEn}</div>
      </div>
      <div style={{ marginBottom:"4mm" }}>
        <SectionBadge icon="✍️" label={isAr ? "تدريب الكتابة" : "Writing Practice"} color={KIDS_GREEN} dir={isAr?"rtl":"ltr"} />
      </div>
      <p style={{ fontSize:"12px", color:"#222", fontWeight:700, marginBottom:"5mm", direction: isAr ? "rtl" : "ltr" }}>
        {isAr ? instructAr : instructEn}
      </p>
      <SyllableWritingGrid vowels={vowels} consonants={consonants} />
    </Page>
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
          {isAr ? `واجب الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `Lesson ${lesson} Homework`}
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
          {isAr ? `بعد الدرس ${["١","٢","٣","٤","٥","٦","٧","٨"][lesson-1]}` : `After Lesson ${lesson}`}
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
            <HowToUse lang="ar" />
            {/* LESSONS 1-2 — Consonants Part 1 (ㄱㄴㄷ + ㅏㅓ, ㄹㅁㅂ + ㅗㅜ) */}
            {[
              { lesson:1, slice:[0,3] as [number,number] },
              { lesson:2, slice:[3,6] as [number,number] },
            ].map(L => (
              <Fragment key={`ar-l${L.lesson}`}>
                <TeachLetters lesson={L.lesson} slice={L.slice} lang="ar" />
                {LESSON_VOWEL_INDICES[L.lesson] && <LessonVowels lesson={L.lesson} lang="ar" />}
                <PictureWords lesson={L.lesson} slice={L.slice} lang="ar" />
                <PracticeLetters lesson={L.lesson} slice={L.slice} lang="ar" />
                <SpeakingDrill lesson={L.lesson} slice={L.slice} lang="ar" />
                <Dictation lesson={L.lesson} slice={L.slice} lang="ar" />
                <MiniReading lesson={L.lesson} slice={L.slice} lang="ar" />
                <ReviewLetters lesson={L.lesson} slice={L.slice} lang="ar" />
                <Homework lesson={L.lesson} slice={L.slice} lang="ar" />
                <DailyPractice lesson={L.lesson} lang="ar" />
              </Fragment>
            ))}
            {/* LESSONS 3-5 — Complete Consonants (ㅅ ㅇ ㅈ + ㅡㅣ, ㅊ ㅋ ㅌ, ㅍ ㅎ) */}
            {[
              { lesson:3, slice:[6,9] as [number,number] },
              { lesson:4, slice:[9,12] as [number,number] },
              { lesson:5, slice:[12,14] as [number,number] },
            ].map(L => (
              <Fragment key={`ar-l${L.lesson}`}>
                <TeachLetters lesson={L.lesson} slice={L.slice} lang="ar" />
                {LESSON_VOWEL_INDICES[L.lesson] && <LessonVowels lesson={L.lesson} lang="ar" />}
                <PictureWords lesson={L.lesson} slice={L.slice} lang="ar" />
                <PracticeLetters lesson={L.lesson} slice={L.slice} lang="ar" />
                <SpeakingDrill lesson={L.lesson} slice={L.slice} lang="ar" />
                <Dictation lesson={L.lesson} slice={L.slice} lang="ar" />
                <MiniReading lesson={L.lesson} slice={L.slice} lang="ar" />
                <ReviewLetters lesson={L.lesson} slice={L.slice} lang="ar" />
                <Homework lesson={L.lesson} slice={L.slice} lang="ar" />
                <DailyPractice lesson={L.lesson} lang="ar" />
              </Fragment>
            ))}
            {/* LESSON 6 — Full Review + Reading + Dictation */}
            <LessonReviewAll lang="ar" />
            <SyllableAr />
            <SyllableWritingPage lang="ar" mode="basic" />
            <ReadingPractice lang="ar" />
            {/* LESSON 7 — Compound Vowels */}
            <CompoundVowelsAr />
            <SyllableWritingPage lang="ar" mode="compound" />
            {/* LESSON 8 — Batchim (simplified) */}
            <BatchimLesson part={1} lang="ar" />
            <BatchimLesson part={2} lang="ar" />
            <KdramaPageAr slice={[0,10]} page={1} />
            <KdramaPageAr slice={[10,20]} page={2} />
            <FinalTest lang="ar" />
            <Certificate lang="ar" />
            {/* ADVANCED / BONUS */}
            <AspiratedAr />
            <BatchimLesson part={3} lang="ar" />
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
            <HowToUse lang="en" />
            {/* LESSONS 1-2 — Consonants Part 1 (ㄱㄴㄷ + ㅏㅓ, ㄹㅁㅂ + ㅗㅜ) */}
            {[
              { lesson:1, slice:[0,3] as [number,number] },
              { lesson:2, slice:[3,6] as [number,number] },
            ].map(L => (
              <Fragment key={`en-l${L.lesson}`}>
                <TeachLetters lesson={L.lesson} slice={L.slice} lang="en" />
                {LESSON_VOWEL_INDICES[L.lesson] && <LessonVowels lesson={L.lesson} lang="en" />}
                <PictureWords lesson={L.lesson} slice={L.slice} lang="en" />
                <PracticeLetters lesson={L.lesson} slice={L.slice} lang="en" />
                <SpeakingDrill lesson={L.lesson} slice={L.slice} lang="en" />
                <Dictation lesson={L.lesson} slice={L.slice} lang="en" />
                <MiniReading lesson={L.lesson} slice={L.slice} lang="en" />
                <ReviewLetters lesson={L.lesson} slice={L.slice} lang="en" />
                <Homework lesson={L.lesson} slice={L.slice} lang="en" />
                <DailyPractice lesson={L.lesson} lang="en" />
              </Fragment>
            ))}
            {/* LESSONS 3-5 — Complete Consonants */}
            {[
              { lesson:3, slice:[6,9] as [number,number] },
              { lesson:4, slice:[9,12] as [number,number] },
              { lesson:5, slice:[12,14] as [number,number] },
            ].map(L => (
              <Fragment key={`en-l${L.lesson}`}>
                <TeachLetters lesson={L.lesson} slice={L.slice} lang="en" />
                {LESSON_VOWEL_INDICES[L.lesson] && <LessonVowels lesson={L.lesson} lang="en" />}
                <PictureWords lesson={L.lesson} slice={L.slice} lang="en" />
                <PracticeLetters lesson={L.lesson} slice={L.slice} lang="en" />
                <SpeakingDrill lesson={L.lesson} slice={L.slice} lang="en" />
                <Dictation lesson={L.lesson} slice={L.slice} lang="en" />
                <MiniReading lesson={L.lesson} slice={L.slice} lang="en" />
                <ReviewLetters lesson={L.lesson} slice={L.slice} lang="en" />
                <Homework lesson={L.lesson} slice={L.slice} lang="en" />
                <DailyPractice lesson={L.lesson} lang="en" />
              </Fragment>
            ))}
            {/* LESSON 6 — Full Review + Reading + Dictation */}
            <LessonReviewAll lang="en" />
            <SyllableEn />
            <SyllableWritingPage lang="en" mode="basic" />
            <ReadingPractice lang="en" />
            {/* LESSON 7 — Compound Vowels */}
            <CompoundVowelsEn />
            <SyllableWritingPage lang="en" mode="compound" />
            {/* LESSON 8 — Batchim (simplified) */}
            <BatchimLesson part={1} lang="en" />
            <BatchimLesson part={2} lang="en" />
            <KdramaPageEn slice={[0,10]} page={1} />
            <KdramaPageEn slice={[10,20]} page={2} />
            <FinalTest lang="en" />
            <Certificate lang="en" />
            {/* ADVANCED / BONUS */}
            <AspiratedEn />
            <BatchimLesson part={3} lang="en" />
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
