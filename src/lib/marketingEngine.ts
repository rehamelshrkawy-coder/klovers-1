// Marketing content generation engine

export interface GroupData {
  id: string;
  name: string;
  level: string;
  day_name: string;
  start_time: string;
  duration_min: number;
  capacity: number;
  active_members: number;
  seats_left: number;
  urgency_label: "Last Seats" | "Starting Soon" | "Open Registration";
  package_id: string;
}

// Delegate to the canonical level registry so marketing copy always matches
// what students see in the intake and admin. Falls back to a prettified form
// for any unknown legacy values (beginner_1, etc.) during the transition.
import { getLevelShortLabel } from "@/constants/levels";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

export function getLevelLabel(level: string): string {
  if (!level) return "";
  const mapped = getLevelShortLabel(level);
  // If still the raw key (unrecognised), apply title case for readability.
  return mapped === level
    ? level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : mapped;
}

export function getUrgencyLabel(seatsLeft: number): GroupData["urgency_label"] {
  if (seatsLeft <= 2) return "Last Seats";
  return "Open Registration";
}

// ─── Organic Post Captions ───

const HOOKS = [
  (g: GroupData) => `🚀 ${getLevelLabel(g.level)} — Starting ${g.day_name} ${g.start_time}`,
  (g: GroupData) => `🇰🇷 Ready to learn Korean? ${getLevelLabel(g.level)} is open!`,
  (g: GroupData) => `✨ New group alert! ${getLevelLabel(g.level)} — ${g.day_name}s at ${g.start_time}`,
];

const BENEFITS = [
  "Learn to read, speak, and build real Korean sentences from week one.",
  "Small group setting for personalized attention and real practice.",
  "Structured curriculum designed to get you speaking Korean fast.",
];

const CTAS = [
  "Reserve your seat today.",
  "Spots are filling up — register now!",
  "Don't miss out — enroll today.",
];

const HASHTAGS = "#LearnKorean #KoreanCourse #Klovers #KoreanLanguage #StudyKorean";

export function generateCaptions(group: GroupData): string[] {
  return [0, 1, 2].map(i => {
    const seatsLine = group.seats_left <= 3 ? `\nOnly ${group.seats_left} seat${group.seats_left === 1 ? "" : "s"} left.` : "";
    return `${HOOKS[i](group)}${seatsLine}\n\n${BENEFITS[i]}\n\n${CTAS[i]}\n\n${HASHTAGS}`;
  });
}

// ─── Meta Ads Copy ───

export function generateAdCopy(group: GroupData) {
  const level = getLevelLabel(group.level);
  
  const primaryTexts = [
    `Learn Korean the right way. ${level} starts ${group.day_name} at ${group.start_time}. Small group, structured lessons, real results. Limited seats available — register now.`,
    `Want to speak Korean? Join our ${level} course. ${group.duration_min}-minute sessions every ${group.day_name}. Only ${group.seats_left} spots remaining.`,
    `Start your Korean journey with ${level}. Expert-led classes, small groups, and a clear roadmap from day one. Seats are limited.`,
  ];

  const headlines = [
    `${level} — ${group.day_name} ${group.start_time}`,
    `Learn Korean — Only ${group.seats_left} Seats Left`,
    `${level} Starts This ${group.day_name}`,
  ];

  const descriptions = [
    `${group.duration_min}-min weekly sessions. Small group. Structured learning.`,
    `Expert-led Korean course. Limited seats. Register today.`,
  ];

  return { primaryTexts, headlines, descriptions, cta: "Sign Up" };
}

// ─── WhatsApp Broadcast Template ───

export function generateWhatsAppMessage(group: GroupData): string {
  const level = getLevelLabel(group.level);
  const slug = level.toLowerCase().replace(/\s+/g, "-");
  const seatsLine = group.seats_left <= 5
    ? `⏳ فضلوا بس ${group.seats_left} مقعد!\n`
    : "";
  const regUrl = `https://kloversegy.com/enroll?utm_source=whatsapp&utm_campaign=${encodeURIComponent(slug)}`;
  return `السلام عليكم 🌸\n\n📣 ${level} Korean Course\n🗓 ${group.day_name}s at ${group.start_time}\n⏱ ${group.duration_min} minutes/session\n\n✅ تعلم الكورية من الصفر مع مجموعة صغيرة ومتابعة شخصية\n${seatsLine}\n📲 سجل هنا:\n${regUrl}\n\n#Klovers #تعلم_الكورية #KoreanLanguage`;
}

// ─── UTM Link Builder ───

export function enrollUrl(campaign: CampaignDirection, postType: MonthlyPostType, source = "instagram"): string {
  return `kloversegy.com/enroll?utm_source=${source}&utm_campaign=${campaign}&utm_content=${postType}`;
}

export function whatsappUrl(campaign: CampaignDirection, postType: MonthlyPostType): string {
  const msg = encodeURIComponent("Hi! I saw your post and I'm interested in learning Korean with Klovers 🇰🇷");
  return `${WHATSAPP_BASE}?text=${msg}`;
}

export function trialUrl(campaign: CampaignDirection): string {
  return `kloversegy.com/free-trial?utm_source=instagram&utm_campaign=${campaign}`;
}

// Which post types should use WhatsApp CTA instead of Register Now
const WHATSAPP_CTA_TYPES: Set<MonthlyPostType> = new Set(["referral", "invite_student"]);

export function isWhatsAppCTA(postType: MonthlyPostType): boolean {
  return WHATSAPP_CTA_TYPES.has(postType);
}

// ─── Post Template Helpers (for canvas rendering) ───

export interface PostTemplate {
  mainText: string;
  subtitle: string;
  extra: string;
  isUrgent: boolean;
}

export function getGroupPostTemplate(group: GroupData): PostTemplate {
  const levelLabel = getLevelLabel(group.level);
  const isUrgent = group.seats_left <= 5;
  const urgencyLine = group.seats_left <= 3
    ? `\n🔴 Only ${group.seats_left} seats left!`
    : group.seats_left <= 6
    ? `\n⚡ ${group.seats_left} seats available`
    : "";
  return {
    mainText: levelLabel,
    subtitle: `${group.day_name} • ${group.start_time}\n${group.duration_min} min / session${urgencyLine}`,
    extra: "#LearnKorean  #Klovers  #KoreanCourse",
    isUrgent,
  };
}

export function getInvitePostTemplate(group: GroupData): PostTemplate {
  const levelLabel = getLevelLabel(group.level);
  return {
    mainText: `Join ${levelLabel}`,
    subtitle: `Every ${group.day_name} • ${group.start_time}\n${group.duration_min} min sessions`,
    extra: "#LearnKorean  #Klovers  #KoreanCourse",
    isUrgent: false,
  };
}

export function getDiscountPostTemplate(discountPct: number, code: string): PostTemplate {
  return {
    mainText: `${discountPct}% OFF`,
    subtitle: `First Month\nCode: ${code || "SAVE" + discountPct}`,
    extra: "#KoreanCourse  #Klovers  #Discount",
    isUrgent: true,
  };
}

export function getReferralPostTemplate(): PostTemplate {
  return {
    mainText: "Refer a Friend",
    subtitle: "Get 1 Free Class\nShare your link",
    extra: "#Klovers  #LearnKorean  #KoreanAcademy",
    isUrgent: false,
  };
}

// ─── Testimonial / Social Proof ───

const TESTIMONIALS = [
  { quote: "I passed TOPIK 2!", student: "Mona, Level 4" },
  { quote: "Reading menus now!", student: "Sara, Level 2" },
  { quote: "Best Korean class!", student: "Ahmed, Level 1" },
  { quote: "Worth every penny!", student: "Rana, Level 3" },
  { quote: "Fluent in 1 year!", student: "Nour, Advanced" },
];

export function getTestimonialPostTemplate(index = 0): PostTemplate {
  const t = TESTIMONIALS[index % TESTIMONIALS.length];
  return {
    mainText: `"${t.quote}"`,
    subtitle: `— ${t.student}\nKlovers Academy`,
    extra: "#StudentSuccess  #Klovers  #KoreanResults",
    isUrgent: false,
  };
}

// ─── FAQ / Objection Handling ───

const FAQ_ITEMS = [
  { q: "Can I learn Korean online?", a: "Yes! Small groups,\nstructured lessons" },
  { q: "How fast will I progress?", a: "Read Korean in 4 weeks\nwith our curriculum" },
  { q: "Is it worth learning Korean?", a: "K-dramas, K-pop, travel —\nopen new worlds" },
];

export function getFAQPostTemplate(index = 0): PostTemplate {
  const faq = FAQ_ITEMS[index % FAQ_ITEMS.length];
  return {
    mainText: faq.q,
    subtitle: faq.a,
    extra: "#KoreanFAQ  #Klovers  #LearnKorean",
    isUrgent: false,
  };
}

// ─── Countdown / Urgency ───

export function getCountdownPostTemplate(daysLeft: number, levelLabel: string): PostTemplate {
  return {
    mainText: `${daysLeft} Days Left`,
    subtitle: `${levelLabel}\nregistration closes soon`,
    extra: "#LastChance  #Klovers  #KoreanCourse",
    isUrgent: true,
  };
}

// ─── Arabic Content Variants ───

export type PostLang = "en" | "ar";

const HOOKS_AR = [
  (g: GroupData) => `🚀 ${getLevelLabel(g.level)} — يبدأ ${g.day_name} الساعة ${g.start_time}`,
  (g: GroupData) => `🇰🇷 جاهز تتعلم كوري؟ ${getLevelLabel(g.level)} مفتوح!`,
  (g: GroupData) => `✨ جروب جديد! ${getLevelLabel(g.level)} — ${g.day_name} الساعة ${g.start_time}`,
];

const BENEFITS_AR = [
  "اتعلم تقرأ وتتكلم وتبني جمل كوري حقيقية من أول أسبوع.",
  "مجموعة صغيرة = اهتمام شخصي وممارسة حقيقية.",
  "منهج منظم يخليك تتكلم كوري بسرعة.",
];

const CTAS_AR = [
  "احجز مكانك النهارده.",
  "الأماكن بتخلص — سجّل دلوقتي!",
  "ماتفوتش الفرصة — سجّل اليوم.",
];

const HASHTAGS_AR = "#تعلم_الكورية #كورس_كوري #كلوفرز #اللغة_الكورية";

export function generateCaptionsAR(group: GroupData): string[] {
  return [0, 1, 2].map(i => {
    const seatsLine = group.seats_left <= 3 ? `\nفاضل بس ${group.seats_left} مقعد${group.seats_left === 1 ? "" : "!"}` : "";
    return `${HOOKS_AR[i](group)}${seatsLine}\n\n${BENEFITS_AR[i]}\n\n${CTAS_AR[i]}\n\n${HASHTAGS_AR}`;
  });
}

export function getGroupPostTemplateAR(group: GroupData): PostTemplate {
  const levelLabel = getLevelLabel(group.level);
  const isUrgent = group.seats_left <= 5;
  const urgencyLine = group.seats_left <= 3
    ? `\n🔴 فاضل بس ${group.seats_left} مقعد!`
    : group.seats_left <= 6
    ? `\n⚡ ${group.seats_left} أماكن متاحة`
    : "";
  return {
    mainText: levelLabel,
    subtitle: `${group.day_name} • ${group.start_time}\n${group.duration_min} دقيقة / حصة${urgencyLine}`,
    extra: "#تعلم_الكورية  #كلوفرز  #كورس_كوري",
    isUrgent,
  };
}

export function getDiscountPostTemplateAR(discountPct: number, code: string): PostTemplate {
  return {
    mainText: `خصم ${discountPct}%`,
    subtitle: `أول شهر\nكود: ${code || "SAVE" + discountPct}`,
    extra: "#كورس_كوري  #كلوفرز  #خصم",
    isUrgent: true,
  };
}

export function getReferralPostTemplateAR(): PostTemplate {
  return {
    mainText: "وصّي صاحبك",
    subtitle: "احصل على حصة مجانية\nشارك الرابط",
    extra: "#كلوفرز  #تعلم_الكورية  #أكاديمية_كلوفرز",
    isUrgent: false,
  };
}

const TESTIMONIALS_AR = [
  { quote: "نجحت في TOPIK 2!", student: "منى، المستوى 4" },
  { quote: "بقيت أقرأ المنيو!", student: "سارة، المستوى 2" },
  { quote: "أحسن كلاس كوري!", student: "أحمد، المستوى 1" },
  { quote: "تستاهل كل قرش!", student: "رنا، المستوى 3" },
  { quote: "بتكلم كوري في سنة!", student: "نور، متقدم" },
];

export function getTestimonialPostTemplateAR(index = 0): PostTemplate {
  const t = TESTIMONIALS_AR[index % TESTIMONIALS_AR.length];
  return {
    mainText: `"${t.quote}"`,
    subtitle: `— ${t.student}\nأكاديمية كلوفرز`,
    extra: "#نجاح_الطلاب  #كلوفرز  #نتائج_الكوري",
    isUrgent: false,
  };
}

const FAQ_ITEMS_AR = [
  { q: "ممكن أتعلم كوري أونلاين؟", a: "أيوه! مجموعات صغيرة\nوحصص منظمة" },
  { q: "هتقدم بسرعة قد إيه؟", a: "هتقرأ كوري في 4 أسابيع\nمع المنهج بتاعنا" },
  { q: "يستاهل أتعلم كوري؟", a: "دراما، كيبوب، سفر —\nافتح عوالم جديدة" },
];

export function getFAQPostTemplateAR(index = 0): PostTemplate {
  const faq = FAQ_ITEMS_AR[index % FAQ_ITEMS_AR.length];
  return {
    mainText: faq.q,
    subtitle: faq.a,
    extra: "#أسئلة_كوري  #كلوفرز  #تعلم_الكورية",
    isUrgent: false,
  };
}

export function getCountdownPostTemplateAR(daysLeft: number, levelLabel: string): PostTemplate {
  return {
    mainText: `${daysLeft} يوم متبقي`,
    subtitle: `${levelLabel}\nالتسجيل هيقفل قريب`,
    extra: "#فرصة_أخيرة  #كلوفرز  #كورس_كوري",
    isUrgent: true,
  };
}

// ─── New Engagement Post Types ───

const KOREAN_TIPS = [
  { word: "안녕하세요", romanized: "Annyeonghaseyo", meaningEN: "Hello (formal)", meaningAR: "مرحبا (رسمي)" },
  { word: "감사합니다", romanized: "Gamsahamnida", meaningEN: "Thank you", meaningAR: "شكرًا" },
  { word: "사랑해요", romanized: "Saranghaeyo", meaningEN: "I love you", meaningAR: "أحبك" },
  { word: "맛있어요", romanized: "Masisseoyo", meaningEN: "It's delicious!", meaningAR: "لذيذ!" },
  { word: "화이팅", romanized: "Hwaiting!", meaningEN: "You can do it!", meaningAR: "يلّا بينا!" },
  { word: "대박", romanized: "Daebak!", meaningEN: "Amazing!", meaningAR: "رهيب!" },
];

export function getTipPostTemplate(index = 0, lang: PostLang = "en"): PostTemplate {
  const t = KOREAN_TIPS[index % KOREAN_TIPS.length];
  return {
    mainText: t.word,
    subtitle: `${t.romanized}\n${lang === "ar" ? t.meaningAR : t.meaningEN}`,
    extra: lang === "ar" ? "#كلمة_كورية  #كلوفرز  #تعلم_الكورية" : "#KoreanWord  #Klovers  #LearnKorean",
    isUrgent: false,
  };
}

const CULTURE_FACTS = [
  { titleEN: "K-Drama Secret", titleAR: "سر الدراما الكورية", factEN: "Korean dramas use honorifics to show social hierarchy — learn Korean to catch every nuance!", factAR: "الدراما الكورية بتستخدم ألقاب الاحترام — اتعلم كوري عشان تفهم كل التفاصيل!" },
  { titleEN: "Hangul in 2 Hours", titleAR: "هانغول في ساعتين", factEN: "The Korean alphabet was designed to be easy to learn — most students read it in under 2 hours!", factAR: "الأبجدية الكورية اتصممت عشان تكون سهلة — أغلب الطلاب بيقرأوها في أقل من ساعتين!" },
  { titleEN: "K-Pop Power", titleAR: "قوة الكيبوب", factEN: "BTS sings in Korean — imagine understanding every word without subtitles!", factAR: "BTS بيغنوا بالكوري — تخيل تفهم كل كلمة من غير ترجمة!" },
];

export function getCulturePostTemplate(index = 0, lang: PostLang = "en"): PostTemplate {
  const c = CULTURE_FACTS[index % CULTURE_FACTS.length];
  return {
    mainText: lang === "ar" ? c.titleAR : c.titleEN,
    subtitle: lang === "ar" ? c.factAR : c.factEN,
    extra: lang === "ar" ? "#ثقافة_كورية  #كلوفرز  #كيبوب" : "#KCulture  #Klovers  #KPop",
    isUrgent: false,
  };
}

// ─── Monthly 30-Post Plan ───

export type MonthlyPostType =
  | "empty_slots"
  | "invite_student"
  | "discount"
  | "referral"
  | "testimonial"
  | "faq"
  | "countdown"
  | "tip"
  | "culture";

export interface ReelScript {
  slide1: string;
  slide2: string;
  slide3: string;
  bgQuery: string;
  audioSuggestion: string;
}

export interface MonthlyPost {
  id: string;
  day: number;
  postType: MonthlyPostType;
  template: PostTemplate;
  caption: string;
  isReel: boolean;
  reelScript?: ReelScript;
}

// Post types that work best as reels (visual, engaging, short-form)
const REEL_PREFERRED_TYPES: Set<MonthlyPostType> = new Set([
  "tip", "culture", "testimonial", "countdown", "faq",
]);

function generateReelScript(
  postType: MonthlyPostType,
  template: PostTemplate,
  studentCount: string,
  campaign: CampaignDirection,
): ReelScript {
  const url = enrollUrl(campaign, postType);
  const trial = trialUrl(campaign);

  switch (postType) {
    case "tip":
      return {
        slide1: `Did you know this Korean word? 🇰🇷\n\n👆 Watch to learn`,
        slide2: `${template.mainText}\n\n${template.subtitle}\n\n💡 Use it in your next conversation!`,
        slide3: `Follow @klovers_academy for daily Korean tips!\n\n📲 Free class: ${trial}\n\n#KoreanWord #LearnKorean #Klovers`,
        bgQuery: "korean hangul calligraphy",
        audioSuggestion: "Trending K-pop instrumental or lo-fi Korean beats",
      };
    case "culture":
      return {
        slide1: `K-Drama fans, this one's for you 🎬\n\n👆 Keep watching`,
        slide2: `${template.mainText}\n\n${template.subtitle}`,
        slide3: `Learn Korean to experience K-culture fully! 🇰🇷\n\n📲 Free trial: ${trial}\n\n#KCulture #KPop #LearnKorean`,
        bgQuery: "korean temple palace seoul",
        audioSuggestion: "Popular K-drama OST or trending K-pop",
      };
    case "testimonial":
      return {
        slide1: `This student went from zero Korean to... 🤯\n\n👆 Hear their story`,
        slide2: `${template.mainText}\n\n${template.subtitle}\n\n⭐ Join ${studentCount} students`,
        slide3: `Ready to write YOUR success story? 🇰🇷\n\n📲 Free trial: ${trial}\n\n#StudentSuccess #Klovers`,
        bgQuery: "happy students celebration",
        audioSuggestion: "Inspirational background music",
      };
    case "countdown":
      return {
        slide1: `⏰ LAST CHANCE! Registration closing soon...\n\n👆 Don't miss this`,
        slide2: `${template.mainText}\n\n${template.subtitle}\n\n🔥 ${studentCount} students already enrolled`,
        slide3: `Secure your seat NOW before it's too late!\n\n📲 ${url}\n\n#LastChance #KoreanCourse`,
        bgQuery: "alarm clock urgency",
        audioSuggestion: "Dramatic countdown music or ticking clock sound",
      };
    case "faq":
      return {
        slide1: `"${template.mainText}" 🤔\n\n👆 Here's the truth`,
        slide2: `${template.subtitle}\n\n✅ ${studentCount} students chose Klovers\n✅ Certified teachers\n✅ Small groups`,
        slide3: `Try a FREE class and see for yourself!\n\n📲 ${trial}\n\n#KoreanFAQ #LearnKorean`,
        bgQuery: "korean study books",
        audioSuggestion: "Conversational background music",
      };
    case "empty_slots":
      return {
        slide1: `🔥 Seats are filling up FAST!\n\n👆 Check availability`,
        slide2: `${template.mainText}\n\n${template.subtitle}\n\n✅ ${studentCount} students trust Klovers`,
        slide3: `Register before your seat is taken!\n\n📲 ${url}\n\n#LearnKorean #Klovers`,
        bgQuery: "empty classroom seats",
        audioSuggestion: "Urgency sound effect + upbeat music",
      };
    case "discount":
      return {
        slide1: `We're giving THIS away... 🏷️\n\n👆 Watch to save`,
        slide2: `${template.mainText}\n\n${template.subtitle}\n\n⏳ Limited time only`,
        slide3: `Grab your discount NOW!\n\n📲 ${url}\n\n#KoreanDiscount #Klovers`,
        bgQuery: "sale discount celebration",
        audioSuggestion: "Exciting deal reveal music",
      };
    case "referral":
      return {
        slide1: `Want a FREE Korean class? 🎁\n\n👆 Here's how`,
        slide2: `1️⃣ Share this reel\n2️⃣ Your friend enrolls\n3️⃣ BOTH get a free session!\n\nIt's that simple.`,
        slide3: `DM us on WhatsApp to get started!\n\n📲 ${whatsappUrl(campaign, postType)}\n\n#ReferAFriend #Klovers`,
        bgQuery: "friends together happy",
        audioSuggestion: "Feel-good friendship music",
      };
    case "invite_student":
      return {
        slide1: `TAG someone who needs Korean in their life! 👇\n\n🇰🇷`,
        slide2: `What they'll get:\n✅ Read Korean in 2 hours\n✅ Speak from week 1\n✅ Small group + certified teacher`,
        slide3: `Share this reel with them NOW!\n\n📲 ${whatsappUrl(campaign, postType)}\n\n#LearnKorean #Klovers`,
        bgQuery: "welcome greeting invitation",
        audioSuggestion: "Upbeat social media trending audio",
      };
    default:
      return {
        slide1: `Learn Korean with Klovers! 🇰🇷`,
        slide2: `${template.mainText}\n\n${template.subtitle}`,
        slide3: `📲 ${url}\n\n#LearnKorean #Klovers`,
        bgQuery: "korea seoul",
        audioSuggestion: "K-pop instrumental",
      };
  }
}

// 30-day posting schedule — mixed sales + engagement content
// Pattern: Awareness (testimonial/faq/tip/culture) → Consideration (empty_slots/invite) → Decision (discount/countdown/referral)
const MONTHLY_SCHEDULE: MonthlyPostType[] = [
  "empty_slots",   // 1  — open week hook
  "tip",           // 2  — educational engagement
  "invite_student",// 3  — soft invite
  "testimonial",   // 4  — social proof
  "culture",       // 5  — K-culture engagement
  "discount",      // 6  — first promo push
  "referral",      // 7  — word of mouth
  "empty_slots",   // 8
  "testimonial",   // 9
  "tip",           // 10 — educational engagement
  "invite_student",// 11
  "countdown",     // 12 — mid-month urgency
  "empty_slots",   // 13
  "discount",      // 14 — second promo push
  "culture",       // 15 — K-culture engagement
  "empty_slots",   // 16
  "referral",      // 17
  "invite_student",// 18
  "empty_slots",   // 19
  "culture",       // 20 — K-culture engagement
  "tip",           // 21 — educational engagement
  "discount",      // 22 — third promo push
  "countdown",     // 23 — urgency ramp up
  "empty_slots",   // 24
  "referral",      // 25
  "invite_student",// 26
  "faq",           // 27 — objection handling
  "testimonial",   // 28
  "discount",      // 29 — end-of-month last chance
  "countdown",     // 30 — FINAL DAY urgency
];

// ─── Campaign Directions ─────────────────────────────────────────────────────

export type CampaignDirection = "balanced" | "engagement" | "enrollment" | "brand_awareness" | "referral_drive" | "re_engagement";

export interface CampaignConfig {
  id: CampaignDirection;
  name: string;
  description: string;
  icon: string;
  schedule: MonthlyPostType[];
}

// Engagement — build community, educate, entertain (tip: 8, culture: 8, testimonial: 4, faq: 3)
const ENGAGEMENT_SCHEDULE: MonthlyPostType[] = [
  "tip",           // 1
  "culture",       // 2
  "testimonial",   // 3
  "tip",           // 4
  "culture",       // 5
  "faq",           // 6
  "tip",           // 7
  "culture",       // 8
  "testimonial",   // 9
  "tip",           // 10
  "culture",       // 11
  "empty_slots",   // 12
  "tip",           // 13
  "culture",       // 14
  "faq",           // 15
  "testimonial",   // 16
  "culture",       // 17
  "tip",           // 18
  "empty_slots",   // 19
  "culture",       // 20
  "discount",      // 21
  "tip",           // 22
  "faq",           // 23
  "culture",       // 24
  "testimonial",   // 25
  "invite_student",// 26
  "tip",           // 27
  "referral",      // 28
  "empty_slots",   // 29
  "discount",      // 30
];

// Enrollment — drive registrations with urgency (empty_slots: 8, countdown: 5, discount: 5, invite: 4)
const ENROLLMENT_SCHEDULE: MonthlyPostType[] = [
  "empty_slots",   // 1
  "tip",           // 2
  "empty_slots",   // 3
  "discount",      // 4
  "invite_student",// 5
  "countdown",     // 6
  "empty_slots",   // 7
  "testimonial",   // 8
  "discount",      // 9
  "empty_slots",   // 10
  "invite_student",// 11
  "countdown",     // 12
  "faq",           // 13
  "empty_slots",   // 14
  "discount",      // 15
  "countdown",     // 16
  "invite_student",// 17
  "empty_slots",   // 18
  "testimonial",   // 19
  "tip",           // 20
  "discount",      // 21
  "empty_slots",   // 22
  "countdown",     // 23
  "invite_student",// 24
  "testimonial",   // 25
  "empty_slots",   // 26
  "culture",       // 27
  "faq",           // 28
  "discount",      // 29
  "countdown",     // 30
];

// Brand Awareness — visibility through culture & social proof (culture: 7, testimonial: 6, tip: 6)
const BRAND_AWARENESS_SCHEDULE: MonthlyPostType[] = [
  "culture",       // 1
  "testimonial",   // 2
  "tip",           // 3
  "culture",       // 4
  "testimonial",   // 5
  "tip",           // 6
  "culture",       // 7
  "faq",           // 8
  "testimonial",   // 9
  "tip",           // 10
  "culture",       // 11
  "testimonial",   // 12
  "empty_slots",   // 13
  "tip",           // 14
  "culture",       // 15
  "faq",           // 16
  "testimonial",   // 17
  "tip",           // 18
  "culture",       // 19
  "invite_student",// 20
  "testimonial",   // 21
  "tip",           // 22
  "faq",           // 23
  "culture",       // 24
  "invite_student",// 25
  "empty_slots",   // 26
  "referral",      // 27
  "discount",      // 28
  "empty_slots",   // 29
  "discount",      // 30
];

// Referral Drive — word-of-mouth growth (referral: 6, invite: 6, testimonial: 5, discount: 4)
const REFERRAL_DRIVE_SCHEDULE: MonthlyPostType[] = [
  "referral",      // 1
  "invite_student",// 2
  "testimonial",   // 3
  "referral",      // 4
  "invite_student",// 5
  "discount",      // 6
  "testimonial",   // 7
  "referral",      // 8
  "invite_student",// 9
  "tip",           // 10
  "referral",      // 11
  "testimonial",   // 12
  "invite_student",// 13
  "discount",      // 14
  "empty_slots",   // 15
  "referral",      // 16
  "invite_student",// 17
  "testimonial",   // 18
  "culture",       // 19
  "discount",      // 20
  "referral",      // 21
  "invite_student",// 22
  "tip",           // 23
  "testimonial",   // 24
  "empty_slots",   // 25
  "faq",           // 26
  "discount",      // 27
  "culture",       // 28
  "empty_slots",   // 29
  "faq",           // 30
];

// Re-engagement — win back cold leads (tip: 7, culture: 6, discount: 4, testimonial: 4)
const RE_ENGAGEMENT_SCHEDULE: MonthlyPostType[] = [
  "tip",           // 1
  "culture",       // 2
  "testimonial",   // 3
  "tip",           // 4
  "culture",       // 5
  "discount",      // 6
  "tip",           // 7
  "testimonial",   // 8
  "culture",       // 9
  "tip",           // 10
  "faq",           // 11
  "culture",       // 12
  "discount",      // 13
  "tip",           // 14
  "testimonial",   // 15
  "culture",       // 16
  "empty_slots",   // 17
  "tip",           // 18
  "invite_student",// 19
  "culture",       // 20
  "discount",      // 21
  "tip",           // 22
  "testimonial",   // 23
  "faq",           // 24
  "empty_slots",   // 25
  "invite_student",// 26
  "referral",      // 27
  "countdown",     // 28
  "empty_slots",   // 29
  "discount",      // 30
];

export const CAMPAIGN_CONFIGS: CampaignConfig[] = [
  { id: "balanced",        name: "Balanced",        icon: "⚖️", description: "Mixed AIDA — equal blend of sales, engagement & awareness", schedule: MONTHLY_SCHEDULE },
  { id: "engagement",      name: "Engagement",      icon: "💬", description: "Build community with tips, culture & student stories", schedule: ENGAGEMENT_SCHEDULE },
  { id: "enrollment",      name: "Enrollment",      icon: "🎯", description: "Drive registrations with seat alerts, countdowns & promos", schedule: ENROLLMENT_SCHEDULE },
  { id: "brand_awareness", name: "Brand Awareness",  icon: "📢", description: "Grow visibility with testimonials & K-culture hooks", schedule: BRAND_AWARENESS_SCHEDULE },
  { id: "referral_drive",  name: "Referral Drive",   icon: "🤝", description: "Amplify word-of-mouth with referral offers & invites", schedule: REFERRAL_DRIVE_SCHEDULE },
  { id: "re_engagement",   name: "Re-engagement",    icon: "🔄", description: "Win back cold leads with tips, culture & free trials", schedule: RE_ENGAGEMENT_SCHEDULE },
];

export function generateMonthlyPlan(
  groups: GroupData[],
  discountPct: number,
  discountCode: string,
  lang: PostLang = "en",
  campaign: CampaignDirection = "balanced",
  studentCount = 500,
): MonthlyPost[] {
  let groupIdx = 0;
  let testimonialIdx = 0;
  let faqIdx = 0;
  let countdownIdx = 0;
  let tipIdx = 0;
  let cultureIdx = 0;
  const isAR = lang === "ar";
  const sc = studentCount > 0 ? `${Math.floor(studentCount / 100) * 100}+` : "500+";

  const safeGroup = () => groups.length ? groups[groupIdx++ % groups.length] : null;
  const url = (type: MonthlyPostType) => enrollUrl(campaign, type);
  const waUrl = (type: MonthlyPostType) => whatsappUrl(campaign, type);
  const trial = trialUrl(campaign);

  const config = CAMPAIGN_CONFIGS.find(c => c.id === campaign) ?? CAMPAIGN_CONFIGS[0];

  return config.schedule.map((type, i) => {
    const day = i + 1;
    let template: PostTemplate;
    let caption = "";

    switch (type) {
      case "empty_slots": {
        const g = safeGroup();
        template = g
          ? (isAR ? getGroupPostTemplateAR(g) : getGroupPostTemplate(g))
          : (isAR ? getDiscountPostTemplateAR(discountPct, discountCode) : getDiscountPostTemplate(discountPct, discountCode));
        caption = g
          ? `📢 ${getLevelLabel(g.level)} — ${g.seats_left} seat${g.seats_left !== 1 ? "s" : ""} left!\n\n🗓 Every ${g.day_name} at ${g.start_time} · ${g.duration_min} min\n✅ Join ${sc} students · Small groups · Certified teacher\n\n📲 ${url(type)}\n\n#LearnKorean #Klovers #KoreanCourse`
          : `📢 New Korean course spots open!\n\n✅ ${sc} students already enrolled. Small groups, certified teachers.\n\n📲 ${url(type)}\n\n#LearnKorean #Klovers`;
        break;
      }
      case "invite_student": {
        const g = safeGroup();
        template = g
          ? (isAR ? getGroupPostTemplateAR(g) : getInvitePostTemplate(g))
          : (isAR ? getReferralPostTemplateAR() : getReferralPostTemplate());
        caption = g
          ? `👋 Know someone who'd love to learn Korean?\n\n${getLevelLabel(g.level)} — ${g.day_name} ${g.start_time}\n\nTag them ⬇️ or DM us on WhatsApp!\n\n📲 ${waUrl(type)}\n\n#LearnKorean #Klovers #KoreanClasses`
          : `👋 Tag a friend who needs Korean in their life! 🇰🇷\n\nDM us to get started →\n\n📲 ${waUrl(type)}\n\n#LearnKorean #Klovers`;
        break;
      }
      case "discount": {
        template = isAR ? getDiscountPostTemplateAR(discountPct, discountCode) : getDiscountPostTemplate(discountPct, discountCode);
        caption = `🏷️ ${discountPct}% OFF your first month!\n\n💰 Use code: ${discountCode}\n⏳ Limited time only\n✅ ${sc} students trust Klovers\n\n📲 ${url(type)}\n\n#KoreanCourse #Klovers #Discount #LearnKorean`;
        break;
      }
      case "referral": {
        template = isAR ? getReferralPostTemplateAR() : getReferralPostTemplate();
        caption = `🤝 Refer a friend → BOTH get a FREE class!\n\n1️⃣ Share this post or DM us\n2️⃣ Your friend enrolls\n3️⃣ You both get a free session\n\n💬 Message us on WhatsApp:\n📲 ${waUrl(type)}\n\n#Klovers #LearnKorean #ReferAFriend`;
        break;
      }
      case "testimonial": {
        template = isAR ? getTestimonialPostTemplateAR(testimonialIdx) : getTestimonialPostTemplate(testimonialIdx);
        const t = isAR ? TESTIMONIALS_AR[testimonialIdx % TESTIMONIALS_AR.length] : TESTIMONIALS[testimonialIdx % TESTIMONIALS.length];
        testimonialIdx++;
        caption = `🌟 "${t.quote}" — ${t.student}\n\nJoin ${sc} students writing their Korean success story 🇰🇷\n\n📲 Free trial: ${trial}\n\n#StudentSuccess #Klovers #LearnKorean`;
        break;
      }
      case "faq": {
        template = isAR ? getFAQPostTemplateAR(faqIdx) : getFAQPostTemplate(faqIdx);
        const faq = isAR ? FAQ_ITEMS_AR[faqIdx % FAQ_ITEMS_AR.length] : FAQ_ITEMS[faqIdx % FAQ_ITEMS.length];
        faqIdx++;
        caption = `❓ ${faq.q}\n\n${faq.a.replace("\n", " — ")}\n\n${sc} students chose Klovers — certified teachers, small groups, proven curriculum.\n\n📲 Try free: ${trial}\n\n#KoreanFAQ #LearnKorean #Klovers`;
        break;
      }
      case "countdown": {
        const daysLeft = [3, 5, 2][countdownIdx % 3];
        const g = groups.length ? groups[countdownIdx % groups.length] : null;
        const levelLabel = g ? getLevelLabel(g.level) : "New Korean Class";
        template = isAR ? getCountdownPostTemplateAR(daysLeft, levelLabel) : getCountdownPostTemplate(daysLeft, levelLabel);
        countdownIdx++;
        caption = `⏰ ${daysLeft} DAYS LEFT to register for ${levelLabel}!\n\n🔥 Spots are filling fast\n✅ ${sc} students already in\n\n📲 Secure your seat: ${url(type)}\n\n#LastChance #Klovers #KoreanCourse`;
        break;
      }
      case "tip": {
        template = getTipPostTemplate(tipIdx, lang);
        const t = KOREAN_TIPS[tipIdx % KOREAN_TIPS.length];
        tipIdx++;
        caption = `💡 Korean word of the day: ${t.word} (${t.romanized})\n\n${t.meaningEN}\n\n💾 Save this & practice!\n🎓 Want structured lessons? Try a free class:\n📲 ${trial}\n\n#KoreanWord #LearnKorean #Klovers`;
        break;
      }
      case "culture": {
        template = getCulturePostTemplate(cultureIdx, lang);
        cultureIdx++;
        caption = `🎬 ${template.mainText}\n\n${template.subtitle}\n\n🇰🇷 Learn Korean to experience K-culture fully!\n📲 Free trial: ${trial}\n\n#KCulture #KPop #LearnKorean #Klovers`;
        break;
      }
    }

    // Alternate reel/static: odd days = reel (if post type is reel-friendly), even = static
    const isReel = (day % 2 === 0) && REEL_PREFERRED_TYPES.has(type);
    const reelScript = isReel ? generateReelScript(type, template!, sc, campaign) : undefined;

    return { id: `monthly-${day}`, day, postType: type, template: template!, caption, isReel, reelScript };
  });
}

// ─── Monthly post → PostData converter (for canvas renderer) ───

export function monthlyPostToPostData(post: MonthlyPost): { id: string; mainText: string; subtitle: string; extraText: string } {
  return {
    id: post.id,
    mainText: post.template.mainText,
    subtitle: post.template.subtitle,
    extraText: post.template.extra,
  };
}

// ─── Publishing copy export (for captions.txt in ZIP) ───

const POST_TYPE_LABELS: Record<MonthlyPostType, string> = {
  empty_slots:    "Class Opening",
  invite_student: "Student Invite",
  discount:       "Promotion",
  referral:       "Referral",
  testimonial:    "Student Story",
  faq:            "FAQ",
  countdown:      "Countdown",
  tip:            "Korean Tip",
  culture:        "K-Culture",
};

export function generatePublishingCopy(post: {
  day: number;
  postType: MonthlyPostType;
  caption: string;
  scheduledDate: string;
}): string {
  const label = POST_TYPE_LABELS[post.postType];
  const date = post.scheduledDate
    ? new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";
  return `=== Day ${post.day} — ${label} ===\n📅 ${date}\n\n${post.caption}\n\n---`;
}

export function generateReelPublishingCopy(post: {
  day: number;
  postType: MonthlyPostType;
  scheduledDate: string;
  reelScript?: ReelScript;
}): string {
  if (!post.reelScript) return "";
  const label = POST_TYPE_LABELS[post.postType];
  const date = post.scheduledDate
    ? new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";
  const rs = post.reelScript;
  return `=== Day ${post.day} — ${label} (REEL) ===\n📅 ${date}\n\n🎬 SLIDE 1 (Hook — 3 sec):\n${rs.slide1}\n\n🎬 SLIDE 2 (Content — 5 sec):\n${rs.slide2}\n\n🎬 SLIDE 3 (CTA — 3 sec):\n${rs.slide3}\n\n🎵 Audio: ${rs.audioSuggestion}\n📸 Background: ${rs.bgQuery}\n\n---`;
}

// ─── Story Script (3-slide) ───

export function generateStoryScript(group: GroupData): { slide1: string; slide2: string; slide3: string } {
  const level = getLevelLabel(group.level);
  const urgency = group.seats_left <= 3
    ? `🔴 آخر ${group.seats_left} مقعد!`
    : group.seats_left <= 6
    ? `⚡ ${group.seats_left} seats left`
    : "✅ Open Registration";
  return {
    slide1: `Want to speak Korean? 🇰🇷\n\n${level}\nStarts ${group.day_name}s at ${group.start_time}\n\n👆 Swipe to see details`,
    slide2: `📚 ${level}\n🗓 Every ${group.day_name} • ${group.start_time}\n⏱ ${group.duration_min} min sessions\n👥 Small group\n${urgency}\n\n✨ Real Korean from week one`,
    slide3: `Ready to start? 🚀\n\n📲 Register now:\nkloversegy.com/enroll\n\n🔗 Link in bio\n\n#Klovers #LearnKorean #KoreanCourse`,
  };
}
