// Korean Learning Worlds - Duolingo-style progression structure
// TOPIK 1 (Worlds 1-7, Lessons 1-75) + TOPIK 2 (Worlds 8-13, Lessons 76-120)
export interface World {
  id: number;
  key: string;
  name: string;
  nameAr: string;
  emoji: string;
  icon: string;
  description: string;
  descriptionAr: string;
  color: string;
  lessonRange: [number, number]; // [startSortOrder, endSortOrder]
  topikLevel: 1 | 2 | 3 | 4 | 5 | 6;
}

export const WORLDS: World[] = [
  // ===== TOPIK 1 (Beginner) =====
  {
    id: 1,
    key: "hangul_village",
    name: "Hangul Village",
    nameAr: "قرية الهانغول",
    emoji: "🏡",
    icon: "ㄱ",
    description: "Master the Korean alphabet and basic sounds",
    descriptionAr: "أتقن الأبجدية الكورية والأصوات الأساسية",
    color: "#CFF7D3",
    lessonRange: [1, 10],
    topikLevel: 1,
  },
  {
    id: 2,
    key: "survival_streets",
    name: "Survival Streets",
    nameAr: "شوارع البقاء",
    emoji: "🏪",
    icon: "🛒",
    description: "Essential phrases for everyday survival",
    descriptionAr: "عبارات أساسية للحياة اليومية",
    color: "#D6E8FF",
    lessonRange: [11, 20],
    topikLevel: 1,
  },
  {
    id: 3,
    key: "daily_life_district",
    name: "Daily Life District",
    nameAr: "حي الحياة اليومية",
    emoji: "🏙️",
    icon: "☀️",
    description: "Talk about your daily routines and activities",
    descriptionAr: "تحدث عن روتينك اليومي وأنشطتك",
    color: "#E8D9FF",
    lessonRange: [21, 30],
    topikLevel: 1,
  },
  {
    id: 4,
    key: "conversation_city",
    name: "Conversation City",
    nameAr: "مدينة المحادثة",
    emoji: "💬",
    icon: "🗣️",
    description: "Build real conversation skills",
    descriptionAr: "بناء مهارات المحادثة الحقيقية",
    color: "#FFE5CC",
    lessonRange: [31, 38],
    topikLevel: 1,
  },
  {
    id: 5,
    key: "grammar_mountains",
    name: "Grammar Mountains",
    nameAr: "جبال القواعد",
    emoji: "⛰️",
    icon: "✍️",
    description: "Conquer essential Korean grammar patterns",
    descriptionAr: "أتقن أنماط القواعد الكورية الأساسية",
    color: "#FFD9E6",
    lessonRange: [39, 45],
    topikLevel: 1,
  },
  {
    id: 6,
    key: "seoul_downtown",
    name: "Seoul Downtown",
    nameAr: "وسط سيول",
    emoji: "🗼",
    icon: "✈️",
    description: "Travel and real-life situation Korean",
    descriptionAr: "الكورية للسفر والمواقف الحقيقية",
    color: "#FFE5CC",
    lessonRange: [46, 60],
    topikLevel: 1,
  },
  {
    id: 7,
    key: "topik_arena",
    name: "TOPIK 1 Arena",
    nameAr: "حلبة التوبيك 1",
    emoji: "🏆",
    icon: "🎓",
    description: "Prepare for the TOPIK 1 exam with mock tests",
    descriptionAr: "استعد لامتحان التوبيك 1 مع اختبارات تجريبية",
    color: "#FFD9E6",
    lessonRange: [61, 75],
    topikLevel: 1,
  },

  // ===== TOPIK 2 (Intermediate-Advanced) =====
  {
    id: 8,
    key: "intermediate_gateway",
    name: "Intermediate Gateway",
    nameAr: "بوابة المتوسط",
    emoji: "🌉",
    icon: "📘",
    description: "Bridge to intermediate Korean — complex sentences & connectors",
    descriptionAr: "جسر إلى الكورية المتوسطة — جمل معقدة وروابط",
    color: "#D7F7F7",
    lessonRange: [76, 83],
    topikLevel: 2,
  },
  {
    id: 9,
    key: "culture_quarter",
    name: "Culture Quarter",
    nameAr: "حي الثقافة",
    emoji: "🎭",
    icon: "🏛️",
    description: "Korean culture, opinions & formal writing",
    descriptionAr: "الثقافة الكورية والآراء والكتابة الرسمية",
    color: "#EFE6FF",
    lessonRange: [84, 91],
    topikLevel: 2,
  },
  {
    id: 10,
    key: "news_tower",
    name: "News Tower",
    nameAr: "برج الأخبار",
    emoji: "📰",
    icon: "📺",
    description: "Read news articles, formal Korean & passive voice",
    descriptionAr: "قراءة المقالات الإخبارية والكورية الرسمية",
    color: "#D6E8FF",
    lessonRange: [92, 99],
    topikLevel: 2,
  },
  {
    id: 11,
    key: "essay_workshop",
    name: "Essay Workshop",
    nameAr: "ورشة الكتابة",
    emoji: "✍️",
    icon: "📝",
    description: "TOPIK 2 writing practice — essays, summaries & opinion pieces",
    descriptionAr: "تمارين كتابة التوبيك 2 — مقالات وملخصات وآراء",
    color: "#FFE5CC",
    lessonRange: [100, 107],
    topikLevel: 2,
  },
  {
    id: 12,
    key: "advanced_grammar_peak",
    name: "Advanced Grammar Peak",
    nameAr: "قمة القواعد المتقدمة",
    emoji: "🏔️",
    icon: "🧠",
    description: "Master advanced grammar patterns & nuanced expressions",
    descriptionAr: "أتقن أنماط القواعد المتقدمة والتعبيرات الدقيقة",
    color: "#FFD9E6",
    lessonRange: [108, 115],
    topikLevel: 2,
  },
  {
    id: 13,
    key: "topik2_arena",
    name: "TOPIK 2 Arena",
    nameAr: "حلبة التوبيك 2",
    emoji: "👑",
    icon: "🏅",
    description: "Full TOPIK 2 exam practice — reading, listening & writing",
    descriptionAr: "تمرين كامل لامتحان التوبيك 2 — قراءة واستماع وكتابة",
    color: "#DFFFE6",
    lessonRange: [116, 120],
    topikLevel: 2,
  },

  // ===== TOPIK 3 / B1 — Intermediate-High =====
  {
    id: 14,
    key: "real_life_stage",
    name: "Real Life Stage",
    nameAr: "مسرح الحياة الواقعية",
    emoji: "🎭",
    icon: "🌍",
    description: "Handle complex real-life topics, debates & formal registers (TOPIK 3/B1)",
    descriptionAr: "التعامل مع مواضيع الحياة المعقدة والنقاشات والأساليب الرسمية (TOPIK 3/B1)",
    color: "#D7F7F7",
    lessonRange: [121, 140],
    topikLevel: 3,
  },

  // ===== TOPIK 4 / B2 — Upper-Intermediate =====
  {
    id: 15,
    key: "professional_plaza",
    name: "Professional Plaza",
    nameAr: "ساحة المحترفين",
    emoji: "💼",
    icon: "🏢",
    description: "Business Korean, presentations, negotiations & professional writing (TOPIK 4/B2)",
    descriptionAr: "الكورية في الأعمال والعروض والتفاوض والكتابة المهنية (TOPIK 4/B2)",
    color: "#D6E8FF",
    lessonRange: [141, 158],
    topikLevel: 4,
  },

  // ===== TOPIK 5 / C1 — Advanced =====
  {
    id: 16,
    key: "academic_heights",
    name: "Academic Heights",
    nameAr: "قمم الأكاديميا",
    emoji: "🎓",
    icon: "📚",
    description: "Academic discourse, literary analysis & advanced nuance (TOPIK 5/C1)",
    descriptionAr: "الخطاب الأكاديمي والتحليل الأدبي والدقة المتقدمة (TOPIK 5/C1)",
    color: "#EFE6FF",
    lessonRange: [159, 172],
    topikLevel: 5,
  },

  // ===== TOPIK 6 / C2 — Near-Native Mastery =====
  {
    id: 17,
    key: "master_hall",
    name: "Master Hall",
    nameAr: "قاعة الأساتذة",
    emoji: "🌟",
    icon: "🏆",
    description: "Near-native mastery — idioms, classical styles & professional broadcasting (TOPIK 6/C2)",
    descriptionAr: "إتقان شبه أصلي — اصطلاحات وأساليب كلاسيكية وبث مهني (TOPIK 6/C2)",
    color: "#DFFFE6",
    lessonRange: [173, 180],
    topikLevel: 6,
  },
];

export function getWorldForLesson(sortOrder: number): World {
  for (const world of WORLDS) {
    if (sortOrder >= world.lessonRange[0] && sortOrder <= world.lessonRange[1]) {
      return world;
    }
  }
  return WORLDS[0];
}

export function getWorldProgress(
  world: World,
  lessonProgress: Record<number, { chapter_completed: boolean }>,
  lessons: { id: number; sort_order: number }[]
): { completed: number; total: number; percent: number } {
  const worldLessons = lessons.filter(
    (l) => l.sort_order >= world.lessonRange[0] && l.sort_order <= world.lessonRange[1]
  );
  const completed = worldLessons.filter((l) => lessonProgress[l.id]?.chapter_completed).length;
  const total = worldLessons.length;
  return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
}
