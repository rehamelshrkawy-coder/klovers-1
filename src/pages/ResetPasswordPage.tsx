import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ResetPasswordPage = () => {
  useSEO({ title: "Reset Password | Klovers Korean Academy", description: "Set a new password for your Klovers Korean Academy account.", noindex: true });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) setExpired(true);
        return ready;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: t("auth.passwordTooShort"), variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: t("auth.passwordsDontMatch"), variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("same_password") || msg.includes("same password") || msg.includes("different password")) {
        toast({ title: t("auth.samePassword"), variant: "destructive" });
      } else {
        toast({ title: t("auth.linkExpiredDesc"), variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    toast({ title: t("auth.updatePassword"), description: t("auth.passwordUpdated") });
    navigate("/login");
  };

  if (expired && !sessionReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("auth.linkExpired")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{t("auth.linkExpiredDesc")}</p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">{t("auth.requestNewLink")}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-text" />
            <p className="text-muted-foreground">{t("auth.verifyingLink")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.setNewPassword")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                type="password"
                placeholder={t("auth.newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                type="password"
                placeholder={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.updating") : t("auth.updatePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
