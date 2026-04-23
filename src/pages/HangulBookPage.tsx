import { useState } from "react";

/* ─── Brand tokens ─────────────────────────────── */
const Y = "#FFFF00";   // primary yellow
const YD = "#E6E600";  // yellow-dark (borders/shadows)
const YL = "#FFFFAA";  // yellow-light (backgrounds)
const BK = "#111111";  // near-black
const BK2 = "#222222"; // card dark bg
const BK3 = "#333333"; // slightly lighter dark

type Lang = "en" | "ar";

/* ─── Consonants data ──────────────────────────── */
const CONSONANTS = [
  {
    char: "ㄱ", roman: "g/k", name_en: "Giyeok", name_ar: "جييوك",
    sound_en: "Like 'g' in go; 'k' at end", sound_ar: "مثل 'ك' في كلمة",
    arabic_eq: "ك / ق",
    mnemonic_en: "A bent arm holding a GUN sideways", mnemonic_ar: "ذراع منحنية تمسك مسدساً",
    emoji: "🔫", shape: "L-shape",
    examples: [{ k: "가방", r: "ga-bang", en: "bag", ar: "حقيبة" }, { k: "고양이", r: "go-yang-i", en: "cat", ar: "قط" }],
  },
  {
    char: "ㄴ", roman: "n", name_en: "Nieun", name_ar: "نييون",
    sound_en: "Like 'n' in no", sound_ar: "مثل 'ن' في نعم",
    arabic_eq: "ن",
    mnemonic_en: "A NOSE seen from the side — tip pointing right", mnemonic_ar: "أنف من الجانب — طرفه يشير لليمين",
    emoji: "👃", shape: "corner",
    examples: [{ k: "나비", r: "na-bi", en: "butterfly", ar: "فراشة" }, { k: "눈", r: "nun", en: "eye / snow", ar: "عين / ثلج" }],
  },
  {
    char: "ㄷ", roman: "d/t", name_en: "Digeut", name_ar: "ديغوت",
    sound_en: "Like 'd' in door", sound_ar: "مثل 'د' في دار",
    arabic_eq: "د / ت",
    mnemonic_en: "An open DOOR frame from above", mnemonic_ar: "إطار باب مفتوح من الأعلى",
    emoji: "🚪", shape: "door",
    examples: [{ k: "달", r: "dal", en: "moon", ar: "قمر" }, { k: "도시", r: "do-si", en: "city", ar: "مدينة" }],
  },
  {
    char: "ㄹ", roman: "r/l", name_en: "Rieul", name_ar: "ريول",
    sound_en: "Flap between R and L", sound_ar: "بين 'ر' و'ل' — طرف اللسان يرتد",
    arabic_eq: "ر / ل",
    mnemonic_en: "A ROLLER-COASTER track rolling between R and L", mnemonic_ar: "مسار أفعوانية — يتحرك بين ر ول",
    emoji: "🎢", shape: "roller",
    examples: [{ k: "라면", r: "ra-myeon", en: "ramen", ar: "رامن" }, { k: "사랑", r: "sa-rang", en: "love", ar: "حب" }],
  },
  {
    char: "ㅁ", roman: "m", name_en: "Mieum", name_ar: "مييوم",
    sound_en: "Like 'm' in mom", sound_ar: "مثل 'م' في ماء",
    arabic_eq: "م",
    mnemonic_en: "A square MOUTH closed shut — M for Mouth", mnemonic_ar: "فم مربع مغلق — م للفم",
    emoji: "👄", shape: "square",
    examples: [{ k: "물", r: "mul", en: "water", ar: "ماء" }, { k: "마음", r: "ma-eum", en: "heart", ar: "قلب" }],
  },
  {
    char: "ㅂ", roman: "b/p", name_en: "Bieup", name_ar: "بييوب",
    sound_en: "Like 'b' in boy", sound_ar: "مثل 'ب' في بيت",
    arabic_eq: "ب / پ",
    mnemonic_en: "A BOX with arms sticking up — B for Box", mnemonic_ar: "صندوق مع ذراعين — ب للصندوق",
    emoji: "📦", shape: "box-arms",
    examples: [{ k: "밥", r: "bap", en: "rice", ar: "أرز" }, { k: "버스", r: "beo-seu", en: "bus", ar: "أتوبيس" }],
  },
  {
    char: "ㅅ", roman: "s", name_en: "Siot", name_ar: "سييوت",
    sound_en: "Like 's' in sun", sound_ar: "مثل 'س' في سماء",
    arabic_eq: "س",
    mnemonic_en: "A mountain peak — the SUN shines from the top", mnemonic_ar: "قمة جبل — الشمس تسطع من الأعلى",
    emoji: "⛰️", shape: "peak",
    examples: [{ k: "사랑", r: "sa-rang", en: "love", ar: "حب" }, { k: "스타", r: "seu-ta", en: "star", ar: "نجم" }],
  },
  {
    char: "ㅇ", roman: "∅/ng", name_en: "Ieung", name_ar: "ييونغ",
    sound_en: "Silent at start; 'ng' at end like 'sing'", sound_ar: "صامت في البداية؛ 'نغ' في النهاية",
    arabic_eq: "صامت / نغ",
    mnemonic_en: "A ZERO circle — starts silent, ends like a ring", mnemonic_ar: "دائرة صفر — صامت في البداية كالخاتم في النهاية",
    emoji: "⭕", shape: "circle",
    examples: [{ k: "아이", r: "a-i", en: "child", ar: "طفل" }, { k: "강", r: "gang", en: "river", ar: "نهر" }],
  },
  {
    char: "ㅈ", roman: "j", name_en: "Jieut", name_ar: "جييوت",
    sound_en: "Like 'j' in juice", sound_ar: "مثل 'ج' في جميل",
    arabic_eq: "ج",
    mnemonic_en: "A star shape with a hat — JUMPING star", mnemonic_ar: "نجمة بقبعة — نجمة قافزة",
    emoji: "⭐", shape: "star-hat",
    examples: [{ k: "저", r: "jeo", en: "I / me (formal)", ar: "أنا (رسمي)" }, { k: "좋아요", r: "jo-a-yo", en: "I like it", ar: "أحبه" }],
  },
  {
    char: "ㅊ", roman: "ch", name_en: "Chieut", name_ar: "تشييوت",
    sound_en: "Like 'ch' in chair — aspirated ㅈ", sound_ar: "مثل 'تش' — ㅈ مع نفخة هواء",
    arabic_eq: "تش / چ",
    mnemonic_en: "ㅈ wearing a CROWN — CH is ㅈ with a puff", mnemonic_ar: "ㅈ مع تاج — نفس الصوت مع نفخة",
    emoji: "👑", shape: "star-crown",
    examples: [{ k: "친구", r: "chin-gu", en: "friend", ar: "صديق" }, { k: "차", r: "cha", en: "tea / car", ar: "شاي / سيارة" }],
  },
  {
    char: "ㅋ", roman: "k", name_en: "Kieuk", name_ar: "كييوك",
    sound_en: "Aspirated 'k' — ㄱ with a big air puff", sound_ar: "ㄱ مع نفخة هواء قوية",
    arabic_eq: "ك (مع نفخة)",
    mnemonic_en: "ㄱ with an extra KICK bar — stronger K", mnemonic_ar: "ㄱ مع خط إضافي — 'ك' أقوى",
    emoji: "💨", shape: "L-extra",
    examples: [{ k: "카페", r: "ka-pe", en: "café", ar: "مقهى" }, { k: "코", r: "ko", en: "nose", ar: "أنف" }],
  },
  {
    char: "ㅌ", roman: "t", name_en: "Tieut", name_ar: "تييوت",
    sound_en: "Aspirated 't' — ㄷ with a big air puff", sound_ar: "ㄷ مع نفخة هواء قوية",
    arabic_eq: "ت (مع نفخة)",
    mnemonic_en: "ㄷ with a middle bar — a TRIPLE door frame", mnemonic_ar: "ㄷ مع خط وسطي — ت أقوى",
    emoji: "🚪", shape: "door-bar",
    examples: [{ k: "택시", r: "taek-si", en: "taxi", ar: "تاكسي" }, { k: "토끼", r: "to-kki", en: "rabbit", ar: "أرنب" }],
  },
  {
    char: "ㅍ", roman: "p", name_en: "Pieup", name_ar: "بييوب",
    sound_en: "Aspirated 'p' — ㅂ with a big puff", sound_ar: "ㅂ مع نفخة هواء قوية",
    arabic_eq: "ب (مع نفخة)",
    mnemonic_en: "Two arms wide open — PUFFING with energy", mnemonic_ar: "ذراعان مفتوحتان — 'ب' مع نفخة",
    emoji: "🦅", shape: "wings",
    examples: [{ k: "파티", r: "pa-ti", en: "party", ar: "حفلة" }, { k: "편의점", r: "pyeo-ni-jeom", en: "convenience store", ar: "دكان" }],
  },
  {
    char: "ㅎ", roman: "h", name_en: "Hieut", name_ar: "هييوت",
    sound_en: "Like 'h' in hello", sound_ar: "مثل 'هـ' في هلا",
    arabic_eq: "هـ",
    mnemonic_en: "A PERSON with a hat saying Hello", mnemonic_ar: "شخص يرتدي قبعة يقول مرحباً",
    emoji: "🎩", shape: "person-hat",
    examples: [{ k: "한국", r: "han-guk", en: "Korea", ar: "كوريا" }, { k: "학교", r: "hak-gyo", en: "school", ar: "مدرسة" }],
  },
];

/* ─── Vowels data ──────────────────────────────── */
const VOWELS = [
  {
    char: "ㅏ", roman: "a", name_en: "A", name_ar: "آ",
    sound_en: "Like 'a' in father — wide open mouth", sound_ar: "مثل 'آ' — افتح فمك",
    arabic_eq: "آ",
    mnemonic_en: "Vertical line + right branch → open 'AH'", mnemonic_ar: "خط عمودي وفرع يميني → 'آ'",
    emoji: "😮", dir: "right",
    examples: [{ k: "아버지", r: "a-beo-ji", en: "father", ar: "أب" }, { k: "바나나", r: "ba-na-na", en: "banana", ar: "موز" }],
  },
  {
    char: "ㅓ", roman: "eo", name_en: "EO", name_ar: "أُ",
    sound_en: "Like 'u' in but — pulled back", sound_ar: "مثل 'أُ' — ممدودة للخلف",
    arabic_eq: "أُ",
    mnemonic_en: "Vertical line + left branch → pulled back 'UH'", mnemonic_ar: "خط عمودي وفرع يساري → 'أُ' للخلف",
    emoji: "😕", dir: "left",
    examples: [{ k: "어머니", r: "eo-meo-ni", en: "mother", ar: "أم" }, { k: "서울", r: "seo-ul", en: "Seoul", ar: "سيول" }],
  },
  {
    char: "ㅗ", roman: "o", name_en: "O", name_ar: "أو",
    sound_en: "Like 'o' in go — round lips", sound_ar: "مثل 'أو' — شفاه دائرية",
    arabic_eq: "و",
    mnemonic_en: "Horizontal line + branch UP → round 'OH'", mnemonic_ar: "خط أفقي وفرع لأعلى → 'و' دائري",
    emoji: "⬆️", dir: "up",
    examples: [{ k: "오늘", r: "o-neul", en: "today", ar: "اليوم" }, { k: "고마워", r: "go-ma-wo", en: "thank you", ar: "شكراً" }],
  },
  {
    char: "ㅜ", roman: "u", name_en: "U", name_ar: "أُو",
    sound_en: "Like 'oo' in moon — round lips down", sound_ar: "مثل 'أُو' — شفاه دائرية للأسفل",
    arabic_eq: "أُو",
    mnemonic_en: "Horizontal line + branch DOWN → 'OO' droops", mnemonic_ar: "خط أفقي وفرع لأسفل → 'أُو' ينزل",
    emoji: "⬇️", dir: "down",
    examples: [{ k: "우유", r: "u-yu", en: "milk", ar: "حليب" }, { k: "구름", r: "gu-reum", en: "cloud", ar: "سحابة" }],
  },
  {
    char: "ㅡ", roman: "eu", name_en: "EU", name_ar: "إ (محايد)",
    sound_en: "Neutral flat sound — spread lips", sound_ar: "صوت محايد مسطح — شفاه ممدودة",
    arabic_eq: "إ (محايد)",
    mnemonic_en: "Just a flat line — keep your face FLAT", mnemonic_ar: "خط مسطح فقط — وجه مسطح",
    emoji: "➖", dir: "flat",
    examples: [{ k: "크다", r: "keu-da", en: "big", ar: "كبير" }, { k: "으악", r: "eu-ak", en: "Ahh! (surprise)", ar: "آه!" }],
  },
  {
    char: "ㅣ", roman: "i", name_en: "I", name_ar: "إي",
    sound_en: "Like 'ee' in see — tall and proud", sound_ar: "مثل 'إي' — طويل ومنتصب",
    arabic_eq: "إي",
    mnemonic_en: "Single tall vertical line — stands like 'EE'", mnemonic_ar: "خط عمودي وحيد — مثل 'إي'",
    emoji: "🧍", dir: "vertical",
    examples: [{ k: "이름", r: "i-reum", en: "name", ar: "اسم" }, { k: "기다려", r: "gi-da-ryeo", en: "wait for me", ar: "انتظرني" }],
  },
  {
    char: "ㅐ", roman: "ae", name_en: "AE", name_ar: "إِ",
    sound_en: "Like 'e' in bed", sound_ar: "مثل 'إِ' في بيت",
    arabic_eq: "إِ",
    mnemonic_en: "ㅏ + extra bar = open 'EH'", mnemonic_ar: "ㅏ مع خط إضافي = 'إِ' مفتوح",
    emoji: "😬", dir: "right-plus",
    examples: [{ k: "개", r: "gae", en: "dog", ar: "كلب" }, { k: "애인", r: "ae-in", en: "sweetheart", ar: "حبيبي" }],
  },
  {
    char: "ㅔ", roman: "e", name_en: "E", name_ar: "إِ",
    sound_en: "Like 'e' in bed (≈ ㅐ in modern Korean)", sound_ar: "مثل 'إِ' — شبيه بـ ㅐ في الكوري الحديث",
    arabic_eq: "إِ",
    mnemonic_en: "ㅓ + extra bar — sounds same as ㅐ today", mnemonic_ar: "ㅓ مع خط إضافي — نفس صوت ㅐ اليوم",
    emoji: "😐", dir: "left-plus",
    examples: [{ k: "에어컨", r: "e-eo-kon", en: "air conditioner", ar: "تكييف" }, { k: "세상", r: "se-sang", en: "world", ar: "عالم" }],
  },
  {
    char: "ㅑ", roman: "ya", name_en: "YA", name_ar: "يَا",
    sound_en: "Like 'ya' in yard", sound_ar: "مثل 'يَا'",
    arabic_eq: "يَا",
    mnemonic_en: "ㅏ with TWO right branches — DOUBLE energy 'YA'", mnemonic_ar: "ㅏ مع فرعين — 'يَا' بطاقة مضاعفة",
    emoji: "✌️", dir: "right-double",
    examples: [{ k: "야채", r: "ya-chae", en: "vegetables", ar: "خضروات" }, { k: "야구", r: "ya-gu", en: "baseball", ar: "بيسبول" }],
  },
  {
    char: "ㅕ", roman: "yeo", name_en: "YEO", name_ar: "يُ",
    sound_en: "Like 'yuh' or 'yeo'", sound_ar: "مثل 'يُ'",
    arabic_eq: "يُ",
    mnemonic_en: "ㅓ with TWO left branches — pulling back 'YUH'", mnemonic_ar: "ㅓ مع فرعين — 'يُ' للخلف",
    emoji: "✌️", dir: "left-double",
    examples: [{ k: "여자", r: "yeo-ja", en: "woman", ar: "امرأة" }, { k: "여행", r: "yeo-haeng", en: "travel", ar: "سفر" }],
  },
];

/* ─── K-Drama vocabulary ───────────────────────── */
const KDRAMA = [
  { k: "오빠", r: "op-pa", en: "Older brother (girl→boy)", ar: "أخ أكبر (فتاة للولد)", note_en: "Most heard word in K-dramas!", note_ar: "الكلمة الأكثر في المسلسلات!", emoji: "💛" },
  { k: "언니", r: "eon-ni", en: "Older sister (girl→girl)", ar: "أخت كبرى (فتاة لفتاة)", note_en: "Girls call older girls this", note_ar: "البنات تقولها للبنات الأكبر", emoji: "👭" },
  { k: "형", r: "hyeong", en: "Older brother (boy→boy)", ar: "أخ أكبر (ولد للولد)", note_en: "Boys call older boys this", note_ar: "الأولاد يقولونها للأكبر منهم", emoji: "👬" },
  { k: "사랑해", r: "sa-rang-hae", en: "I love you ❤", ar: "أحبك ❤", note_en: "The most iconic K-drama line", note_ar: "أشهر جملة في المسلسلات الكورية", emoji: "❤️" },
  { k: "괜찮아?", r: "gwaen-chan-a?", en: "Are you okay?", ar: "هل أنت بخير؟", note_en: "Heard every episode!", note_ar: "تُسمع في كل حلقة!", emoji: "🤔" },
  { k: "미안해", r: "mi-an-hae", en: "I'm sorry", ar: "أنا آسف", note_en: "Informal apology", note_ar: "اعتذار غير رسمي", emoji: "🙏" },
  { k: "고마워", r: "go-ma-wo", en: "Thank you (informal)", ar: "شكراً (غير رسمي)", note_en: "Between friends", note_ar: "بين الأصدقاء", emoji: "💚" },
  { k: "대박!", r: "dae-bak!", en: "Awesome! Amazing!", ar: "إبداع! رائع!", note_en: "Slang for 'jackpot / wow'", note_ar: "سلانغ تعني 'واو / رهيب'", emoji: "🤩" },
  { k: "화이팅!", r: "hwa-i-ting!", en: "Fighting! / You got this!", ar: "يلا! اقدر عليها!", note_en: "Korean cheer — borrowed from English", note_ar: "تشجيع كوري — مستعار من الإنجليزية", emoji: "💪" },
  { k: "잠깐!", r: "jam-kkan!", en: "Wait a moment!", ar: "انتظر لحظة!", note_en: "Used constantly in drama chases", note_ar: "تُستخدم دائماً في مشاهد المطاردة", emoji: "✋" },
  { k: "배고파", r: "bae-go-pa", en: "I'm hungry", ar: "أنا جائع", note_en: "Said before every ramen scene", note_ar: "تُقال قبل كل مشهد رامن", emoji: "🍜" },
  { k: "진짜?!", r: "jin-jja?!", en: "Really?! Seriously?!", ar: "جدياً؟! فعلاً؟!", note_en: "Expression of disbelief", note_ar: "تعبير عن الدهشة", emoji: "😱" },
];

/* ─── Syllable examples ────────────────────────── */
const SYLLABLES = [
  { c: "ㅎ", v: "ㅏ", b: "하", r: "ha", en: "(to do)", ar: "(للفعل)" },
  { c: "ㄴ", v: "ㅏ", b: "나", r: "na", en: "I / me", ar: "أنا" },
  { c: "ㅅ", v: "ㅏ", b: "사", r: "sa", en: "four", ar: "أربعة" },
  { c: "ㅂ", v: "ㅏ", b: "바", r: "ba", en: "(part of sea)", ar: "(جزء من بحر)" },
  { c: "ㄱ", v: "ㅗ", b: "고", r: "go", en: "and (connector)", ar: "و (رابط)" },
  { c: "ㄴ", v: "ㅗ", b: "노", r: "no", en: "no / song", ar: "لا / أغنية" },
  { c: "ㄷ", v: "ㅗ", b: "도", r: "do", en: "also / too", ar: "أيضاً" },
  { c: "ㄹ", v: "ㅏ", b: "라", r: "ra", en: "(part of ramen)", ar: "(جزء من رامن)" },
  { c: "ㅁ", v: "ㅏ", b: "마", r: "ma", en: "horse", ar: "حصان" },
  { c: "ㅈ", v: "ㅏ", b: "자", r: "ja", en: "ruler / sleep", ar: "مسطرة / نوم" },
  { c: "ㅋ", v: "ㅏ", b: "카", r: "ka", en: "(café start)", ar: "(بداية مقهى)" },
  { c: "ㅅ", v: "ㅣ", b: "시", r: "si", en: "time / poem", ar: "وقت / قصيدة" },
];

/* ─── Types ────────────────────────────────────── */
interface BookPageProps { children: React.ReactNode; className?: string }

/* ─── Helper: BookPage shell ───────────────────── */
function BookPage({ children, className = "" }: BookPageProps) {
  return (
    <div
      className={`book-page ${className}`}
      style={{
        width: "210mm", minHeight: "297mm",
        padding: "15mm 14mm",
        boxSizing: "border-box",
        background: "#fff",
        position: "relative",
        pageBreakAfter: "always",
        breakAfter: "page",
        overflow: "hidden",
      }}
    >
      {/* Yellow top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "8mm", background: Y }} />
      {/* Bottom stripe */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "5mm", background: BK }} />
      {/* Left accent bar */}
      <div style={{ position: "absolute", top: "8mm", bottom: "5mm", left: 0, width: "4px", background: Y }} />

      <div style={{ marginTop: "10mm" }}>{children}</div>
    </div>
  );
}

/* ─── Section header ───────────────────────────── */
function SHead({ en, ar, lang }: { en: string; ar: string; lang: Lang }) {
  return (
    <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ width: "6px", height: "32px", background: Y, borderRadius: "3px", flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: "18px", fontWeight: 900, color: BK, lineHeight: 1.1 }}>
          {lang === "ar" ? ar : en}
        </div>
        <div style={{ fontSize: "11px", color: "#666", direction: lang === "ar" ? "ltr" : "rtl" }}>
          {lang === "ar" ? en : ar}
        </div>
      </div>
    </div>
  );
}

/* ─── Consonant card ───────────────────────────── */
function ConsCard({ c, lang }: { c: typeof CONSONANTS[0]; lang: Lang }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "72px 1fr", gap: "8px",
      background: "#fafafa", border: `2px solid ${Y}`,
      borderRadius: "10px", padding: "8px",
      pageBreakInside: "avoid", breakInside: "avoid", marginBottom: "6px",
    }}>
      {/* Character block */}
      <div style={{
        background: BK, borderRadius: "8px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "6px", minHeight: "72px",
      }}>
        <div style={{ fontSize: "42px", lineHeight: 1, color: Y, fontWeight: 900 }}>{c.char}</div>
        <div style={{ fontSize: "10px", color: "#ccc", marginTop: "2px" }}>{c.roman}</div>
        <div style={{ fontSize: "16px", marginTop: "2px" }}>{c.emoji}</div>
      </div>
      {/* Info */}
      <div>
        <div style={{ fontWeight: 800, fontSize: "12px", color: BK }}>
          {lang === "ar" ? c.name_ar : c.name_en}
          <span style={{ fontWeight: 400, color: "#888", marginLeft: "6px", fontSize: "10px" }}>
            {lang === "ar" ? c.name_en : c.name_ar}
          </span>
        </div>
        <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>
          🔊 {lang === "ar" ? c.sound_ar : c.sound_en}
        </div>
        <div style={{
          fontSize: "10px", color: "#555",
          background: YL, borderRadius: "5px",
          padding: "3px 6px", margin: "3px 0",
          direction: lang === "ar" ? "rtl" : "ltr",
        }}>
          💡 {lang === "ar" ? c.mnemonic_ar : c.mnemonic_en}
        </div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {c.examples.map((ex, i) => (
            <div key={i} style={{
              background: BK, color: "#fff", borderRadius: "5px",
              padding: "2px 6px", fontSize: "9px",
            }}>
              <span style={{ color: Y, fontWeight: 800 }}>{ex.k}</span>
              {" "}({ex.r}) {lang === "ar" ? ex.ar : ex.en}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Vowel card ───────────────────────────────── */
function VowCard({ v, lang }: { v: typeof VOWELS[0]; lang: Lang }) {
  return (
    <div style={{
      background: "#fafafa", border: `2px solid ${YD}`,
      borderRadius: "10px", padding: "8px",
      display: "grid", gridTemplateColumns: "60px 1fr", gap: "8px",
      pageBreakInside: "avoid", breakInside: "avoid", marginBottom: "6px",
    }}>
      <div style={{
        background: Y, borderRadius: "8px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "6px", minHeight: "64px",
      }}>
        <div style={{ fontSize: "38px", fontWeight: 900, color: BK, lineHeight: 1 }}>{v.char}</div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: BK2, marginTop: "2px" }}>{v.roman}</div>
        <div style={{ fontSize: "14px" }}>{v.emoji}</div>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: "11px", color: BK }}>
          {lang === "ar" ? v.name_ar : v.name_en}
        </div>
        <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>
          🔊 {lang === "ar" ? v.sound_ar : v.sound_en}
        </div>
        <div style={{
          fontSize: "10px", background: YL, borderRadius: "5px",
          padding: "2px 6px", margin: "3px 0", color: "#555",
          direction: lang === "ar" ? "rtl" : "ltr",
        }}>
          💡 {lang === "ar" ? v.mnemonic_ar : v.mnemonic_en}
        </div>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {v.examples.map((ex, i) => (
            <div key={i} style={{
              background: BK2, borderRadius: "5px", padding: "2px 6px", fontSize: "9px", color: "#fff",
            }}>
              <span style={{ color: Y, fontWeight: 800 }}>{ex.k}</span> — {lang === "ar" ? ex.ar : ex.en}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGES
══════════════════════════════════════════════════ */

/* Cover */
function Cover({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <div style={{
      width: "210mm", minHeight: "297mm",
      background: BK, pageBreakAfter: "always", breakAfter: "page",
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20mm",
    }}>
      {/* Big decorative Korean in background */}
      <div style={{
        position: "absolute", top: "-30px", right: "-20px",
        fontSize: "320px", fontWeight: 900, color: "#1a1a00",
        lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>한</div>

      {/* Yellow top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "14px", background: Y }} />
      {/* Yellow bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "14px", background: Y }} />
      {/* Yellow left bar */}
      <div style={{ position: "absolute", top: "14px", bottom: "14px", left: 0, width: "8px", background: Y }} />
      {/* Yellow right bar */}
      <div style={{ position: "absolute", top: "14px", bottom: "14px", right: 0, width: "8px", background: Y }} />

      {/* Logo pill */}
      <div style={{
        background: Y, borderRadius: "40px",
        padding: "8px 24px", display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "24px",
      }}>
        <span style={{ fontSize: "24px" }}>🍀</span>
        <span style={{ fontSize: "20px", fontWeight: 900, color: BK, letterSpacing: "3px" }}>KLOVERS</span>
      </div>

      {/* Giant Hangul display */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{
          fontSize: "100px", fontWeight: 900, color: Y,
          lineHeight: 1, textShadow: `0 0 40px ${Y}66`,
        }}>한글</div>
        <div style={{ fontSize: "13px", color: "#888", letterSpacing: "8px", marginTop: "4px" }}>
          H • A • N • G • U • L
        </div>
      </div>

      {/* Title card */}
      <div style={{
        border: `3px solid ${Y}`,
        borderRadius: "16px", padding: "20px 28px",
        textAlign: "center", maxWidth: "340px",
        marginBottom: "20px",
      }}>
        <div style={{ fontSize: "26px", fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
          {isAr ? "كتاب الهانغول الرسمي" : "Official Hangul Starter Book"}
        </div>
        <div style={{ fontSize: "14px", color: Y, fontWeight: 700, marginTop: "6px" }}>
          {isAr ? "Official Hangul Starter Book" : "كتاب الهانغول الرسمي"}
        </div>
        <div style={{
          marginTop: "10px", display: "flex", justifyContent: "center",
          gap: "6px", flexWrap: "wrap",
        }}>
          {["🎬 K-Drama", "🎵 K-Pop", "🌸 Korean Culture"].map(t => (
            <span key={t} style={{
              background: "#222", color: Y, fontSize: "10px",
              fontWeight: 700, padding: "3px 8px", borderRadius: "20px",
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Level badge */}
      <div style={{
        background: Y, borderRadius: "40px",
        padding: "8px 28px", textAlign: "center",
        marginBottom: "16px",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 900, color: BK }}>
          {isAr ? "المستوى الأول" : "Level 1 — Beginner"}
        </div>
        <div style={{ fontSize: "10px", color: BK2 }}>
          {isAr ? "Level 1 — Beginner" : "المستوى الأول"}
        </div>
      </div>

      {/* Alphabet preview strip */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", maxWidth: "300px" }}>
        {"ㄱㄴㄷㄹㅁㅂㅅㅇㅏㅓㅗㅜㅡㅣ".split("").map((ch, i) => (
          <div key={i} style={{
            background: i % 2 === 0 ? "#1a1a00" : "#222",
            border: `1px solid ${Y}33`,
            borderRadius: "6px", width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", color: Y, fontWeight: 700,
          }}>{ch}</div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "22px", textAlign: "center" }}>
        <div style={{ fontSize: "10px", color: "#555" }}>© 2025 Klovers Korean Academy • klovers.academy</div>
        <div style={{ fontSize: "10px", color: Y, marginTop: "2px" }}>
          {isAr ? "نسخة عربية-كورية" : "English–Korean Edition"}
        </div>
      </div>
    </div>
  );
}

/* Welcome page */
function Welcome({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const plan = [
    { d: isAr ? "يوم ١" : "Day 1", t: isAr ? "حروف المد ㅏ–ㅜ" : "Vowels ㅏ–ㅜ" },
    { d: isAr ? "يوم ٢" : "Day 2", t: isAr ? "حروف المد ㅡ–ㅕ" : "Vowels ㅡ–ㅕ" },
    { d: isAr ? "يوم ٣" : "Day 3", t: isAr ? "حروف ㄱ–ㄷ" : "Cons. ㄱ–ㄷ" },
    { d: isAr ? "يوم ٤" : "Day 4", t: isAr ? "حروف ㄹ–ㅅ" : "Cons. ㄹ–ㅅ" },
    { d: isAr ? "يوم ٥" : "Day 5", t: isAr ? "حروف ㅇ–ㅊ" : "Cons. ㅇ–ㅊ" },
    { d: isAr ? "يوم ٦" : "Day 6", t: isAr ? "حروف ㅋ–ㅎ" : "Cons. ㅋ–ㅎ" },
    { d: isAr ? "يوم ٧" : "Day 7", t: isAr ? "مقاطع + مراجعة 🏆" : "Syllables + Review 🏆" },
  ];
  return (
    <BookPage>
      <SHead en="Welcome to Hangul!" ar="مرحباً بعالم الهانغول!" lang={lang} />

      {/* Why Hangul */}
      <div style={{
        background: BK, borderRadius: "12px", padding: "14px",
        marginBottom: "10px", color: "#fff",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: Y, marginBottom: "6px" }}>
              {isAr ? "لماذا الهانغول رائع؟" : "Why Hangul is Brilliant"}
            </div>
            <p style={{ fontSize: "10px", lineHeight: 1.8, color: "#ddd" }}>
              {isAr
                ? "اخترع الملك سيجونغ الهانغول عام ١٤٤٣م. إنها أبجدية صوتية — كل حرف يمثل صوتاً. معظم المتعلمين يقرؤون في ٢–٣ أيام فقط!"
                : "King Sejong invented Hangul in 1443. It's a phonetic alphabet — each letter represents a sound. Most learners can read in just 2–3 days!"}
            </p>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: Y, marginBottom: "6px" }}>
              {isAr ? "الأرقام السحرية" : "The Magic Numbers"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { n: "14", l: isAr ? "حرف ساكن" : "Consonants" },
                { n: "10", l: isAr ? "حرف مد" : "Vowels" },
                { n: "∞", l: isAr ? "مقطع ممكن" : "Possible syllables" },
              ].map(({ n, l }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    background: Y, color: BK, fontWeight: 900,
                    fontSize: "18px", width: "36px", height: "36px",
                    borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{n}</div>
                  <div style={{ fontSize: "11px", color: "#ccc" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Syllable block diagram */}
      <div style={{
        border: `3px solid ${Y}`, borderRadius: "12px",
        padding: "12px", marginBottom: "10px", background: YL,
      }}>
        <div style={{ fontWeight: 800, fontSize: "12px", color: BK, marginBottom: "8px", textAlign: "center" }}>
          {isAr ? "كيف تُبنى الكتلة المقطعية" : "How a Syllable Block Works"}
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "8px", flexWrap: "wrap",
        }}>
          {[
            { label: isAr ? "حرف ساكن" : "Consonant", char: "ㅎ", sub: "h", bg: BK, fg: Y },
            { label: "+", char: "", sub: "", bg: "transparent", fg: Y },
            { label: isAr ? "حرف مد" : "Vowel", char: "ㅏ", sub: "a", bg: Y, fg: BK },
            { label: "=", char: "", sub: "", bg: "transparent", fg: BK },
            { label: isAr ? "المقطع" : "Syllable!", char: "하", sub: "ha", bg: BK, fg: Y },
          ].map((item, i) =>
            item.char === "" ? (
              <div key={i} style={{ fontSize: "24px", fontWeight: 900, color: BK }}>{item.label}</div>
            ) : (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "3px" }}>{item.label}</div>
                <div style={{
                  background: item.bg, borderRadius: "10px",
                  padding: "8px 14px", fontSize: "38px", fontWeight: 900,
                  color: item.fg, lineHeight: 1,
                  border: item.bg === "transparent" ? "none" : `2px solid ${Y}`,
                }}>{item.char}</div>
                {item.sub && <div style={{ fontSize: "10px", color: "#444", marginTop: "3px" }}>{item.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      {/* 7-day plan */}
      <div style={{ fontWeight: 800, fontSize: "11px", color: BK, marginBottom: "6px" }}>
        📅 {isAr ? "خطة الدراسة في ٧ أيام" : "7-Day Study Plan"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
        {plan.map((p, i) => (
          <div key={i} style={{
            background: i === 6 ? Y : BK,
            borderRadius: "8px", padding: "7px 3px", textAlign: "center",
          }}>
            <div style={{ fontSize: "9px", fontWeight: 800, color: i === 6 ? BK : Y }}>{p.d}</div>
            <div style={{ fontSize: "8px", color: i === 6 ? BK2 : "#aaa", marginTop: "3px", lineHeight: 1.3 }}>{p.t}</div>
          </div>
        ))}
      </div>
    </BookPage>
  );
}

/* Consonants page */
function Consonants({ slice, page, lang }: { slice: [number, number]; page: number; lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <BookPage>
      <SHead
        en={`Consonants (자음) — Part ${page}/2`}
        ar={`الحروف الساكنة (자음) — الجزء ${page === 1 ? "١" : "٢"} من ٢`}
        lang={lang}
      />
      <div style={{
        background: YL, borderRadius: "8px", padding: "7px 10px",
        fontSize: "10px", color: BK2, marginBottom: "8px",
        direction: isAr ? "rtl" : "ltr",
      }}>
        💡 {isAr
          ? "الحروف الساكنة هي العمود الفقري للهانغول. كل مقطع يبدأ بحرف ساكن!"
          : "Consonants are the backbone of Hangul. Every syllable starts with one!"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {CONSONANTS.slice(...slice).map(c => <ConsCard key={c.char} c={c} lang={lang} />)}
      </div>
    </BookPage>
  );
}

/* Vowels page */
function Vowels({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <BookPage>
      <SHead en="Vowels (모음)" ar="حروف المد (모음)" lang={lang} />
      <div style={{
        background: BK, borderRadius: "8px", padding: "7px 10px",
        fontSize: "10px", color: Y, marginBottom: "8px",
        direction: isAr ? "rtl" : "ltr",
      }}>
        🌟 {isAr
          ? "حروف المد تجلس بجانب الحرف الساكن أو أسفله. لا توجد بنفسها!"
          : "Vowels sit beside or below a consonant. They never stand alone!"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {VOWELS.map(v => <VowCard key={v.char} v={v} lang={lang} />)}
      </div>
    </BookPage>
  );
}

/* Syllable building page */
function SyllablePage({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <BookPage>
      <SHead en="Building Syllable Blocks" ar="بناء الكتل المقطعية" lang={lang} />

      {/* Rules */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        {[
          {
            n: "①", title: isAr ? "كل مقطع يبدأ بحرف ساكن" : "Every syllable starts with a consonant",
            note: isAr ? "إذا كان الصوت يبدأ بمد، نضع ㅇ الصامت" : "If starting with a vowel, use silent ㅇ",
            ex: "아 = ㅇ + ㅏ",
          },
          {
            n: "②", title: isAr ? "حروف المد الطويلة تجلس يميناً" : "Tall vowels sit to the RIGHT",
            note: isAr ? "ㅏ ㅓ ㅣ ㅐ ㅔ ㅑ ㅕ" : "ㅏ ㅓ ㅣ ㅐ ㅔ ㅑ ㅕ",
            ex: "가 나 사 바",
          },
          {
            n: "③", title: isAr ? "حروف المد العريضة تجلس أسفل" : "Wide vowels sit BELOW",
            note: isAr ? "ㅗ ㅜ ㅡ ㅛ ㅠ" : "ㅗ ㅜ ㅡ ㅛ ㅠ",
            ex: "고 노 소 도",
          },
          {
            n: "④", title: isAr ? "باتشيم — حرف ساكن في الأسفل" : "받침 — final consonant below",
            note: isAr ? "اختياري — يوضع تحت الكتلة" : "Optional — sits under the block",
            ex: "한 = ㅎ + ㅏ + ㄴ",
          },
        ].map(r => (
          <div key={r.n} style={{
            background: BK, borderRadius: "10px", padding: "10px",
          }}>
            <div style={{ fontSize: "20px", color: Y, fontWeight: 900 }}>{r.n}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: "4px" }}>{r.title}</div>
            <div style={{ fontSize: "9px", color: "#aaa", marginBottom: "4px" }}>{r.note}</div>
            <div style={{ fontSize: "14px", color: Y, fontWeight: 800 }}>{r.ex}</div>
          </div>
        ))}
      </div>

      {/* Syllable grid */}
      <div style={{ fontWeight: 800, fontSize: "11px", color: BK, marginBottom: "6px" }}>
        🔤 {isAr ? "أمثلة على المقاطع" : "Syllable Examples"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "5px" }}>
        {SYLLABLES.map(s => (
          <div key={s.b} style={{
            background: BK, borderRadius: "8px", padding: "7px 4px", textAlign: "center",
          }}>
            <div style={{ fontSize: "8px", color: "#666" }}>{s.c}+{s.v}</div>
            <div style={{ fontSize: "30px", fontWeight: 900, color: Y, lineHeight: 1 }}>{s.b}</div>
            <div style={{ fontSize: "9px", color: "#aaa" }}>{s.r}</div>
            <div style={{ fontSize: "8px", color: "#888" }}>{isAr ? s.ar : s.en}</div>
          </div>
        ))}
      </div>
    </BookPage>
  );
}

/* K-drama page */
function KdramaPage({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <BookPage>
      <SHead en="K-Drama Essentials 🎬" ar="أساسيات المسلسلات الكورية 🎬" lang={lang} />
      <div style={{
        background: YL, borderRadius: "8px", padding: "7px 10px",
        fontSize: "10px", color: BK2, marginBottom: "8px",
        direction: isAr ? "rtl" : "ltr",
      }}>
        🎵 {isAr
          ? "سمعت هذه الكلمات مئة مرة في المسلسلات — الآن اقرأها بالهانغول!"
          : "You've heard these 100 times in dramas — now read them in Hangul!"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
        {KDRAMA.map(v => (
          <div key={v.k} style={{
            background: "#fafafa", border: `2px solid ${Y}`,
            borderRadius: "10px", padding: "8px 10px",
            display: "flex", gap: "8px", alignItems: "flex-start",
            pageBreakInside: "avoid", breakInside: "avoid",
          }}>
            <div style={{ fontSize: "20px" }}>{v.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "22px", fontWeight: 900, color: BK,
                background: Y, display: "inline-block",
                padding: "1px 8px", borderRadius: "6px", marginBottom: "2px",
              }}>{v.k}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#555" }}>{v.r}</div>
              <div style={{ fontSize: "10px", color: BK, fontWeight: 700 }}>
                {isAr ? v.ar : v.en}
              </div>
              <div style={{ fontSize: "9px", color: "#888", fontStyle: "italic" }}>
                {isAr ? v.note_ar : v.note_en}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BookPage>
  );
}

/* Practice page */
function PracticePage({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const ex1 = [
    { q: "ㄱ", choices: ["n","m","g","h"] },
    { q: "ㄴ", choices: ["g","n","s","m"] },
    { q: "ㅁ", choices: ["h","b","m","r"] },
    { q: "ㅅ", choices: ["s","k","j","p"] },
    { q: "ㅎ", choices: ["m","h","n","g"] },
  ];
  const ex2 = [
    { k: "가방", a: "ga-bang" }, { k: "사랑", a: "sa-rang" },
    { k: "한국", a: "han-guk" }, { k: "친구", a: "chin-gu" }, { k: "고마워", a: "go-ma-wo" },
  ];
  const ex3 = [
    { eq: "ㅂ + ㅏ", a: "바" }, { eq: "ㄴ + ㅗ", a: "노" },
    { eq: "ㅅ + ㅣ", a: "시" }, { eq: "ㅎ + ㅏ", a: "하" }, { eq: "ㄱ + ㅜ", a: "구" },
  ];

  return (
    <BookPage>
      <SHead en="Practice Exercises ✏️" ar="تمارين تطبيقية ✏️" lang={lang} />

      {/* Ex 1 */}
      <div style={{ background: BK, borderRadius: "10px", padding: "10px", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, color: Y, marginBottom: "4px" }}>
          {isAr ? "تمرين ١ — اختر الصوت الصحيح لكل حرف" : "Exercise 1 — Circle the correct romanization"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6px" }}>
          {ex1.map((e, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", color: Y, fontWeight: 900 }}>{e.q}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                {e.choices.map(c => (
                  <div key={c} style={{
                    background: "#222", borderRadius: "4px",
                    padding: "2px", fontSize: "9px", color: "#ccc",
                  }}>{c}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ex 2 */}
      <div style={{ background: YL, border: `2px solid ${Y}`, borderRadius: "10px", padding: "10px", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, color: BK, marginBottom: "6px" }}>
          {isAr ? "تمرين ٢ — اكتب النطق بالحروف اللاتينية" : "Exercise 2 — Write the romanization"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6px" }}>
          {ex2.map((e, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                background: BK, borderRadius: "8px", padding: "8px 4px",
                fontSize: "22px", color: Y, fontWeight: 900,
              }}>{e.k}</div>
              <div style={{
                marginTop: "4px", border: "1px dashed #aaa",
                borderRadius: "4px", height: "20px", background: "#fff",
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Ex 3 */}
      <div style={{ background: "#fafafa", border: `2px solid ${YD}`, borderRadius: "10px", padding: "10px", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, color: BK, marginBottom: "6px" }}>
          {isAr ? "تمرين ٣ — ادمج الحروف لتكوين مقطع" : "Exercise 3 — Combine to form a syllable"}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {ex3.map((e, i) => (
            <div key={i} style={{
              background: BK, borderRadius: "8px", padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: "13px", color: Y, fontWeight: 700 }}>{e.eq} = ?</div>
              <div style={{
                marginTop: "4px", border: `1px dashed ${Y}`,
                borderRadius: "4px", height: "28px", width: "40px",
                margin: "4px auto 0",
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Free writing grid */}
      <div style={{ fontWeight: 800, fontSize: "11px", color: BK, marginBottom: "5px" }}>
        ✏️ {isAr ? "شبكة الكتابة الحرة" : "Free Writing Grid"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: "3px" }}>
        {Array(32).fill(null).map((_, i) => (
          <div key={i} style={{
            border: `1px solid ${Y}`, borderRadius: "4px",
            height: "30px", background: "#fffffe",
          }} />
        ))}
      </div>
    </BookPage>
  );
}

/* Answer key + Reference + Certificate */
function AnswerPage({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  return (
    <BookPage>
      <SHead en="Answer Key + Quick Reference" ar="مفتاح الإجابات + المرجع السريع" lang={lang} />

      {/* Answers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        <div style={{ background: "#f8f8f8", borderRadius: "8px", padding: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, color: BK, marginBottom: "5px" }}>
            {isAr ? "تمرين ١" : "Exercise 1"}
          </div>
          {[["ㄱ","g"],["ㄴ","n"],["ㅁ","m"],["ㅅ","s"],["ㅎ","h"]].map(([q,a]) => (
            <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", padding:"2px 0", borderBottom:"1px solid #eee" }}>
              <span style={{ fontWeight:700 }}>{q}</span>
              <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#f8f8f8", borderRadius: "8px", padding: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, color: BK, marginBottom: "5px" }}>
            {isAr ? "تمرين ٢" : "Exercise 2"}
          </div>
          {[["가방","ga-bang"],["사랑","sa-rang"],["한국","han-guk"],["친구","chin-gu"],["고마워","go-ma-wo"]].map(([q,a]) => (
            <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"9px", padding:"2px 0", borderBottom:"1px solid #eee" }}>
              <span style={{ fontWeight:700, color: BK }}>{q}</span>
              <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#f8f8f8", borderRadius: "8px", padding: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, color: BK, marginBottom: "5px" }}>
            {isAr ? "تمرين ٣" : "Exercise 3"}
          </div>
          {[["ㅂ+ㅏ","바"],["ㄴ+ㅗ","노"],["ㅅ+ㅣ","시"],["ㅎ+ㅏ","하"],["ㄱ+ㅜ","구"]].map(([q,a]) => (
            <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", padding:"2px 0", borderBottom:"1px solid #eee" }}>
              <span style={{ fontWeight:700 }}>{q}</span>
              <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full reference chart */}
      <div style={{ background: BK, borderRadius: "10px", padding: "10px", marginBottom: "10px" }}>
        <div style={{ fontSize: "10px", fontWeight: 800, color: Y, marginBottom: "6px" }}>
          {isAr ? "جدول المرجع السريع — الحروف الساكنة" : "Quick Reference — All Consonants"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px", marginBottom: "8px" }}>
          {CONSONANTS.map(c => (
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color: Y, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"8px", color:"#aaa" }}>{c.roman}</div>
              <div style={{ fontSize:"10px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:"#333", margin:"6px 0" }} />
        <div style={{ fontSize: "10px", fontWeight: 800, color: Y, marginBottom: "6px" }}>
          {isAr ? "الحروف المدّية" : "All Vowels"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: "4px" }}>
          {VOWELS.map(v => (
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:"#fff9c4", fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"8px", color:"#aaa" }}>{v.roman}</div>
              <div style={{ fontSize:"10px" }}>{v.emoji}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate */}
      <div style={{
        border: `4px solid ${Y}`, borderRadius: "14px",
        padding: "16px", textAlign:"center",
        background: `linear-gradient(135deg, ${YL} 0%, #fff 60%, ${YL} 100%)`,
      }}>
        <div style={{ fontSize:"32px", marginBottom:"4px" }}>🏆</div>
        <div style={{ fontSize:"18px", fontWeight:900, color: BK }}>
          {isAr ? "تهانينا! أتممت المستوى الأول" : "Hangul Level 1 — Complete!"}
        </div>
        <div style={{ fontSize:"12px", color:"#555", marginTop:"3px" }}>
          {isAr ? "Hangul Level 1 — Complete!" : "تهانينا! أتممت مستوى الهانغول الأول"}
        </div>
        <div style={{
          margin:"12px auto", width:"220px",
          borderBottom:`2px solid ${BK}`,
        }} />
        <div style={{ fontSize:"11px", color:"#888" }}>
          {isAr ? "اسم الطالب / Student Name" : "Student Name / اسم الطالب"}
        </div>
        <div style={{ marginTop:"10px", fontSize:"10px", color:"#aaa" }}>
          Klovers Korean Academy • klovers.academy • 2025
        </div>
      </div>
    </BookPage>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function HangulBookPage() {
  const [lang, setLang] = useState<Lang>("ar");

  const handleDownload = (l: Lang) => {
    setLang(l);
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #hangul-book, #hangul-book * { visibility: visible !important; }
          #hangul-book { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .book-page {
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page { size: A4; margin: 0; }
        }
        @media screen {
          .book-page {
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            margin: 0 auto 32px;
          }
        }
        #hangul-book { background: #e8e8e8; }
      `}</style>

      {/* ── Top bar ── */}
      <div className="no-print" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:1000,
        background: BK, padding:"10px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 2px 16px rgba(0,0,0,0.4)",
        borderBottom: `3px solid ${Y}`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"22px" }}>🍀</span>
          <span style={{ fontWeight:900, color: Y, fontSize:"17px", letterSpacing:"2px" }}>KLOVERS</span>
          <span style={{ color:"#666", fontSize:"12px" }}>— Hangul Book</span>
        </div>

        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {/* Language toggle */}
          <div style={{ display:"flex", background:"#222", borderRadius:"8px", overflow:"hidden", border:`1px solid ${Y}33` }}>
            {(["ar","en"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding:"6px 14px", fontSize:"12px", fontWeight:700,
                background: lang === l ? Y : "transparent",
                color: lang === l ? BK : "#aaa",
                border:"none", cursor:"pointer",
              }}>
                {l === "ar" ? "🇦🇪 عربي" : "🇬🇧 English"}
              </button>
            ))}
          </div>

          <button onClick={() => window.history.back()} style={{
            background:"#333", color:"#fff", border:"none",
            borderRadius:"8px", padding:"7px 14px", fontSize:"12px", cursor:"pointer",
          }}>← Back</button>

          <button onClick={() => handleDownload("ar")} style={{
            background: Y, color: BK, border:"none",
            borderRadius:"8px", padding:"7px 14px", fontSize:"12px",
            fontWeight:800, cursor:"pointer",
          }}>⬇ Arabic PDF</button>

          <button onClick={() => handleDownload("en")} style={{
            background:"#fff", color: BK, border:`2px solid ${Y}`,
            borderRadius:"8px", padding:"7px 14px", fontSize:"12px",
            fontWeight:800, cursor:"pointer",
          }}>⬇ English PDF</button>
        </div>
      </div>

      {/* ── Book ── */}
      <div id="hangul-book" style={{ paddingTop:"64px", paddingBottom:"40px", minHeight:"100vh" }}>
        <Cover lang={lang} />
        <Welcome lang={lang} />
        <Consonants slice={[0,7]} page={1} lang={lang} />
        <Consonants slice={[7,14]} page={2} lang={lang} />
        <Vowels lang={lang} />
        <SyllablePage lang={lang} />
        <KdramaPage lang={lang} />
        <PracticePage lang={lang} />
        <AnswerPage lang={lang} />
      </div>
    </>
  );
}
