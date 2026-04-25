import { lazy, Suspense, useEffect, useRef } from "react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyLearnKorean from "@/components/WhyLearnKorean";
import Footer from "@/components/Footer";
import StickyEnrollBar from "@/components/StickyEnrollBar";
import ReturningStudentBanner from "@/components/ReturningStudentBanner";
import InterviewBannerChip from "@/components/InterviewBannerChip";

// Lazy-load below-fold sections for faster initial paint
const MeetTeacher = lazy(() => import("@/components/MeetTeacher"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const LearningRoadmap = lazy(() => import("@/components/LearningRoadmap"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const HomeBlogSection = lazy(() => import("@/components/HomeBlogSection"));
const PlacementTestCTA = lazy(() => import("@/components/PlacementTestCTA"));
const HomeGamesSection = lazy(() => import("@/components/HomeGamesSection"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));
const ReturningStudentOffer = lazy(() => import("@/components/ReturningStudentOffer"));

const SectionFallback = () => (
  <div className="py-20 px-4">
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-1/3 mx-auto" />
      <div className="h-4 bg-muted rounded-lg w-1/2 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
      </div>
    </div>
  </div>
);

const Index = () => {
  useSEO({ title: "Korean Classes in Arabic | Klovers Academy", description: "Join Klovers Korean Lovers Academy. Interactive online Korean lessons, placement tests, and gamified learning for all levels.", canonical: "https://kloversegy.com/" });

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Korean Language Courses at Klovers",
      description: "Online Korean language courses for all levels — from A1 beginner to C2 advanced.",
      url: "https://kloversegy.com/pricing",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Course",
            name: "Group Korean Classes",
            description: "Live online group Korean classes for A1–C2 levels. Small groups, expert teachers, flexible schedule.",
            provider: { "@type": "Organization", name: "Klovers Korean Academy", url: "https://kloversegy.com" },
            url: "https://kloversegy.com/enroll-now?classType=group",
            educationalLevel: "Beginner to Advanced",
            inLanguage: "ko",
            offers: { "@type": "Offer", price: "25", priceCurrency: "USD", availability: "https://schema.org/InStock" },
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Course",
            name: "Private Korean Classes",
            description: "One-on-one private Korean lessons tailored to your goals and schedule.",
            provider: { "@type": "Organization", name: "Klovers Korean Academy", url: "https://kloversegy.com" },
            url: "https://kloversegy.com/enroll-now?classType=private",
            educationalLevel: "Beginner to Advanced",
            inLanguage: "ko",
            offers: { "@type": "Offer", price: "50", priceCurrency: "USD", availability: "https://schema.org/InStock" },
          },
        },
      ],
    };
    const el = document.createElement("script");
    el.id = "home-course-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);

    const bizSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "Klovers Korean Academy",
      url: "https://kloversegy.com",
      logo: "https://kloversegy.com/klovers-logo.jpg",
      description: "Online Korean language school teaching Arabic speakers. Live classes, small groups, A1–C2 levels.",
      email: "koreanlovers.net@gmail.com",
      telephone: "+601121777560",
      sameAs: [
        "https://www.facebook.com/Klovers.net/",
        "https://www.tiktok.com/@klovers.net",
        "https://t.me/+Fu5T7d4wLMsxNDY9",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Korean Language Courses",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Course", name: "Group Korean Classes" } },
          { "@type": "Offer", itemOffered: { "@type": "Course", name: "Private Korean Classes" } },
        ],
      },
    };
    const bizEl = document.createElement("script");
    bizEl.id = "home-biz-jsonld";
    bizEl.setAttribute("type", "application/ld+json");
    bizEl.textContent = JSON.stringify(bizSchema);
    document.head.appendChild(bizEl);

    return () => { el.remove(); bizEl.remove(); };
  }, []);

  // ── Scroll depth + section visibility analytics ────────────────
  useEffect(() => {
    const milestones = new Set<number>();
    const onScroll = () => {
      const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      [25, 50, 75, 90].forEach((m) => {
        if (pct >= m && !milestones.has(m)) {
          milestones.add(m);
          try { logLeadEvent({ source_type: "homepage", cta_label: `scroll_depth_${m}` }); } catch {}
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = [
      { id: "how-it-works", label: "section_how_it_works" },
      { id: "placement-cta", label: "section_placement_cta" },
      { id: "testimonials", label: "section_testimonials" },
      { id: "meet-teacher", label: "section_meet_teacher" },
      { id: "final-cta", label: "section_final_cta" },
    ];
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          try { logLeadEvent({ source_type: "homepage", cta_label: label }); } catch {}
          obs.disconnect();
        }
      }, { threshold: 0.3 });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content">
        {/* Attention — strong hook, CTA, social proof stats */}
        <HeroSection />

        {/* Returning students promotional banner */}
        <ReturningStudentBanner />
        {/* Interview training chip — non-intrusive floating, dismissible */}
        <InterviewBannerChip />

        {/* Interest — immediately answer "how does this work?" */}
        <div id="how-it-works" style={{ minHeight: 480 }}>
          <Suspense fallback={<SectionFallback />}>
            <HowItWorks />
          </Suspense>
        </div>
        {/* Action — low-friction free CTA (no payment). Placed high because
            placement-test takers convert 5x more than bounced visitors. */}
        <div id="placement-cta" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <PlacementTestCTA />
          </Suspense>
        </div>
        {/* Desire — social proof builds trust early */}
        <div id="testimonials" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <TestimonialsSection />
          </Suspense>
        </div>
        {/* Desire — reinforces motivation after seeing proof */}
        <WhyLearnKorean />
        {/* Desire — humanize the brand, build connection */}
        <div id="meet-teacher" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <MeetTeacher />
          </Suspense>
        </div>
        {/* Desire — show the clear path forward */}
        <Suspense fallback={<SectionFallback />}>
          <LearningRoadmap />
        </Suspense>
        {/* Returning student offer — capitalize on roadmap motivation */}
        <Suspense fallback={<SectionFallback />}>
          <ReturningStudentOffer />
        </Suspense>
        {/* Interest — fun differentiator */}
        <Suspense fallback={<SectionFallback />}>
          <HomeGamesSection />
        </Suspense>
        {/* Interest — content authority */}
        <Suspense fallback={<SectionFallback />}>
          <HomeBlogSection />
        </Suspense>
        {/* Action — final conversion push */}
        <div id="final-cta">
          <Suspense fallback={<SectionFallback />}>
            <FinalCTA />
          </Suspense>
        </div>
      </main>
      <Footer />
      <StickyEnrollBar />
    </div>
  );
};

export default Index;
