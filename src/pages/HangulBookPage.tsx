import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

/* ─── Brand tokens ─────────────────────────────── */
const Y   = "#FFFF00";   // primary yellow
const YL  = "#FFFFBB";   // light yellow (warm accent)
const GL  = "#C8FFD4";   // light mint green (clover accent)
const GD  = "#166534";   // dark green (green on green)
const BK  = "#111111";
const BK2 = "#222222";

/* ─── Pexels free photos (confirmed IDs, no attribution required) ── */
const PX = (id: number, w=800, h=500) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

const PHOTOS = {
  seoulNight:   PX(32164874),   // Cherry blossoms + Seoul Tower at night
  seoulNeon:    PX(32164874),   // same scenic night shot (different crop via h)
  hanbok:       PX(31743249),   // Woman in traditional hanbok at palace
  palace:       PX(11870589),   // Gyeongbokgung Palace Seoul
  palaceGate:   PX(36045999),   // Snowy Gyeongbokgung in winter
  koreanFood:   PX(8954371),    // Korean kimchi in bowl
  kimchi:       PX(8954371),    // Korean kimchi
  cherryBlossom:PX(32164874),   // Cherry blossoms Seoul Tower night
  kpopCrowd:    PX(18447992),   // Concert lights
  temple:       PX(12176008),   // Landscape Gyeongbokgung with hanbok
  hanokVillage: PX(11870589),   // Palace (hanok-style architecture)
};

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

function Photo({ src, alt, h = 140, radius = 10, overlay = false }: {
  src: string; alt: string; h?: number; radius?: number; overlay?: boolean;
}) {
  return (
    <div style={{ position:"relative", borderRadius:`${radius}px`, overflow:"hidden", height:`${h}px` }}>
      <img
        src={src} alt={alt}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {overlay && (
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))" }} />
      )}
      <div style={{ position:"absolute", bottom:"4px", right:"6px", fontSize:"7px", color:"rgba(255,255,255,0.5)" }}>
        Photo: Pexels
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
    en:{ name:"Giyeok", sound:"Like 'g' in go; 'k' at end of syllable", mnemonic:"A bent arm holding a GUN — fires a 'G' sound", eq:"g / k", ex:[{k:"가방",r:"ga-bang",m:"bag"},{k:"고양이",r:"go-yang-i",m:"cat"}] },
    ar:{ name:"جييوك", sound:"مثل 'ك' في كلمة / 'ق' في قلم", mnemonic:"ذراع منحنية تمسك مسدساً — صوت 'ك'", eq:"ك / ق", ex:[{k:"가방",r:"غا-بانغ",m:"حقيبة"},{k:"고양이",r:"غو-يانغ-إي",m:"قط"}] },
  },
  {
    char:"ㄴ", roman:"n", emoji:"👃",
    en:{ name:"Nieun", sound:"Like 'n' in no", mnemonic:"A NOSE seen from the side — tip points right", eq:"n", ex:[{k:"나비",r:"na-bi",m:"butterfly"},{k:"눈",r:"nun",m:"eye / snow"}] },
    ar:{ name:"نييون", sound:"مثل 'ن' في نعم", mnemonic:"أنف من الجانب — طرفه يشير لليمين", eq:"ن", ex:[{k:"나비",r:"نا-بي",m:"فراشة"},{k:"눈",r:"نون",m:"عين / ثلج"}] },
  },
  {
    char:"ㄷ", roman:"d / t", emoji:"🚪",
    en:{ name:"Digeut", sound:"Like 'd' in door; 't' at end", mnemonic:"An open DOOR frame viewed from above", eq:"d / t", ex:[{k:"달",r:"dal",m:"moon"},{k:"도시",r:"do-si",m:"city"}] },
    ar:{ name:"ديغوت", sound:"مثل 'د' في دار / 'ت' في النهاية", mnemonic:"إطار باب مفتوح ينظر إليه من الأعلى", eq:"د / ت", ex:[{k:"달",r:"دال",m:"قمر"},{k:"도시",r:"دو-سي",m:"مدينة"}] },
  },
  {
    char:"ㄹ", roman:"r / l", emoji:"🎢",
    en:{ name:"Rieul", sound:"A flap sound — tongue between R and L", mnemonic:"A ROLLER-COASTER track, rolling between R and L", eq:"r / l", ex:[{k:"라면",r:"ra-myeon",m:"ramen"},{k:"사랑",r:"sa-rang",m:"love"}] },
    ar:{ name:"ريول", sound:"بين 'ر' و'ل' — طرف اللسان يرتد سريعاً", mnemonic:"مسار أفعوانية — يتحرك بين الراء واللام", eq:"ر / ل", ex:[{k:"라면",r:"را-ميون",m:"رامن"},{k:"사랑",r:"سا-رانغ",m:"حب"}] },
  },
  {
    char:"ㅁ", roman:"m", emoji:"👄",
    en:{ name:"Mieum", sound:"Like 'm' in mom", mnemonic:"A square MOUTH sealed shut — M for Mouth", eq:"m", ex:[{k:"물",r:"mul",m:"water"},{k:"마음",r:"ma-eum",m:"heart/mind"}] },
    ar:{ name:"مييوم", sound:"مثل 'م' في ماء", mnemonic:"فم مربع مغلق تماماً — م للفم", eq:"م", ex:[{k:"물",r:"مول",m:"ماء"},{k:"마음",r:"ما-أوم",m:"قلب"}] },
  },
  {
    char:"ㅂ", roman:"b / p", emoji:"📦",
    en:{ name:"Bieup", sound:"Like 'b' in boy; 'p' at end", mnemonic:"A BOX with arms — B for Box sealed shut", eq:"b / p", ex:[{k:"밥",r:"bap",m:"rice"},{k:"버스",r:"beo-seu",m:"bus"}] },
    ar:{ name:"بييوب", sound:"مثل 'ب' في بيت / 'پ' في النهاية", mnemonic:"صندوق مع ذراعين — ب للصندوق المغلق", eq:"ب / پ", ex:[{k:"밥",r:"باب",m:"أرز"},{k:"버스",r:"بو-سو",m:"أتوبيس"}] },
  },
  {
    char:"ㅅ", roman:"s", emoji:"⛰️",
    en:{ name:"Siot", sound:"Like 's' in sun", mnemonic:"A mountain PEAK — the Sun shines from the top", eq:"s", ex:[{k:"사랑",r:"sa-rang",m:"love"},{k:"스타",r:"seu-ta",m:"star"}] },
    ar:{ name:"سييوت", sound:"مثل 'س' في سماء", mnemonic:"قمة جبل — الشمس تسطع من الأعلى", eq:"س", ex:[{k:"사랑",r:"سا-رانغ",m:"حب"},{k:"스타",r:"سو-تا",m:"نجم"}] },
  },
  {
    char:"ㅇ", roman:"∅ / ng", emoji:"⭕",
    en:{ name:"Ieung", sound:"Silent at start; 'ng' (like sing) at end", mnemonic:"A ZERO circle — starts silent, ends like a ring", eq:"silent / ng", ex:[{k:"아이",r:"a-i",m:"child"},{k:"강",r:"gang",m:"river"}] },
    ar:{ name:"ييونغ", sound:"صامت في بداية المقطع؛ 'نغ' (مثل ring) في النهاية", mnemonic:"دائرة صفر — صامت في البداية، 'نغ' في النهاية", eq:"صامت / نغ", ex:[{k:"아이",r:"أ-إي",m:"طفل"},{k:"강",r:"غانغ",m:"نهر"}] },
  },
  {
    char:"ㅈ", roman:"j", emoji:"⭐",
    en:{ name:"Jieut", sound:"Like 'j' in juice", mnemonic:"A star shape with a hat — JUMPING star", eq:"j", ex:[{k:"저",r:"jeo",m:"I / me (formal)"},{k:"좋아요",r:"jo-a-yo",m:"I like it"}] },
    ar:{ name:"جييوت", sound:"مثل 'ج' في جميل", mnemonic:"نجمة بقبعة — نجمة قافزة", eq:"ج", ex:[{k:"저",r:"جو",m:"أنا (رسمي)"},{k:"좋아요",r:"جو-أ-يو",m:"أحبه"}] },
  },
  {
    char:"ㅊ", roman:"ch", emoji:"👑",
    en:{ name:"Chieut", sound:"Like 'ch' in chair — aspirated version of ㅈ", mnemonic:"ㅈ wearing a CROWN — same sound with a puff of air", eq:"ch", ex:[{k:"친구",r:"chin-gu",m:"friend"},{k:"차",r:"cha",m:"tea / car"}] },
    ar:{ name:"تشييوت", sound:"مثل 'تش' — نفس ㅈ مع نفخة هواء قوية", mnemonic:"ㅈ مع تاج — نفس الصوت لكن مع نفخة", eq:"تش / چ", ex:[{k:"친구",r:"تشين-غو",m:"صديق"},{k:"차",r:"تشا",m:"شاي / سيارة"}] },
  },
  {
    char:"ㅋ", roman:"k", emoji:"💨",
    en:{ name:"Kieuk", sound:"Aspirated 'k' — ㄱ with a strong puff of air", mnemonic:"ㄱ with an extra KICK bar — harder K", eq:"k (aspirated)", ex:[{k:"카페",r:"ka-pe",m:"café"},{k:"코",r:"ko",m:"nose"}] },
    ar:{ name:"كييوك", sound:"'ك' مع نفخة هواء قوية — ㄱ أقوى", mnemonic:"ㄱ مع خط إضافي — 'ك' أشد وأقوى", eq:"ك (مع نفخة)", ex:[{k:"카페",r:"كا-بيه",m:"مقهى"},{k:"코",r:"كو",m:"أنف"}] },
  },
  {
    char:"ㅌ", roman:"t", emoji:"🌬️",
    en:{ name:"Tieut", sound:"Aspirated 't' — ㄷ with a strong puff of air", mnemonic:"ㄷ with a middle BAR — a door frame reinforced", eq:"t (aspirated)", ex:[{k:"택시",r:"taek-si",m:"taxi"},{k:"토끼",r:"to-kki",m:"rabbit"}] },
    ar:{ name:"تييوت", sound:"'ت' مع نفخة هواء قوية — ㄷ أقوى", mnemonic:"ㄷ مع خط وسطي — إطار باب مُعزَّز", eq:"ت (مع نفخة)", ex:[{k:"택시",r:"تيك-سي",m:"تاكسي"},{k:"토끼",r:"تو-كي",m:"أرنب"}] },
  },
  {
    char:"ㅍ", roman:"p", emoji:"🦅",
    en:{ name:"Pieup", sound:"Aspirated 'p' — ㅂ with a strong puff of air", mnemonic:"Two arms wide open — PUFFING with energy", eq:"p (aspirated)", ex:[{k:"파티",r:"pa-ti",m:"party"},{k:"편의점",r:"pyeo-ni-jeom",m:"convenience store"}] },
    ar:{ name:"بييوب الكبير", sound:"'ب' مع نفخة هواء قوية — ㅂ أقوى", mnemonic:"ذراعان مفتوحتان على مصراعيهما — 'ب' مع قوة", eq:"ب (مع نفخة)", ex:[{k:"파티",r:"با-تي",m:"حفلة"},{k:"편의점",r:"بيو-ني-جوم",m:"دكان صغير"}] },
  },
  {
    char:"ㅎ", roman:"h", emoji:"🎩",
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
function Page({ children, dir = "ltr" }: { children: React.ReactNode; dir?: "ltr" | "rtl" }) {
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
        <div style={{ fontSize:"18px", marginTop:"3px" }}>{c.emoji}</div>
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
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
          {d.ex.map((ex, i) => (
            <div key={i} style={{
              background:BK2, borderRadius:"5px",
              padding:"2px 6px", fontSize:"11px", color:"#fff",
            }}>
              <span style={{ color:Y, fontWeight:800 }}>{ex.k}</span> — {ex.m}
            </div>
          ))}
        </div>
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

/* ── History page AR ── */
function HistoryAr() {
  return (
    <Page dir="rtl">
      <SHead title="تاريخ اللغة الكورية" subtitle="رحلة ٢٠٠٠ عام من الكلمات والحكايات" />

      {/* Photo header */}
      <div style={{ marginBottom:"10px", borderRadius:"10px", overflow:"hidden" }}>
        <Photo src={PHOTOS.palaceGate} alt="Gyeongbokgung Palace Gate" h={110} radius={10} overlay />
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
          <Photo src={PHOTOS.palace} alt="Gyeongbokgung Palace" h={100} radius={0} />
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
          <Photo src={PHOTOS.seoulNeon} alt="Seoul neon" h={75} radius={0} overlay />
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
          <Photo src={PHOTOS.kpopCrowd} alt="K-Pop concert" h={75} radius={0} overlay />
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
          <Photo src={PHOTOS.kimchi} alt="Korean kimchi" h={65} radius={0} />
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
          <TaegeukIcon size={20} />
          <span style={{ fontSize:"12px", fontWeight:900, color:"rgba(255,255,0,0.65)", letterSpacing:"6px" }}>KLOVERS</span>
          <div style={{ flex:1, height:"1px", background:"rgba(255,255,0,0.22)" }} />
        </div>

        {/* Publisher tag */}
        <div style={{ textAlign:"center", marginBottom:"6mm" }}>
          <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", letterSpacing:"3px" }}>KLOVERS KOREAN ACADEMY</span>
        </div>

        {/* ── HERO: 한글 ── */}
        <div style={{ textAlign:"center", padding:"0 10mm", marginBottom:"6mm" }}>
          <div style={{
            fontSize:"172px", fontWeight:900, color:Y, lineHeight:0.88,
            textShadow:"0 0 50px rgba(255,255,0,0.75), 0 0 100px rgba(255,255,0,0.35), 0 0 180px rgba(255,255,0,0.18)",
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
          <Photo src={PHOTOS.seoulNight} alt="Seoul at night" h={100} radius={0} overlay />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, transparent 35%, transparent 65%, rgba(8,8,8,0.55) 100%)" }} />
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
          <div style={{ fontSize:"13px", color:"rgba(255,255,0,0.75)", fontWeight:700, letterSpacing:"1px" }}>
            النسخة العربية–الكورية الحصرية
          </div>
        </div>

        {/* Glassmorphism tags */}
        <div style={{ display:"flex", gap:"7px", justifyContent:"center", flexWrap:"wrap", padding:"0 14mm", marginBottom:"7mm" }}>
          {["🎬 مسلسلات كورية", "🎵 كيبوب", "🌸 ثقافة كورية"].map(t => (
            <span key={t} style={{
              background:"rgba(255,255,0,0.09)", color:"rgba(255,255,0,0.88)",
              border:"1px solid rgba(255,255,0,0.28)",
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
              border:"1.5px solid rgba(255,255,0,0.5)", borderRadius:"7px",
              padding:"5px 22px", textAlign:"center",
            }}>
              <span style={{ fontSize:"11px", fontWeight:900, color:"rgba(255,255,0,0.85)", letterSpacing:"1px" }}>
                المستوى ١ — مبتدئ
              </span>
            </div>
          </div>

          {/* Alphabet strip */}
          <div style={{ display:"flex", gap:"3px", justifyContent:"center", marginBottom:"9px" }}>
            {"ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜ".split("").map((ch,i) => (
              <div key={i} style={{
                width:"21px", height:"21px",
                background:`rgba(255,255,0,${i%3===0?0.14:i%3===1?0.07:0.10})`,
                border:"1px solid rgba(255,255,0,0.18)",
                borderRadius:"4px",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"12px", color:"rgba(255,255,0,0.75)", fontWeight:700,
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
    </Page>
  );
}

/* ── Table of Contents AR ── */
function TocAr() {
  const chapters = [
    { n:"١",  title:"تاريخ اللغة الكورية",         icon:"📜", page:3 },
    { n:"٢",  title:"الملك سيجونغ العظيم",          icon:"👑", page:4 },
    { n:"٣",  title:"الثقافة الكورية",               icon:"🌸", page:5 },
    { n:"٤",  title:"سلسلة كتب Klovers",             icon:"📚", page:6 },
    { n:"٥",  title:"مرحباً بعالم الهانغول",         icon:"🎉", page:7 },
    { n:"٦",  title:"الحروف الساكنة — الجزء الأول",  icon:"🔤", page:8 },
    { n:"٧",  title:"الحروف الساكنة — الجزء الثاني", icon:"🔤", page:9 },
    { n:"٨",  title:"حروف المد",                     icon:"🗣️", page:10 },
    { n:"٩",  title:"بناء الكتل المقطعية",            icon:"🏗️", page:11 },
    { n:"١٠", title:"الباتشيم — الحرف الساكن الأخير", icon:"⬇️", page:12 },
    { n:"١١", title:"الباتشيم المزدوج",               icon:"✌️", page:13 },
    { n:"١٢", title:"أساسيات المسلسلات الكورية",     icon:"🎬", page:14 },
    { n:"١٣", title:"تمارين تطبيقية",                icon:"✏️", page:15 },
    { n:"١٤", title:"مفتاح الإجابات والمرجع السريع", icon:"🏆", page:16 },
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
            <div style={{ flex:1, fontSize:"12px", fontWeight:700, color:BK }}>{ch.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
              <div style={{ width:"50px", borderBottom:"1px dashed #ccc" }} />
              <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"12px", padding:"2px 10px", borderRadius:"6px" }}>{ch.page}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"12px", alignItems:"center" }}>
        <TaegeukIcon size={42} />
        <div>
          <div style={{ fontSize:"13px", fontWeight:900, color:Y, marginBottom:"3px" }}>رحلتك تبدأ من هنا 🚀</div>
          <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.6 }}>اقرأ كل فصل بالترتيب — كل فصل يبني على السابق. في ٧ أيام ستقرأ الكورية!</div>
        </div>
      </div>
    </Page>
  );
}

function ConsonantsAr({ slice, page }: { slice:[number,number]; page:number }) {
  const count = slice[1] - slice[0];
  const kpopLyrics = page === 1
    ? { lyric:"사랑해", rom:"sa-rang-hae", meaning:"أحبك", song:"BTS — Boy In Luv" }
    : { lyric:"고마워", rom:"go-ma-wo", meaning:"شكراً", song:"IU — Palette" };
  return (
    <Page dir="rtl">
      <SHead title={`الحروف الساكنة (자음) — الجزء ${page===1?"١":"٢"} من ٢`} subtitle="كل مقطع كوري يبدأ بحرف ساكن" />
      {/* Marzano "I can..." learning objective */}
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"7px", fontWeight:700 }}>
        ✅ بنهاية هذه الصفحة ستتمكن من: قراءة ونطق <strong>{count}</strong> حروف كورية جديدة وكتابتها بنفسك!
      </div>
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
    </Page>
  );
}

function VowelsAr() {
  return (
    <Page dir="rtl">
      <SHead title="حروف المد (모음)" subtitle="حروف المد لا تقف وحدها — تحتاج دائماً حرفاً ساكناً" />
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px", marginBottom:"10px" }}>
        {GYEOP.map((g,i)=>(
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

function KdramaAr() {
  return (
    <Page dir="rtl">
      <SHead title="أساسيات المسلسلات الكورية 🎬" subtitle="كلمات سمعتها مئة مرة — اقرأها الآن بالهانغول!" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
        {KDRAMA_AR.map(v=>(
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

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>تمرين ١ — اختر الصوت الصحيح لكل حرف</div>
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
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>تمرين ٢ — اكتب النطق بالحروف اللاتينية</div>
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
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>تمرين ٣ — ادمج الحروف لتكوين مقطع</div>
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
        <Photo src={PHOTOS.hanokVillage} alt="Bukchon Hanok Village" h={110} radius={10} overlay />
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
          <Photo src={PHOTOS.palaceGate} alt="Gyeongbokgung Gate" h={100} radius={0} />
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
          <Photo src={PHOTOS.seoulNight} alt="Seoul night skyline" h={75} radius={0} overlay />
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
          <Photo src={PHOTOS.kpopCrowd} alt="K-Pop concert crowd" h={75} radius={0} overlay />
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
          <Photo src={PHOTOS.koreanFood} alt="Korean food" h={65} radius={0} />
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
          <TaegeukIcon size={20} />
          <span style={{ fontSize:"12px", fontWeight:900, color:"rgba(255,255,0,0.65)", letterSpacing:"6px" }}>KLOVERS</span>
          <div style={{ flex:1, height:"1px", background:"rgba(255,255,0,0.22)" }} />
        </div>

        {/* Publisher tag */}
        <div style={{ textAlign:"center", marginBottom:"6mm" }}>
          <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", letterSpacing:"3px" }}>KLOVERS KOREAN ACADEMY</span>
        </div>

        {/* ── HERO: 한글 ── */}
        <div style={{ textAlign:"center", padding:"0 10mm", marginBottom:"6mm" }}>
          <div style={{
            fontSize:"172px", fontWeight:900, color:Y, lineHeight:0.88,
            textShadow:"0 0 50px rgba(255,255,0,0.75), 0 0 100px rgba(255,255,0,0.35), 0 0 180px rgba(255,255,0,0.18)",
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
          <Photo src={PHOTOS.palace} alt="Gyeongbokgung Palace" h={100} radius={0} overlay />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, transparent 35%, transparent 65%, rgba(8,8,8,0.55) 100%)" }} />
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
          <div style={{ fontSize:"13px", color:"rgba(255,255,0,0.75)", fontWeight:700, letterSpacing:"1px" }}>
            Exclusive English–Korean Edition
          </div>
        </div>

        {/* Glassmorphism tags */}
        <div style={{ display:"flex", gap:"7px", justifyContent:"center", flexWrap:"wrap", padding:"0 14mm", marginBottom:"7mm" }}>
          {["🎬 K-Drama", "🎵 K-Pop", "🌸 Korean Culture"].map(t => (
            <span key={t} style={{
              background:"rgba(255,255,0,0.09)", color:"rgba(255,255,0,0.88)",
              border:"1px solid rgba(255,255,0,0.28)",
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
              border:"1.5px solid rgba(255,255,0,0.5)", borderRadius:"7px",
              padding:"5px 22px", textAlign:"center",
            }}>
              <span style={{ fontSize:"11px", fontWeight:900, color:"rgba(255,255,0,0.85)", letterSpacing:"1px" }}>
                Level 1 — Beginner
              </span>
            </div>
          </div>

          {/* Alphabet strip */}
          <div style={{ display:"flex", gap:"3px", justifyContent:"center", marginBottom:"9px" }}>
            {"ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜ".split("").map((ch,i) => (
              <div key={i} style={{
                width:"21px", height:"21px",
                background:`rgba(255,255,0,${i%3===0?0.14:i%3===1?0.07:0.10})`,
                border:"1px solid rgba(255,255,0,0.18)",
                borderRadius:"4px",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"12px", color:"rgba(255,255,0,0.75)", fontWeight:700,
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
    </Page>
  );
}

/* ── Table of Contents EN ── */
function TocEn() {
  const chapters = [
    { n:"1",  title:"The History of the Korean Language",  icon:"📜", page:3 },
    { n:"2",  title:"King Sejong the Great",               icon:"👑", page:4 },
    { n:"3",  title:"Korean Culture",                      icon:"🌸", page:5 },
    { n:"4",  title:"The Klovers Book Series",             icon:"📚", page:6 },
    { n:"5",  title:"Welcome to Hangul!",                  icon:"🎉", page:7 },
    { n:"6",  title:"Consonants — Part 1 of 2",            icon:"🔤", page:8 },
    { n:"7",  title:"Consonants — Part 2 of 2",            icon:"🔤", page:9 },
    { n:"8",  title:"Vowels",                              icon:"🗣️", page:10 },
    { n:"9",  title:"Building Syllable Blocks",            icon:"🏗️", page:11 },
    { n:"10", title:"Batchim — The Final Consonant",       icon:"⬇️", page:12 },
    { n:"11", title:"Double Batchim (겹받침)",              icon:"✌️", page:13 },
    { n:"12", title:"K-Drama Essentials",                  icon:"🎬", page:14 },
    { n:"13", title:"Practice Exercises",                  icon:"✏️", page:15 },
    { n:"14", title:"Answer Key & Quick Reference",        icon:"🏆", page:16 },
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
            <div style={{ flex:1, fontSize:"12px", fontWeight:700, color:BK }}>{ch.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
              <div style={{ width:"50px", borderBottom:"1px dashed #ccc" }} />
              <div style={{ background:Y, color:BK, fontWeight:900, fontSize:"12px", padding:"2px 10px", borderRadius:"6px" }}>{ch.page}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"12px", padding:"12px", display:"flex", gap:"12px", alignItems:"center" }}>
        <TaegeukIcon size={42} />
        <div>
          <div style={{ fontSize:"13px", fontWeight:900, color:Y, marginBottom:"3px" }}>Your journey starts here 🚀</div>
          <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.6 }}>Read each chapter in order — every chapter builds on the last. In 7 days you'll be reading Korean!</div>
        </div>
      </div>
    </Page>
  );
}

function ConsonantsEn({ slice, page }: { slice:[number,number]; page:number }) {
  const count = slice[1] - slice[0];
  const kpopLyrics = page === 1
    ? { lyric:"사랑해", rom:"sa-rang-hae", meaning:"I love you", song:"BTS — Boy In Luv" }
    : { lyric:"고마워", rom:"go-ma-wo", meaning:"Thank you", song:"IU — Palette" };
  return (
    <Page dir="ltr">
      <SHead title={`Consonants (자음) — Part ${page} of 2`} subtitle="Every Korean syllable begins with a consonant" />
      {/* Marzano "I can..." learning objective */}
      <div style={{ background:"#f0fff4", border:"2px solid #22c55e", borderRadius:"8px", padding:"7px 10px", fontSize:"11px", color:"#166534", marginBottom:"7px", fontWeight:700 }}>
        ✅ By the end of this page you will be able to: read, pronounce, and write <strong>{count}</strong> new Korean letters!
      </div>
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px", marginBottom:"10px" }}>
        {GYEOP.map((g,i)=>(
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

function KdramaEn() {
  return (
    <Page dir="ltr">
      <SHead title="K-Drama Essentials 🎬" subtitle="Words you've heard 100 times — now read them in Hangul!" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
        {KDRAMA_EN.map(v=>(
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

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>Exercise 1 — Circle the correct romanization</div>
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
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>Exercise 2 — Write the romanization below each word</div>
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
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>Exercise 3 — Combine the letters to form a syllable</div>
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
        <div style={{ background:Y, borderRadius:"40px", padding:"8px 24px", display:"flex", alignItems:"center", gap:"10px" }}>
          <TaegeukIcon size={26} />
          <span style={{ fontSize:"18px", fontWeight:900, color:BK, letterSpacing:"3px" }}>KLOVERS</span>
        </div>
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

      {/* Bottom: QR + website + barcode */}
      <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:"12px" }}>
        <QRPlaceholder size={72} label="للصوت والنطق" />
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"14px", color:Y, fontWeight:900 }}>klovers.academy</div>
          <div style={{ fontSize:"11px", color:"#555", marginTop:"4px" }}>تعلّم الكورية مجاناً</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"8px" }}>© 2025 Klovers Korean Academy</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"2px" }}>Photos: Pexels.com — جميع الحقوق محفوظة</div>
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
        <div style={{ background:Y, borderRadius:"40px", padding:"8px 24px", display:"flex", alignItems:"center", gap:"10px" }}>
          <TaegeukIcon size={26} />
          <span style={{ fontSize:"18px", fontWeight:900, color:BK, letterSpacing:"3px" }}>KLOVERS</span>
        </div>
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

      {/* Bottom: QR + website + barcode */}
      <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:"12px" }}>
        <QRPlaceholder size={72} label="Scan for audio" />
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"14px", color:Y, fontWeight:900 }}>klovers.academy</div>
          <div style={{ fontSize:"11px", color:"#555", marginTop:"4px" }}>Learn Korean Free Online</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"8px" }}>© 2025 Klovers Korean Academy</div>
          <div style={{ fontSize:"10px", color:"#444", marginTop:"2px" }}>Photos: Pexels.com — All rights reserved</div>
        </div>
        <div style={{ background:"#fff", padding:"8px", borderRadius:"8px" }}>
          <BarcodeIcon />
        </div>
      </div>
    </div>
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
          .book-page { box-shadow: 0 4px 24px rgba(0,0,0,0.15); margin: 0 auto 28px; }
        }
        #hangul-book {
          background: #e5e5e5;
          font-family: 'Cairo', 'Noto Sans KR', system-ui, sans-serif;
          counter-reset: book-page;
        }
        .book-page {
          counter-increment: book-page;
        }
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
        {isAr ? (
          <>
            <CoverAr />
            <TocAr />
            <HistoryAr />
            <SejongAr />
            <CultureAr />
            <CourseAr />
            <WelcomeAr />
            <ConsonantsAr slice={[0,7]} page={1} />
            <ConsonantsAr slice={[7,14]} page={2} />
            <VowelsAr />
            <SyllableAr />
            <BatchimAr />
            <DoubleBatchimAr />
            <KdramaAr />
            <PracticeAr />
            <AnswerAr />
            <BackCoverAr />
          </>
        ) : (
          <>
            <CoverEn />
            <TocEn />
            <HistoryEn />
            <SejongEn />
            <CultureEn />
            <CourseEn />
            <WelcomeEn />
            <ConsonantsEn slice={[0,7]} page={1} />
            <ConsonantsEn slice={[7,14]} page={2} />
            <VowelsEn />
            <SyllableEn />
            <BatchimEn />
            <DoubleBatchimEn />
            <KdramaEn />
            <PracticeEn />
            <AnswerEn />
            <BackCoverEn />
          </>
        )}
      </div>
    </>
  );
}
