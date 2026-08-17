import { useState, useRef, useEffect } from "react";
import { ChevronDown, BookOpen, MessageCircle, Zap, Star, Trophy, Flame, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const LEVEL_META: Record<string, { color: string; bg: string; border: string; gradient: string; icon: React.ElementType; emoji: string }> = {
  A0:              { color: "text-[#E8D9FF]", bg: "bg-[#E8D9FF]/10", border: "border-[#E8D9FF]/30", gradient: "from-[#E8D9FF]/30 to-[#E8D9FF]/5", icon: BookOpen,      emoji: "🇰🇷" },
  "TOPIK 1 / A1":  { color: "text-[#D6E8FF]", bg: "bg-[#D6E8FF]/10", border: "border-[#D6E8FF]/30", gradient: "from-[#D6E8FF]/30 to-[#D6E8FF]/5", icon: MessageCircle, emoji: "🌱" },
  "TOPIK 2 / A2":  { color: "text-[#D7F7F7]", bg: "bg-[#D7F7F7]/10", border: "border-[#D7F7F7]/30", gradient: "from-[#D7F7F7]/30 to-[#D7F7F7]/5", icon: Zap,           emoji: "⚡" },
  "TOPIK 3 / B1":  { color: "text-[#CFF7D3]", bg: "bg-[#CFF7D3]/10", border: "border-[#CFF7D3]/30", gradient: "from-[#CFF7D3]/30 to-[#CFF7D3]/5", icon: Star,          emoji: "🔥" },
  "TOPIK 4 / B2":  { color: "text-[#FFE5CC]", bg: "bg-[#FFE5CC]/10", border: "border-[#FFE5CC]/30", gradient: "from-[#FFE5CC]/30 to-[#FFE5CC]/5", icon: Flame,         emoji: "💪" },
  "TOPIK 5 / C1":  { color: "text-[#FFE5CC]", bg: "bg-[#FFE5CC]/10", border: "border-[#FFE5CC]/30", gradient: "from-[#FFE5CC]/30 to-[#FFE5CC]/5", icon: Trophy,        emoji: "🏅" },
  "TOPIK 6 / C2":  { color: "text-[#FFD9E6]", bg: "bg-[#FFD9E6]/10", border: "border-[#FFD9E6]/30", gradient: "from-[#FFD9E6]/30 to-[#FFD9E6]/5", icon: GraduationCap, emoji: "🏆" },
};

const getMeta = (level: string) =>
  LEVEL_META[level] ?? { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", gradient: "from-primary/20 to-primary/5", icon: Star, emoji: "⭐" };

const LearningRoadmap = () => {
  const { t, tArray } = useLanguage();
  const stages = tArray("roadmap", "stages") as { title: string; description: string; level: string }[];
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const revealAll = () => setVisibleItems(new Set(stages.map((_, i) => i)));

    // No observer, or reduced motion: reveal everything immediately rather
    // than leaving every item stuck at opacity-0 forever.
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof IntersectionObserver === "undefined" || reduceMotion) {
      revealAll();
      return;
    }

    const observers: IntersectionObserver[] = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(i));
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    // Failsafe: whatever the observers did, the content becomes visible.
    const timer = window.setTimeout(revealAll, 2000);

    return () => {
      observers.forEach((o) => o.disconnect());
      window.clearTimeout(timer);
    };
  }, [stages.length]);

  const toggle = (index: number) =>
    setActiveStep((prev) => (prev === index ? null : index));

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-black text-xs font-semibold uppercase tracking-widest mb-4 border border-black/25 shadow-sm">
            Your Journey
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            {t("roadmap", "title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
            {t("roadmap", "subtitle")}
          </p>
        </div>

        {/* Roadmap cards — centered stack, no timeline line */}
        <div className="max-w-xl mx-auto space-y-3">
          {stages.map((stage, index) => {
            const isActive = activeStep === index;
            const isVisible = visibleItems.has(index);
            const meta = getMeta(stage.level);
            const Icon = meta.icon;
            const isLast = index === stages.length - 1;

            return (
              <div
                key={index}
                ref={(el) => { itemRefs.current[index] = el; }}
                style={{ transitionDelay: `${index * 80}ms` }}
                className={`transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                {/* Card */}
                <div
                  onClick={() => toggle(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggle(index)}
                  className={`relative rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-300 border overflow-hidden group ${
                    isActive
                      ? `${meta.border} shadow-lg ring-1 ring-inset ${meta.border}`
                      : "border-border hover:border-primary/30 hover:shadow-md"
                  }`}
                >
                  {/* Subtle gradient background when active */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} pointer-events-none`} />
                  )}

                  {/* Top row */}
                  <div className="relative flex items-center gap-4">
                    {/* Step number + emoji */}
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? `${meta.bg} shadow-md` : "bg-muted/50 group-hover:bg-muted"
                    }`}>
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-background ${
                        isActive ? `${meta.bg} ${meta.color}` : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? meta.color : "text-muted-foreground"} transition-colors`} />
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${
                          isActive ? meta.color : "text-muted-foreground"
                        } transition-colors`}>
                          {stage.level}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-foreground leading-tight">
                        {stage.title}
                      </h3>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                        isActive ? `rotate-180 ${meta.color}` : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Expandable description */}
                  <div
                    className={`relative overflow-hidden transition-all duration-400 ease-in-out ${
                      isActive ? "max-h-40 mt-4 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed ps-[72px]">
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* Connector line between cards */}
                {!isLast && (
                  <div className="flex justify-center py-1">
                    <div className={`w-0.5 h-3 rounded-full transition-colors duration-300 ${
                      isActive || activeStep === index + 1 ? "bg-primary/60" : "bg-border"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8">
            <Link to="/placement-test">
              {t("roadmap", "cta")}
              <ArrowRight className="h-5 w-5 rtl-flip" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">{t("roadmap", "ctaSub")}</p>
        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
