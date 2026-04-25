import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Brain, Target, Sparkles, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const PlacementTestCTA = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeLevel, setActiveLevel] = useState(0);

  const LEVELS = [
    { label: t("placementCta.levelA1"),  color: "bg-blue-500",   width: "w-[15%]" },
    { label: t("placementCta.levelA2"),  color: "bg-cyan-500",    width: "w-[30%]" },
    { label: t("placementCta.levelB1"),  color: "bg-green-500",   width: "w-[50%]" },
    { label: t("placementCta.levelB2"),  color: "bg-amber-500",   width: "w-[65%]" },
    { label: t("placementCta.levelC1"),  color: "bg-orange-500",  width: "w-[80%]" },
    { label: t("placementCta.levelC2"),  color: "bg-rose-500",    width: "w-[100%]" },
  ];

  const FEATURES = [
    { icon: ClipboardCheck, label: t("placementCta.feature20Q") },
    { icon: Clock,          label: t("placementCta.feature5Min") },
    { icon: Target,         label: t("placementCta.featureTopik") },
    { icon: Brain,          label: t("placementCta.featureInstant") },
  ];

  // Scroll-triggered entrance
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Animate through levels once visible
  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= LEVELS.length) { clearInterval(id); return; }
      setActiveLevel(i);
    }, 400);
    return () => clearInterval(id);
  }, [visible, LEVELS.length]);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 relative overflow-hidden bg-gradient-to-b from-background to-muted/40"
    >
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/15 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-200/15 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      {/* Floating Korean characters */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        {["한", "국", "어", "급", "수"].map((char, i) => (
          <span
            key={char}
            className="absolute text-5xl font-bold text-amber-300/10 dark:text-amber-400/8"
            style={{ top: `${15 + i * 18}%`, left: `${3 + i * 19}%`, transform: `rotate(${-15 + i * 8}deg)` }}
          >
            {char}
          </span>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* ── Left: Copy ── */}
          <div
            className={`space-y-6 text-center md:text-start transition-all duration-700 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-black/10 px-4 py-2 rounded-full text-sm font-semibold text-amber-700">
              <Sparkles className="h-4 w-4" />
              {t("placementCta.badge")}
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              {t("placementCta.titleLine1")}<br />
              <span className="relative inline-block">
                <span className="relative z-10">{t("placementCta.titleMiddle")}</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-200/40 rounded-full -z-0" />
              </span>{" "}
              {t("placementCta.titleEnd")}
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {t("placementCta.subtitle")}
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-muted/60 rounded-xl px-3 py-2.5 text-sm text-foreground font-medium">
                  <Icon className="h-4 w-4 text-amber-600 shrink-0" />
                  {label}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/placement-test")}
              className="text-base px-8 gap-2 h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              {t("placementCta.cta")}
              <ChevronRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground">
              {t("placementCta.note")}
            </p>
          </div>

          {/* ── Right: Animated Level Card ── */}
          <div
            className={`flex justify-center transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative w-full max-w-sm">
              {/* Card */}
              <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-primary-foreground font-bold text-sm">{t("placementCta.cardTitle")}</p>
                    <p className="text-primary-foreground/70 text-xs">{t("placementCta.cardSubtitle")}</p>
                  </div>
                </div>

                {/* Levels list */}
                <div className="px-5 py-4 space-y-3">
                  {LEVELS.map((lvl, idx) => (
                    <div key={lvl.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${idx === activeLevel ? "text-foreground" : "text-muted-foreground"}`}>
                          {lvl.label}
                        </span>
                        {idx === activeLevel && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium animate-pulse border border-black/10">
                            {t("placementCta.detecting")}
                          </span>
                        )}
                        {idx < activeLevel && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${lvl.color} ${
                            idx <= activeLevel ? lvl.width : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t("placementCta.cardFooter")}</span>
                  <span className="text-xs font-bold text-amber-700">{t("placementCta.free")}</span>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                {t("placementCta.instant")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlacementTestCTA;
