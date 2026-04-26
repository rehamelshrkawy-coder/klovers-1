import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

/* ─── Brand tokens ─────────────────────────────── */
const Y   = "#FFFF00";
const YL  = "#FFFFBB";
const GL  = "#C8FFD4";
const BK  = "#111111";
const BK2 = "#222222";

type Lang = "ar" | "en";

/* ── Photos ── */
const PX = (id: number, w = 800, h = 500) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

const PHOTOS = {
  seoulNight:    PX(32164874),
  palace:        PX(11870589),
  hanbok:        PX(31743249),
  kpopCrowd:     PX(18447992),
  cherryBlossom: PX(32164874),
  kimchi:        PX(8954371),
};

/* ── SVG icons (reuse Hangul Book style) ── */
function TaegeukIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="none" stroke={Y} strokeWidth="3" />
      <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2Z" fill="#0047AB" />
      <path d="M50 98 A48 48 0 0 1 50 2 A24 24 0 0 1 50 50 A24 24 0 0 0 50 98Z" fill="#C8102E" />
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
        const rad   = (angle * Math.PI) / 180;
        const x = 50 + 28 * Math.cos(rad);
        const y = 50 + 28 * Math.sin(rad);
        return (
          <ellipse key={i} cx={x} cy={y} rx="16" ry="10" fill={color} opacity="0.85"
            transform={`rotate(${angle + 90}, ${x}, ${y})`} />
        );
      })}
      <circle cx="50" cy="50" r="14" fill={BK} />
      <circle cx="50" cy="50" r="8"  fill={Y}  />
    </svg>
  );
}

function PalaceRoofIcon({ size = 40, color = Y }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <path d="M10 60 Q15 30 50 20 Q85 30 90 60 Z" fill={color} />
      <rect x="20" y="58" width="60" height="6" rx="3" fill={BK} />
      <path d="M10 60 Q5 55 3 45"  stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M90 60 Q95 55 97 45" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="44" y="64" width="12" height="30" rx="2" fill={color} opacity="0.7" />
      <rect x="15" y="92" width="70" height="6"  rx="3" fill={color} />
    </svg>
  );
}

function DancheongBorder() {
  return (
    <div style={{ display:"flex", gap:"4px", alignItems:"center", padding:"6px 0", marginBottom:"8px" }}>
      {["#0047AB","#C8102E",Y,GL,"#C8102E","#0047AB",Y,GL,"#C8102E","#0047AB",Y,GL,"#C8102E","#0047AB"].map((c, i) => (
        <div key={i} style={{
          width:"14px", height:"14px", borderRadius:"2px", background: c, flexShrink:0,
          clipPath: i % 2 === 0 ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : "none",
        }} />
      ))}
    </div>
  );
}

function Photo({ src, alt, h = 140, radius = 10, overlay = false }: {
  src: string; alt: string; h?: number; radius?: number; overlay?: boolean;
}) {
  return (
    <div style={{ position:"relative", borderRadius:`${radius}px`, overflow:"hidden", height:`${h}px` }}>
      <img src={src} alt={alt}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      {overlay && (
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))" }} />
      )}
      <div style={{ position:"absolute", bottom:"4px", right:"6px", fontSize:"7px", color:"rgba(255,255,255,0.5)" }}>Photo: Pexels</div>
    </div>
  );
}

/* ── Page wrapper ── */
function Page({ children, dir = "ltr" }: { children: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", padding:"14mm 13mm",
      boxSizing:"border-box", background:"#fff",
      position:"relative", pageBreakAfter:"always", breakAfter:"page",
      direction: dir,
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:BK }} />
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
   ARABIC PAGES
══════════════════════════════════════════════════ */

/* Cover */
function TrialCoverAr() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", boxSizing:"border-box",
      background:BK, position:"relative",
      pageBreakAfter:"always", breakAfter:"page",
      direction:"rtl", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", textAlign:"center",
    }}>
      {/* Decorative corners */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:Y }} />
      <div style={{ position:"absolute", top:"9px", bottom:"6px", right:0, width:"5px", background:Y }} />
      <div style={{ position:"absolute", top:"9px", bottom:"6px", left:0, width:"5px", background:"#333" }} />

      {/* Badge */}
      <div style={{ background:Y, borderRadius:"50px", padding:"6px 22px", fontSize:"11px", fontWeight:900, color:BK, marginBottom:"22px", letterSpacing:"1px" }}>
        مجاناً · ٣٠ دقيقة · تجربة حقيقية
      </div>

      <TaegeukIcon size={72} />

      <div style={{ fontSize:"13px", color:"#888", marginTop:"18px", marginBottom:"6px", letterSpacing:"2px" }}>KLOVERS KOREAN ACADEMY</div>
      <div style={{ fontSize:"38px", fontWeight:900, color:Y, lineHeight:1.15, marginBottom:"8px" }}>
        حصتك التجريبية<br />المجانية
      </div>
      <div style={{ fontSize:"14px", color:"#ccc", marginBottom:"26px" }}>
        اكتشف الكورية في ٣٠ دقيقة
      </div>

      <DancheongBorder />

      <div style={{ marginTop:"16px", display:"flex", gap:"18px", justifyContent:"center" }}>
        {[
          { icon:"🎬", label:"K-Drama & K-Pop" },
          { icon:"📚", label:"٦ مستويات" },
          { icon:"👨‍🏫", label:"معلم متخصص" },
        ].map(b => (
          <div key={b.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"24px" }}>{b.icon}</div>
            <div style={{ fontSize:"10px", color:"#aaa", marginTop:"4px" }}>{b.label}</div>
          </div>
        ))}
      </div>

      <div style={{ position:"absolute", bottom:"20px", fontSize:"9px", color:"#555" }}>
        kloversegy.com · دليل المعلم للحصة التجريبية
      </div>
    </div>
  );
}

/* Agenda */
function TrialAgendaAr() {
  const steps = [
    { time:"٠–٥ دقائق",  icon:"👋", color:"#0047AB", title:"تعارف ودفء",         body:"نتعرف على بعض، أسمعكم أسماءكم، نشاط تحفيزي: 'ليه بدأت تتعلم كوري؟'" },
    { time:"٥–١٢ دقيقة", icon:"🌏", color:"#C8102E", title:"ليه الكورية؟",        body:"K-Drama، K-Pop، السفر، السلسلة الكورية — سبع دقائق تغير نظرتك للغة." },
    { time:"١٢–٢٢ دقيقة",icon:"✍️", color:"#166534", title:"نتعلم الهانغول!",      body:"نتعلم ٥ حروف ساكنة + ٣ حروف مد، ونقرأ ٢ كلمة كورية حقيقية سوياً." },
    { time:"٢٢–٢٧ دقيقة",icon:"🎬", color:"#7B2D8B", title:"جمل من المسلسلات",   body:"نقرأ ٣ جمل من K-Drama بالهانغول، مع الترجمة والنطق الصحيح." },
    { time:"٢٧–٣٠ دقيقة",icon:"🚀", color:BK,        title:"الخطوات التالية",      body:"نعرض المستويات الستة ونشرح الطريق للطلاقة — وإزاي تبدأ معنا!" },
  ];

  return (
    <Page dir="rtl">
      <SHead title="برنامج الـ٣٠ دقيقة" subtitle="ما ستتعلمه اليوم — خطوة بخطوة" />
      <Photo src={PHOTOS.seoulNight} alt="Seoul" h={100} radius={10} overlay />
      <DancheongBorder />

      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", right:"17px", top:0, bottom:0, width:"3px", background:Y, borderRadius:"2px" }} />
        {steps.map((s, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px", alignItems:"flex-start" }}>
            <div style={{
              width:"36px", height:"36px", background:s.color, borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"17px", flexShrink:0, zIndex:1,
              border:`2px solid ${Y}`,
            }}>{s.icon}</div>
            <div style={{
              flex:1, background: i === 2 ? BK : "#f9f9f9",
              border:`2px solid ${i === 2 ? Y : "#e5e5e5"}`,
              borderRadius:"10px", padding:"9px 12px",
            }}>
              <div style={{ fontSize:"10px", fontWeight:700, color: i === 2 ? Y : "#888", marginBottom:"1px" }}>{s.time}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color: i === 2 ? "#fff" : BK, marginBottom:"3px" }}>{s.title}</div>
              <div style={{ fontSize:"10px", color: i === 2 ? "#ccc" : "#555", lineHeight:1.7 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:Y, borderRadius:"10px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px", marginTop:"4px" }}>
        <MugunghwaIcon size={32} color={BK} />
        <div style={{ fontSize:"11px", color:BK, fontWeight:700 }}>
          في ٣٠ دقيقة فقط ستكون قادراً على قراءة كلمات كورية حقيقية!
        </div>
      </div>
    </Page>
  );
}

/* Why Korean */
function TrialWhyAr() {
  const reasons = [
    { icon:"🎬", title:"K-Drama و K-Pop",    body:"اكثر من ٢ مليار مشاهدة يومياً. تخيل إنك تفهم كل كلمة بدون ترجمة!" },
    { icon:"✈️", title:"السفر لكوريا",        body:"كوريا الجنوبية وجهة أحلام الكثيرين. لغتهم تفتح لك أبواباً مختلفة تماماً." },
    { icon:"💼", title:"فرص العمل",           body:"شركات كورية ضخمة (Samsung، Hyundai، LG) تبحث دائماً عن متحدثي اللغة." },
    { icon:"🧠", title:"سهلة جداً للعرب",    body:"الهانغول أبجدية علمية منطقية — ممكن تتعلمها في يومين فقط!" },
    { icon:"🌟", title:"مجتمع نشيط",          body:"مجتمع Klovers دافئ ومتحمس — أصدقاء جدد يتعلمون معك." },
    { icon:"🎯", title:"منهج واضح",           body:"٦ كتب منظمة من الصفر للطلاقة — تعرف دايماً إيه اللي جاي." },
  ];

  return (
    <Page dir="rtl">
      <SHead title="ليه تتعلم الكورية؟" subtitle="٦ أسباب تخليك تبدأ النهارده" />
      <Photo src={PHOTOS.kpopCrowd} alt="K-Pop concert" h={90} radius={10} overlay />
      <DancheongBorder />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"10px" }}>
        {reasons.map(r => (
          <div key={r.title} style={{
            background:YL, borderRadius:"10px", padding:"10px",
            border:`1px solid ${Y}`,
          }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{r.icon}</div>
            <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"3px" }}>{r.title}</div>
            <div style={{ fontSize:"10px", color:"#555", lineHeight:1.7 }}>{r.body}</div>
          </div>
        ))}
      </div>

      <div style={{ background:BK, borderRadius:"10px", padding:"12px 16px", textAlign:"center" }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:Y, marginBottom:"4px" }}>
          한국어를 배워요! — Hankugeoreul baewoyo!
        </div>
        <div style={{ fontSize:"10px", color:"#aaa" }}>نتعلم اللغة الكورية! — قريباً ستقرأ هذه الجملة بنفسك</div>
      </div>
    </Page>
  );
}

/* Levels */
function TrialLevelsAr() {
  const levels = [
    { n:"١", color:"#C8102E", badge:"مبتدئ",      book:"الهانغول والأساسيات",        skills:["قراءة الهانغول", "مفردات أساسية", "أرقام وألوان", "تعارف بالكوري"] },
    { n:"٢", color:"#0047AB", badge:"مبتدئ+",     book:"قواعد المحادثة",             skills:["جمل يومية", "أسئلة بسيطة", "التسوق والمطعم", "الطقس والوقت"] },
    { n:"٣", color:"#166534", badge:"متوسط ١",    book:"القواعد الأساسية",           skills:["أفعال مهمة", "نفي وأسئلة", "ماضٍ ومستقبل", "مشاعر وآراء"] },
    { n:"٤", color:"#7B2D8B", badge:"متوسط ٢",    book:"محادثات أعمق",              skills:["شرح وتفسير", "مواقف اجتماعية", "كتابة رسائل", "أخبار وأحداث"] },
    { n:"٥", color:"#B45309", badge:"متقدم",       book:"الكورية الحقيقية",           skills:["لغة غير رسمية", "ثقافة وتقاليد", "فهم Drama حقيقية", "نقاش آراء"] },
    { n:"٦", color:BK,        badge:"طلاقة",       book:"قراءة وكتابة وطلاقة",       skills:["قراءة مقالات", "كتابة إبداعية", "محادثة طبيعية", "اختبار TOPIK"] },
  ];

  return (
    <Page dir="rtl">
      <SHead title="المستويات الستة — طريقك للطلاقة" subtitle="من الصفر إلى محادثة طبيعية بالكوري" />
      <DancheongBorder />

      <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
        {levels.map((lv, i) => (
          <div key={i} style={{
            display:"grid", gridTemplateColumns:"44px 1fr",
            background: i === 0 ? BK : "#f9f9f9",
            border:`2px solid ${i === 0 ? Y : "#e5e5e5"}`,
            borderRadius:"10px", overflow:"hidden",
          }}>
            {/* Level number column */}
            <div style={{
              background:lv.color, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", padding:"8px 4px",
            }}>
              <div style={{ fontSize:"18px", fontWeight:900, color:Y, lineHeight:1 }}>{lv.n}</div>
              <div style={{ fontSize:"7px", color:"rgba(255,255,255,0.8)", marginTop:"2px" }}>{lv.badge}</div>
            </div>
            {/* Content */}
            <div style={{ padding:"8px 10px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color: i === 0 ? Y : BK, marginBottom:"4px" }}>
                📚 {lv.book}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                {lv.skills.map(sk => (
                  <span key={sk} style={{
                    background: i === 0 ? "#333" : YL,
                    color: i === 0 ? "#ddd" : BK2,
                    fontSize:"9px", padding:"2px 7px",
                    borderRadius:"20px", fontWeight:600,
                  }}>{sk}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:Y, borderRadius:"8px", padding:"8px 14px", marginTop:"8px", textAlign:"center" }}>
        <div style={{ fontSize:"10px", color:BK, fontWeight:800 }}>
          ⏱️ كل مستوى: ٢٤ حصة · ٩٠ دقيقة لكل حصة · مجموعات صغيرة (٤–٨ طلاب)
        </div>
      </div>
    </Page>
  );
}

/* Hangul Taste */
function TrialHangulAr() {
  const chars = [
    { char:"ㄱ", sound:"ك/غ", word:"가방", read:"غا-بانغ", mean:"حقيبة" },
    { char:"ㄴ", sound:"ن",   word:"나비", read:"نا-بي",   mean:"فراشة" },
    { char:"ㅅ", sound:"س",   word:"사랑", read:"سا-رانغ", mean:"حب" },
    { char:"ㅁ", sound:"م",   word:"물",   read:"مول",     mean:"ماء" },
    { char:"ㅎ", sound:"هـ",  word:"한국", read:"هان-غوك", mean:"كوريا" },
  ];
  const vowels = [
    { char:"ㅏ", sound:"آ",  ex:"아" },
    { char:"ㅗ", sound:"أو", ex:"오" },
    { char:"ㅣ", sound:"إي", ex:"이" },
  ];

  return (
    <Page dir="rtl">
      <SHead title="جرّب الهانغول الآن! ✍️" subtitle="٥ حروف + ٣ حروف مد — تقرأ كلمات كورية في ١٠ دقائق" />
      <DancheongBorder />

      {/* Consonants */}
      <div style={{ marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px", display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ background:Y, padding:"2px 8px", borderRadius:"6px" }}>الحروف الساكنة</span>
          اكتب معنا!
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {chars.map((c, i) => (
            <div key={i} style={{
              display:"grid", gridTemplateColumns:"50px 50px 1fr",
              gap:"8px", alignItems:"center",
              background: i % 2 === 0 ? YL : "#f5f5f5",
              borderRadius:"8px", padding:"7px 10px",
              border:`1px solid ${i % 2 === 0 ? Y : "#e5e5e5"}`,
            }}>
              <div style={{ fontSize:"28px", fontWeight:900, color:BK, textAlign:"center" }}>{c.char}</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"14px", fontWeight:800, color:"#0047AB" }}>{c.sound}</div>
                <div style={{ fontSize:"8px", color:"#888" }}>صوت</div>
              </div>
              <div>
                <div style={{ fontSize:"15px", fontWeight:900, color:BK }}>{c.word}</div>
                <div style={{ fontSize:"10px", color:"#555" }}>{c.read} — {c.mean}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vowels */}
      <div style={{ marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>
          <span style={{ background:Y, padding:"2px 8px", borderRadius:"6px" }}>حروف المد</span>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          {vowels.map(v => (
            <div key={v.char} style={{
              flex:1, background:BK, borderRadius:"10px", padding:"10px",
              textAlign:"center", border:`2px solid ${Y}`,
            }}>
              <div style={{ fontSize:"30px", fontWeight:900, color:Y }}>{v.char}</div>
              <div style={{ fontSize:"14px", fontWeight:800, color:"#fff", marginTop:"2px" }}>{v.sound}</div>
              <div style={{ fontSize:"20px", marginTop:"6px", color:Y }}>{v.ex}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Try reading */}
      <div style={{ background:"#f0fff4", borderRadius:"10px", padding:"10px 14px", border:`2px solid #166534` }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:"#166534", marginBottom:"6px" }}>
          🎯 جرّب اقرأ:
        </div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {[
            { k:"사랑", r:"سا-رانغ", m:"حب" },
            { k:"한국", r:"هان-غوك", m:"كوريا" },
            { k:"나비", r:"نا-بي", m:"فراشة" },
          ].map(w => (
            <div key={w.k} style={{
              background:"#fff", borderRadius:"8px", padding:"8px 12px",
              textAlign:"center", border:`1px solid #166534`, flex:1,
            }}>
              <div style={{ fontSize:"22px", fontWeight:900, color:BK }}>{w.k}</div>
              <div style={{ fontSize:"10px", color:"#166534", fontWeight:700 }}>{w.r}</div>
              <div style={{ fontSize:"10px", color:"#555" }}>{w.m}</div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

/* K-Drama phrases */
function TrialDramaAr() {
  const phrases = [
    { k:"사랑해요", r:"سارانغ-هييو", m:"أحبك (رسمي)", show:"Crash Landing on You", emoji:"❤️" },
    { k:"괜찮아요?", r:"كوينتشانا-يو؟", m:"هل أنت بخير؟", show:"Goblin", emoji:"🤔" },
    { k:"화이팅!", r:"هوايتينغ!", m:"يلا! اقدر!", show:"كل المسلسلات", emoji:"💪" },
    { k:"대박이야!", r:"ديباك-إييا!", m:"لقطة! رائع!", show:"My Love from the Star", emoji:"🤩" },
    { k:"잠깐만요", r:"جامكانمانيو", m:"انتظر لحظة", show:"Vincenzo", emoji:"✋" },
    { k:"고마워요", r:"غوماوو-يو", m:"شكراً جزيلاً", show:"Reply 1988", emoji:"💚" },
  ];

  return (
    <Page dir="rtl">
      <SHead title="جمل سمعتها في المسلسلات 🎬" subtitle="اقرأها الآن بالهانغول — ستفاجأ بنفسك!" />
      <Photo src={PHOTOS.cherryBlossom} alt="Seoul cherry blossoms" h={80} radius={10} overlay />
      <DancheongBorder />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"10px" }}>
        {phrases.map((p, i) => (
          <div key={i} style={{
            background: i % 3 === 0 ? BK : i % 3 === 1 ? YL : "#f9f9f9",
            border:`2px solid ${i % 3 === 0 ? Y : i % 3 === 1 ? Y : "#e5e5e5"}`,
            borderRadius:"10px", padding:"10px",
          }}>
            <div style={{ fontSize:"20px", marginBottom:"4px" }}>{p.emoji}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color: i % 3 === 0 ? Y : BK, marginBottom:"2px" }}>{p.k}</div>
            <div style={{ fontSize:"11px", fontWeight:700, color: i % 3 === 0 ? "#ccc" : "#0047AB", marginBottom:"2px" }}>{p.r}</div>
            <div style={{ fontSize:"10px", color: i % 3 === 0 ? "#aaa" : "#555", marginBottom:"4px" }}>{p.m}</div>
            <div style={{ fontSize:"9px", color: i % 3 === 0 ? "#666" : "#888", borderTop:`1px solid ${i % 3 === 0 ? "#333" : "#ddd"}`, paddingTop:"4px" }}>
              📺 {p.show}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"#0047AB", borderRadius:"10px", padding:"10px 14px", textAlign:"center" }}>
        <div style={{ fontSize:"12px", fontWeight:800, color:Y, marginBottom:"3px" }}>
          💡 حقيقة مذهلة
        </div>
        <div style={{ fontSize:"10px", color:"#ddd" }}>
          بعد المستوى الأول فقط، ستفهم ما يقال في المشاهد الرومانسية والمشاهد المضحكة في أي مسلسل كوري!
        </div>
      </div>
    </Page>
  );
}

/* Testimonials */
function TrialTestimonialsAr() {
  const testimonials = [
    { name:"نور إبراهيم", city:"القاهرة", level:"مستوى ٢", quote:"كنت بحلم إني أفهم المسلسلات الكورية بدون ترجمة. بعد ٣ شهور مع Klovers بقيت أفهم ٥٠٪ من الكلام!", emoji:"🌸" },
    { name:"ياسمين حسن",  city:"الإسكندرية", level:"مستوى ١", quote:"الهانغول بدت صعبة جداً من بره. بس بعد أول حصة مع الأستاذة قررت إني مكملة!", emoji:"💛" },
    { name:"محمد علي",    city:"القاهرة", level:"مستوى ٣", quote:"مجموعة صغيرة + أسلوب المدرسة = تعلمت أكتر في شهرين من ٣ سنين بنفسي!", emoji:"🔥" },
    { name:"سارة محمود",  city:"الجيزة",  level:"مستوى ٢", quote:"كل حصة بتبقى ممتعة ومليانة ضحك. مش بس بتتعلمي — بتحبي اللغة أكتر!", emoji:"😍" },
  ];

  return (
    <Page dir="rtl">
      <SHead title="ماذا قال طلابنا؟ 💬" subtitle="تجارب حقيقية من مجتمع Klovers" />
      <DancheongBorder />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"9px", marginBottom:"12px" }}>
        {testimonials.map((t, i) => (
          <div key={i} style={{
            background: i % 2 === 0 ? BK : "#f9f9f9",
            border:`2px solid ${i % 2 === 0 ? Y : "#e5e5e5"}`,
            borderRadius:"12px", padding:"12px",
            display:"flex", flexDirection:"column", gap:"8px",
          }}>
            <div style={{ fontSize:"28px", lineHeight:1 }}>{t.emoji}</div>
            <div style={{ fontSize:"10px", color: i % 2 === 0 ? "#ccc" : "#555", lineHeight:1.7, flex:1 }}>
              "{t.quote}"
            </div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:800, color: i % 2 === 0 ? Y : BK }}>{t.name}</div>
              <div style={{ fontSize:"9px", color: i % 2 === 0 ? "#888" : "#888" }}>{t.city} · {t.level}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:Y, borderRadius:"10px", padding:"10px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
        <MugunghwaIcon size={36} color={BK} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:900, color:BK }}>+٥٠٠ طالب</div>
          <div style={{ fontSize:"10px", color:BK2 }}>انضموا لمجتمع Klovers من مصر والخليج والمغرب العربي</div>
        </div>
      </div>
    </Page>
  );
}

/* Join CTA */
function TrialJoinAr() {
  const steps = [
    { n:"١", icon:"💬", title:"تواصل معنا",        body:"ابعت لنا على واتساب أو إنستجرام وإحنا هنرد عليك فوراً." },
    { n:"٢", icon:"📅", title:"اختر موعدك",        body:"مواعيد مرنة — صباح أو مساء، أيام عطلة، حسب وقتك." },
    { n:"٣", icon:"📚", title:"ابدأ المستوى الأول", body:"تحصل على كتاب Hangul Book 1 + الوصول للمجموعة + دعم الأستاذة." },
    { n:"٤", icon:"🌟", title:"وصّل للطلاقة",      body:"٦ مستويات واضحة — ومجتمع يشجعك في كل خطوة." },
  ];

  return (
    <Page dir="rtl">
      <SHead title="انضم لعائلة Klovers 🚀" subtitle="رحلة ألف ميل تبدأ بكلمة واحدة: أنا جاهز!" />
      <Photo src={PHOTOS.palace} alt="Gyeongbokgung Palace" h={85} radius={10} overlay />
      <DancheongBorder />

      {/* Steps */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            background: i < 2 ? BK : YL,
            border:`2px solid ${i < 2 ? Y : Y}`,
            borderRadius:"10px", padding:"11px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px" }}>
              <div style={{
                width:"22px", height:"22px", background:Y, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"11px", fontWeight:900, color:BK, flexShrink:0,
              }}>{s.n}</div>
              <div style={{ fontSize:"14px" }}>{s.icon}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color: i < 2 ? Y : BK }}>{s.title}</div>
            </div>
            <div style={{ fontSize:"10px", color: i < 2 ? "#ccc" : "#555", lineHeight:1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div style={{ background:BK, borderRadius:"12px", padding:"14px", textAlign:"center", border:`3px solid ${Y}` }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:Y, marginBottom:"8px" }}>
          ابدأ رحلتك الآن!
        </div>
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
          <div style={{ background:"#25D366", borderRadius:"8px", padding:"8px 16px", fontSize:"11px", fontWeight:700, color:"#fff" }}>
            💬 واتساب
          </div>
          <div style={{ background:"#E1306C", borderRadius:"8px", padding:"8px 16px", fontSize:"11px", fontWeight:700, color:"#fff" }}>
            📸 إنستجرام
          </div>
          <div style={{ background:"#0047AB", borderRadius:"8px", padding:"8px 16px", fontSize:"11px", fontWeight:700, color:"#fff" }}>
            🌐 kloversegy.com
          </div>
        </div>
        <div style={{ fontSize:"10px", color:"#888", marginTop:"10px" }}>
          한국어를 배워요! — نتعلم اللغة الكورية معاً!
        </div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════
   ENGLISH PAGES
══════════════════════════════════════════════════ */

function TrialCoverEn() {
  return (
    <div className="book-page" style={{
      width:"210mm", minHeight:"297mm", boxSizing:"border-box",
      background:BK, position:"relative",
      pageBreakAfter:"always", breakAfter:"page",
      direction:"ltr", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", textAlign:"center",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"9px", background:Y }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"6px", background:Y }} />
      <div style={{ position:"absolute", top:"9px", bottom:"6px", left:0, width:"5px", background:Y }} />
      <div style={{ position:"absolute", top:"9px", bottom:"6px", right:0, width:"5px", background:"#333" }} />

      <div style={{ background:Y, borderRadius:"50px", padding:"6px 22px", fontSize:"11px", fontWeight:900, color:BK, marginBottom:"22px", letterSpacing:"1px" }}>
        FREE · 30 MINUTES · REAL EXPERIENCE
      </div>
      <TaegeukIcon size={72} />
      <div style={{ fontSize:"13px", color:"#888", marginTop:"18px", marginBottom:"6px", letterSpacing:"2px" }}>KLOVERS KOREAN ACADEMY</div>
      <div style={{ fontSize:"38px", fontWeight:900, color:Y, lineHeight:1.15, marginBottom:"8px" }}>
        Your Free<br />Trial Class
      </div>
      <div style={{ fontSize:"14px", color:"#ccc", marginBottom:"26px" }}>
        Discover Korean in 30 minutes
      </div>
      <DancheongBorder />
      <div style={{ marginTop:"16px", display:"flex", gap:"18px", justifyContent:"center" }}>
        {[
          { icon:"🎬", label:"K-Drama & K-Pop" },
          { icon:"📚", label:"6 Levels" },
          { icon:"👨‍🏫", label:"Expert Teacher" },
        ].map(b => (
          <div key={b.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"24px" }}>{b.icon}</div>
            <div style={{ fontSize:"10px", color:"#aaa", marginTop:"4px" }}>{b.label}</div>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute", bottom:"20px", fontSize:"9px", color:"#555" }}>
        kloversegy.com · Teacher's Trial Class Guide
      </div>
    </div>
  );
}

function TrialAgendaEn() {
  const steps = [
    { time:"0–5 min",  icon:"👋", color:"#0047AB", title:"Ice Breaker & Intro",      body:"Meet the group, share names, warm-up: 'Why did you start learning Korean?'" },
    { time:"5–12 min", icon:"🌏", color:"#C8102E", title:"Why Korean?",              body:"K-Drama, K-Pop, travel, career — 7 minutes that will change how you see this language." },
    { time:"12–22 min",icon:"✍️", color:"#166534", title:"Learn Hangul Now!",        body:"Learn 5 consonants + 3 vowels, then read 2 real Korean words together." },
    { time:"22–27 min",icon:"🎬", color:"#7B2D8B", title:"K-Drama Phrases",          body:"Read 3 K-Drama phrases in Hangul — with translation and correct pronunciation." },
    { time:"27–30 min",icon:"🚀", color:BK,        title:"Your Next Steps",          body:"Overview of the 6 levels and the path to fluency — how to join us!" },
  ];

  return (
    <Page dir="ltr">
      <SHead title="The 30-Minute Agenda" subtitle="What you'll experience today — step by step" />
      <Photo src={PHOTOS.seoulNight} alt="Seoul" h={100} radius={10} overlay />
      <DancheongBorder />
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:"17px", top:0, bottom:0, width:"3px", background:Y, borderRadius:"2px" }} />
        {steps.map((s, i) => (
          <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px", alignItems:"flex-start" }}>
            <div style={{
              width:"36px", height:"36px", background:s.color, borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"17px", flexShrink:0, zIndex:1, border:`2px solid ${Y}`,
            }}>{s.icon}</div>
            <div style={{
              flex:1, background: i === 2 ? BK : "#f9f9f9",
              border:`2px solid ${i === 2 ? Y : "#e5e5e5"}`,
              borderRadius:"10px", padding:"9px 12px",
            }}>
              <div style={{ fontSize:"10px", fontWeight:700, color: i === 2 ? Y : "#888", marginBottom:"1px" }}>{s.time}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color: i === 2 ? "#fff" : BK, marginBottom:"3px" }}>{s.title}</div>
              <div style={{ fontSize:"10px", color: i === 2 ? "#ccc" : "#555", lineHeight:1.7 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:Y, borderRadius:"10px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px", marginTop:"4px" }}>
        <MugunghwaIcon size={32} color={BK} />
        <div style={{ fontSize:"11px", color:BK, fontWeight:700 }}>
          In 30 minutes you'll be reading real Korean words — guaranteed!
        </div>
      </div>
    </Page>
  );
}

function TrialWhyEn() {
  const reasons = [
    { icon:"🎬", title:"K-Drama & K-Pop",    body:"Over 2 billion views daily. Imagine understanding every word without subtitles!" },
    { icon:"✈️", title:"Travel to Korea",     body:"South Korea is a dream destination. The language opens completely different doors." },
    { icon:"💼", title:"Career Opportunities", body:"Korean giants (Samsung, Hyundai, LG) always look for Korean speakers." },
    { icon:"🧠", title:"Easier Than You Think", body:"Hangul is a scientific alphabet — you can learn it in 2 days!" },
    { icon:"🌟", title:"Vibrant Community",   body:"The Klovers community is warm and enthusiastic — make new friends while learning." },
    { icon:"🎯", title:"Clear Curriculum",    body:"6 structured books from zero to fluency — you always know what's coming next." },
  ];

  return (
    <Page dir="ltr">
      <SHead title="Why Learn Korean?" subtitle="6 reasons to start today" />
      <Photo src={PHOTOS.kpopCrowd} alt="K-Pop concert" h={90} radius={10} overlay />
      <DancheongBorder />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"10px" }}>
        {reasons.map(r => (
          <div key={r.title} style={{ background:YL, borderRadius:"10px", padding:"10px", border:`1px solid ${Y}` }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{r.icon}</div>
            <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"3px" }}>{r.title}</div>
            <div style={{ fontSize:"10px", color:"#555", lineHeight:1.7 }}>{r.body}</div>
          </div>
        ))}
      </div>
      <div style={{ background:BK, borderRadius:"10px", padding:"12px 16px", textAlign:"center" }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:Y, marginBottom:"4px" }}>
          한국어를 배워요! — Hankugeoreul baewoyo!
        </div>
        <div style={{ fontSize:"10px", color:"#aaa" }}>Let's learn Korean! — You'll be reading this sentence yourself very soon</div>
      </div>
    </Page>
  );
}

function TrialLevelsEn() {
  const levels = [
    { n:"1", color:"#C8102E", badge:"Beginner",      book:"Hangul & Basics",            skills:["Read Hangul", "Core vocab", "Numbers & colors", "Introduce yourself"] },
    { n:"2", color:"#0047AB", badge:"Beginner+",     book:"Conversation Foundations",   skills:["Daily sentences", "Simple questions", "Shopping & restaurants", "Weather & time"] },
    { n:"3", color:"#166534", badge:"Intermediate 1", book:"Grammar Essentials",         skills:["Key verbs", "Negation & questions", "Past & future tense", "Feelings & opinions"] },
    { n:"4", color:"#7B2D8B", badge:"Intermediate 2", book:"Deeper Conversations",       skills:["Explanation", "Social situations", "Writing messages", "News & events"] },
    { n:"5", color:"#B45309", badge:"Advanced",       book:"Real Korean",                skills:["Informal speech", "Culture & traditions", "Watch real dramas", "Debate opinions"] },
    { n:"6", color:BK,        badge:"Fluency",        book:"Read, Write & Speak Fluently",skills:["Read articles", "Creative writing", "Natural conversation", "TOPIK exam"] },
  ];

  return (
    <Page dir="ltr">
      <SHead title="6 Levels — Your Road to Fluency" subtitle="From zero to natural Korean conversation" />
      <DancheongBorder />
      <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
        {levels.map((lv, i) => (
          <div key={i} style={{
            display:"grid", gridTemplateColumns:"44px 1fr",
            background: i === 0 ? BK : "#f9f9f9",
            border:`2px solid ${i === 0 ? Y : "#e5e5e5"}`,
            borderRadius:"10px", overflow:"hidden",
          }}>
            <div style={{
              background:lv.color, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", padding:"8px 4px",
            }}>
              <div style={{ fontSize:"18px", fontWeight:900, color:Y, lineHeight:1 }}>{lv.n}</div>
              <div style={{ fontSize:"7px", color:"rgba(255,255,255,0.8)", marginTop:"2px", textAlign:"center" }}>{lv.badge}</div>
            </div>
            <div style={{ padding:"8px 10px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color: i === 0 ? Y : BK, marginBottom:"4px" }}>
                📚 {lv.book}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                {lv.skills.map(sk => (
                  <span key={sk} style={{
                    background: i === 0 ? "#333" : YL,
                    color: i === 0 ? "#ddd" : BK2,
                    fontSize:"9px", padding:"2px 7px",
                    borderRadius:"20px", fontWeight:600,
                  }}>{sk}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:Y, borderRadius:"8px", padding:"8px 14px", marginTop:"8px", textAlign:"center" }}>
        <div style={{ fontSize:"10px", color:BK, fontWeight:800 }}>
          ⏱️ Each level: 24 sessions · 90 min each · Small groups (4–8 students)
        </div>
      </div>
    </Page>
  );
}

function TrialHangulEn() {
  const chars = [
    { char:"ㄱ", sound:"g/k", word:"가방", read:"ga-bang", mean:"bag" },
    { char:"ㄴ", sound:"n",   word:"나비", read:"na-bi",   mean:"butterfly" },
    { char:"ㅅ", sound:"s",   word:"사랑", read:"sa-rang", mean:"love" },
    { char:"ㅁ", sound:"m",   word:"물",   read:"mul",     mean:"water" },
    { char:"ㅎ", sound:"h",   word:"한국", read:"han-guk", mean:"Korea" },
  ];
  const vowels = [
    { char:"ㅏ", sound:"ah",  ex:"아" },
    { char:"ㅗ", sound:"oh",  ex:"오" },
    { char:"ㅣ", sound:"ee",  ex:"이" },
  ];

  return (
    <Page dir="ltr">
      <SHead title="Try Hangul Right Now! ✍️" subtitle="5 consonants + 3 vowels — read Korean in 10 minutes" />
      <DancheongBorder />

      <div style={{ marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px", display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ background:Y, padding:"2px 8px", borderRadius:"6px" }}>Consonants</span>
          Write along!
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {chars.map((c, i) => (
            <div key={i} style={{
              display:"grid", gridTemplateColumns:"50px 50px 1fr",
              gap:"8px", alignItems:"center",
              background: i % 2 === 0 ? YL : "#f5f5f5",
              borderRadius:"8px", padding:"7px 10px",
              border:`1px solid ${i % 2 === 0 ? Y : "#e5e5e5"}`,
            }}>
              <div style={{ fontSize:"28px", fontWeight:900, color:BK, textAlign:"center" }}>{c.char}</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"14px", fontWeight:800, color:"#0047AB" }}>{c.sound}</div>
                <div style={{ fontSize:"8px", color:"#888" }}>sound</div>
              </div>
              <div>
                <div style={{ fontSize:"15px", fontWeight:900, color:BK }}>{c.word}</div>
                <div style={{ fontSize:"10px", color:"#555" }}>{c.read} — {c.mean}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:"10px" }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:BK, marginBottom:"6px" }}>
          <span style={{ background:Y, padding:"2px 8px", borderRadius:"6px" }}>Vowels</span>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          {vowels.map(v => (
            <div key={v.char} style={{
              flex:1, background:BK, borderRadius:"10px", padding:"10px",
              textAlign:"center", border:`2px solid ${Y}`,
            }}>
              <div style={{ fontSize:"30px", fontWeight:900, color:Y }}>{v.char}</div>
              <div style={{ fontSize:"14px", fontWeight:800, color:"#fff", marginTop:"2px" }}>{v.sound}</div>
              <div style={{ fontSize:"20px", marginTop:"6px", color:Y }}>{v.ex}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"#f0fff4", borderRadius:"10px", padding:"10px 14px", border:`2px solid #166534` }}>
        <div style={{ fontSize:"11px", fontWeight:800, color:"#166534", marginBottom:"6px" }}>🎯 Try reading:</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {[
            { k:"사랑", r:"sa-rang", m:"love" },
            { k:"한국", r:"han-guk", m:"Korea" },
            { k:"나비", r:"na-bi",   m:"butterfly" },
          ].map(w => (
            <div key={w.k} style={{
              background:"#fff", borderRadius:"8px", padding:"8px 12px",
              textAlign:"center", border:`1px solid #166534`, flex:1,
            }}>
              <div style={{ fontSize:"22px", fontWeight:900, color:BK }}>{w.k}</div>
              <div style={{ fontSize:"10px", color:"#166534", fontWeight:700 }}>{w.r}</div>
              <div style={{ fontSize:"10px", color:"#555" }}>{w.m}</div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

function TrialDramaEn() {
  const phrases = [
    { k:"사랑해요",  r:"sa-rang-hae-yo",  m:"I love you",         show:"Crash Landing on You", emoji:"❤️" },
    { k:"괜찮아요?", r:"gwaen-chan-a-yo?", m:"Are you okay?",       show:"Goblin",               emoji:"🤔" },
    { k:"화이팅!",   r:"hwa-i-ting!",      m:"You got this!",      show:"Every K-Drama",         emoji:"💪" },
    { k:"대박이야!", r:"dae-bak-i-ya!",    m:"That's amazing!",    show:"My Love from the Star", emoji:"🤩" },
    { k:"잠깐만요",  r:"jam-kkan-man-yo",  m:"Wait a moment",      show:"Vincenzo",              emoji:"✋" },
    { k:"고마워요",  r:"go-ma-wo-yo",      m:"Thank you",          show:"Reply 1988",            emoji:"💚" },
  ];

  return (
    <Page dir="ltr">
      <SHead title="K-Drama Phrases You Already Know 🎬" subtitle="Now read them in Hangul — you'll surprise yourself!" />
      <Photo src={PHOTOS.hanbok} alt="Traditional hanbok" h={80} radius={10} overlay />
      <DancheongBorder />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"10px" }}>
        {phrases.map((p, i) => (
          <div key={i} style={{
            background: i % 3 === 0 ? BK : i % 3 === 1 ? YL : "#f9f9f9",
            border:`2px solid ${i % 3 === 0 ? Y : i % 3 === 1 ? Y : "#e5e5e5"}`,
            borderRadius:"10px", padding:"10px",
          }}>
            <div style={{ fontSize:"20px", marginBottom:"4px" }}>{p.emoji}</div>
            <div style={{ fontSize:"16px", fontWeight:900, color: i % 3 === 0 ? Y : BK, marginBottom:"2px" }}>{p.k}</div>
            <div style={{ fontSize:"11px", fontWeight:700, color: i % 3 === 0 ? "#ccc" : "#0047AB", marginBottom:"2px" }}>{p.r}</div>
            <div style={{ fontSize:"10px", color: i % 3 === 0 ? "#aaa" : "#555", marginBottom:"4px" }}>{p.m}</div>
            <div style={{ fontSize:"9px", color: i % 3 === 0 ? "#666" : "#888", borderTop:`1px solid ${i % 3 === 0 ? "#333" : "#ddd"}`, paddingTop:"4px" }}>
              📺 {p.show}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:"#0047AB", borderRadius:"10px", padding:"10px 14px", textAlign:"center" }}>
        <div style={{ fontSize:"12px", fontWeight:800, color:Y, marginBottom:"3px" }}>💡 Fun Fact</div>
        <div style={{ fontSize:"10px", color:"#ddd" }}>
          After just Level 1, you'll understand what's being said in romantic and funny scenes of any K-Drama!
        </div>
      </div>
    </Page>
  );
}

function TrialTestimonialsEn() {
  const testimonials = [
    { name:"Nour Ibrahim",  city:"Cairo",        level:"Level 2", quote:"I dreamed of understanding K-dramas without subtitles. After 3 months with Klovers I understand 50% of the dialogue!", emoji:"🌸" },
    { name:"Yasmine Hassan", city:"Alexandria",  level:"Level 1", quote:"Hangul seemed really hard from the outside. But after the first class with the teacher I decided to keep going!", emoji:"💛" },
    { name:"Mohamed Ali",   city:"Cairo",        level:"Level 3", quote:"Small group + the teacher's style = I learned more in 2 months than 3 years on my own!", emoji:"🔥" },
    { name:"Sara Mahmoud",  city:"Giza",         level:"Level 2", quote:"Every class is fun and full of laughter. You don't just learn — you fall in love with the language!", emoji:"😍" },
  ];

  return (
    <Page dir="ltr">
      <SHead title="What Our Students Say 💬" subtitle="Real stories from the Klovers community" />
      <DancheongBorder />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"9px", marginBottom:"12px" }}>
        {testimonials.map((t, i) => (
          <div key={i} style={{
            background: i % 2 === 0 ? BK : "#f9f9f9",
            border:`2px solid ${i % 2 === 0 ? Y : "#e5e5e5"}`,
            borderRadius:"12px", padding:"12px",
            display:"flex", flexDirection:"column", gap:"8px",
          }}>
            <div style={{ fontSize:"28px", lineHeight:1 }}>{t.emoji}</div>
            <div style={{ fontSize:"10px", color: i % 2 === 0 ? "#ccc" : "#555", lineHeight:1.7, flex:1 }}>
              "{t.quote}"
            </div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:800, color: i % 2 === 0 ? Y : BK }}>{t.name}</div>
              <div style={{ fontSize:"9px", color:"#888" }}>{t.city} · {t.level}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:Y, borderRadius:"10px", padding:"10px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
        <MugunghwaIcon size={36} color={BK} />
        <div>
          <div style={{ fontSize:"12px", fontWeight:900, color:BK }}>500+ Students</div>
          <div style={{ fontSize:"10px", color:BK2 }}>Joined the Klovers community from Egypt, the Gulf, and the Arab Maghreb</div>
        </div>
      </div>
    </Page>
  );
}

function TrialJoinEn() {
  const steps = [
    { n:"1", icon:"💬", title:"Reach Out",          body:"Message us on WhatsApp or Instagram and we'll reply instantly." },
    { n:"2", icon:"📅", title:"Pick Your Schedule",  body:"Flexible times — morning or evening, weekends, whatever works for you." },
    { n:"3", icon:"📚", title:"Start Level 1",       body:"Get Hangul Book 1 + group access + full teacher support." },
    { n:"4", icon:"🌟", title:"Reach Fluency",       body:"6 clear levels — and a community cheering you on every step of the way." },
  ];

  return (
    <Page dir="ltr">
      <SHead title="Join the Klovers Family 🚀" subtitle="A journey of a thousand miles begins with one word: I'm ready!" />
      <Photo src={PHOTOS.palace} alt="Gyeongbokgung Palace" h={85} radius={10} overlay />
      <DancheongBorder />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            background: i < 2 ? BK : YL,
            border:`2px solid ${Y}`,
            borderRadius:"10px", padding:"11px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px" }}>
              <div style={{
                width:"22px", height:"22px", background:Y, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"11px", fontWeight:900, color:BK, flexShrink:0,
              }}>{s.n}</div>
              <div style={{ fontSize:"14px" }}>{s.icon}</div>
              <div style={{ fontSize:"11px", fontWeight:800, color: i < 2 ? Y : BK }}>{s.title}</div>
            </div>
            <div style={{ fontSize:"10px", color: i < 2 ? "#ccc" : "#555", lineHeight:1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
      <div style={{ background:BK, borderRadius:"12px", padding:"14px", textAlign:"center", border:`3px solid ${Y}` }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:Y, marginBottom:"8px" }}>Start your journey today!</div>
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
          <div style={{ background:"#25D366", borderRadius:"8px", padding:"8px 16px", fontSize:"11px", fontWeight:700, color:"#fff" }}>💬 WhatsApp</div>
          <div style={{ background:"#E1306C", borderRadius:"8px", padding:"8px 16px", fontSize:"11px", fontWeight:700, color:"#fff" }}>📸 Instagram</div>
          <div style={{ background:"#0047AB", borderRadius:"8px", padding:"8px 16px", fontSize:"11px", fontWeight:700, color:"#fff" }}>🌐 kloversegy.com</div>
        </div>
        <div style={{ fontSize:"10px", color:"#888", marginTop:"10px" }}>
          한국어를 배워요! — Let's learn Korean together!
        </div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function TrialBookPage() {
  const [preview, setPreview] = useState<Lang>("ar");
  const [access, setAccess] = useState<"loading" | "granted" | "denied">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      const { data: adminRow } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();

      if (!cancelled) setAccess(adminRow ? "granted" : "denied");
    })();
    return () => { cancelled = true; };
  }, [navigate]);

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
      <h1 className="text-2xl font-black">Trial Book — Admin Only</h1>
      <p className="text-muted-foreground max-w-sm">This resource is available to teachers and admins only.</p>
      <button onClick={() => navigate("/dashboard")}
        className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors">
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
        @media print {
          body * { visibility: hidden !important; }
          #trial-book, #trial-book * { visibility: visible !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
          #trial-book { position: absolute; top: 0; left: 0; width: 100%; }
          .book-page { page-break-after: always !important; break-after: page !important; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .book-page { margin: 0 auto 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-white border-b shadow-sm flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            ← Back
          </button>
          <span className="text-sm font-bold">Trial Class Book — دليل الحصة التجريبية</span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">30 min</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border rounded-lg overflow-hidden text-xs">
            <button onClick={() => setPreview("ar")}
              className={`px-3 py-1.5 font-medium transition-colors ${isAr ? "bg-amber-500 text-black" : "hover:bg-muted"}`}>
              عربي
            </button>
            <button onClick={() => setPreview("en")}
              className={`px-3 py-1.5 font-medium transition-colors ${!isAr ? "bg-amber-500 text-black" : "hover:bg-muted"}`}>
              English
            </button>
          </div>
          <button onClick={() => printVersion("ar")}
            className="text-xs px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
            ⬇ PDF عربي
          </button>
          <button onClick={() => printVersion("en")}
            className="text-xs px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
            ⬇ PDF English
          </button>
        </div>
      </div>

      {/* Book */}
      <div id="trial-book" style={{ padding:"24px 0" }}>
        {isAr ? (
          <>
            <TrialCoverAr />
            <TrialAgendaAr />
            <TrialWhyAr />
            <TrialLevelsAr />
            <TrialHangulAr />
            <TrialDramaAr />
            <TrialTestimonialsAr />
            <TrialJoinAr />
          </>
        ) : (
          <>
            <TrialCoverEn />
            <TrialAgendaEn />
            <TrialWhyEn />
            <TrialLevelsEn />
            <TrialHangulEn />
            <TrialDramaEn />
            <TrialTestimonialsEn />
            <TrialJoinEn />
          </>
        )}
      </div>
    </>
  );
}
