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
import { useLanguage } from "@/contexts/LanguageContext";

const englishFaqs = [
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
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: t("pricingPage.faq1Q"), a: t("pricingPage.faq1A") },
    { q: t("pricingPage.faq2Q"), a: t("pricingPage.faq2A") },
    { q: t("pricingPage.faq3Q"), a: t("pricingPage.faq3A") },
    { q: t("pricingPage.faq4Q"), a: t("pricingPage.faq4A") },
    { q: t("pricingPage.faq5Q"), a: t("pricingPage.faq5A") },
    { q: t("pricingPage.faq6Q"), a: t("pricingPage.faq6A") },
  ];
  return (
    <section className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
          {t("pricingPage.faqTitle")}
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          {t("pricingPage.faqSubtitle")}
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
  const { t } = useLanguage();
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
    const url = `${WHATSAPP_BASE}?text=${encodeURIComponent(t("pricingPage.exitWaMessage"))}`;
    trackAndOpenWhatsApp(url, { cta_label: "pricing_exit_intent" });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-3">
      <div className="bg-card text-card-foreground rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 relative animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setVisible(false)}
          aria-label={t("pricingPage.exitDismiss")}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-center space-y-1 mb-4">
          <div className="text-4xl mb-2">🎁</div>
          <h3 className="text-lg font-bold text-foreground">{t("pricingPage.exitTitle")}</h3>
          <p className="text-sm text-muted-foreground leading-snug">
            {t("pricingPage.exitBodyPre")} <strong className="text-foreground">{t("pricingPage.exitBodyHighlight")}</strong> {t("pricingPage.exitBodyPost")}
          </p>
        </div>
        <div className="space-y-2">
          <Link
            to="/free-trial"
            onClick={handleTrialClick}
            className="block w-full bg-primary text-primary-foreground text-center font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t("pricingPage.exitCta")}
          </Link>
          <button
            onClick={handleWaClick}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
          >
            {t("pricingPage.exitChat")}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          {t("pricingPage.exitFooter")}
        </p>
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
      "mainEntity": englishFaqs.map((f) => ({
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
