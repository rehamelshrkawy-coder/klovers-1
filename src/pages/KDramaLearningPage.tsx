import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Tv, Brain, BarChart3, Play, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const KDramaLearningPage = () => {
  const { t } = useLanguage();
  useSEO({
    title: "Learn Korean Through K-Dramas | Beginner to Advanced Method",
    description: "Master Korean by watching K-dramas. Learn the best dramas for your level, proven learning methods, and how to progress from A1 to B2 through drama immersion.",
    canonical: "https://kloversegy.com/learn-korean-kdramas"
  });

  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can you really learn Korean from K-dramas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, absolutely. Research shows that drama-based learning improves listening comprehension 40% faster than textbooks alone. You learn natural spoken Korean, cultural context, and emotional connections to words make them stick longer."
          }
        },
        {
          "@type": "Question",
          name: "What's the best drama for beginners?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Squid Game (오징어 게임) or Descendants of the Sun. Both have clear speech, repetitive vocabulary, and engaging storylines. Avoid complex dramas like Mr. Sunshine or Hospital Playlist until you reach B1 level."
          }
        },
        {
          "@type": "Question",
          name: "Should I watch with English or Korean subtitles?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Best method: Watch 1st time with English subtitles (enjoy the story), 2nd time with Korean subtitles (notice words), 3rd time with no subtitles (test listening). Don't jump to Korean subtitles immediately — your brain won't keep up."
          }
        },
        {
          "@type": "Question",
          name: "How much do you learn from one K-drama?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "One full drama series (12-16 episodes): 200-400 new vocabulary words, 30-50 common phrases, natural pronunciation patterns, and cultural context. Combined with active study, one drama can boost you 0.5-1 full level."
          }
        },
        {
          "@type": "Question",
          name: "Best K-dramas for learning specific skills?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For vocabulary: Descendants of the Sun (medical), Itaewon Class (food/business). For listening: Squid Game, Crash Landing on You (clear actors). For grammar: Reply 1988 (slow, conversational). For advanced: Hospital Playlist, Mr. Sunshine."
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

    return () => faqLd?.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-24 pb-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mb-4" variant="outline">{t("kdrama.badge")}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t("kdrama.heroTitle")}
            </h1>
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              {t("kdrama.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <a href="/enroll-now">{t("kdrama.ctaStart")}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/placement-test">{t("kdrama.ctaFindLevel")}</a>
              </Button>
            </div>
            <p className="text-sm text-foreground/70 mt-6">{t("kdrama.ctaFooter")}</p>
          </div>
        </section>

        {/* Why K-Dramas Work */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("kdrama.whyTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Tv className="h-8 w-8 text-pink-500" />,
                  title: t("kdrama.whyCard1Title"),
                  desc: t("kdrama.whyCard1Desc")
                },
                {
                  icon: <Brain className="h-8 w-8 text-purple-500" />,
                  title: t("kdrama.whyCard2Title"),
                  desc: t("kdrama.whyCard2Desc")
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
                  title: t("kdrama.whyCard3Title"),
                  desc: t("kdrama.whyCard3Desc")
                },
                {
                  icon: <Sparkles className="h-8 w-8 text-amber-500" />,
                  title: t("kdrama.whyCard4Title"),
                  desc: t("kdrama.whyCard4Desc")
                },
                {
                  icon: <Play className="h-8 w-8 text-red-500" />,
                  title: t("kdrama.whyCard5Title"),
                  desc: t("kdrama.whyCard5Desc")
                },
                {
                  icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
                  title: t("kdrama.whyCard6Title"),
                  desc: t("kdrama.whyCard6Desc")
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-foreground/70 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Framework */}
        <section className="py-16 border-b bg-slate-50/50 dark:bg-slate-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">{t("kdrama.frameworkTitle")}</h2>
            <p className="text-foreground/70 mb-12">{t("kdrama.frameworkSubtitle")}</p>

            <div className="space-y-6">
              {[
                {
                  num: "1",
                  title: t("kdrama.watch1Title"),
                  time: t("kdrama.watch1Time"),
                  desc: t("kdrama.watch1Desc")
                },
                {
                  num: "2",
                  title: t("kdrama.watch2Title"),
                  time: t("kdrama.watch2Time"),
                  desc: t("kdrama.watch2Desc")
                },
                {
                  num: "3",
                  title: t("kdrama.watch3Title"),
                  time: t("kdrama.watch3Time"),
                  desc: t("kdrama.watch3Desc")
                },
                {
                  num: "4",
                  title: t("kdrama.watch4Title"),
                  time: t("kdrama.watch4Time"),
                  desc: t("kdrama.watch4Desc")
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-500 text-white font-bold flex-shrink-0">
                      {item.num}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm text-pink-600 font-semibold mt-1">{item.time}</p>
                    </div>
                  </div>
                  <p className="text-foreground/70 ml-14">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-lg bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-800">
              <p className="font-bold mb-2">{t("kdrama.expectedResults")}</p>
              <p className="text-foreground/70">{t("kdrama.expectedResultsDesc")}</p>
            </div>
          </div>
        </section>

        {/* Dramas by Level */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">{t("kdrama.levelsTitle")}</h2>
            <p className="text-foreground/70 mb-12">{t("kdrama.levelsSubtitle")}</p>

            {[
              {
                level: t("kdrama.levelA1"),
                dramas: [
                  { name: t("kdrama.levelA1Drama1Name"), why: t("kdrama.levelA1Drama1Why") },
                  { name: t("kdrama.levelA1Drama2Name"), why: t("kdrama.levelA1Drama2Why") }
                ]
              },
              {
                level: t("kdrama.levelA2"),
                dramas: [
                  { name: t("kdrama.levelA2Drama1Name"), why: t("kdrama.levelA2Drama1Why") },
                  { name: t("kdrama.levelA2Drama2Name"), why: t("kdrama.levelA2Drama2Why") }
                ]
              },
              {
                level: t("kdrama.levelB1"),
                dramas: [
                  { name: t("kdrama.levelB1Drama1Name"), why: t("kdrama.levelB1Drama1Why") },
                  { name: t("kdrama.levelB1Drama2Name"), why: t("kdrama.levelB1Drama2Why") }
                ]
              },
              {
                level: t("kdrama.levelB2"),
                dramas: [
                  { name: t("kdrama.levelB2Drama1Name"), why: t("kdrama.levelB2Drama1Why") },
                  { name: t("kdrama.levelB2Drama2Name"), why: t("kdrama.levelB2Drama2Why") }
                ]
              }
            ].map((section, i) => (
              <div key={i} className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-pink-600">{section.level}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {section.dramas.map((drama, j) => (
                    <div key={j} className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="font-bold text-foreground mb-1">{drama.name}</p>
                      <p className="text-sm text-foreground/70">{drama.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Study Habits */}
        <section className="py-16 border-b bg-blue-50/50 dark:bg-blue-950/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("kdrama.habitTitle")}</h2>

            <div className="space-y-4">
              {[
                { day: t("kdrama.habitDay1"), goal: t("kdrama.habitGoal1"), habit: t("kdrama.habitTime1") },
                { day: t("kdrama.habitDay2"), goal: t("kdrama.habitGoal2"), habit: t("kdrama.habitTime2") },
                { day: t("kdrama.habitDay3"), goal: t("kdrama.habitGoal3"), habit: t("kdrama.habitTime3") },
                { day: t("kdrama.habitDay4"), goal: t("kdrama.habitGoal4"), habit: t("kdrama.habitTime4") },
                { day: t("kdrama.habitDay5"), goal: t("kdrama.habitGoal5"), habit: t("kdrama.habitTime5") }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg border bg-white dark:bg-slate-900 flex items-start gap-4">
                  <div className="flex-shrink-0 font-bold text-blue-600 min-w-fit">{item.day}</div>
                  <div className="flex-grow">
                    <p className="font-semibold text-foreground">{item.goal}</p>
                    <p className="text-sm text-foreground/60 mt-1">{item.habit}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-lg bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
              <p className="font-bold mb-2">{t("kdrama.journalTitle")}</p>
              <p className="text-sm text-foreground/70 mb-4">{t("kdrama.journalIntro")}</p>
              <div className="bg-white dark:bg-slate-900 p-4 rounded text-sm font-mono text-foreground/70">
                <p>{t("kdrama.journalPhrase")}</p>
                <p>{t("kdrama.journalContext")}</p>
                <p>{t("kdrama.journalMySentence")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Klovers + Dramas */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">{t("kdrama.combineTitle")}</h2>
            <p className="text-foreground/70 mb-12">{t("kdrama.combineSubtitle")}</p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  col: t("kdrama.combineCol1Title"),
                  items: [t("kdrama.combineCol1Item1"), t("kdrama.combineCol1Item2"), t("kdrama.combineCol1Item3"), t("kdrama.combineCol1Item4"), t("kdrama.combineCol1Item5")]
                },
                {
                  col: t("kdrama.combineCol2Title"),
                  items: [t("kdrama.combineCol2Item1"), t("kdrama.combineCol2Item2"), t("kdrama.combineCol2Item3"), t("kdrama.combineCol2Item4"), t("kdrama.combineCol2Item5")],
                  highlight: true
                },
                {
                  col: t("kdrama.combineCol3Title"),
                  items: [t("kdrama.combineCol3Item1"), t("kdrama.combineCol3Item2"), t("kdrama.combineCol3Item3"), t("kdrama.combineCol3Item4"), t("kdrama.combineCol3Item5")]
                }
              ].map((col, i) => (
                <div key={i} className={`p-6 rounded-lg border ${
                  col.highlight ? "bg-pink-50 dark:bg-pink-950/10 border-pink-200 dark:border-pink-800 shadow-lg scale-105" : "bg-slate-50/50 dark:bg-slate-900/50"
                }`}>
                  <h3 className={`font-bold text-lg mb-4 ${col.highlight ? "text-pink-600" : ""}`}>{col.col}</h3>
                  <ul className="space-y-2">
                    {col.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <span className={`font-bold mt-0.5 ${item.includes("✓") ? "text-green-500" : item.includes("❌") ? "text-red-500" : ""}`}>
                          {item.includes("✓") ? "✓" : item.includes("❌") ? "✗" : "•"}
                        </span>
                        {item.replace(/[✓❌]/g, "")}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-lg bg-purple-50 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-800">
              <p className="font-bold mb-2">{t("kdrama.strategyTitle")}</p>
              <p className="text-foreground/70">{t("kdrama.strategyDesc")}</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">{t("kdrama.faqTitle")}</h2>
            <div className="space-y-6">
              {[
                { q: t("kdrama.faq1Q"), a: t("kdrama.faq1A") },
                { q: t("kdrama.faq2Q"), a: t("kdrama.faq2A") },
                { q: t("kdrama.faq3Q"), a: t("kdrama.faq3A") },
                { q: t("kdrama.faq4Q"), a: t("kdrama.faq4A") },
                { q: t("kdrama.faq5Q"), a: t("kdrama.faq5A") }
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
        <section className="py-20 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("kdrama.finalCtaTitle")}</h2>
            <p className="text-lg mb-8 text-pink-100 max-w-2xl mx-auto">
              {t("kdrama.finalCtaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="/enroll-now" className="flex items-center gap-2">
                  {t("kdrama.finalCtaJoin")} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-white hover:bg-white/10" asChild>
                <a href="/placement-test">{t("kdrama.finalCtaLevel")}</a>
              </Button>
            </div>
            <p className="text-sm text-pink-100 mt-6">
              <Tv className="h-4 w-4 inline mr-2" />
              {t("kdrama.finalCtaFooter")}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KDramaLearningPage;
