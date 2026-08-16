import { useState } from "react";
import { Star, Facebook, CheckCircle2, Pause, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AVERAGE_RATING } from "@/lib/siteConfig";

const reviews = [
  {
    name: "Nada Tamer",
    flag: "🇪🇬",
    lang: "en",
    text: "Very professional and fun at the same time! Makes learning very easy and enjoyable. I highly recommend it to anyone ❤️",
    date: "Dec 2021",
    duration: "3 months",
    level: "A1 → A2",
  },
  {
    name: "Ayaya Salah",
    flag: "🇪🇬",
    lang: "en",
    text: "The course is absolutely entertaining. I enjoy every second of it — educational, not boring and I can already see progress. Highly recommend it!",
    date: "Dec 2021",
    duration: "4 months",
    level: "A1 → A2",
  },
  {
    name: "Maged M. Aziz",
    flag: "🇪🇬",
    lang: "en",
    text: "Very effective. Reham is soo awesome and I learnt a lot from her. I give her 10/10. Thank you for making things easier! 👊👊",
    date: "Jul 2023",
    duration: "6 months",
    level: "A1 → B1",
  },
  {
    name: "Nami Waka",
    flag: "🌍",
    lang: "en",
    text: "Reham is a wonderful teacher. She has a really nice smile. I'm looking forward to having her teach me Korean from now on.",
    date: "Jul 2024",
    duration: "2 months",
    level: "Beginner",
  },
  {
    name: "Kholoud Al-Bahay",
    flag: "🇸🇦",
    lang: "en",
    text: "One of the best courses I've ever enrolled in ❤️❤️❤️ How much I love how she strives and cares for us and our learning process. Highly recommend!",
    date: "Aug 2022",
    duration: "4 months",
    level: "A1 → A2",
  },
  {
    name: "Jomana Azouz",
    flag: "🇪🇬",
    lang: "en",
    text: "She is amazing and really a good teacher. She simplifies everything to make it understandable, and doing the homework you will notice the development in your accent!",
    date: "Jul 2023",
    duration: "5 months",
    level: "A1 → B1",
  },
  {
    name: "حياة مصطفى",
    flag: "🇪🇬",
    lang: "ar",
    text: "ميرسي جداً على تعليمنا اللغة الكورية 😍 متشكرة جداً على المستويات اللي وصلنالها من الصفر — تعليم الحروف والكتابة والقراءة والكلام. الكلام ده مايوصفش جهدك وصبرك 선생님 감사합니다",
    date: "Jul 2023",
    duration: "٦ أشهر",
    level: "A1 ← B1",
  },
  {
    name: "يمنى دراهم",
    flag: "🇪🇬",
    lang: "ar",
    text: "من الكورسات اللذيذة والممتعة جداً! طريقتها حلوة جداً وبتوضح الحاجة بصورة بسيطة وسهلة، دا غير شخصيتها العسولة وأنها هتساعدك في أي وقت 💕💕💕",
    date: "Jul 2023",
    duration: "٤ أشهر",
    level: "A1 ← A2",
  },
  {
    name: "سامة آدم",
    flag: "🇪🇬",
    lang: "ar",
    text: "بجد أحلى سونتسينيم في الدنيا 😍 الكورس خفيف وبستمتع بيه جداً. قربت أكمل سنة وبجد اتحسنت كتير في الكوري والجرامر بتسهله جداً علينا ❤️❤️❤️",
    date: "Nov 2022",
    duration: "١١ شهر",
    level: "A1 ← B2",
  },
  {
    name: "مريم ميرا",
    flag: "🇪🇬",
    lang: "ar",
    text: "بجد يستفاد كتير في الكورس ده ويتعلم أكتر. ممكن اني أكتب جملة كاملة بالكوري رغم اني مكنتش أعرف أقرأ أو أكتب كوري من قبل! 선생님 감사합니다 ❤️",
    date: "Nov 2022",
    duration: "٣ أشهر",
    level: "A0 ← A1",
  },
  {
    name: "بوسي محمد",
    flag: "🇪🇬",
    lang: "ar",
    text: "تعلمت الحروف والأرقام وأبدأت أحس بالفرق! بالصدفة شوفت البوست وكنت فخورة جداً. أجرب وحقيقي انا من أوائل المحاضرين حسيت بفرق جامد ❤️❤️",
    date: "Nov 2022",
    duration: "٢ شهر",
    level: "مبتدئ",
  },
  {
    name: "نهال أشرف",
    flag: "🇪🇬",
    lang: "ar",
    text: "استفدت حلو أوي وبجد المستوى هايل ❤️",
    date: "Nov 2022",
    duration: "٣ أشهر",
    level: "A1 ← A2",
  },
];

// Split into two rows for opposite-direction scroll
const row1 = reviews.slice(0, 6);
const row2 = reviews.slice(6);

// Brand gold rather than yellow-400 (#FACC15), which is 1.53:1 on white — the
// stars were all but invisible, and a rating is meaningful content, not decor.
const StarRow = () => (
  <div className="flex gap-0.5" role="img" aria-label="Rated 5 out of 5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="h-3.5 w-3.5 fill-primary-text text-primary-text" aria-hidden="true" />
    ))}
  </div>
);

const ReviewCard = ({ review }: { review: (typeof reviews)[0] }) => {
  const initials = review.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex-shrink-0 w-72 bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
      dir={review.lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary-text font-bold text-sm flex-shrink-0 border border-black/10">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground truncate">{review.name}</span>
              <span className="text-base leading-none">{review.flag}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow />
              <span className="text-xs text-muted-foreground">{review.date}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="text-[10px] text-green-600 font-semibold">Verified Student</span>
              {review.duration && (
                <span className="text-[10px] text-muted-foreground">· {review.duration} · {review.level}</span>
              )}
            </div>
          </div>
        </div>
        <Facebook className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{review.text}</p>
    </div>
  );
};

const ScrollRow = ({
  items,
  direction,
  paused,
}: {
  items: (typeof reviews)[0][];
  direction: "left" | "right";
  paused: boolean;
}) => {
  // The duplicate half is the seam of the infinite loop. It carries the same
  // text as the first half, so it is hidden from assistive tech and taken out
  // of the tab order — otherwise every review is announced twice and keyboard
  // users have to tab through twelve unreachable, permanently-moving cards.
  return (
    // Hovering or focusing anywhere in the row also pauses it: a moving target
    // is hard to read and hard to click.
    <div className="overflow-hidden relative group/marquee">
      {/* fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

      <div
        className={`flex gap-4 w-max group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] ${
          direction === "left" ? "animate-scroll-left" : "animate-scroll-right"
        } ${paused ? "marquee-paused" : ""}`}
      >
        {items.map((r, i) => (
          <ReviewCard key={`a-${i}`} review={r} />
        ))}
        {/* `contents` keeps the layout byte-identical to a flat list while
            letting the duplicate half be hidden from assistive tech. */}
        <div className="contents" aria-hidden="true">
          {items.map((r, i) => (
            <ReviewCard key={`b-${i}`} review={r} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  // Two counter-scrolling infinite rows with no way to stop them is a WCAG
  // 2.2.2 Level A failure. Starts paused when the OS asks for reduced motion.
  const [paused, setPaused] = useState(
    () => typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 mb-10 text-center">
        {/* Badge */}
        <a
          href="https://www.facebook.com/kloversegy/reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-1.5 mb-5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Facebook className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {t("testimonialsSection.badge")}
          </span>
        </a>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
          {t("testimonialsSection.title")}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          {t("testimonialsSection.subtitle")}
        </p>

        {/* Star summary */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary-text text-primary-text" aria-hidden="true" />
            ))}
          </div>
          <span className="text-lg font-bold text-foreground">{AVERAGE_RATING.toFixed(1)}</span>
          <span className="text-muted-foreground text-sm">{t("testimonialsSection.ratingSuffix")}</span>
        </div>
      </div>

      {/* Scrolling rows */}
      <div className="space-y-4">
        <ScrollRow items={row1} direction="left" paused={paused} />
        <ScrollRow items={row2} direction="right" paused={paused} />
      </div>

      {/* Pause control (WCAG 2.2.2). Keyboard-reachable, and it says which
          state the next press produces. */}
      <div className="container mx-auto px-4 mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors min-h-[44px]"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          {paused
            ? (isAr ? "تشغيل التمرير" : "Resume scrolling")
            : (isAr ? "إيقاف التمرير" : "Pause scrolling")}
        </button>
      </div>
    </section>
  );
};

export default TestimonialsSection;
