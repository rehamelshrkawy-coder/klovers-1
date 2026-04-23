import { lazy, Suspense, useEffect } from "react";
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
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
    return () => { el.remove(); };
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
        <Suspense fallback={<SectionFallback />}>
          <HowItWorks />
        </Suspense>
        {/* Action — low-friction free CTA (no payment). Placed high because
            placement-test takers convert 5x more than bounced visitors. */}
        <Suspense fallback={<SectionFallback />}>
          <PlacementTestCTA />
        </Suspense>
        {/* Desire — social proof builds trust early */}
        <Suspense fallback={<SectionFallback />}>
          <TestimonialsSection />
        </Suspense>
        {/* Desire — reinforces motivation after seeing proof */}
        <WhyLearnKorean />
        {/* Desire — humanize the brand, build connection */}
        <Suspense fallback={<SectionFallback />}>
          <MeetTeacher />
        </Suspense>
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
        <Suspense fallback={<SectionFallback />}>
          <FinalCTA />
        </Suspense>
      </main>
      <Footer />
      <StickyEnrollBar />
    </div>
  );
};

export default Index;
