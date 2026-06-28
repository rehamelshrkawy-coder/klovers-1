import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Gamepad2, BookOpen, X, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { markOnboardingDone } from "@/lib/onboarding";

const STEPS = [
  {
    icon: ClipboardCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    titleEn: "Take Your Placement Test",
    titleAr: "اختبر مستواك",
    descEn: "Find out your exact Korean level (A1–C2) with our free TOPIK-based assessment. It only takes 10 minutes!",
    descAr: "اكتشف مستواك الدقيق في الكورية من A1 إلى C2 باختبار TOPIK المجاني. يستغرق فقط 10 دقائق!",
    cta: "/placement-test",
    ctaEn: "Take Free Test",
    ctaAr: "ابدأ الاختبار",
  },
  {
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/10",
    titleEn: "Explore Your Textbook",
    titleAr: "استكشف كتابك المدرسي",
    descEn: "Browse 75+ structured Korean lessons organised by level. Study vocabulary, grammar, and culture at your pace.",
    descAr: "تصفح أكثر من 75 درساً كورياً منظماً حسب المستوى. ادرس المفردات والقواعد والثقافة بوتيرتك الخاصة.",
    cta: "/textbook",
    ctaEn: "Open Textbook",
    ctaAr: "افتح الكتاب",
  },
  {
    icon: Gamepad2,
    color: "text-primary",
    bg: "bg-primary/10",
    titleEn: "Play & Earn XP",
    titleAr: "العب واكسب نقاطاً",
    descEn: "13 interactive games to practise Korean — every game you play earns XP and unlocks badges. Learning is fun!",
    descAr: "13 لعبة تفاعلية لتدريب الكورية — كل لعبة تلعبها تكسبك نقاطاً وتفتح شارات. التعلم ممتع!",
    cta: "/games",
    ctaEn: "Play Games",
    ctaAr: "العب الآن",
  },
];

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const handleClose = () => {
    markOnboardingDone();
    onClose();
  };

  const handleCta = (href: string) => {
    markOnboardingDone();
    onClose();
    navigate(href);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl" aria-describedby="welcome-desc">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-primary-foreground" />
          </button>

          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary-foreground/15 items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-extrabold text-primary-foreground mb-1">
            {isAr ? "مرحباً بك في Klovers! 🇰🇷" : "Welcome to Klovers! 🇰🇷"}
          </h2>
          <p className="text-primary-foreground/80 text-sm">
            {isAr ? "إليك كيف تبدأ رحلتك الكورية" : "Here's how to kick off your Korean journey"}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl ${current.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-6 w-6 ${current.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base leading-tight mb-1.5">
                {isAr ? current.titleAr : current.titleEn}
              </h3>
              <p id="welcome-desc" className="text-muted-foreground text-sm leading-relaxed">
                {isAr ? current.descAr : current.descEn}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleCta(current.cta)}
              className="flex-1 gap-1.5 h-10"
            >
              {isAr ? current.ctaAr : current.ctaEn}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleNext} className="h-10 px-4 text-sm">
              {step < STEPS.length - 1
                ? (isAr ? "التالي" : "Next")
                : (isAr ? "تم" : "Done")}
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isAr ? "تخطي جولة الترحيب" : "Skip welcome tour"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
