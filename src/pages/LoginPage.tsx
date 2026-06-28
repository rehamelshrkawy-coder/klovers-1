import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeInternalPath } from "@/lib/safeNavigation";

const LoginPage = () => {
  useSEO({ title: "Login | Klovers Korean Academy", description: "Sign in to your Klovers account to access your Korean lessons, progress tracker, and student dashboard.", noindex: true });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam ? safeInternalPath(redirectParam) : null;
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // If user is already authenticated (e.g. returning from OAuth), redirect immediately
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const savedRedirect = localStorage.getItem("enroll_redirect");
        const finalRedirect = safeInternalPath(redirectTo || savedRedirect);
        if (savedRedirect) localStorage.removeItem("enroll_redirect");
        navigate(finalRedirect, { replace: true });
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const savedRedirect = localStorage.getItem("enroll_redirect");
        const finalRedirect = safeInternalPath(redirectTo || savedRedirect);
        if (savedRedirect) localStorage.removeItem("enroll_redirect");
        navigate(finalRedirect, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let description = t("auth.invalidCredentials");
      if (error.message?.includes("Email not confirmed")) {
        description = t("auth.emailNotConfirmed");
      }
      toast({ title: t("auth.loginFailed"), description, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleData) {
      navigate("/admin");
    } else {
      // Stamp reset_version on profile
      try {
        const { data: setting } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "app_reset_version")
          .single();
        if (setting?.value) {
          await supabase
            .from("profiles")
            .update({ reset_version: setting.value } as any)
            .eq("user_id", data.user.id);
        }
      } catch { /* ignore */ }

      // Post-login: sync enroll_draft to enrollment if present
      try {
        const draftRaw = localStorage.getItem("enroll_draft");
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          if (draft.level || draft.package_id || draft.preferred_day) {
            const schedUpdate: Record<string, any> = {};
            if (draft.level) schedUpdate.level = draft.level;
            if (draft.package_id || draft.packageId) schedUpdate.package_id = draft.package_id || draft.packageId;
            if (draft.preferred_day || draft.days) schedUpdate.preferred_day = draft.preferred_day || draft.days;
            if (draft.preferred_time || draft.time) schedUpdate.preferred_time = draft.preferred_time || draft.time;
            if (draft.timezone || draft.tz) schedUpdate.timezone = draft.timezone || draft.tz;

            const { data: pending } = await supabase
              .from("enrollments")
              .select("id, level")
              .eq("user_id", data.user.id)
              .in("status", ["PENDING", "PENDING_PAYMENT"] as any)
              .order("created_at", { ascending: false })
              .limit(1);

            if (pending && pending.length > 0 && (!pending[0].level || pending[0].level === "")) {
              await supabase
                .from("enrollments")
                .update(schedUpdate as any)
                .eq("id", pending[0].id);
            }
            localStorage.removeItem("enroll_draft");
          }
        }
      } catch { /* ignore draft sync errors */ }

      const savedRedirect = localStorage.getItem("enroll_redirect");
      const finalRedirect = safeInternalPath(redirectTo || savedRedirect);
      if (savedRedirect) localStorage.removeItem("enroll_redirect");
      navigate(finalRedirect);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    // Always save intended redirect so we can use it after OAuth callback
    const intendedRedirect = safeInternalPath(redirectTo);
    localStorage.setItem("enroll_redirect", intendedRedirect);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/login` },
      });
      if (error) {
        localStorage.removeItem("enroll_redirect");
        toast({
          title: isAr ? "تسجيل الدخول عبر Google غير متاح" : "Google sign-in unavailable",
          description: isAr ? "يرجى استخدام البريد الإلكتروني وكلمة المرور، أو تواصل مع الدعم." : "Please use email and password to log in, or contact support.",
          variant: "destructive",
        });
      }
    } catch {
      localStorage.removeItem("enroll_redirect");
      toast({
        title: isAr ? "فشل تسجيل الدخول" : "Sign-in failed",
        description: isAr ? "يرجى استخدام البريد الإلكتروني وكلمة المرور." : "Please use email and password to log in.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex flex-col items-center justify-center px-4 gap-4">

        {/* Welcome strip */}
        <div className="flex items-center gap-3 flex-wrap justify-center text-sm text-muted-foreground">
          <span>{isAr ? "🔥 حافظ على سلسلتك" : "🔥 Keep your streak"}</span>
          <span className="text-border">·</span>
          <span>{isAr ? "⭐ تقييم 4.9" : "⭐ 4.9 rated academy"}</span>
          <span className="text-border">·</span>
          <span>🇰🇷 A1–C2</span>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.logIn")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{isAr ? "مرحباً بعودتك — تقدمك في انتظارك." : "Welcome back — your progress is waiting for you."}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.signingIn") : t("auth.logIn")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link to="/forgot-password" className="text-foreground font-semibold underline">{t("auth.forgotPassword")}</Link>
              </p>
              <p className="text-sm text-center text-muted-foreground">
                {t("auth.dontHaveAccount")} <Link to={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"} className="text-foreground font-semibold underline">{t("auth.signUp")}</Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          {isAr ? "جديد في Klovers؟ " : "New to Klovers? "}
          <Link
            to={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
            className="text-primary font-semibold hover:underline"
          >
            {isAr ? "أنشئ حساب مجاني ←" : "Create a free account →"}
          </Link>
        </p>

      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
