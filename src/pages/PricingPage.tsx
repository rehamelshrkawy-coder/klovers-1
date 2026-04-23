import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import EnrollSection from "@/components/EnrollSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ScrollToTop from "@/components/ScrollToTop";
import StickyEnrollBar from "@/components/StickyEnrollBar";
import { ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";

const faqs = [
  {
    q: "Do I need any experience to start?",
    a: "Absolutely not. We start from the very basics — Hangul letters, pronunciation, and everyday phrases. If you're a total beginner you'll be in the right place.",
  },
  {
    q: "What if I miss a class?",
    a: "Group classes are recorded and shared with enrolled students. Private students can reschedule with 24h notice. No class is ever wasted.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: "Yes. If you're not satisfied after your first class we'll give you a full refund — no questions asked. After that, refunds are prorated for unused sessions.",
  },
  {
    q: "How do I pay? Is it safe?",
    a: "We accept bank transfer, Vodafone Cash, and InstaPay (Egypt) plus international card or PayPal. All payments are manually reviewed by our team before activation — no automatic charges.",
  },
  {
    q: "How many students are in a group class?",
    a: "Groups are kept small — usually 4 to 8 students — so you still get personal attention and time to speak Korean in every session.",
  },
  {
    q: "Which platform do the classes use?",
    a: "All live classes run on Zoom. You'll receive the link before each session. No download required — you can join from any browser.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
          Common Questions
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          Everything you need to know before enrolling
        </p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-muted/30 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-sm text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ExitNudge = () => {
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);
  const shownLogged = useRef(false);

  useEffect(() => {
    const trigger = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      setVisible(true);
      if (!shownLogged.current) {
        shownLogged.current = true;
        track.custom("exit_intent_shown", { page: "pricing" });
        logLeadEvent({ source_type: "pricing", cta_label: "exit_intent_shown" });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) trigger();
    };

    let scrolledUp = 0;
    let lastY = window.scrollY;
    const handleScroll = () => {
      if (dismissed.current) return;
      const y = window.scrollY;
      if (y < lastY) scrolledUp += lastY - y;
      else scrolledUp = 0;
      lastY = y;
      if (scrolledUp > 250) trigger();
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleTrialClick = () => {
    track.custom("exit_intent_clicked", { page: "pricing", cta: "free_trial" });
    logLeadEvent({ source_type: "pricing", cta_label: "exit_intent_trial" });
  };

  const handleWaClick = () => {
    track.custom("exit_intent_clicked", { page: "pricing", cta: "whatsapp" });
    const url = `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I saw the pricing page and I'd like help choosing a plan.")}`;
    trackAndOpenWhatsApp(url, { cta_label: "pricing_exit_intent" });
  };

  if (!visible) return null;

  // Non-blocking bottom sheet — first attempt was a full-screen modal that
  // got 16 impressions / 0 clicks. The blocker reflex (users hit ESC / X
  // without reading) ate the pitch entirely. This version is an inline
  // sheet pinned to the bottom of the viewport with ONE high-contrast CTA,
  // no WhatsApp distraction, no secondary button competing for attention.
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none animate-in slide-in-from-bottom-2 duration-300">
      <div className="relative pointer-events-auto mx-auto max-w-lg bg-card border-2 border-primary/60 shadow-[0_20px_60px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden">
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/free-trial"
          onClick={handleTrialClick}
          className="group flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors"
        >
          <div className="text-3xl flex-shrink-0">🎁</div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-bold text-foreground text-sm leading-tight">
              Wait — try one class <span className="text-primary">free</span> first
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              45 min · real teacher · no payment · no commitment
            </p>
          </div>
          <div className="flex-shrink-0 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-[1.03] transition-all">
            Book →
          </div>
        </Link>
        <button
          onClick={handleWaClick}
          className="block w-full text-center text-[10px] text-muted-foreground hover:text-foreground py-1.5 border-t border-border/50 bg-muted/20"
        >
          Need help choosing? Chat on WhatsApp
        </button>
      </div>
    </div>
  );
};

const PricingPage = () => {
  useSEO({ title: "Pricing & Plans", description: "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.", canonical: "https://kloversegy.com/pricing" });

  useEffect(() => { logLeadEvent({ source_type: "pricing", cta_label: "page_view" }); }, []);

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "pricing-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Korean Language Course Plans",
      "description": "Affordable Korean language learning plans at Klovers Academy",
      "url": "https://kloversegy.com/pricing",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Course",
            "name": "Group Korean Classes",
            "provider": { "@type": "Organization", "name": "Klovers Korean Academy" },
            "inLanguage": "ko"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Course",
            "name": "Private Korean Classes",
            "provider": { "@type": "Organization", "name": "Klovers Korean Academy" },
            "inLanguage": "ko"
          }
        }
      ]
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => {
    const faqEl = document.createElement("script");
    faqEl.id = "pricing-faq-jsonld";
    faqEl.setAttribute("type", "application/ld+json");
    faqEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    });
    document.head.appendChild(faqEl);
    return () => { faqEl.remove(); };
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <PricingSection />
        <TestimonialsSection />
        <FAQ />
        <EnrollSection />
      </main>
      <Footer />
      <ScrollToTop />
      <ExitNudge />
      <StickyEnrollBar />
    </div>
  );
};

export default PricingPage;
