import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Star, Zap, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

const SOCIAL_PROOF = [
  { icon: Users, value: "500+", label: "Active Students" },
  { icon: Star,  value: "4.9★",   label: "Average Rating" },
  { icon: Zap,   value: "4–8",    label: "Students Per Class" },
];

// Floating Korean characters for visual texture
const KR_CHARS = ["안녕", "한국어", "공부", "화이팅", "수업", "최고"];

const FinalCTA = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Animate student count 0 → 1000
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const target = 500;
    const step = Math.ceil(target / 60);
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(start);
      if (start >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden bg-primary border-y border-black/25"
    >
      {/* Top edge gradient for depth */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />

      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {KR_CHARS.map((char, i) => (
          <span
            key={char}
            className="absolute text-4xl md:text-6xl font-extrabold text-primary-foreground/5"
            style={{
              top: `${10 + (i % 3) * 30}%`,
              left: `${5 + i * 15}%`,
              transform: `rotate(${-20 + i * 10}deg)`,
            }}
          >
            {char}
          </span>
        ))}
        {/* Gradient blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary-foreground/3 rounded-full" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">

        {/* Label pill */}
        <div
          className={`inline-flex items-center gap-2 bg-primary-foreground/15 border border-primary-foreground/25 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold mb-6 transition-all duration-700 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {isAr ? "ابدأ رحلتك الكورية اليوم" : "Start Your Korean Journey Today"}
        </div>

        {/* Headline */}
        <h2
          className={`text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-5 leading-tight transition-all duration-700 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {t("finalCta", "title")}
        </h2>

        <p
          className={`text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-base md:text-lg leading-relaxed transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {t("finalCta", "subtitle")}
        </p>

        {/* Animated social proof */}
        <div
          className={`flex items-center justify-center gap-4 flex-wrap mb-10 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {SOCIAL_PROOF.map(({ icon: Icon, value, label }, i) => (
            <div key={label} className="flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-2.5">
              <Icon className="h-5 w-5 text-primary-foreground/70" />
              <div className="text-left">
                <p className="font-bold text-primary-foreground text-sm leading-none">
                  {i === 0 ? `${count.toLocaleString()}+` : value}
                </p>
                <p className="text-[11px] text-primary-foreground/60">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-3 items-center justify-center mb-6 transition-all duration-700 delay-400 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button size="lg" variant="secondary" asChild className="gap-2 h-13 px-8 text-base shadow-xl min-w-[200px] font-bold">
            <Link to="/free-trial">
              {t("finalCta", "button")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>

          <Button size="lg" variant="outline" asChild className="gap-2 h-12 px-8 text-base bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 min-w-[200px]">
            <Link to="/placement-test">
              {isAr ? "اختبار مجاني" : "Free Placement Test"}
            </Link>
          </Button>

          {/* WhatsApp CTA — Egyptian market */}
          <Button
            size="lg"
            asChild
            className="gap-2 h-12 px-8 text-base bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 min-w-[200px] font-semibold"
          >
            <a
              href={WHATSAPP_BASE}
              onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "final_cta_homepage" }); }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              {isAr ? "واتساب" : "WhatsApp Us"}
            </a>
          </Button>
        </div>

        <p className="text-primary-foreground/50 text-xs">
          {isAr ? "لا بطاقة ائتمان · ٣٠ دقيقة · معلمة حقيقية · نرد خلال دقائق" : "No credit card · 30 minutes · Real teacher · We reply in minutes"}
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
