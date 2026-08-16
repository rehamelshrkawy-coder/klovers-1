import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Copy,
  Check,
  UserPlus,
  Share2,
  Shield,
  ArrowRight,
  ChevronDown,
  Sparkles,
  BookOpen,
  Users,
  Trophy,
  MessageCircle,
  Link2,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { RETURNING_STUDENT_CODE, WHATSAPP_BASE, SITE_URL } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

const STEP_ICONS = [ShoppingCart, Tag, GraduationCap];
const REFERRAL_ICONS = [UserPlus, Share2, Shield];
const WHY_ICONS = [Sparkles, BookOpen, Users, Trophy];

const PAGE_URL = `${SITE_URL}/welcome-back`;

const ReturningStudentsLandingPage = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<{
    conversions: number;
    clicks: number;
    bonusPercent: number;
  } | null>(null);

  useSEO({
    title: "Welcome Back — Returning Students Offer",
    description:
      "Returning Klovers students get 20% off. Enroll now, share with friends, and save up to 35%. No placement test required.",
    canonical: PAGE_URL,
  });

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  // Fetch logged-in user for personal referral links + stats
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      // Fetch referral stats for discount progress
      Promise.all([
        supabase
          .from("referral_conversions")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", uid),
        supabase
          .from("referral_clicks")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", uid),
      ]).then(([convResult, clickResult]) => {
        const conversions = convResult.count ?? 0;
        const clicks = clickResult.count ?? 0;
        const shareOnly = Math.max(0, clicks - conversions);
        const bonusPercent = Math.min(conversions * 5 + shareOnly * 2, 15);
        setReferralStats({ conversions, clicks, bonusPercent });
      });
    });
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const handleCopyCode = async () => {
    await copyToClipboard(RETURNING_STUDENT_CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Use personal referral link if logged in, otherwise generic page URL
  const shareUrl = userId ? `${SITE_URL}/signup?ref=${userId}` : PAGE_URL;

  const handleCopyLink = async () => {
    await copyToClipboard(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      isAr
        ? `عرض حصري للطلاب العائدين في Klovers! خصم 20% 🎉\n${shareUrl}`
        : `Exclusive offer for returning Klovers students! 20% off 🎉\n${shareUrl}`
    );
    trackAndOpenWhatsApp(`https://wa.me/?text=${msg}`, { cta_label: "returning_share" });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("welcomeBack.share.title"),
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    }
  };

  const offerItems = tArray("welcomeBack.offer.items");
  const steps = tArray("welcomeBack.steps.items") as {
    title: string;
    description: string;
  }[];
  const whyItems = tArray("welcomeBack.whyReturn.items") as {
    title: string;
    description: string;
  }[];
  const referralItems = tArray("welcomeBack.share.referralItems") as {
    label: string;
    description: string;
  }[];
  const faqs = tArray("welcomeBack.faq.items") as {
    question: string;
    answer: string;
  }[];

  return (
    <>
      <Header />
      <main id="main-content">
        {/* ── Share & Referral (Lead Section) ── */}
        <section className="relative overflow-hidden bg-muted/30 py-20 md:py-28 px-4">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-24 -start-24 w-80 h-80 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -end-24 w-72 h-72 bg-muted/30 dark:bg-muted/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3">
                {t("welcomeBack.share.title")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("welcomeBack.share.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Referral tiers */}
              <Card className="border-border/60 bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {referralItems.map((item, i) => {
                      const Icon = REFERRAL_ICONS[i];
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground border border-black/25 shrink-0">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Share buttons */}
              <Card className="border-border/60 flex items-center">
                <CardContent className="pt-6 w-full space-y-4">
                  <p className="text-sm font-medium text-center text-muted-foreground mb-2">
                    {isAr ? "شارك هذه الصفحة مع أصدقائك" : "Share this page with your friends"}
                  </p>

                  {/* Referral progress (logged-in users only) */}
                  {referralStats && referralStats.bonusPercent > 0 && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 text-center">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        {isAr
                          ? `لقد حصلت على خصم إضافي ${referralStats.bonusPercent}%!`
                          : `You've earned +${referralStats.bonusPercent}% referral bonus!`}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        {isAr
                          ? `${referralStats.conversions} صديق انضم · ${Math.max(0, referralStats.clicks - referralStats.conversions)} شخص زار رابطك`
                          : `${referralStats.conversions} friend${referralStats.conversions !== 1 ? "s" : ""} enrolled · ${Math.max(0, referralStats.clicks - referralStats.conversions)} link visitor${Math.max(0, referralStats.clicks - referralStats.conversions) !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  )}

                  {!userId && (
                    <p className="text-xs text-center text-muted-foreground">
                      {isAr ? (
                        <><Link to="/login" className="underline font-medium text-foreground">سجل دخولك</Link> للحصول على رابط إحالة شخصي</>
                      ) : (
                        <><Link to="/login" className="underline font-medium text-foreground">Log in</Link> to get your personal referral link</>
                      )}
                    </p>
                  )}

                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full gap-2 border-border text-foreground hover:bg-muted"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t("welcomeBack.share.copiedLink")}
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        {t("welcomeBack.share.copyLink")}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleWhatsAppShare}
                    className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("welcomeBack.share.whatsapp")}
                  </Button>

                  {canShare && (
                    <Button
                      onClick={handleNativeShare}
                      variant="outline"
                      className="w-full gap-2 border-border text-foreground hover:bg-muted"
                    >
                      <Share2 className="h-4 w-4" />
                      {t("welcomeBack.share.shareButton")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Hero ── */}
        <section className="py-16 md:py-24 px-4 bg-background">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge
              variant="outline"
              className="mb-5 border-border text-foreground bg-muted text-sm px-4 py-1"
            >
              <GraduationCap className="h-4 w-4 me-2" />
              {t("welcomeBack.hero.badge")}
            </Badge>

            <h2 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
              {t("welcomeBack.hero.title")}
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("welcomeBack.hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="gap-2 h-14 px-8 text-base font-bold shadow-lg">
                <Link to="/enroll-now">
                  {t("welcomeBack.hero.ctaPrimary")}
                  <ArrowRight className="h-5 w-5 rtl-flip" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 h-14 px-8 text-base font-medium border-border text-foreground hover:bg-muted"
              >
                <Link to="/placement-test">
                  {t("welcomeBack.hero.ctaSecondary")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Offer Details + Promo Code ── */}
        <section
          ref={sectionRef}
          className="py-16 md:py-24 px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/50"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-20 -start-20 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <div
              className={`grid md:grid-cols-2 gap-8 transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {/* Offer card */}
              <Card className="border-border/60">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground border border-black/25">
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    {t("welcomeBack.offer.title")}
                  </h2>
                  <ul className="space-y-3">
                    {offerItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {item as string}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Promo code */}
              <Card className="border-2 border-dashed border-primary/40 bg-muted/50 flex items-center">
                <CardContent className="pt-6 text-center w-full">
                  <p className="text-sm text-muted-foreground mb-3 font-medium">
                    {t("welcomeBack.offer.promoLabel")}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-foreground tracking-wider select-all">
                      {RETURNING_STUDENT_CODE}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyCode}
                      className="gap-1.5 border-border text-foreground hover:bg-muted"
                    >
                      {codeCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          {t("welcomeBack.offer.promoCopied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          {t("welcomeBack.offer.promoCopy")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── How to Enroll (Steps) ── */}
        <section className="py-16 md:py-24 px-4 bg-background">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
              {t("welcomeBack.steps.title")}
            </h2>

            <div className="space-y-5">
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground border border-black/25 font-bold text-sm">
                        {i + 1}
                      </span>
                      {i < steps.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <Icon className="h-4 w-4 text-foreground" />
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional placement test note */}
            <div className="mt-8 p-4 rounded-lg border border-border/60 bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t("welcomeBack.steps.placementNote")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-foreground hover:bg-muted gap-1.5"
              >
                <Link to="/placement-test">
                  {t("welcomeBack.steps.placementLink")}
                  <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── What's New ── */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
              {t("welcomeBack.whyReturn.title")}
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {whyItems.map((item, i) => {
                const Icon = WHY_ICONS[i];
                return (
                  <Card
                    key={i}
                    className="border-border/60 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6 flex items-start gap-4">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground border border-black/25 shrink-0">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold mb-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        {faqs.length > 0 && (
          <section className="py-16 md:py-24 px-4 bg-background">
            <div className="container mx-auto max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
                {t("welcomeBack.faq.title")}
              </h2>

              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-border/60 rounded-lg overflow-hidden"
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
                        openFaq === i
                          ? "py-3 border-t border-border/60"
                          : "max-h-0 py-0"
                      }`}
                    >
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section className="py-16 md:py-20 px-4 bg-primary text-primary-foreground border-y border-black/25">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              {t("welcomeBack.finalCta.title")}
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              {t("welcomeBack.finalCta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Button
                size="lg"
                asChild
                className="gap-2 h-14 px-8 text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
              >
                <Link to="/enroll-now">
                  {t("welcomeBack.finalCta.button")}
                  <ArrowRight className="h-5 w-5 rtl-flip" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 h-14 px-8 text-base font-medium border-white/40 text-white hover:bg-white/10"
              >
                <a
                  href={WHATSAPP_BASE}
                  onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "returning_final_cta" }); }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("welcomeBack.finalCta.whatsapp")}
                </a>
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/60">
              {t("welcomeBack.finalCta.note")}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ReturningStudentsLandingPage;
