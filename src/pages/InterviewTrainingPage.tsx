import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const RehamTrainingPanel = lazy(() => import("@/components/admin/RehamTrainingPanel"));

const ACCESS_PASSWORD = "klovers2026";

export default function InterviewTrainingPage() {
  const { t } = useLanguage();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-xl">{t("interviewTraining.gateTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("interviewTraining.gateTag")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("interviewTraining.gateHint")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t("interviewTraining.gatePlaceholder")}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  className="pl-10"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center">{t("interviewTraining.gateWrong")}</p>
              )}
              <Button type="submit" className="w-full gap-2">
                <Lock className="h-4 w-4" /> {t("interviewTraining.gateAccess")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              {t("interviewTraining.gateTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("interviewTraining.gateTag")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAuthenticated(false); setPassword(""); }}
            className="gap-1.5 text-xs"
          >
            <Lock className="h-3.5 w-3.5" /> {t("interviewTraining.lock")}
          </Button>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div>}>
          <RehamTrainingPanel />
        </Suspense>
      </div>
    </div>
  );
}
