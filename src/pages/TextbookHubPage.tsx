import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Sun, Sparkles, Clapperboard, Brain, ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const BOOKS = [
  {
    key: "korean-1",
    titleEn: "Korean Textbook",
    titleAr: "كتاب الكورية",
    subtitleEn: "TOPIK 1 & 2 · 75+ Lessons",
    subtitleAr: "توبيك ١ و ٢ · ٧٥+ درس",
    descEn: "Master Korean from Hangul to advanced grammar through worlds and missions.",
    descAr: "أتقن الكورية من الهانغول إلى القواعد المتقدمة عبر العوالم والمهام.",
    emoji: "📘",
    icon: BookOpen,
    gradient: "from-amber-100 to-yellow-50",
    border: "border-amber-200 hover:border-amber-400 ring-1 ring-black/10",
    iconColor: "text-amber-600",
    subtitleColor: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-800 border border-black/10",
  },
  {
    key: "daily-routine",
    titleEn: "Daily Routine Korean",
    titleAr: "كورية الروتين اليومي",
    subtitleEn: "32 Daily Life Categories",
    subtitleAr: "٣٢ فئة حياتية يومية",
    descEn: "Learn Korean through everyday actions — sleeping, cooking, cleaning & more.",
    descAr: "تعلم الكورية من خلال الأفعال اليومية — النوم، الطبخ، التنظيف والمزيد.",
    emoji: "☀️",
    icon: Sun,
    gradient: "from-orange-100 to-amber-50",
    border: "border-orange-200 hover:border-orange-400 ring-1 ring-black/10",
    iconColor: "text-orange-500",
    subtitleColor: "text-orange-700",
    badgeBg: "bg-orange-100 text-orange-800 border border-black/10",
  },
  {
    key: "kdrama",
    titleEn: "K-Drama Korean",
    titleAr: "كورية الدراما",
    subtitleEn: "30 Drama-Based Lessons",
    subtitleAr: "٣٠ درس من الدراما الكورية",
    descEn: "Learn Korean through iconic K-Drama dialogues, slang, and cultural context.",
    descAr: "تعلم الكورية من خلال حوارات الدراما الأيقونية والعامية والسياق الثقافي.",
    emoji: "🎬",
    icon: Clapperboard,
    gradient: "from-rose-100 to-pink-50",
    border: "border-rose-200 hover:border-rose-400 ring-1 ring-black/10",
    iconColor: "text-rose-500",
    subtitleColor: "text-rose-700",
    badgeBg: "bg-rose-100 text-rose-800 border border-black/10",
  },
  {
    key: "grammar-mastery",
    titleEn: "Grammar Mastery",
    titleAr: "إتقان القواعد",
    subtitleEn: "57 Pattern-Focused Lessons · All 6 Levels",
    subtitleAr: "٥٧ درسًا على الأنماط · جميع المستويات الست",
    descEn: "Deep-dive every Korean grammar pattern from basic particles to classical literary style.",
    descAr: "ادرس كل نمط قواعدي كوري بعمق — من الجسيمات الأساسية إلى الأسلوب الأدبي الكلاسيكي.",
    emoji: "🧠",
    icon: Brain,
    gradient: "from-violet-100 to-purple-50",
    border: "border-violet-200 hover:border-violet-400 ring-1 ring-black/10",
    iconColor: "text-violet-500",
    subtitleColor: "text-violet-700",
    badgeBg: "bg-violet-100 text-violet-800 border border-black/10",
    badge: "NEW",
  },
  {
    key: "picture-vocab",
    titleEn: "Picture Vocabulary",
    titleAr: "مفردات الصور",
    subtitleEn: "15 Visual Scene Lessons",
    subtitleAr: "١٥ درساً بالصور",
    descEn: "Learn Korean vocabulary through beautiful illustrated scenes — bedroom, café, park and more.",
    descAr: "تعلم مفردات الكورية من خلال مشاهد مصوّرة جميلة — غرفة النوم، الكافيه، الحديقة والمزيد.",
    emoji: "🖼️",
    icon: ImageIcon,
    gradient: "from-green-100 to-green-50",
    border: "border-green-200 hover:border-green-400 ring-1 ring-black/10",
    iconColor: "text-green-500",
    subtitleColor: "text-green-700",
    badgeBg: "bg-green-100 text-green-800 border border-black/10",
    badge: "NEW",
  },
];

const TextbookHubPage = () => {
  useSEO({ title: "Korean Textbooks", description: "Learn Korean with Klovers interactive digital textbooks. Vocabulary flashcards, grammar, dialogues, exercises and reading passages.", canonical: "https://kloversegy.com/textbook" });
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        <section className="text-center mb-12 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-6 border border-black/10 dark:bg-amber-900/40 dark:text-amber-400">
            <Sparkles className="h-4 w-4" />
            {isAr ? "مكتبة الكتب" : "Book Library"}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isAr ? "اختر كتابك" : "Choose Your Book"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {isAr
              ? "اختر كتاباً تعليمياً وابدأ رحلتك في تعلم الكورية"
              : "Pick a learning book and start your Korean journey"}
          </p>
        </section>

        <section className="container mx-auto px-4 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {BOOKS.map((book) => {
              const Icon = book.icon;
              const hasBadge = "badge" in book && book.badge;
              return (
                <Link
                  key={book.key}
                  to={`/textbook/${book.key}`}
                  className={cn(
                    "group relative block rounded-2xl border-2 p-6 transition-all hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br",
                    book.gradient,
                    book.border
                  )}
                >
                  {hasBadge && (
                    <span className="absolute top-3 end-3 text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white">
                      {(book as { badge?: string }).badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl">{book.emoji}</span>
                    <Icon className={cn("h-6 w-6 opacity-50", book.iconColor)} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {isAr ? book.titleAr : book.titleEn}
                  </h2>
                  <p className={cn("text-sm font-medium mb-2", book.subtitleColor)}>
                    {isAr ? book.subtitleAr : book.subtitleEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? book.descAr : book.descEn}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TextbookHubPage;
