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
            <h2 className="text-3xl font-bold mb-12 text-center">TOPIK Levels & Requirements</h2>
            <div className="space-y-4">
              {[
                { level: "Level 1 (A1)", range: "0-40 points", desc: "Beginner — Basic greetings, very simple survival Korean" },
                { level: "Level 2 (A2)", range: "41-100 points", desc: "Elementary — Understand familiar topics, simple conversations" },
                { level: "Level 3 (B1)", range: "120-150 points", desc: "Intermediate — Understand main points, express opinions, watch K-dramas" },
                { level: "Level 4 (B2)", range: "151-190 points", desc: "Upper Intermediate — Nearly fluent, read news articles, business discussions", highlight: true },
                { level: "Level 5 (C1)", range: "191-230 points", desc: "Advanced — Near native proficiency, read literature, academic discussions" },
                { level: "Level 6 (C2)", range: "231-300 points", desc: "Mastery — Native-like fluency, subtle cultural references understood" }
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
              <p className="text-sm"><strong>Most Popular:</strong> Level 4 (B2) is the minimum for university admission, job applications, and visa sponsorship in South Korea.</p>
            </div>
          </div>
        </section>

        {/* 2026 TOPIK Schedule */}
        <section className="py-16 border-b bg-slate-50/50 dark:bg-slate-950/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">2026 TOPIK Exam Dates</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  season: "Spring 2026 (TOPIK II)",
                  date: "April 19, 2026",
                  registration: "Feb 23 - Mar 23, 2026",
                  location: "Register on official TOPIK website"
                },
                {
                  season: "Fall 2026 (TOPIK II)",
                  date: "October 18, 2026",
                  registration: "Aug 10 - Sep 10, 2026",
                  location: "Register on official TOPIK website"
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-lg border bg-white dark:bg-slate-900">
                  <h3 className="font-bold text-lg mb-4">{item.season}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground/60">Exam Date</p>
                      <p className="text-lg font-bold">{item.date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/60">Registration Period</p>
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
              <p className="text-sm"><strong>⚠️ Important:</strong> Registration opens 5-6 weeks before exam. Mark your calendar now to avoid missing deadlines. Exam fee is approximately 50,000 KRW (~$40 USD).</p>
            </div>
          </div>
        </section>

        {/* Study Timeline */}
        <section className="py-16 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4">Study Timeline to Level 4 (8-12 Weeks)</h2>
            <p className="text-foreground/70 mb-12">Assuming you already reach A2-B1 level. For beginners, add 12-16 weeks of foundation study first.</p>

            <div className="space-y-6">
              {[
                {
                  week: "Weeks 1-2",
                  focus: "Test Format Mastery",
                  tasks: [
                    "Take 1 full-length practice test (2 hours)",
                    "Review test structure: Listening (4 sections), Reading (3 sections), Writing (2 tasks)",
                    "Identify your weak areas (usually writing + complex reading)"
                  ]
                },
                {
                  week: "Weeks 3-4",
                  focus: "Listening Skills",
                  tasks: [
                    "Listen to TOPIK listening samples daily (30 min)",
                    "Practice multiple-choice strategies",
                    "Build vocabulary for common topics (jobs, hobbies, daily life)"
                  ]
                },
                {
                  week: "Weeks 5-6",
                  focus: "Reading & Vocabulary",
                  tasks: [
                    "Learn 200+ TOPIK-specific vocabulary words",
                    "Practice reading comprehension exercises",
                    "Learn common Korean sentence patterns in reading"
                  ]
                },
                {
                  week: "Weeks 7-8",
                  focus: "Writing Skills",
                  tasks: [
                    "Practice short essay writing (200-300 words)",
                    "Learn formal Korean writing patterns",
                    "Get feedback on grammar/structure from tutors"
                  ]
                },
                {
                  week: "Weeks 9-12",
                  focus: "Full Practice Tests",
                  tasks: [
                    "Take 4 full-length practice tests",
                    "Review errors carefully",
                    "Focus on speed + accuracy in final 2 weeks"
                  ]
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
            <h2 className="text-3xl font-bold mb-12 text-center">TOPIK Exam Day: Pro Tips</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Clock className="h-8 w-8 text-blue-500" />,
                  title: "Time Management",
                  tips: ["Listening: 50 min (no breaks)", "Break: 15 min", "Reading + Writing: 100 min total"]
                },
                {
                  icon: <Target className="h-8 w-8 text-amber-500" />,
                  title: "Test Strategy",
                  tips: ["Skip hard questions, come back later", "Budget 30 min for writing", "Don't panic if a section is hard"]
                },
                {
                  icon: <TrendingUp className="h-8 w-8 text-green-500" />,
                  title: "Scoring Strategy",
                  tips: ["Each section weighted equally", "Aim for 60%+ to pass Level 4", "One section weakness won't kill you"]
                },
                {
                  icon: <Zap className="h-8 w-8 text-purple-500" />,
                  title: "Mental Game",
                  tips: ["Get sleep night before", "Eat protein breakfast", "Stay calm — you've practiced this"]
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
            <h2 className="text-3xl font-bold mb-12 text-center">Why Klovers for TOPIK Preparation</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "TOPIK-Specific Curriculum", desc: "Lessons built specifically for TOPIK exam format, not general Korean" },
                { title: "200+ Practice Tests", desc: "Full-length practice exams that mirror the real TOPIK" },
                { title: "Expert Tutors", desc: "Teachers who've passed TOPIK Level 6 and know every question type" },
                { title: "Writing Feedback", desc: "Get your essays corrected by native speakers (most critical skill)" },
                { title: "Vocabulary System", desc: "1,200 TOPIK-essential words taught in context + spaced repetition" },
                { title: "Flexible Timing", desc: "Classes at 8 PM Cairo time for working professionals" }
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
            <h2 className="text-3xl font-bold mb-12 text-center">TOPIK FAQs</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Can I take TOPIK from outside South Korea?",
                  a: "Yes. TOPIK II is offered at Korean cultural centers and universities in 60+ countries. Check TOPIK official website for testing centers in Egypt or nearby."
                },
                {
                  q: "How long is the TOPIK score valid?",
                  a: "TOPIK scores are valid for 2 years from the test date. After 2 years, you'll need to retake the exam if needed for university/job applications."
                },
                {
                  q: "What if I don't reach my target level?",
                  a: "You can retake the exam every 6 months. Most people improve 1 level per attempt if they study focused and learn from their mistakes."
                },
                {
                  q: "Is TOPIK required to work in South Korea?",
                  a: "Not always, but Level 4+ significantly improves job prospects. Most Korean employers prefer TOPIK Level 3-4 minimum for professional roles."
                },
                {
                  q: "Should I take TOPIK I or TOPIK II?",
                  a: "TOPIK I = Levels 1-2 (Beginner). TOPIK II = Levels 3-6 (Intermediate+). Most people jump directly to TOPIK II. Only take I if you're brand new to Korean."
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
        <section className="py-20 bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Ace Your TOPIK Exam?</h2>
            <p className="text-lg mb-8 text-green-100 max-w-2xl mx-auto">
              Start preparing with Klovers' TOPIK-specific curriculum. Expert tutors, 200+ practice tests, and personalized feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a href="/enroll-now" className="flex items-center gap-2">
                  Start TOPIK Prep <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-white hover:bg-white/10" asChild>
                <a href="/placement-test">Take Free Test</a>
              </Button>
            </div>
            <p className="text-sm text-green-100 mt-6">
              <BookOpen className="h-4 w-4 inline mr-2" />
              Next TOPIK Exam: April 19, 2026 • Registration closes March 23
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TopikExamPage;
