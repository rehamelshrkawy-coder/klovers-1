import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BookOpen, Zap, Users, Target, TrendingUp, ArrowRight, Clock, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TopikExamPage = () => {
  const { t } = useLanguage();
  useSEO({
    title: "TOPIK Exam Preparation 2026 | Complete Study Guide & Practice Tests",
    description: "Master the TOPIK Korean proficiency exam with our complete 2026 guide. Learn test format, scoring, registration deadlines, and proven strategies to reach your target TOPIK level (1-6).",
    canonical: "https://kloversegy.com/topik-exam-preparation"
  });

  useEffect(() => {
    // JSON-LD: FAQPage for TOPIK
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the TOPIK exam?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK (Test of Proficiency in Korean) is the official Korean language proficiency test administered by the Korea Institute of International Education Cooperation (KIIEC). It has 6 levels from beginner (1) to advanced (6) and is recognized worldwide for college admissions, job applications, and visa requirements."
          }
        },
        {
          "@type": "Question",
          name: "How many TOPIK levels are there?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK has 6 levels: Level 1-2 (Beginner A1-A2), Level 3-4 (Intermediate B1-B2), Level 5-6 (Advanced C1-C2). Most people aim for Level 4 (upper intermediate) for job/university requirements."
          }
        },
        {
          "@type": "Question",
          name: "When is the TOPIK exam in 2026?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK is offered twice yearly: Spring (April) and Fall (October). Registration opens 5-6 weeks before the exam date. Check the official TOPIK website for exact dates and registration deadlines in your country."
          }
        },
        {
          "@type": "Question",
          name: "How long should I study for TOPIK Level 4?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For English speakers: 6-12 months of consistent study. For Arabic speakers using Klovers: 4-8 months due to grammar similarities with Arabic. The key is daily practice (1-2 hours) and focused listening/reading practice."
          }
        },
        {
          "@type": "Question",
          name: "What's the passing score for TOPIK?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TOPIK I (Levels 1-2) requires 0-200 points. TOPIK II (Levels 3-6) requires 0-300 points. Level cutoffs: Level 3=120 pts, Level 4=150 pts, Level 5=190 pts, Level 6=230 pts. Most employers require Level 4 minimum."
          }
        }
      ]
    };

    let faqLd = document.getElementById("faq-jsonld");
    if (!faqLd) {
      faqLd = document.createElement("script");
      faqLd.id = "faq-jsonld";
      faqLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(faqLd);
    }
    faqLd.textContent = JSON.stringify(faqSchema);

    // JSON-LD: Guide schema
    const guideSchema = {
      "@context": "https://schema.org",
      "@type": "Guide",
      headline: "TOPIK Exam Preparation 2026: Complete Study Guide",
      description: "Ultimate guide to preparing for the Korean TOPIK exam with study timeline, practice tests, and exam strategies",
      author: { "@type": "Organization", name: "Klovers" },
      datePublished: "2026-04-08"
    };

    let guideLd = document.getElementById("guide-jsonld");
    if (!guideLd) {
      guideLd = document.createElement("script");
      guideLd.id = "guide-jsonld";
      guideLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(guideLd);
    }
    guideLd.textContent = JSON.stringify(guideSchema);

    return () => {
      faqLd?.remove();
      guideLd?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mb-4" variant="outline">{t("topikExam.badge")}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t("topikExam.heroTitle")}
            </h1>
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              {t("topikExam.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <a href="/placement-test">{t("topikExam.ctaTest")}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/enroll-now">{t("topikExam.ctaCourse")}</a>
              </Button>
            </div>
          </div>
        </section>

        {/* TOPIK Levels Overview */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("topikExam.levelsTitle")}</h2>
            <div className="space-y-4">
              {[
                { level: t("topikExam.level1"), range: t("topikExam.level1Range"), desc: t("topikExam.level1Desc") },
                { level: t("topikExam.level2"), range: t("topikExam.level2Range"), desc: t("topikExam.level2Desc") },
                { level: t("topikExam.level3"), range: t("topikExam.level3Range"), desc: t("topikExam.level3Desc") },
                { level: t("topikExam.level4"), range: t("topikExam.level4Range"), desc: t("topikExam.level4Desc"), highlight: true },
                { level: t("topikExam.level5"), range: t("topikExam.level5Range"), desc: t("topikExam.level5Desc") },
                { level: t("topikExam.level6"), range: t("topikExam.level6Range"), desc: t("topikExam.level6Desc") }
              ].map((item, i) => (
                <div key={i} className={`p-6 rounded-lg border transition-colors ${
                  item.highlight ? "bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-800" : "bg-slate-50/50 dark:bg-slate-900/50"
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{item.level}</h3>
                    <Badge variant={item.highlight ? "default" : "secondary"}>{item.range}</Badge>
                  </div>
                  <p className="text-foreground/70">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 rounded-lg bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800">
              <p className="text-sm"><strong>{t("topikExam.mostPopular")}</strong> {t("topikExam.mostPopularDesc")}</p>
            </div>
          </div>
        </section>

        {/* 2026 TOPIK Schedule */}
        <section className="py-16 border-b bg-slate-50/50 dark:bg-slate-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("topikExam.datesTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  season: t("topikExam.springTitle"),
                  date: t("topikExam.springDate"),
                  registration: t("topikExam.springReg"),
                  location: t("topikExam.regWebsite")
                },
                {
                  season: t("topikExam.fallTitle"),
                  date: t("topikExam.fallDate"),
                  registration: t("topikExam.fallReg"),
                  location: t("topikExam.regWebsite")
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <h3 className="font-bold text-lg mb-4">{item.season}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground/60">{t("topikExam.examDateLabel")}</p>
                      <p className="text-lg font-bold">{item.date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/60">{t("topikExam.regPeriodLabel")}</p>
                      <p className="text-lg">{item.registration}</p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-foreground/70">{item.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 rounded-lg bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
              <p className="text-sm"><strong>{t("topikExam.importantNote")}</strong> {t("topikExam.importantDesc")}</p>
            </div>
          </div>
        </section>

        {/* Study Timeline */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">{t("topikExam.timelineTitle")}</h2>
            <p className="text-foreground/70 mb-12">{t("topikExam.timelineSubtitle")}</p>

            <div className="space-y-6">
              {[
                {
                  week: t("topikExam.weeks12"),
                  focus: t("topikExam.focus12"),
                  tasks: [t("topikExam.task121"), t("topikExam.task122"), t("topikExam.task123")]
                },
                {
                  week: t("topikExam.weeks34"),
                  focus: t("topikExam.focus34"),
                  tasks: [t("topikExam.task341"), t("topikExam.task342"), t("topikExam.task343")]
                },
                {
                  week: t("topikExam.weeks56"),
                  focus: t("topikExam.focus56"),
                  tasks: [t("topikExam.task561"), t("topikExam.task562"), t("topikExam.task563")]
                },
                {
                  week: t("topikExam.weeks78"),
                  focus: t("topikExam.focus78"),
                  tasks: [t("topikExam.task781"), t("topikExam.task782"), t("topikExam.task783")]
                },
                {
                  week: t("topikExam.weeks912"),
                  focus: t("topikExam.focus912"),
                  tasks: [t("topikExam.task9121"), t("topikExam.task9122"), t("topikExam.task9123")]
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500 text-white font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{item.week}</p>
                      <p className="text-sm font-semibold text-green-600">{item.focus}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {item.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-foreground/70">
                        <CheckCircle2 className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TOPIK Exam Day Tips */}
        <section className="py-16 border-b bg-blue-50/50 dark:bg-blue-950/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("topikExam.examDayTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Clock className="h-8 w-8 text-blue-500" />,
                  title: t("topikExam.tipTimeTitle"),
                  tips: [t("topikExam.tipTime1"), t("topikExam.tipTime2"), t("topikExam.tipTime3")]
                },
                {
                  icon: <Target className="h-8 w-8 text-amber-500" />,
                  title: t("topikExam.tipStrategyTitle"),
                  tips: [t("topikExam.tipStrategy1"), t("topikExam.tipStrategy2"), t("topikExam.tipStrategy3")]
                },
                {
                  icon: <TrendingUp className="h-8 w-8 text-green-500" />,
                  title: t("topikExam.tipScoringTitle"),
                  tips: [t("topikExam.tipScoring1"), t("topikExam.tipScoring2"), t("topikExam.tipScoring3")]
                },
                {
                  icon: <Zap className="h-8 w-8 text-purple-500" />,
                  title: t("topikExam.tipMentalTitle"),
                  tips: [t("topikExam.tipMental1"), t("topikExam.tipMental2"), t("topikExam.tipMental3")]
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-bold text-lg mb-4">{item.title}</h3>
                  <ul className="space-y-2">
                    {item.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2 text-foreground/70">
                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Klovers for TOPIK Prep */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("topikExam.whyKloversTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: t("topikExam.whyKlovers1Title"), desc: t("topikExam.whyKlovers1Desc") },
                { title: t("topikExam.whyKlovers2Title"), desc: t("topikExam.whyKlovers2Desc") },
                { title: t("topikExam.whyKlovers3Title"), desc: t("topikExam.whyKlovers3Desc") },
                { title: t("topikExam.whyKlovers4Title"), desc: t("topikExam.whyKlovers4Desc") },
                { title: t("topikExam.whyKlovers5Title"), desc: t("topikExam.whyKlovers5Desc") },
                { title: t("topikExam.whyKlovers6Title"), desc: t("topikExam.whyKlovers6Desc") }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-start gap-3 mb-4">
                    <Award className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <h3 className="font-bold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-foreground/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("topikExam.faqTitle")}</h2>
            <div className="space-y-6">
              {[
                { q: t("topikExam.faq1Q"), a: t("topikExam.faq1A") },
                { q: t("topikExam.faq2Q"), a: t("topikExam.faq2A") },
                { q: t("topikExam.faq3Q"), a: t("topikExam.faq3A") },
                { q: t("topikExam.faq4Q"), a: t("topikExam.faq4A") },
                { q: t("topikExam.faq5Q"), a: t("topikExam.faq5A") }
              ].map((item, i) => (
                <details key={i} className="group p-6 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                  <summary className="font-bold text-lg flex items-center justify-between">
                    {item.q}
                    <span className="transition group-open:rotate-180">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </summary>
                  <p className="text-foreground/70 mt-4 pt-4 border-t">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("topikExam.finalCtaTitle")}</h2>
            <p className="text-lg mb-8 text-green-100 max-w-2xl mx-auto">
              {t("topikExam.finalCtaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="/enroll-now" className="flex items-center gap-2">
                  {t("topikExam.finalCtaStart")} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-white hover:bg-white/10" asChild>
                <a href="/placement-test">{t("topikExam.finalCtaTest")}</a>
              </Button>
            </div>
            <p className="text-sm text-green-100 mt-6">
              <BookOpen className="h-4 w-4 inline mr-2" />
              {t("topikExam.finalCtaFooter")}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TopikExamPage;
