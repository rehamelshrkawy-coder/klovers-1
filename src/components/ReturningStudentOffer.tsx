import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Copy,
  Check,
  UserPlus,
  Share2,
  Shield,
  ClipboardCheck,
  Route,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RETURNING_STUDENT_CODE } from "@/lib/siteConfig";

const STEP_ICONS = [ClipboardCheck, Route, GraduationCap];
const REFERRAL_ICONS = [UserPlus, Share2, Shield];

const ReturningStudentOffer = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RETURNING_STUDENT_CODE);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = RETURNING_STUDENT_CODE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const offerItems = tArray("returningStudents.section.offerItems");
  const steps = tArray("returningStudents.section.steps") as { title: string; description: string }[];
  const referralItems = tArray("returningStudents.section.referralItems") as { label: string; description: string }[];
  const faqs = tArray("returningStudents.section.faqs") as { question: string; answer: string }[];

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-4 relative overflow-hidden bg-gradient-to-b from-green-50 to-green-100/60 dark:from-green-950/40 dark:to-green-900/20"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-20 -start-20 w-72 h-72 bg-green-200/40 dark:bg-green-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -end-20 w-64 h-64 bg-green-100/50 dark:bg-green-900/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className={`mb-4 border-green-300 text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 transition-all duration-700 ${
              visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 me-1.5" />
            {t("returningStudents.section.badge")}
          </Badge>
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 transition-all duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {t("returningStudents.section.title")}
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto text-base md:text-lg transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {t("returningStudents.section.subtitle")}
          </p>
        </div>

        {/* HERO: Referral program — primary focus */}
        <div
          className={`mb-12 transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Card className="border-2 border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-950/30 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground border border-black/25 mb-4">
                  <Share2 className="h-7 w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-2">{t("returningStudents.section.referralTitle")}</h3>
                <p className="text-muted-foreground max-w-lg mx-auto">{t("returningStudents.section.referralSubtitle")}</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {referralItems.map((item, i) => {
                  const Icon = REFERRAL_ICONS[i];
                  return (
                    <div key={i} className="text-center p-4 rounded-xl bg-white/80 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/40">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground border border-black/25 mb-3">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="font-bold text-sm mb-1">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two-column grid: Offer + Steps */}
        <div
          className={`grid md:grid-cols-2 gap-8 mb-12 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Left: Offer details + Promo code */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground border border-black/25">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  {t("returningStudents.section.offerTitle")}
                </h3>
                <ul className="space-y-3">
                  {offerItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item as string}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Promo code block */}
            <Card className="border-2 border-dashed border-primary/40 bg-muted/50 dark:bg-muted/30">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-3 font-medium">
                  {t("returningStudents.section.promoLabel")}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-foreground tracking-wider select-all">
                    {RETURNING_STUDENT_CODE}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="gap-1.5 border-border text-foreground hover:bg-muted"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {t("returningStudents.section.promoCopied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {t("returningStudents.section.promoCopy")}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Steps */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t("returningStudents.section.stepsTitle")}</h3>
            <div className="space-y-4">
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground border border-black/25 font-bold text-sm">
                        {i + 1}
                      </span>
                      {i < steps.length - 1 && (
                        <div className="w-0.5 h-6 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <Icon className="h-4 w-4 text-foreground" />
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mini FAQ */}
        {faqs.length > 0 && (
          <div
            className={`max-w-3xl mx-auto mb-12 transition-all duration-700 [transition-delay:400ms] ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h3 className="text-lg font-bold text-center mb-4">{t("returningStudents.section.faqTitle")}</h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-start text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 ms-2 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`px-4 text-sm text-muted-foreground overflow-hidden transition-all duration-200 ${
                      openFaq === i ? "py-3 border-t border-border/60" : "max-h-0 py-0"
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className={`text-center transition-all duration-700 delay-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button size="lg" asChild className="gap-2 h-13 px-8 text-base font-bold shadow-lg">
            <Link to="/placement-test">
              {t("returningStudents.section.cta")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReturningStudentOffer;
