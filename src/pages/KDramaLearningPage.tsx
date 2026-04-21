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
            <h2 className="text-3xl font-bold mb-12 text-center">Why K-Dramas Are the Best Learning Tool</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Tv className="h-8 w-8 text-pink-500" />,
                  title: "Natural Spoken Korean",
                  desc: "Real conversations, not textbook sentences. You learn how Koreans actually talk — slang, casual forms, emotional expressions."
                },
                {
                  icon: <Brain className="h-8 w-8 text-purple-500" />,
                  title: "Emotional Memory Encoding",
                  desc: "When you're emotionally invested in a scene, your brain tags the words as 'important' and stores them longer."
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
                  title: "Repetition Without Boredom",
                  desc: "Dramas repeat phrases naturally. You hear 'I love you' 50 times across episodes without feeling like you're studying."
                },
                {
                  icon: <Sparkles className="h-8 w-8 text-amber-500" />,
                  title: "Cultural Context",
                  desc: "Learn more than words — understand Korean culture, manners, social hierarchies, and why Koreans communicate the way they do."
                },
                {
                  icon: <Play className="h-8 w-8 text-red-500" />,
                  title: "Motivation Stays High",
                  desc: "You WANT to understand because you're invested in the story. No cramming, no forcing yourself — you want more."
                },
                {
                  icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
                  title: "Passively Builds Skills",
                  desc: "You improve listening, pronunciation patterns, rhythm, and intonation just by watching. Your ear trains automatically."
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
            <h2 className="text-3xl font-bold mb-4">The 4-Watch Method (Most Effective)</h2>
            <p className="text-foreground/70 mb-12">This proven method accelerates learning dramatically. Follow it for any K-drama.</p>

            <div className="space-y-6">
              {[
                {
                  num: "1",
                  title: "Watch 1: English Subtitles — Enjoy the Story",
                  time: "1 hour per episode",
                  desc: "Just relax and watch. Your job is to enjoy the plot, not study. Get invested in the characters and story. This builds motivation for later watches."
                },
                {
                  num: "2",
                  title: "Watch 2: Korean Subtitles — Notice the Words",
                  time: "1.5 hours per episode",
                  desc: "Slower pace. Notice words you recognize. When you see a word in Korean text that matches the audio, your brain notes the connection. Don't pause — let it flow."
                },
                {
                  num: "3",
                  title: "Watch 3: No Subtitles — Test Your Listening",
                  time: "1 hour per episode",
                  desc: "Now your listening is tested. You'll catch maybe 30-50% at A1, 60-70% at B1. This struggle is good — it's the brain working hard to process."
                },
                {
                  num: "4",
                  title: "Scene-Based Deep Dive — Master 1 Scene",
                  time: "30 minutes",
                  desc: "Pick ONE emotional 3-minute scene. Pause, repeat, write what you heard, repeat, listen again. By day 3, you'll have memorized the scene."
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
              <p className="font-bold mb-2">✓ Expected Results:</p>
              <p className="text-foreground/70">After 1 full drama (12 episodes × 4 watches): 300+ vocabulary, 40+ phrases memorized, 1-2 TOPIK level improvement if combined with active study.</p>
            </div>
          </div>
        </section>

        {/* Dramas by Level */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">Recommended Dramas by Korean Level</h2>
            <p className="text-foreground/70 mb-12">Start with your level, don't jump ahead. The difficulty progression matters.</p>

            {[
              {
                level: "A1 — BEGINNER (0-3 months)",
                dramas: [
                  { name: "Squid Game", why: "Clear pronunciation, repetitive vocab (game/rules/numbers), high engagement" },
                  { name: "My School President", why: "Teenagers (slower speech), school vocabulary, uplifting tone" }
                ]
              },
              {
                level: "A2 — ELEMENTARY (3-6 months)",
                dramas: [
                  { name: "Descendants of the Sun", why: "Medical/military vocab, clear dialogue, multiple angles teach words" },
                  { name: "Crash Landing on You", why: "Everyday Korean mixed with quirky plot, good balance" }
                ]
              },
              {
                level: "B1 — INTERMEDIATE (6-9 months)",
                dramas: [
                  { name: "Itaewon Class", why: "Restaurant/business Korean, mature dialogue, realistic situations" },
                  { name: "Reply 1988", why: "Family dynamics, nostalgic (slower), conversational patterns" }
                ]
              },
              {
                level: "B2+ — ADVANCED (9-12 months)",
                dramas: [
                  { name: "Hospital Playlist", why: "Medical terminology, complex emotions, multiple characters" },
                  { name: "Mr. Sunshine", why: "Historical (formal language), mature themes, dense dialogue" }
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
            <h2 className="text-3xl font-bold mb-12 text-center">Build the Drama Habit (30 Days to Results)</h2>

            <div className="space-y-4">
              {[
                { day: "Days 1-5", goal: "Pick your drama & watch episode 1 (English subtitles)", habit: "30 min daily" },
                { day: "Days 6-10", goal: "Watch episodes 1-2 again (Korean subtitles)", habit: "45 min daily" },
                { day: "Days 11-15", goal: "Rewatch no subtitles + pick 1 scene to master", habit: "1 hour daily" },
                { day: "Days 16-20", goal: "Finish episode 2-3 fully, keep 1 phrase journal", habit: "1 hour daily" },
                { day: "Days 21-30", goal: "Build momentum: 1-2 episodes per week with journal", habit: "1-2 hours daily" }
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
              <p className="font-bold mb-2">📝 Keep a Drama Journal:</p>
              <p className="text-sm text-foreground/70 mb-4">When you hear a phrase you like, write it:</p>
              <div className="bg-white dark:bg-slate-900 p-4 rounded text-sm font-mono text-foreground/70">
                <p>Phrase: "정말이야?" (Really?)</p>
                <p>Context: Character's shocked reaction</p>
                <p>My sentence: "정말이야? 한국어를 배웠어?" (Really? You learned Korean?)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Klovers + Dramas */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">Combine Dramas + Klovers for 3x Faster Results</h2>
            <p className="text-foreground/70 mb-12">Drama watching is powerful passive learning. Add structured lessons for active learning — together they're unstoppable.</p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  col: "Dramas Alone",
                  items: ["Learn listening", "Learn vocabulary", "Learn culture", "❌ Don't learn grammar", "❌ Can't ask questions"]
                },
                {
                  col: "Klovers + Dramas",
                  items: ["Learn listening ✓", "Learn vocabulary ✓", "Learn culture ✓", "Learn grammar ✓", "Ask questions ✓"],
                  highlight: true
                },
                {
                  col: "Textbooks Alone",
                  items: ["Learn grammar", "Learn vocabulary", "❌ Boring", "❌ Not realistic Korean", "❌ No cultural context"]
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
              <p className="font-bold mb-2">🎯 Best Strategy:</p>
              <p className="text-foreground/70">Take Klovers lessons 3x per week (1 hour), watch K-dramas 3-4x per week (1-2 hours). Let lessons explain the grammar you hear in dramas, and let dramas reinforce what you learned in lessons.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">K-Drama Learning FAQs</h2>
            <div className="space-y-6">
              {[
                {
                  q: "How many episodes should I watch per week?",
                  a: "Start with 1 episode per week (4 watches = 4 hours). Once you get the habit, move to 2-3 episodes per week. Quality beats quantity — one fully analyzed episode beats 5 passive episodes."
                },
                {
                  q: "What if the K-drama doesn't have Korean subtitles available?",
                  a: "Netflix has Korean subtitles for most dramas. If not, use YouTube with auto-generated Korean subtitles (not perfect but helpful). Try: Viki, iQiyi, or WeTV apps which support Korean subtitles."
                },
                {
                  q: "Should I watch the full series or just clip scenes?",
                  a: "Full series. Watching the full arc keeps you motivated (cliffhangers!), reinforces vocab across more situations, and the story engagement helps retention. Clips are too short to build the habit."
                },
                {
                  q: "How much new vocabulary do you realistically learn?",
                  a: "Per drama series: 200-400 words if A1, 300-500 words if B1. Not all new words — many repeats. But key phrases and high-frequency words will stick."
                },
                {
                  q: "Is drama learning enough, or do I need formal lessons?",
                  a: "Dramas teach listening and vocabulary brilliantly, but grammar and writing need structure. Combine dramas with 1-2 lessons per week from Klovers for fastest progress."
                }
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Learning Through K-Dramas Today</h2>
            <p className="text-lg mb-8 text-pink-100 max-w-2xl mx-auto">
              Watch the shows you love while your brain learns Korean automatically. Klovers lessons structure your learning so every drama watch accelerates your progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="/enroll-now" className="flex items-center gap-2">
                  Join Klovers <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-white hover:bg-white/10" asChild>
                <a href="/placement-test">Find Your Drama Level</a>
              </Button>
            </div>
            <p className="text-sm text-pink-100 mt-6">
              <Tv className="h-4 w-4 inline mr-2" />
              Recommended dramas for all levels • Drama journal template included • Expert tutor guidance
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KDramaLearningPage;
