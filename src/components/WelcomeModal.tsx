import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Gamepad2, BookOpen, X, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Presentation and routing only — every string comes from the translation file.
 * These used to be `titleEn`/`titleAr` literal pairs living in the component,
 * untranslatable on a bilingual site, while the `welcomeModal` translation
 * section described a different tour that nothing rendered.
 */
const STEPS = [
  { icon: ClipboardCheck, color: "text-blue-500",     bg: "bg-blue-500/10",  href: "/placement-test" },
  { icon: BookOpen,       color: "text-green-500",    bg: "bg-green-500/10", href: "/textbook" },
  { icon: Gamepad2,       color: "text-primary-text", bg: "bg-primary/10",   href: "/games" },
];

const STORAGE_KEY = "klovers-onboarding-done";

export const markOnboardingDone = () => localStorage.setItem(STORAGE_KEY, "1");
export const isOnboardingDone = () => Boolean(localStorage.getItem(STORAGE_KEY));

interface WelcomeStep {
  title: string;
  description: string;
  cta: string;
}

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { t, tArray } = useLanguage();
  const steps = tArray("welcomeModal.steps") as WelcomeStep[];

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
  const copy = steps[step];
  const Icon = current.icon;

  // The tour is decoration; if its copy is missing there is nothing to show.
  if (!copy) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl" aria-describedby="welcome-desc">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-3 end-3 h-7 w-7 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors"
            aria-label={t("welcomeModal.close")}
          >
            <X className="h-4 w-4 text-primary-foreground" />
          </button>

          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary-foreground/15 items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-extrabold text-primary-foreground mb-1">
            {t("welcomeModal.title")}
          </h2>
          <p className="text-primary-foreground/80 text-sm">
            {t("welcomeModal.subtitle")}
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
                {copy.title}
              </h3>
              <p id="welcome-desc" className="text-muted-foreground text-sm leading-relaxed">
                {copy.description}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleCta(current.href)}
              className="flex-1 gap-1.5 h-10"
            >
              {copy.cta}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleNext} className="h-10 px-4 text-sm">
              {step < STEPS.length - 1 ? t("welcomeModal.next") : t("welcomeModal.done")}
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("welcomeModal.skip")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
