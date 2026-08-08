import { useMemo, useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

// Inject JSON-LD into document head
const FAQSchemaScript = ({ schema }: { schema: object }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    script.id = "faq-schema";
    document.head.appendChild(script);
    return () => { document.getElementById("faq-schema")?.remove(); };
  }, [schema]);
  return null;
};

const FAQPage = () => {
  useSEO({ title: "FAQ", description: "Got questions about learning Korean with Klovers? Find answers about courses, teachers, scheduling, and payments.", canonical: "https://kloversegy.com/faq" });
  const { t, tArray } = useLanguage();
  const faqs = tArray("faqPage", "items") as { question: string; answer: string; category?: string }[];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    const catLabels: Record<string, string> = {
      gettingStarted: t("faqPage", "categories.gettingStarted") || "Getting Started",
      classes: t("faqPage", "categories.classes") || "Classes",
      payment: t("faqPage", "categories.payment") || "Payment",
      progress: t("faqPage", "categories.progress") || "Progress",
    };
    faqs.forEach(f => {
      if (f.category && !cats.has(f.category)) {
        cats.set(f.category, catLabels[f.category] || f.category);
      }
    });
    return cats;
  }, [faqs, t]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter(f => {
      if (activeCategory && f.category !== activeCategory) return false;
      if (!q) return true;
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    });
  }, [faqs, activeCategory, searchQuery]);

  // JSON-LD FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen">
      {/* Inject JSON-LD FAQ schema into head */}
      {typeof document !== "undefined" && <FAQSchemaScript schema={faqSchema} />}

      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                {t("faqPage", "badge")}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                {t("faqPage", "title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("faqPage", "subtitle")}
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md mx-auto mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category filters */}
            {categories.size > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                <Button
                  variant={activeCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </Button>
                {Array.from(categories).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={activeCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}

            <div className="max-w-3xl mx-auto">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No results for "{searchQuery}"</p>
                  <button onClick={() => { setSearchQuery(""); setActiveCategory(null); }} className="mt-2 text-sm text-primary hover:underline">
                    Clear search
                  </button>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-foreground hover:text-foreground/80">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {/* CTA Section */}
            <div className="max-w-2xl mx-auto mt-16 text-center p-8 rounded-2xl bg-card border">
              <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t("faqPage", "ctaTitle")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("faqPage", "ctaText")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <a href="https://wa.me/201010003084?text=Hi!%20I%20have%20a%20question%20about%20Klovers." onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp("https://wa.me/201010003084?text=Hi!%20I%20have%20a%20question%20about%20Klovers.", { cta_label: "faq_contact" }); }} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://t.me/+Fu5T7d4wLMsxNDY9" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Telegram
                  </a>
                </Button>
                <Button asChild>
                  <Link to="/enroll-now">
                    {t("faqPage", "ctaEnroll")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default FAQPage;
