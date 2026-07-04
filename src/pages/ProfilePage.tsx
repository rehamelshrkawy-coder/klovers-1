import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import AvatarUpload from "@/components/AvatarUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Globe, GraduationCap, BookOpen, Gamepad2, CalendarDays, LayoutDashboard, LogOut, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LEVELS = ["A0 Absolute Beginner", "A1 Beginner", "A2 Elementary", "B1 Intermediate", "B2 Upper-Intermediate", "C1 Advanced", "C2 Mastery"];
const COUNTRIES = ["Egypt", "Saudi Arabia", "UAE", "Jordan", "Kuwait", "Bahrain", "Qatar", "Oman", "Libya", "Morocco", "Tunisia", "Algeria", "Other"];

interface Profile {
  user_id: string;
  name: string;
  avatar_url: string;
  level: string;
  country: string;
}

const ProfilePage = () => {
  useSEO({ title: "My Profile | Klovers Korean Academy", description: "Manage your Klovers profile", noindex: true });
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      setEmail(session.user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, level, country")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        setName(data.name || "");
        setLevel(data.level || "");
        setCountry(data.country || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), level, country })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // These belong to the just-ended session — clear them so they can't
    // redirect the next person to sign in on this device to someone else's page.
    localStorage.removeItem("enroll_redirect");
    localStorage.removeItem("enroll_draft");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAr ? "ملفي الشخصي" : "My Profile"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr ? "إدارة معلوماتك الشخصية وإعدادات التعلم" : "Manage your personal information and learning settings"}
            </p>
          </div>

          {/* Avatar + Name Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {isAr ? "الصورة الشخصية والاسم" : "Photo & Name"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <AvatarUpload
                  userId={userId}
                  currentUrl={avatarUrl}
                  name={name}
                  onUploaded={(url) => setAvatarUrl(url)}
                />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? "الاسم الكامل" : "Full name"}</p>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? "أدخل اسمك" : "Enter your name"}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                {isAr ? "البريد الإلكتروني" : "Email Address"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
                <span className="text-sm text-foreground font-medium">{email}</span>
                <Badge variant="secondary" className="text-xs">{isAr ? "مؤكد" : "Verified"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isAr ? "لتغيير البريد الإلكتروني تواصل مع الدعم" : "To change your email address, contact support"}
              </p>
            </CardContent>
          </Card>

          {/* Learning Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                {isAr ? "معلومات التعلم" : "Learning Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">{isAr ? "مستوى الكورية" : "Korean Level"}</p>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder={isAr ? "اختر مستواك" : "Select your level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  <Globe className="h-3 w-3 inline mr-1" />
                  {isAr ? "الدولة" : "Country"}
                </p>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder={isAr ? "اختر دولتك" : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <Button onClick={handleSave} disabled={saving} className="w-full h-11">
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
          </Button>

          {/* Quick Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? "روابط سريعة" : "Quick Links"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: LayoutDashboard, label: isAr ? "لوحة التحكم" : "Dashboard",      href: "/dashboard" },
                  { icon: CalendarDays,    label: isAr ? "جدولي" : "My Schedule",           href: "/dashboard/schedule" },
                  { icon: BookOpen,        label: isAr ? "الكتاب المدرسي" : "Textbook",     href: "/textbook" },
                  { icon: Gamepad2,        label: isAr ? "الألعاب" : "Games",               href: "/games" },
                ].map(({ icon: Icon, label, href }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm font-medium text-foreground text-left"
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardContent className="pt-6">
              <Button variant="outline" onClick={handleLogout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                <LogOut className="h-4 w-4" />
                {isAr ? "تسجيل الخروج" : "Sign Out"}
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
