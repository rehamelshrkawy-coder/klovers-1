import { useState, useEffect, useRef } from "react";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent } from "@/lib/leadTracking";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "exit_modal_shown";

const ExitIntentModal = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const triggered = useRef(false);

  const trigger = () => {
    if (triggered.current) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    triggered.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");
    setShow(true);
  };

  useEffect(() => {
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 5) trigger();
    };
    document.addEventListener("mouseleave", onMouseLeave);
    // Fallback timer: show after 45s if still on page
    const timer = setTimeout(trigger, 45_000);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || email.length < 5) {
      setError(isAr ? "أدخل بريدًا إلكترونيًا صحيحًا" : "Enter a valid email address");
      return;
    }
    // Fire-and-forget: log lead + submit to leads system
    try {
      logLeadEvent({
        source_type: "exit_intent",
        cta_label: "exit_intent_hangul_sheet",
        metadata: { email },
      });
      supabase.functions.invoke("submit-lead", {
        body: { email, source: "exit_intent_hangul_sheet", name: "Hangul Sheet Request" },
      }).catch(() => {});
    } catch {}
    setSubmitted(true);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      dir={isAr ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "عرض خاص" : "Special offer"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
        aria-hidden="true"
      />

      <div className="relative bg-background border border-border rounded-3xl shadow-2xl max-w-md w-full p-7 animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isAr ? "إغلاق" : "Close"}
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-black text-foreground mb-2">
              {isAr ? "وصلك! راجع بريدك 📩" : "On its way! Check your inbox 📩"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {isAr
                ? "هنبعتلك ورقة هانغول + ١٠٪ خصم على أول حصة مدفوعة."
                : "We'll send you the Hangul sheet + 10% off your first paid class."}
            </p>
            <Button onClick={() => setShow(false)} className="w-full">
              {isAr ? "رجوع للصفحة" : "Back to site"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">
                  {isAr ? "قبل ما تمشي" : "Before you go"}
                </p>
                <h3 className="text-lg font-black text-foreground leading-tight">
                  {isAr ? "خد ورقة هانغول مجانًا 🇰🇷" : "Free Hangul Starter Sheet 🇰🇷"}
                </h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {isAr
                ? "الحروف الكورية كاملة في ورقة واحدة — مع طريقة اللفظ الصح. بلاش بطاقة، بلاش التزامات."
                : "The full Korean alphabet on one sheet — with pronunciation for each letter. No card, no commitment."}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="h-12 text-base"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full gap-2 font-bold">
                <Gift className="h-4 w-4" />
                {isAr ? "أرسلوا لي الورقة" : "Send Me the Sheet"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {isAr ? "بريدك آمن معنا. لا سبام أبدًا." : "Your email is safe. No spam, ever."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ExitIntentModal;
