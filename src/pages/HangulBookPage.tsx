import { useRef } from "react";

/* ─────────────────────────────────────────────
   Data: 14 basic consonants
───────────────────────────────────────────── */
const CONSONANTS = [
  {
    char: "ㄱ",
    roman: "g / k",
    name: "기역 (Giyeok)",
    sound: "Like 'g' in go (start of syllable) or 'k' at end",
    arabic: "ك / ق",
    mnemonic: "Looks like the side of a gun — it kicks out a 'G' sound",
    mnemonicAr: "تشبه بندقية من الجانب — صوت 'ك'",
    examples: [
      { word: "가방", roman: "ga-bang", meaning: "bag / حقيبة" },
      { word: "고양이", roman: "go-yang-i", meaning: "cat / قط" },
    ],
    stroke: "①→ ②↓",
    color: "#FFD700",
  },
  {
    char: "ㄴ",
    roman: "n",
    name: "니은 (Nieun)",
    sound: "Like 'n' in no",
    arabic: "ن",
    mnemonic: "Looks like a boot stepping on the floor — 'N' for Nose",
    mnemonicAr: "تشبه حذاءً — صوت 'ن'",
    examples: [
      { word: "나비", roman: "na-bi", meaning: "butterfly / فراشة" },
      { word: "눈", roman: "nun", meaning: "eye / snow — عين / ثلج" },
    ],
    stroke: "①↓ ②→",
    color: "#FFF176",
  },
  {
    char: "ㄷ",
    roman: "d / t",
    name: "디귿 (Digeut)",
    sound: "Like 'd' in door (start) or 't' at end",
    arabic: "د / ت",
    mnemonic: "A doorway open at the top — 'D' for Door",
    mnemonicAr: "باب مفتوح — صوت 'د'",
    examples: [
      { word: "도서관", roman: "do-seo-gwan", meaning: "library / مكتبة" },
      { word: "달", roman: "dal", meaning: "moon / قمر" },
    ],
    stroke: "①→ ②↓ ③→",
    color: "#FFD700",
  },
  {
    char: "ㄹ",
    roman: "r / l",
    name: "리을 (Rieul)",
    sound: "Between English 'r' and 'l' — tip of tongue flaps",
    arabic: "ر / ل",
    mnemonic: "A roller-coaster track — rolls between R and L",
    mnemonicAr: "مسار أفعوانية — بين 'ر' و'ل'",
    examples: [
      { word: "라면", roman: "ra-myeon", meaning: "ramen / رامن" },
      { word: "사랑", roman: "sa-rang", meaning: "love / حب" },
    ],
    stroke: "①→ ②↓ ③→ ④→",
    color: "#FFF176",
  },
  {
    char: "ㅁ",
    roman: "m",
    name: "미음 (Mieum)",
    sound: "Like 'm' in mom",
    arabic: "م",
    mnemonic: "A square mouth — 'M' for Mouth",
    mnemonicAr: "فم مربع — صوت 'م'",
    examples: [
      { word: "마음", roman: "ma-eum", meaning: "heart/mind / قلب" },
      { word: "물", roman: "mul", meaning: "water / ماء" },
    ],
    stroke: "①↓ ②→ ③↑ ④→",
    color: "#FFD700",
  },
  {
    char: "ㅂ",
    roman: "b / p",
    name: "비읍 (Bieup)",
    sound: "Like 'b' in boy (start) or 'p' at end",
    arabic: "ب / پ",
    mnemonic: "A box sealed shut — 'B' for Box",
    mnemonicAr: "صندوق مغلق — صوت 'ب'",
    examples: [
      { word: "밥", roman: "bap", meaning: "rice / أرز" },
      { word: "버스", roman: "beo-seu", meaning: "bus / أتوبيس" },
    ],
    stroke: "①↓ ②↓ ③→ ④→ ⑤→",
    color: "#FFF176",
  },
  {
    char: "ㅅ",
    roman: "s",
    name: "시옷 (Siot)",
    sound: "Like 's' in sun",
    arabic: "س / ش",
    mnemonic: "A roof peak on a house — 'S' for Sun shining from above",
    mnemonicAr: "سقف مثلث — صوت 'س'",
    examples: [
      { word: "사람", roman: "sa-ram", meaning: "person / شخص" },
      { word: "스타", roman: "seu-ta", meaning: "star / نجم" },
    ],
    stroke: "①↗ ②↘",
    color: "#FFD700",
  },
  {
    char: "ㅇ",
    roman: "silent / ng",
    name: "이응 (Ieung)",
    sound: "Silent at start of syllable; 'ng' (like sing) at end",
    arabic: "صامت / ـنغ",
    mnemonic: "A zero circle — starts silent, ends like a 'ring'",
    mnemonicAr: "دائرة صفر — صامت في البداية، 'نغ' في النهاية",
    examples: [
      { word: "아이", roman: "a-i", meaning: "child / طفل" },
      { word: "강", roman: "gang", meaning: "river / نهر" },
    ],
    stroke: "① circle",
    color: "#FFF176",
  },
  {
    char: "ㅈ",
    roman: "j",
    name: "지읒 (Jieut)",
    sound: "Like 'j' in juice",
    arabic: "ج",
    mnemonic: "A star shape with a hat — 'J' for Jumping",
    mnemonicAr: "نجمة بقبعة — صوت 'ج'",
    examples: [
      { word: "저", roman: "jeo", meaning: "I/me (formal) / أنا (رسمي)" },
      { word: "좋아요", roman: "jo-a-yo", meaning: "I like it / أحبه" },
    ],
    stroke: "①→ ②↗ ③↘",
    color: "#FFD700",
  },
  {
    char: "ㅊ",
    roman: "ch",
    name: "치읓 (Chieut)",
    sound: "Like 'ch' in chair — aspirated ㅈ",
    arabic: "تش",
    mnemonic: "ㅈ wearing a crown — 'CH' is ㅈ with extra air",
    mnemonicAr: "ㅈ مع تاج — نفس الصوت لكن مع نفخة هواء",
    examples: [
      { word: "친구", roman: "chin-gu", meaning: "friend / صديق" },
      { word: "차", roman: "cha", meaning: "tea / car — شاي / سيارة" },
    ],
    stroke: "①→ ②↗ ③↘ ④→",
    color: "#FFF176",
  },
  {
    char: "ㅋ",
    roman: "k",
    name: "키읔 (Kieuk)",
    sound: "Like 'k' in kick — aspirated ㄱ",
    arabic: "ك (مع نفخة)",
    mnemonic: "ㄱ with an extra stroke — more air, harder 'K'",
    mnemonicAr: "ㄱ مع خط إضافي — 'ك' أقوى",
    examples: [
      { word: "카페", roman: "ka-pe", meaning: "café / كافيه" },
      { word: "코", roman: "ko", meaning: "nose / أنف" },
    ],
    stroke: "①→ ②↓ ③→",
    color: "#FFD700",
  },
  {
    char: "ㅌ",
    roman: "t",
    name: "티읕 (Tieut)",
    sound: "Like 't' in top — aspirated ㄷ",
    arabic: "ت (مع نفخة)",
    mnemonic: "ㄷ with a middle bar — stronger 'T' puff",
    mnemonicAr: "ㄷ مع خط وسطي — 'ت' أقوى",
    examples: [
      { word: "택시", roman: "taek-si", meaning: "taxi / تاكسي" },
      { word: "토끼", roman: "to-kki", meaning: "rabbit / أرنب" },
    ],
    stroke: "①→ ②↓ ③→ ④→",
    color: "#FFF176",
  },
  {
    char: "ㅍ",
    roman: "p",
    name: "피읖 (Pieup)",
    sound: "Like 'p' in park — aspirated ㅂ",
    arabic: "ب (مع نفخة)",
    mnemonic: "Two arms stretched wide — a 'P' that puffs air",
    mnemonicAr: "ذراعان ممدودتان — 'ب' مع نفخة",
    examples: [
      { word: "파티", roman: "pa-ti", meaning: "party / حفلة" },
      { word: "편의점", roman: "pyeo-ni-jeom", meaning: "convenience store / دكان" },
    ],
    stroke: "①→ ②↓ ③↓ ④→",
    color: "#FFD700",
  },
  {
    char: "ㅎ",
    roman: "h",
    name: "히읗 (Hieut)",
    sound: "Like 'h' in hello",
    arabic: "هـ",
    mnemonic: "A person with a hat standing tall — 'H' for Hello",
    mnemonicAr: "شخص يرتدي قبعة — صوت 'هـ'",
    examples: [
      { word: "학교", roman: "hak-gyo", meaning: "school / مدرسة" },
      { word: "한국", roman: "han-guk", meaning: "Korea / كوريا" },
    ],
    stroke: "①→ ② circle",
    color: "#FFF176",
  },
];

/* ─────────────────────────────────────────────
   Data: 10 basic vowels
───────────────────────────────────────────── */
const VOWELS = [
  {
    char: "ㅏ",
    roman: "a",
    sound: "Like 'a' in father",
    arabic: "آ",
    mnemonic: "A vertical line with a branch going RIGHT — open your mouth wide for 'AH'",
    mnemonicAr: "خط عمودي وفرع لليمين — افتح فمك 'آ'",
    examples: [
      { word: "아버지", roman: "a-beo-ji", meaning: "father / أب" },
      { word: "바나나", roman: "ba-na-na", meaning: "banana / موز" },
    ],
  },
  {
    char: "ㅓ",
    roman: "eo",
    sound: "Like 'u' in but / uh",
    arabic: "أُ",
    mnemonic: "A vertical line with a branch going LEFT — like pulling back",
    mnemonicAr: "خط عمودي وفرع لليسار — صوت 'أُ'",
    examples: [
      { word: "어머니", roman: "eo-meo-ni", meaning: "mother / أم" },
      { word: "서울", roman: "seo-ul", meaning: "Seoul / سيول" },
    ],
  },
  {
    char: "ㅗ",
    roman: "o",
    sound: "Like 'o' in go",
    arabic: "و",
    mnemonic: "A horizontal line with a branch going UP — round lips like 'OH'",
    mnemonicAr: "خط أفقي وفرع لأعلى — دور شفتيك 'و'",
    examples: [
      { word: "오늘", roman: "o-neul", meaning: "today / اليوم" },
      { word: "고마워", roman: "go-ma-wo", meaning: "thank you (informal) / شكرًا" },
    ],
  },
  {
    char: "ㅜ",
    roman: "u",
    sound: "Like 'oo' in moon",
    arabic: "ُو",
    mnemonic: "A horizontal line with a branch going DOWN — like frowning 'OO'",
    mnemonicAr: "خط أفقي وفرع لأسفل — شفاه دائرية 'أو'",
    examples: [
      { word: "우유", roman: "u-yu", meaning: "milk / حليب" },
      { word: "구름", roman: "gu-reum", meaning: "cloud / سحابة" },
    ],
  },
  {
    char: "ㅡ",
    roman: "eu",
    sound: "Neutral — like a flat 'uh' with spread lips",
    arabic: "إ (محايد)",
    mnemonic: "Just a flat horizontal line — keep your face flat and neutral",
    mnemonicAr: "خط أفقي فقط — صوت محايد",
    examples: [
      { word: "으악", roman: "eu-ak", meaning: "Ahhh! (surprise) / آه!" },
      { word: "크다", roman: "keu-da", meaning: "big / كبير" },
    ],
  },
  {
    char: "ㅣ",
    roman: "i",
    sound: "Like 'ee' in see",
    arabic: "إِي",
    mnemonic: "A single vertical line — stands tall and proud like 'EE'",
    mnemonicAr: "خط عمودي واحد — صوت 'إي'",
    examples: [
      { word: "이름", roman: "i-reum", meaning: "name / اسم" },
      { word: "기다려", roman: "gi-da-ryeo", meaning: "wait for me / انتظرني" },
    ],
  },
  {
    char: "ㅐ",
    roman: "ae",
    sound: "Like 'e' in bed",
    arabic: "إِ",
    mnemonic: "ㅏ plus an extra bar — open 'EH' sound",
    mnemonicAr: "ㅏ مع خط إضافي — صوت 'إِ'",
    examples: [
      { word: "개", roman: "gae", meaning: "dog / كلب" },
      { word: "애인", roman: "ae-in", meaning: "sweetheart / حبيبي" },
    ],
  },
  {
    char: "ㅔ",
    roman: "e",
    sound: "Like 'e' in bed (nearly same as ㅐ in modern Korean)",
    arabic: "إِ",
    mnemonic: "ㅓ plus an extra bar — sounds nearly like ㅐ today",
    mnemonicAr: "ㅓ مع خط إضافي — شبيه بـ ㅐ في الكوري الحديث",
    examples: [
      { word: "에어컨", roman: "e-eo-kon", meaning: "air conditioner / تكييف" },
      { word: "세상", roman: "se-sang", meaning: "world / عالم" },
    ],
  },
  {
    char: "ㅑ",
    roman: "ya",
    sound: "Like 'ya' in yard",
    arabic: "يَا",
    mnemonic: "ㅏ with two right branches — 'Y' doubles the energy to 'YA'",
    mnemonicAr: "ㅏ مع فرعين — صوت 'يَا'",
    examples: [
      { word: "야채", roman: "ya-chae", meaning: "vegetables / خضروات" },
      { word: "야구", roman: "ya-gu", meaning: "baseball / البيسبول" },
    ],
  },
  {
    char: "ㅕ",
    roman: "yeo",
    sound: "Like 'yuh' or 'yeo'",
    arabic: "يُ",
    mnemonic: "ㅓ with two left branches — 'Y' pulling back into 'YUH'",
    mnemonicAr: "ㅓ مع فرعين — صوت 'يُ'",
    examples: [
      { word: "여자", roman: "yeo-ja", meaning: "woman / امرأة" },
      { word: "여행", roman: "yeo-haeng", meaning: "travel / سفر" },
    ],
  },
];

/* ─────────────────────────────────────────────
   Data: Syllable structure examples
───────────────────────────────────────────── */
const SYLLABLE_EXAMPLES = [
  { cons: "ㅁ", vowel: "ㅏ", block: "마", roman: "ma", meaning: "horse / حصان" },
  { cons: "ㅂ", vowel: "ㅏ", block: "바", roman: "ba", meaning: "sea / بحر (in 바다)" },
  { cons: "ㅅ", vowel: "ㅏ", block: "사", roman: "sa", meaning: "four / أربعة" },
  { cons: "ㄴ", vowel: "ㅏ", block: "나", roman: "na", meaning: "I/me / أنا" },
  { cons: "ㄱ", vowel: "ㅗ", block: "고", roman: "go", meaning: "and (connector) / و" },
  { cons: "ㄴ", vowel: "ㅗ", block: "노", roman: "no", meaning: "no / لا" },
  { cons: "ㄷ", vowel: "ㅗ", block: "도", roman: "do", meaning: "also / أيضًا" },
  { cons: "ㅎ", vowel: "ㅏ", block: "하", roman: "ha", meaning: "(part of 하다 = to do)" },
];

/* ─────────────────────────────────────────────
   Data: K-drama essential vocab
───────────────────────────────────────────── */
const KDRAMA_VOCAB = [
  { korean: "오빠", roman: "op-pa", arabic: "أوبا", meaning: "older brother (girl to boy) — heard constantly in K-dramas!" },
  { korean: "언니", roman: "eon-ni", arabic: "أونّي", meaning: "older sister (girl to girl)" },
  { korean: "형", roman: "hyeong", arabic: "هيونغ", meaning: "older brother (boy to boy)" },
  { korean: "누나", roman: "nu-na", arabic: "نونا", meaning: "older sister (boy to girl)" },
  { korean: "사랑해", roman: "sa-rang-hae", arabic: "سارانغ-هيه", meaning: "I love you ❤" },
  { korean: "괜찮아?", roman: "gwaen-chan-a?", arabic: "كوينتشانا؟", meaning: "Are you okay?" },
  { korean: "미안해", roman: "mi-an-hae", arabic: "ميانهيه", meaning: "I'm sorry" },
  { korean: "고마워", roman: "go-ma-wo", arabic: "غوماوو", meaning: "Thank you (informal)" },
  { korean: "잠깐요", roman: "jam-kkan-yo", arabic: "جامكانيو", meaning: "Wait a moment!" },
  { korean: "대박!", roman: "dae-bak!", arabic: "ديباك!", meaning: "Awesome! / Amazing! — إبداع!" },
  { korean: "화이팅!", roman: "hwa-i-ting!", arabic: "هوايتينغ!", meaning: "Fighting! / Go for it! — يلا!" },
  { korean: "배고파", roman: "bae-go-pa", arabic: "بيغوبا", meaning: "I'm hungry / أنا جائع" },
];

/* ─────────────────────────────────────────────
   Data: Practice exercises
───────────────────────────────────────────── */
const EXERCISES = [
  {
    title: "Exercise 1 — Match the Sound",
    titleAr: "تمرين ١ — طابق الصوت",
    instruction: "Draw a line connecting each consonant to its romanization.",
    items: [
      { q: "ㄱ", a: "n" },
      { q: "ㄴ", a: "m" },
      { q: "ㅁ", a: "g" },
      { q: "ㅅ", a: "h" },
      { q: "ㅎ", a: "s" },
    ],
  },
  {
    title: "Exercise 2 — Read & Transliterate",
    titleAr: "تمرين ٢ — اقرأ وحوّل",
    instruction: "Write the romanization for each Korean word below.",
    items: [
      { q: "가방", a: "ga-bang" },
      { q: "사랑", a: "sa-rang" },
      { q: "고마워", a: "go-ma-wo" },
      { q: "한국", a: "han-guk" },
      { q: "친구", a: "chin-gu" },
    ],
  },
  {
    title: "Exercise 3 — Build Syllables",
    titleAr: "تمرين ٣ — ابنِ المقاطع",
    instruction: "Combine the consonant + vowel to form a syllable block.",
    items: [
      { q: "ㅂ + ㅏ = ?", a: "바" },
      { q: "ㄴ + ㅗ = ?", a: "노" },
      { q: "ㅅ + ㅣ = ?", a: "시" },
      { q: "ㅎ + ㅏ = ?", a: "하" },
      { q: "ㄱ + ㅜ = ?", a: "구" },
    ],
  },
];

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function BookPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`book-page relative bg-white ${className}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm 18mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        breakAfter: "page",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ en, ar }: { en: string; ar: string }) {
  return (
    <div className="mb-6 border-b-4 border-yellow-400 pb-2">
      <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{en}</h2>
      <p style={{ fontSize: "14px", color: "#555", fontFamily: "serif", direction: "rtl", textAlign: "right" }}>{ar}</p>
    </div>
  );
}

function ConsonantCard({ c }: { c: (typeof CONSONANTS)[0] }) {
  return (
    <div
      style={{
        background: "#fafafa",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        padding: "14px 12px",
        marginBottom: "10px",
        display: "grid",
        gridTemplateColumns: "80px 1fr",
        gap: "12px",
        alignItems: "start",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      {/* Big character */}
      <div
        style={{
          background: c.color,
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 6px",
          minHeight: "80px",
        }}
      >
        <span style={{ fontSize: "42px", fontWeight: 900, lineHeight: 1, color: "#111" }}>{c.char}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#333", marginTop: "4px" }}>{c.roman}</span>
        <span style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>{c.stroke}</span>
      </div>

      {/* Info */}
      <div>
        <div style={{ fontWeight: 800, fontSize: "13px", color: "#111", marginBottom: "2px" }}>{c.name}</div>
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "3px" }}>
          🔊 <strong>EN:</strong> {c.sound}
        </div>
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "5px" }}>
          🔊 <strong>AR:</strong> {c.arabic}
        </div>
        <div
          style={{
            background: "#fffde7",
            borderRadius: "6px",
            padding: "4px 7px",
            fontSize: "10px",
            color: "#555",
            marginBottom: "4px",
          }}
        >
          💡 {c.mnemonic}
        </div>
        <div
          style={{
            background: "#fff8e1",
            borderRadius: "6px",
            padding: "4px 7px",
            fontSize: "10px",
            color: "#666",
            direction: "rtl",
            textAlign: "right",
            marginBottom: "5px",
          }}
        >
          💡 {c.mnemonicAr}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {c.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                background: "#f3f4f6",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "10px",
              }}
            >
              <strong>{ex.word}</strong> ({ex.roman}) — {ex.meaning}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VowelCard({ v }: { v: (typeof VOWELS)[0] }) {
  return (
    <div
      style={{
        background: "#fafafa",
        border: "2px solid #e5e7eb",
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "10px",
        display: "grid",
        gridTemplateColumns: "70px 1fr",
        gap: "10px",
        alignItems: "start",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <div
        style={{
          background: "#fff9c4",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          minHeight: "70px",
          border: "2px solid #FFD700",
        }}
      >
        <span style={{ fontSize: "38px", fontWeight: 900, lineHeight: 1, color: "#111" }}>{v.char}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#333", marginTop: "3px" }}>{v.roman}</span>
      </div>
      <div>
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "3px" }}>
          🔊 <strong>EN:</strong> {v.sound}
        </div>
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "4px" }}>
          🔊 <strong>AR:</strong> {v.arabic}
        </div>
        <div
          style={{
            background: "#fffde7",
            borderRadius: "6px",
            padding: "3px 6px",
            fontSize: "10px",
            color: "#555",
            marginBottom: "3px",
          }}
        >
          💡 {v.mnemonic}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {v.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                background: "#f3f4f6",
                borderRadius: "5px",
                padding: "2px 7px",
                fontSize: "10px",
              }}
            >
              <strong>{ex.word}</strong> ({ex.roman}) — {ex.meaning}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page: Cover
───────────────────────────────────────────── */
function CoverPage() {
  return (
    <BookPage>
      {/* Yellow top band */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "12mm",
          background: "#FFD700",
        }}
      />
      {/* Yellow bottom band */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "12mm",
          background: "#FFD700",
        }}
      />

      <div style={{ textAlign: "center", paddingTop: "20mm" }}>
        {/* Logo area */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "#111",
            borderRadius: "16px",
            padding: "10px 24px",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🍀</span>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "#FFD700", letterSpacing: "2px" }}>KLOVERS</span>
        </div>

        {/* Korean decorative text */}
        <div style={{ fontSize: "64px", fontWeight: 900, color: "#FFD700", lineHeight: 1, marginBottom: "4px" }}>
          한글
        </div>
        <div style={{ fontSize: "14px", color: "#aaa", letterSpacing: "4px", marginBottom: "30px" }}>
          H A N G U L
        </div>

        {/* Title block */}
        <div
          style={{
            background: "#111",
            borderRadius: "20px",
            padding: "24px 32px",
            margin: "0 10mm 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: "8px" }}>
            The Official Klovers
          </div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#FFD700", lineHeight: 1.2, marginBottom: "8px" }}>
            Hangul Starter Book
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#ccc",
              fontFamily: "serif",
              direction: "rtl",
              marginTop: "12px",
            }}
          >
            كتاب تعلم الهانغول للمبتدئين
          </div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>Level 1 • المستوى الأول</div>
        </div>

        {/* Subtitle */}
        <p style={{ fontSize: "13px", color: "#555", maxWidth: "320px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          Master the Korean alphabet in just 7 days using visual mnemonics,
          Arabic phonetic bridges, and K-drama vocabulary you already love.
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#666",
            direction: "rtl",
            fontFamily: "serif",
            lineHeight: 1.7,
            maxWidth: "320px",
            margin: "0 auto 30px",
          }}
        >
          اتقن الأبجدية الكورية في ٧ أيام فقط باستخدام الصور التذكارية،
          وجسور النطق العربية، ومفردات المسلسلات الكورية.
        </p>

        {/* K-drama icons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", fontSize: "32px", marginBottom: "20px" }}>
          <span>🎵</span>
          <span>🎬</span>
          <span>🌸</span>
          <span>📚</span>
          <span>🏆</span>
        </div>

        {/* Bottom credit */}
        <div style={{ position: "absolute", bottom: "18mm", left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#888" }}>© 2025 Klovers — Korean Language Academy</div>
          <div style={{ fontSize: "10px", color: "#aaa" }}>klovers.academy</div>
        </div>
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Page: Welcome / How to use this book
───────────────────────────────────────────── */
function WelcomePage() {
  return (
    <BookPage>
      <SectionHeader en="Welcome to Hangul!" ar="مرحباً بك في الهانغول!" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* EN */}
        <div style={{ background: "#111", borderRadius: "12px", padding: "16px", color: "#fff" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#FFD700", marginBottom: "10px" }}>
            Why Hangul is Brilliant
          </h3>
          <p style={{ fontSize: "11px", lineHeight: 1.7 }}>
            Hangul (한글) was invented in 1443 by King Sejong the Great. Unlike Chinese or Japanese,
            it is a <strong>phonetic alphabet</strong> — each letter represents a sound.
            Most learners can read Hangul in just <strong>2–3 days</strong> of focused practice!
          </p>
          <p style={{ fontSize: "11px", lineHeight: 1.7, marginTop: "8px" }}>
            Korean has <strong>14 basic consonants</strong> and <strong>10 basic vowels</strong>.
            They combine into <strong>syllable blocks</strong> rather than reading left-to-right
            like English.
          </p>
        </div>
        {/* AR */}
        <div
          style={{
            background: "#fffde7",
            borderRadius: "12px",
            padding: "16px",
            direction: "rtl",
            fontFamily: "serif",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#111", marginBottom: "10px" }}>
            لماذا الهانغول رائع؟
          </h3>
          <p style={{ fontSize: "11px", lineHeight: 1.9, color: "#333" }}>
            اخترع الملك سيجونغ الهانغول عام ١٤٤٣م. على عكس الصينية أو اليابانية، فهو
            <strong> أبجدية صوتية</strong> — كل حرف يمثل صوتًا محددًا.
            معظم المتعلمين يستطيعون القراءة في <strong>٢–٣ أيام</strong> من الممارسة!
          </p>
          <p style={{ fontSize: "11px", lineHeight: 1.9, color: "#333", marginTop: "8px" }}>
            الكورية تحتوي على <strong>١٤ حرفًا ساكنًا</strong> و<strong>١٠ حروف مد</strong>.
            تتحد لتشكّل <strong>كتلًا مقطعية</strong>.
          </p>
        </div>
      </div>

      {/* The system diagram */}
      <div
        style={{
          background: "#f8f9fa",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: "13px", marginBottom: "12px" }}>
          How a Syllable Block Works — كيف تعمل الكتلة المقطعية
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: "Consonant\nحرف ساكن", char: "ㅎ", roman: "h" },
            { label: "+", char: "", roman: "" },
            { label: "Vowel\nحرف مد", char: "ㅏ", roman: "a" },
            { label: "=", char: "", roman: "" },
            { label: "Syllable\nمقطع", char: "하", roman: "ha" },
          ].map((item, i) =>
            item.char === "" ? (
              <div key={i} style={{ fontSize: "28px", fontWeight: 900, color: "#FFD700" }}>
                {item.label}
              </div>
            ) : (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#666", whiteSpace: "pre-line", marginBottom: "4px" }}>
                  {item.label}
                </div>
                <div
                  style={{
                    background: "#FFD700",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    fontSize: "36px",
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {item.char}
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#555", marginTop: "4px" }}>{item.roman}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Study plan */}
      <div style={{ background: "#111", borderRadius: "12px", padding: "16px" }}>
        <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFD700", marginBottom: "10px" }}>
          7-Day Study Plan — خطة الدراسة في ٧ أيام
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {[
            { day: "Day 1", ar: "يوم ١", topic: "Vowels ㅏ–ㅜ" },
            { day: "Day 2", ar: "يوم ٢", topic: "Vowels ㅡ–ㅕ" },
            { day: "Day 3", ar: "يوم ٣", topic: "Cons. ㄱ–ㄷ" },
            { day: "Day 4", ar: "يوم ٤", topic: "Cons. ㄹ–ㅅ" },
            { day: "Day 5", ar: "يوم ٥", topic: "Cons. ㅇ–ㅊ" },
            { day: "Day 6", ar: "يوم ٦", topic: "Cons. ㅋ–ㅎ" },
            { day: "Day 7", ar: "يوم ٧", topic: "Syllables + Review" },
          ].map((d, i) => (
            <div
              key={i}
              style={{
                background: i === 6 ? "#FFD700" : "#222",
                borderRadius: "8px",
                padding: "8px 4px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "9px", fontWeight: 800, color: i === 6 ? "#111" : "#FFD700" }}>{d.day}</div>
              <div style={{ fontSize: "8px", color: i === 6 ? "#333" : "#aaa", direction: "rtl" }}>{d.ar}</div>
              <div style={{ fontSize: "8px", color: i === 6 ? "#111" : "#ccc", marginTop: "3px" }}>{d.topic}</div>
            </div>
          ))}
        </div>
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Pages: Consonants (split into 2 pages)
───────────────────────────────────────────── */
function ConsonantsPage({ slice, pageNum }: { slice: [number, number]; pageNum: number }) {
  return (
    <BookPage>
      <SectionHeader
        en={`Part 1: Consonants (자음) — Page ${pageNum}/2`}
        ar={`الجزء الأول: الحروف الساكنة (صفحة ${pageNum} من ٢)`}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {CONSONANTS.slice(...slice).map((c) => (
          <ConsonantCard key={c.char} c={c} />
        ))}
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Pages: Vowels
───────────────────────────────────────────── */
function VowelsPage() {
  return (
    <BookPage>
      <SectionHeader en="Part 2: Vowels (모음)" ar="الجزء الثاني: حروف المد" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {VOWELS.map((v) => (
          <VowelCard key={v.char} v={v} />
        ))}
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Page: Syllable Building
───────────────────────────────────────────── */
function SyllablePage() {
  return (
    <BookPage>
      <SectionHeader en="Part 3: Building Syllable Blocks" ar="الجزء الثالث: بناء الكتل المقطعية" />

      {/* Rules */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div style={{ background: "#111", borderRadius: "12px", padding: "14px", color: "#fff", fontSize: "11px" }}>
          <div style={{ fontWeight: 800, color: "#FFD700", marginBottom: "8px" }}>The 3 Rules</div>
          <div style={{ lineHeight: 1.8 }}>
            <div>① Every syllable starts with a consonant</div>
            <div>② Vowels sit beside or below the consonant</div>
            <div>③ Optional final consonant (받침) goes underneath</div>
          </div>
          <div style={{ marginTop: "10px", background: "#222", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "4px" }}>ㄱ + ㅏ + ㄴ</div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: "#FFD700" }}>간</div>
            <div style={{ fontSize: "10px", color: "#888" }}>gan = liver / كبد</div>
          </div>
        </div>
        <div style={{ background: "#fffde7", borderRadius: "12px", padding: "14px", direction: "rtl", fontFamily: "serif", fontSize: "11px" }}>
          <div style={{ fontWeight: 800, color: "#111", marginBottom: "8px" }}>القواعد الثلاث</div>
          <div style={{ lineHeight: 1.9, color: "#333" }}>
            <div>① كل مقطع يبدأ بحرف ساكن</div>
            <div>② حروف المد تجلس بجانب الحرف أو أسفله</div>
            <div>③ حرف ساكن اختياري في النهاية (باتشيم) يوضع تحت</div>
          </div>
        </div>
      </div>

      {/* Vertical vs horizontal vowel */}
      <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
        <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: "10px" }}>
          Vowel Position Rule — قاعدة موضع حرف المد
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px" }}>
              Tall vowel (ㅏ,ㅓ,ㅣ,ㅐ,ㅔ) → sits to the RIGHT
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
              {["가", "나", "사"].map((s) => (
                <div key={s} style={{ background: "#FFD700", borderRadius: "8px", padding: "8px 14px", fontSize: "32px", fontWeight: 900 }}>{s}</div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px" }}>
              Wide vowel (ㅗ,ㅜ,ㅡ,ㅛ,ㅠ) → sits BELOW
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
              {["고", "노", "소"].map((s) => (
                <div key={s} style={{ background: "#fff9c4", border: "2px solid #FFD700", borderRadius: "8px", padding: "8px 14px", fontSize: "32px", fontWeight: 900 }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Syllable grid */}
      <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: "8px" }}>
        Syllable Examples — أمثلة على المقاطع
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {SYLLABLE_EXAMPLES.map((s) => (
          <div
            key={s.block}
            style={{
              background: "#111",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
              {s.cons} + {s.vowel}
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: "#FFD700", lineHeight: 1 }}>{s.block}</div>
            <div style={{ fontSize: "10px", color: "#ccc", marginTop: "3px" }}>{s.roman}</div>
            <div style={{ fontSize: "9px", color: "#888" }}>{s.meaning}</div>
          </div>
        ))}
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Page: K-drama Vocabulary
───────────────────────────────────────────── */
function KdramaPage() {
  return (
    <BookPage>
      <SectionHeader en="Part 4: K-Drama Essentials 🎬" ar="الجزء الرابع: أساسيات المسلسلات الكورية 🎬" />
      <p style={{ fontSize: "11px", color: "#555", marginBottom: "14px" }}>
        You've heard these words a hundred times — now read them in Hangul!
        <span style={{ direction: "rtl", display: "block", fontFamily: "serif", color: "#666", marginTop: "3px" }}>
          سمعت هذه الكلمات مئة مرة — الآن اقرأها بالهانغول!
        </span>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {KDRAMA_VOCAB.map((v) => (
          <div
            key={v.korean}
            style={{
              background: "#fafafa",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div
              style={{
                background: "#FFD700",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "22px",
                fontWeight: 900,
                color: "#111",
                whiteSpace: "nowrap",
                minWidth: "64px",
                textAlign: "center",
              }}
            >
              {v.korean}
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#333" }}>{v.roman}</div>
              <div style={{ fontSize: "10px", color: "#666", direction: "rtl", fontFamily: "serif" }}>{v.arabic}</div>
              <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.5 }}>{v.meaning}</div>
            </div>
          </div>
        ))}
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Page: Writing Practice
───────────────────────────────────────────── */
function PracticePage() {
  const dotGrid = Array(8).fill(null);
  const lines = Array(6).fill(null);

  return (
    <BookPage>
      <SectionHeader en="Part 5: Writing Practice ✏️" ar="الجزء الخامس: تمرين الكتابة ✏️" />

      {/* Exercises */}
      {EXERCISES.map((ex, ei) => (
        <div
          key={ei}
          style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "14px",
            pageBreakInside: "avoid",
            breakInside: "avoid",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "12px", color: "#111", marginBottom: "2px" }}>{ex.title}</div>
          <div style={{ fontSize: "10px", color: "#888", direction: "rtl", fontFamily: "serif", marginBottom: "6px" }}>
            {ex.titleAr}
          </div>
          <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px" }}>📝 {ex.instruction}</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {ex.items.map((item, ii) => (
              <div
                key={ii}
                style={{
                  background: "#fff",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#111",
                  minWidth: "60px",
                  textAlign: "center",
                }}
              >
                <div>{item.q}</div>
                <div
                  style={{
                    marginTop: "6px",
                    borderTop: "1px dashed #ccc",
                    paddingTop: "4px",
                    fontSize: "10px",
                    fontWeight: 400,
                    color: "#ccc",
                    minHeight: "18px",
                  }}
                >
                  {/* answer hidden for practice */}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Free writing grid */}
      <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "14px" }}>
        <div style={{ fontWeight: 800, fontSize: "12px", marginBottom: "8px" }}>
          Free Writing Practice — تمرين الكتابة الحرة
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "4px" }}>
          {dotGrid.map((_, row) =>
            dotGrid.map((_, col) => (
              <div
                key={`${row}-${col}`}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  height: "32px",
                  background: "#fff",
                }}
              />
            ))
          )}
        </div>
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Page: Answer Key + Certificate
───────────────────────────────────────────── */
function AnswerKeyPage() {
  return (
    <BookPage>
      <SectionHeader en="Answer Key — مفتاح الإجابات" ar="" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {EXERCISES.map((ex, ei) => (
          <div key={ei} style={{ background: "#f8f9fa", borderRadius: "10px", padding: "12px" }}>
            <div style={{ fontWeight: 800, fontSize: "11px", color: "#111", marginBottom: "8px" }}>{ex.title}</div>
            {ex.items.map((item, ii) => (
              <div
                key={ii}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  padding: "3px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontWeight: 700 }}>{item.q}</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>{item.a}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Quick reference table */}
      <div style={{ background: "#111", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFD700", marginBottom: "10px" }}>
          Quick Reference — المرجع السريع
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px" }}>
          {CONSONANTS.map((c) => (
            <div key={c.char} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#FFD700" }}>{c.char}</div>
              <div style={{ fontSize: "9px", color: "#ccc" }}>{c.roman}</div>
            </div>
          ))}
        </div>
        <div style={{ height: "1px", background: "#333", margin: "8px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px" }}>
          {VOWELS.map((v) => (
            <div key={v.char} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff9c4" }}>{v.char}</div>
              <div style={{ fontSize: "9px", color: "#ccc" }}>{v.roman}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini certificate */}
      <div
        style={{
          border: "4px solid #FFD700",
          borderRadius: "16px",
          padding: "20px",
          textAlign: "center",
          background: "#fffde7",
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "4px" }}>🏆</div>
        <div style={{ fontSize: "18px", fontWeight: 900, color: "#111" }}>
          Hangul Level 1 — Complete!
        </div>
        <div style={{ fontSize: "13px", color: "#555", direction: "rtl", fontFamily: "serif", marginTop: "4px" }}>
          تهانينا! أتممت مستوى الهانغول الأول
        </div>
        <div style={{ margin: "14px auto", width: "200px", borderBottom: "2px solid #999" }} />
        <div style={{ fontSize: "11px", color: "#888" }}>Student Name — اسم الطالب</div>
        <div style={{ marginTop: "10px", fontSize: "11px", color: "#aaa" }}>
          Awarded by <strong>Klovers Korean Academy</strong> • klovers.academy
        </div>
      </div>
    </BookPage>
  );
}

/* ─────────────────────────────────────────────
   Main exported component
───────────────────────────────────────────── */
export default function HangulBookPage() {
  const bookRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #hangul-book, #hangul-book * { visibility: visible !important; }
          #hangul-book { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .book-page {
            page-break-after: always;
            break-after: page;
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page { size: A4; margin: 0; }
        }
        @media screen {
          .book-page {
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            margin: 0 auto 32px;
          }
        }
        body { background: #f0f0f0; }
      `}</style>

      {/* ── Control bar (screen only) ── */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "#111",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🍀</span>
          <span style={{ fontWeight: 900, color: "#FFD700", fontSize: "16px" }}>KLOVERS</span>
          <span style={{ color: "#888", fontSize: "13px" }}>— Hangul Level 1 Book</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <button
            onClick={handlePrint}
            style={{
              background: "#FFD700",
              color: "#111",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ⬇ Download / Print PDF
          </button>
        </div>
      </div>

      {/* ── Book content ── */}
      <div
        id="hangul-book"
        ref={bookRef}
        style={{ paddingTop: "64px", paddingBottom: "40px", background: "#f0f0f0", minHeight: "100vh" }}
      >
        <CoverPage />
        <WelcomePage />
        <ConsonantsPage slice={[0, 7]} pageNum={1} />
        <ConsonantsPage slice={[7, 14]} pageNum={2} />
        <VowelsPage />
        <SyllablePage />
        <KdramaPage />
        <PracticePage />
        <AnswerKeyPage />
      </div>
    </>
  );
}
