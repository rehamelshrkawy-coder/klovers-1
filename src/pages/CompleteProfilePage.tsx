import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import { useLanguage } from "@/contexts/LanguageContext";

const COUNTRIES = [
  "Egypt", "Saudi Arabia", "UAE", "Kuwait", "Qatar", "Bahrain", "Oman",
  "Jordan", "Lebanon", "Syria", "Iraq", "Palestine", "Libya", "Tunisia",
  "Algeria", "Morocco", "Sudan", "Yemen", "United States", "United Kingdom",
  "Canada", "Australia", "Other",
];

const CompleteProfilePage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const LEVELS = [
    { value: "absolute_beginner", label: t("completeProfile.levelAbsoluteBeginner") },
    { value: "beginner", label: t("completeProfile.levelKnowsHangul") },
    ...LEVEL_SELECT_OPTIONS,
  ];

  const GOALS = [
    { value: "Travel to Korea", label: t("completeProfile.goal1") },
    { value: "Watch K-dramas / K-pop without subtitles", label: t("completeProfile.goal2") },
    { value: "Study or work in Korea", label: t("completeProfile.goal3") },
    { value: "Make Korean friends", label: t("completeProfile.goal4") },
    { value: "Pass TOPIK exam", label: t("completeProfile.goal5") },
    { value: "General interest", label: t("completeProfile.goal6") },
    { value: "Other", label: t("completeProfile.goal7") },
  ];

  const [form, setForm] = useState({
    name: "",
    email: emailFromUrl,
    country: "",
    level: "",
    goal: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name.trim()) {
      toast({ title: t("completeProfile.fillNameEmail"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          country: form.country,
          level: form.level,
          goal: form.goal,
          source: "complete-profile",
          user_id: session?.user?.id,
        },
      });

      if (error) throw new Error(error.message || t("completeProfile.saveFailedGeneric"));

      setDone(true);
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-20 px-4 flex flex-col items-center text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t("completeProfile.doneTitle")}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {t("completeProfile.doneDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild>
                <Link to="/enroll">
                  {t("completeProfile.browseCourses")} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">{t("completeProfile.goHome")}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
              <span className="text-primary text-outlined text-sm font-semibold">{t("completeProfile.badge")}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("completeProfile.pageTitle")}</h1>
            <p className="text-muted-foreground">
              {t("completeProfile.pageSubtitle")}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("completeProfile.nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("completeProfile.namePlaceholder")}
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("completeProfile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("completeProfile.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  readOnly={!!emailFromUrl}
                  className={emailFromUrl ? "bg-muted text-muted-foreground" : ""}
                  required
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label>{t("completeProfile.countryLabel")}</Label>
                <Select value={form.country} onValueChange={set("country")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("completeProfile.countryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label>{t("completeProfile.levelLabel")}</Label>
                <Select value={form.level} onValueChange={set("level")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("completeProfile.levelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Goal */}
              <div className="space-y-1.5">
                <Label>{t("completeProfile.goalLabel")}</Label>
                <Select value={form.goal} onValueChange={set("goal")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("completeProfile.goalPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? t("completeProfile.savingButton") : t("completeProfile.saveButton")}
                {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {t("completeProfile.privacyNote")}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompleteProfilePage;
