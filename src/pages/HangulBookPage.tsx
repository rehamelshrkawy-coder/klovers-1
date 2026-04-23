import { useState } from "react";

/* ─── Brand tokens ─────────────────────────────── */
const Y   = "#FFFF00";
const YL  = "#FFFFBB";
const BK  = "#111111";
const BK2 = "#222222";

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
        position:"relative", overflow:"hidden",
        pageBreakAfter:"always", breakAfter:"page",
        direction: dir,
      }}
    >
      {/* yellow top stripe */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:Y }} />
      {/* black bottom stripe */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:BK }} />
      {/* yellow side bar */}
      <div style={{ position:"absolute", top:"9px", bottom:"6px", left:0, width:"5px", background:Y }} />

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
        <div style={{ fontSize:"10px", color:"#ccc", marginTop:"1px" }}>{c.roman}</div>
        <div style={{ fontSize:"18px", marginTop:"3px" }}>{c.emoji}</div>
      </div>
      {/* Info — pure target language */}
      <div>
        <div style={{ fontWeight:900, fontSize:"13px", color:BK, marginBottom:"2px" }}>{d.name}</div>
        <div style={{
          background: isAr ? YL : "#f0f0f0",
          borderRadius:"6px", padding:"3px 7px",
          fontSize:"10px", color:"#444", marginBottom:"3px",
        }}>🔊 {d.sound}</div>
        <div style={{
          background:YL, borderRadius:"6px",
          padding:"3px 7px", fontSize:"10px", color:"#555", marginBottom:"4px",
        }}>💡 {d.mnemonic}</div>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {d.ex.map((ex, i) => (
            <div key={i} style={{
              background:BK2, borderRadius:"5px",
              padding:"3px 7px", fontSize:"9px", color:"#fff",
            }}>
              <span style={{ color:Y, fontWeight:800 }}>{ex.k}</span>
              {" "}({ex.r}) — {ex.m}
            </div>
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
      background:"#f9f9f9", border:`2px solid #E6E600`,
      borderRadius:"10px", padding:"8px",
      display:"grid", gridTemplateColumns:"58px 1fr", gap:"8px",
      pageBreakInside:"avoid", breakInside:"avoid", marginBottom:"6px",
      direction: isAr ? "rtl" : "ltr",
    }}>
      <div style={{
        background:Y, borderRadius:"8px",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        minHeight:"64px", padding:"6px",
      }}>
        <div style={{ fontSize:"40px", fontWeight:900, color:BK, lineHeight:1 }}>{v.char}</div>
        <div style={{ fontSize:"10px", fontWeight:700, color:BK2, marginTop:"2px" }}>{v.roman}</div>
        <div style={{ fontSize:"15px" }}>{v.emoji}</div>
      </div>
      <div>
        <div style={{ fontWeight:900, fontSize:"12px", color:BK, marginBottom:"2px" }}>{d.name}</div>
        <div style={{
          background: isAr ? YL : "#f0f0f0",
          borderRadius:"6px", padding:"3px 6px",
          fontSize:"10px", color:"#444", marginBottom:"3px",
        }}>🔊 {d.sound}</div>
        <div style={{ background:YL, borderRadius:"6px", padding:"3px 6px", fontSize:"10px", color:"#555", marginBottom:"4px" }}>
          💡 {d.mnemonic}
        </div>
        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
          {d.ex.map((ex, i) => (
            <div key={i} style={{
              background:BK2, borderRadius:"5px",
              padding:"2px 6px", fontSize:"9px", color:"#fff",
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
   BOOK PAGES — Arabic version
══════════════════════════════════════════════════ */

function CoverAr() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", background:BK,
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"18mm", direction:"rtl",
    }}>
      {/* borders */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", left:0, width:"8px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", right:0, width:"8px", background:Y }} />

      {/* Huge background character */}
      <div style={{ position:"absolute", top:"-20px", left:"-20px", fontSize:"300px", fontWeight:900, color:"#1a1a00", lineHeight:1, userSelect:"none" }}>글</div>

      {/* Logo */}
      <div style={{ background:Y, borderRadius:"40px", padding:"8px 24px", display:"flex", alignItems:"center", gap:"10px", marginBottom:"22px" }}>
        <span style={{ fontSize:"24px" }}>🍀</span>
        <span style={{ fontSize:"20px", fontWeight:900, color:BK, letterSpacing:"3px" }}>KLOVERS</span>
      </div>

      {/* Korean hero */}
      <div style={{ textAlign:"center", marginBottom:"18px" }}>
        <div style={{ fontSize:"96px", fontWeight:900, color:Y, lineHeight:1 }}>한글</div>
        <div style={{ fontSize:"12px", color:"#777", letterSpacing:"8px", marginTop:"4px" }}>H • A • N • G • U • L</div>
      </div>

      {/* Title box */}
      <div style={{ border:`3px solid ${Y}`, borderRadius:"16px", padding:"20px 28px", textAlign:"center", maxWidth:"340px", marginBottom:"18px" }}>
        <div style={{ fontSize:"30px", fontWeight:900, color:"#fff", lineHeight:1.2 }}>كتاب الهانغول الرسمي</div>
        <div style={{ fontSize:"14px", color:Y, fontWeight:700, marginTop:"6px" }}>النسخة العربية-الكورية</div>
        <div style={{ marginTop:"10px", display:"flex", justifyContent:"center", gap:"6px", flexWrap:"wrap" }}>
          {["🎬 مسلسلات", "🎵 كيبوب", "🌸 ثقافة كورية"].map(t => (
            <span key={t} style={{ background:"#222", color:Y, fontSize:"10px", fontWeight:700, padding:"3px 8px", borderRadius:"20px" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Level badge */}
      <div style={{ background:Y, borderRadius:"40px", padding:"8px 28px", textAlign:"center", marginBottom:"18px" }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:BK }}>المستوى الأول — مبتدئ</div>
      </div>

      {/* Alphabet strip */}
      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", justifyContent:"center", maxWidth:"300px" }}>
        {"ㄱㄴㄷㄹㅁㅂㅅㅇㅏㅓㅗㅜㅡㅣ".split("").map((ch, i) => (
          <div key={i} style={{ background: i%2===0?"#1a1a00":"#222", border:`1px solid ${Y}33`, borderRadius:"6px", width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", color:Y, fontWeight:700 }}>{ch}</div>
        ))}
      </div>

      <div style={{ position:"absolute", bottom:"22px", textAlign:"center", direction:"rtl" }}>
        <div style={{ fontSize:"10px", color:"#555" }}>© 2025 Klovers Korean Academy — klovers.academy</div>
        <div style={{ fontSize:"10px", color:Y, marginTop:"2px" }}>نسخة عربية–كورية حصرية</div>
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
          <p style={{ fontSize:"10px", lineHeight:2, color:"#ddd", margin:0 }}>
            اخترع الملك سيجونغ الهانغول عام ١٤٤٣م. إنها <strong style={{color:Y}}>أبجدية صوتية</strong> — كل حرف يمثل صوتاً واحداً فقط. معظم المتعلمين يستطيعون القراءة في <strong style={{color:Y}}>٢ إلى ٣ أيام</strong> فقط!
          </p>
        </div>
        <div style={{ background:Y, borderRadius:"12px", padding:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:BK, marginBottom:"7px" }}>الأرقام السحرية</div>
          {[{n:"١٤", l:"حرفاً ساكناً أساسياً"},{n:"١٠", l:"حروف مد أساسية"},{n:"∞", l:"مقطع ممكن التكوين"}].map(({n,l})=>(
            <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"7px" }}>
              <div style={{ background:BK, color:Y, fontWeight:900, fontSize:"18px", width:"36px", height:"36px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:"11px", color:BK2, fontWeight:600 }}>{l}</div>
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
                <div style={{fontSize:"9px",color:"#555",marginBottom:"3px",direction:"rtl"}}>{item.label}</div>
                <div style={{background:item.bg,borderRadius:"10px",padding:"8px 14px",fontSize:"40px",fontWeight:900,color:item.fg,lineHeight:1,border:item.bg==="transparent"?"none":`2px solid ${Y}`}}>{item.char}</div>
                {item.sub&&<div style={{fontSize:"10px",color:"#555",marginTop:"3px"}}>{item.sub}</div>}
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
            <div style={{ fontSize:"9px", fontWeight:800, color:i===6?BK:Y }}>{p.d}</div>
            <div style={{ fontSize:"8px", color:i===6?BK2:"#aaa", marginTop:"3px", lineHeight:1.4 }}>{p.t}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function ConsonantsAr({ slice, page }: { slice:[number,number]; page:number }) {
  return (
    <Page dir="rtl">
      <SHead title={`الحروف الساكنة (자음) — الجزء ${page===1?"١":"٢"} من ٢`} subtitle="كل مقطع كوري يبدأ بحرف ساكن" />
      <div style={{ background:YL, borderRadius:"8px", padding:"6px 10px", fontSize:"10px", color:BK2, marginBottom:"8px" }}>
        💡 هناك ١٤ حرفاً ساكناً أساسياً، و٥ حروف ساكنة مُشدَّدة (مع نفخة هواء). تعلّم الأساسية أولاً!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {CONSONANTS.slice(...slice).map(c => <ConsCard key={c.char} c={c} lang="ar" />)}
      </div>
    </Page>
  );
}

function VowelsAr() {
  return (
    <Page dir="rtl">
      <SHead title="حروف المد (모음)" subtitle="حروف المد لا تقف وحدها — تحتاج دائماً حرفاً ساكناً" />
      <div style={{ background:BK, borderRadius:"8px", padding:"6px 10px", fontSize:"10px", color:Y, marginBottom:"8px" }}>
        🌟 إذا بدأت الكلمة بصوت مدّي، نضع الحرف الصامت ㅇ أمامه: مثال → أ = 아 (ㅇ + ㅏ)
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {VOWELS.map(v => <VowCard key={v.char} v={v} lang="ar" />)}
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
            <div style={{ fontSize:"10px", fontWeight:700, color:"#fff", lineHeight:1.6, marginBottom:"3px" }}>{r.t}</div>
            <div style={{ fontSize:"9px", color:"#aaa", marginBottom:"4px" }}>{r.n2}</div>
            <div style={{ fontSize:"14px", color:Y, fontWeight:800 }}>{r.ex}</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>🔤 أمثلة على المقاطع</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"5px" }}>
        {SYLLABLES.map(s=>(
          <div key={s.b} style={{ background:BK, borderRadius:"8px", padding:"7px 4px", textAlign:"center" }}>
            <div style={{ fontSize:"8px", color:"#555", direction:"ltr" }}>{s.c}+{s.v}</div>
            <div style={{ fontSize:"32px", fontWeight:900, color:Y, lineHeight:1 }}>{s.b}</div>
            <div style={{ fontSize:"9px", color:"#aaa" }}>{s.r}</div>
            <div style={{ fontSize:"8px", color:"#888" }}>{s.ar}</div>
          </div>
        ))}
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
              <div style={{ fontSize:"10px", fontWeight:700, color:"#777", direction:"ltr" }}>{v.r}</div>
              <div style={{ fontSize:"11px", color:BK, fontWeight:700 }}>{v.m}</div>
              <div style={{ fontSize:"9px", color:"#888", fontStyle:"italic" }}>{v.note}</div>
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

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>تمرين ١ — اختر الصوت الصحيح لكل حرف</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{q:"ㄱ",c:["ن","م","ك","هـ"]},{q:"ㄴ",c:["ك","ن","س","م"]},{q:"ㅁ",c:["هـ","ب","م","ر"]},{q:"ㅅ",c:["س","ك","ج","ب"]},{q:"ㅎ",c:["م","هـ","ن","ك"]}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"30px", color:Y, fontWeight:900 }}>{e.q}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px", marginTop:"4px" }}>
                {e.c.map(ch=><div key={ch} style={{ background:"#222", borderRadius:"4px", padding:"2px", fontSize:"10px", color:"#ccc" }}>{ch}</div>)}
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
            <div style={{ fontSize:"10px", fontWeight:800, color:BK, marginBottom:"5px" }}>{ex.t}</div>
            {ex.items.map(([q,a])=>(
              <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", padding:"2px 0", borderBottom:"1px solid #eee", direction:"ltr" }}>
                <span style={{ fontWeight:700 }}>{q}</span>
                <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"10px" }}>
        <div style={{ fontSize:"10px", fontWeight:800, color:Y, marginBottom:"7px" }}>جدول المرجع السريع — الحروف الساكنة</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {CONSONANTS.map(c=>(
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color:Y, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"8px", color:"#aaa" }}>{c.roman}</div>
              <div style={{ fontSize:"12px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:"#333", margin:"6px 0" }} />
        <div style={{ fontSize:"10px", fontWeight:800, color:Y, marginBottom:"6px" }}>حروف المد</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"4px" }}>
          {VOWELS.map(v=>(
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:"#fff9c4", fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"8px", color:"#aaa" }}>{v.roman}</div>
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
        <div style={{ marginTop:"10px", fontSize:"10px", color:"#aaa" }}>Klovers Korean Academy • klovers.academy • 2025</div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════
   BOOK PAGES — English version
══════════════════════════════════════════════════ */

function CoverEn() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", background:BK,
      pageBreakAfter:"always", breakAfter:"page",
      position:"relative", overflow:"hidden", boxSizing:"border-box",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"18mm",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"14px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", left:0, width:"8px", background:Y }} />
      <div style={{ position:"absolute", top:"14px", bottom:"14px", right:0, width:"8px", background:Y }} />

      <div style={{ position:"absolute", top:"-20px", right:"-20px", fontSize:"300px", fontWeight:900, color:"#1a1a00", lineHeight:1, userSelect:"none" }}>한</div>

      <div style={{ background:Y, borderRadius:"40px", padding:"8px 24px", display:"flex", alignItems:"center", gap:"10px", marginBottom:"22px" }}>
        <span style={{ fontSize:"24px" }}>🍀</span>
        <span style={{ fontSize:"20px", fontWeight:900, color:BK, letterSpacing:"3px" }}>KLOVERS</span>
      </div>

      <div style={{ textAlign:"center", marginBottom:"18px" }}>
        <div style={{ fontSize:"96px", fontWeight:900, color:Y, lineHeight:1 }}>한글</div>
        <div style={{ fontSize:"12px", color:"#777", letterSpacing:"8px", marginTop:"4px" }}>H • A • N • G • U • L</div>
      </div>

      <div style={{ border:`3px solid ${Y}`, borderRadius:"16px", padding:"20px 28px", textAlign:"center", maxWidth:"340px", marginBottom:"18px" }}>
        <div style={{ fontSize:"30px", fontWeight:900, color:"#fff", lineHeight:1.2 }}>Official Hangul Starter Book</div>
        <div style={{ fontSize:"14px", color:Y, fontWeight:700, marginTop:"6px" }}>English–Korean Edition</div>
        <div style={{ marginTop:"10px", display:"flex", justifyContent:"center", gap:"6px", flexWrap:"wrap" }}>
          {["🎬 K-Drama", "🎵 K-Pop", "🌸 Korean Culture"].map(t=>(
            <span key={t} style={{ background:"#222", color:Y, fontSize:"10px", fontWeight:700, padding:"3px 8px", borderRadius:"20px" }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ background:Y, borderRadius:"40px", padding:"8px 28px", textAlign:"center", marginBottom:"18px" }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:BK }}>Level 1 — Beginner</div>
      </div>

      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", justifyContent:"center", maxWidth:"300px" }}>
        {"ㄱㄴㄷㄹㅁㅂㅅㅇㅏㅓㅗㅜㅡㅣ".split("").map((ch,i)=>(
          <div key={i} style={{ background:i%2===0?"#1a1a00":"#222", border:`1px solid ${Y}33`, borderRadius:"6px", width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", color:Y, fontWeight:700 }}>{ch}</div>
        ))}
      </div>

      <div style={{ position:"absolute", bottom:"22px", textAlign:"center" }}>
        <div style={{ fontSize:"10px", color:"#555" }}>© 2025 Klovers Korean Academy — klovers.academy</div>
        <div style={{ fontSize:"10px", color:Y, marginTop:"2px" }}>Exclusive English–Korean Edition</div>
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
          <p style={{ fontSize:"10px", lineHeight:2, color:"#ddd", margin:0 }}>
            King Sejong invented Hangul in 1443. It is a <strong style={{color:Y}}>phonetic alphabet</strong> — each letter represents exactly one sound. Most learners can read in just <strong style={{color:Y}}>2–3 days</strong> of focused practice!
          </p>
        </div>
        <div style={{ background:Y, borderRadius:"12px", padding:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:BK, marginBottom:"7px" }}>The Magic Numbers</div>
          {[{n:"14",l:"basic consonants"},{n:"10",l:"basic vowels"},{n:"∞",l:"possible syllables"}].map(({n,l})=>(
            <div key={n} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"7px" }}>
              <div style={{ background:BK, color:Y, fontWeight:900, fontSize:"18px", width:"36px", height:"36px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:"11px", color:BK2, fontWeight:600 }}>{l}</div>
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
                <div style={{fontSize:"9px",color:"#555",marginBottom:"3px"}}>{item.label}</div>
                <div style={{background:item.bg,borderRadius:"10px",padding:"8px 14px",fontSize:"40px",fontWeight:900,color:item.fg,lineHeight:1,border:`2px solid ${Y}`}}>{item.char}</div>
                {item.sub&&<div style={{fontSize:"10px",color:"#555",marginTop:"3px"}}>{item.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>📅 7-Day Study Plan</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px" }}>
        {plan.map((p,i)=>(
          <div key={i} style={{ background:i===6?Y:BK, borderRadius:"8px", padding:"7px 3px", textAlign:"center" }}>
            <div style={{ fontSize:"9px", fontWeight:800, color:i===6?BK:Y }}>{p.d}</div>
            <div style={{ fontSize:"8px", color:i===6?BK2:"#aaa", marginTop:"3px", lineHeight:1.4 }}>{p.t}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function ConsonantsEn({ slice, page }: { slice:[number,number]; page:number }) {
  return (
    <Page dir="ltr">
      <SHead title={`Consonants (자음) — Part ${page} of 2`} subtitle="Every Korean syllable begins with a consonant" />
      <div style={{ background:YL, borderRadius:"8px", padding:"6px 10px", fontSize:"10px", color:BK2, marginBottom:"8px" }}>
        💡 There are 14 basic consonants plus 5 aspirated (with a puff of air). Master the basics first!
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {CONSONANTS.slice(...slice).map(c=><ConsCard key={c.char} c={c} lang="en" />)}
      </div>
    </Page>
  );
}

function VowelsEn() {
  return (
    <Page dir="ltr">
      <SHead title="Vowels (모음)" subtitle="Vowels never stand alone — they always need a consonant" />
      <div style={{ background:BK, borderRadius:"8px", padding:"6px 10px", fontSize:"10px", color:Y, marginBottom:"8px" }}>
        🌟 If a syllable starts with a vowel sound, use the silent ㅇ as a placeholder: e.g., "a" = 아 (ㅇ + ㅏ)
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
        {VOWELS.map(v=><VowCard key={v.char} v={v} lang="en" />)}
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
            <div style={{ fontSize:"10px", fontWeight:700, color:"#fff", lineHeight:1.6, marginBottom:"3px" }}>{r.t}</div>
            <div style={{ fontSize:"9px", color:"#aaa", marginBottom:"4px" }}>{r.n2}</div>
            <div style={{ fontSize:"14px", color:Y, fontWeight:800 }}>{r.ex}</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight:800, fontSize:"11px", color:BK, marginBottom:"6px" }}>🔤 Syllable Examples</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"5px" }}>
        {SYLLABLES.map(s=>(
          <div key={s.b} style={{ background:BK, borderRadius:"8px", padding:"7px 4px", textAlign:"center" }}>
            <div style={{ fontSize:"8px", color:"#555" }}>{s.c}+{s.v}</div>
            <div style={{ fontSize:"32px", fontWeight:900, color:Y, lineHeight:1 }}>{s.b}</div>
            <div style={{ fontSize:"9px", color:"#aaa" }}>{s.r}</div>
            <div style={{ fontSize:"8px", color:"#888" }}>{s.en}</div>
          </div>
        ))}
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
              <div style={{ fontSize:"10px", fontWeight:700, color:"#777" }}>{v.r}</div>
              <div style={{ fontSize:"11px", color:BK, fontWeight:700 }}>{v.m}</div>
              <div style={{ fontSize:"9px", color:"#888", fontStyle:"italic" }}>{v.note}</div>
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

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:Y, marginBottom:"6px" }}>Exercise 1 — Circle the correct romanization</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
          {[{q:"ㄱ",c:["n","m","g","h"]},{q:"ㄴ",c:["g","n","s","m"]},{q:"ㅁ",c:["h","b","m","r"]},{q:"ㅅ",c:["s","k","j","p"]},{q:"ㅎ",c:["m","h","n","g"]}].map((e,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"30px", color:Y, fontWeight:900 }}>{e.q}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px", marginTop:"4px" }}>
                {e.c.map(ch=><div key={ch} style={{ background:"#222", borderRadius:"4px", padding:"2px", fontSize:"10px", color:"#ccc" }}>{ch}</div>)}
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
            <div style={{ fontSize:"10px", fontWeight:800, color:BK, marginBottom:"5px" }}>{ex.t}</div>
            {ex.items.map(([q,a])=>(
              <div key={q} style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", padding:"2px 0", borderBottom:"1px solid #eee" }}>
                <span style={{ fontWeight:700 }}>{q}</span>
                <span style={{ color:"#22c55e", fontWeight:700 }}>{a}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"10px", padding:"10px", marginBottom:"10px" }}>
        <div style={{ fontSize:"10px", fontWeight:800, color:Y, marginBottom:"7px" }}>Quick Reference — All Consonants</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
          {CONSONANTS.map(c=>(
            <div key={c.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", color:Y, fontWeight:900, lineHeight:1 }}>{c.char}</div>
              <div style={{ fontSize:"8px", color:"#aaa" }}>{c.roman}</div>
              <div style={{ fontSize:"12px" }}>{c.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{ height:"1px", background:"#333", margin:"6px 0" }} />
        <div style={{ fontSize:"10px", fontWeight:800, color:Y, marginBottom:"6px" }}>All Vowels</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"4px" }}>
          {VOWELS.map(v=>(
            <div key={v.char} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"20px", color:"#fff9c4", fontWeight:900, lineHeight:1 }}>{v.char}</div>
              <div style={{ fontSize:"8px", color:"#aaa" }}>{v.roman}</div>
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
        <div style={{ marginTop:"10px", fontSize:"10px", color:"#aaa" }}>Klovers Korean Academy • klovers.academy • 2025</div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function HangulBookPage() {
  const [preview, setPreview] = useState<Lang>("ar");

  const printVersion = (lang: Lang) => {
    setPreview(lang);
    setTimeout(() => window.print(), 400);
  };

  const isAr = preview === "ar";

  return (
    <>
      <style>{`
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
        #hangul-book { background: #e5e5e5; }
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
            <WelcomeAr />
            <ConsonantsAr slice={[0,7]} page={1} />
            <ConsonantsAr slice={[7,14]} page={2} />
            <VowelsAr />
            <SyllableAr />
            <KdramaAr />
            <PracticeAr />
            <AnswerAr />
          </>
        ) : (
          <>
            <CoverEn />
            <WelcomeEn />
            <ConsonantsEn slice={[0,7]} page={1} />
            <ConsonantsEn slice={[7,14]} page={2} />
            <VowelsEn />
            <SyllableEn />
            <KdramaEn />
            <PracticeEn />
            <AnswerEn />
          </>
        )}
      </div>
    </>
  );
}
