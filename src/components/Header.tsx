import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, UserCircle, ChevronDown, LogOut, LayoutDashboard, CalendarDays, Zap, Brain, Sun, Moon, Settings, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import kloversLogo from "@/assets/klovers-logo.jpg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logLeadEvent } from "@/lib/leadTracking";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isAr = language === "ar";

  // Load profile whenever the logged-in user changes
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("name, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const primaryLinks = [
    { href: "/", label: t("header", "home") },
    { href: "/courses", label: t("header", "courses") },
    { href: "/pricing", label: t("header", "pricing") },
    { href: "/textbook", label: isAr ? "الكتاب" : "Textbook" },
    { href: "/games", label: isAr ? "ألعاب" : "Games", badge: !user ? (isAr ? "مجاني" : "Free") : undefined },
  ];

  const moreLinks = [
    { href: "/blog", label: isAr ? "المدونة" : "Blog" },
    { href: "/about", label: t("header", "about") },
    { href: "/faq", label: t("header", "faq") },
    { href: "/contact", label: t("header", "contact") },
  ];

  const allLinks = [...primaryLinks, ...moreLinks];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg">Skip to main content</a>
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/98 backdrop-blur-md shadow-sm" : "bg-background/95 backdrop-blur-sm"} border-b border-border`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="K-Lovers homepage">
            <img src={kloversLogo} alt="K-Lovers" className="h-9 w-9 rounded-full object-cover" loading="eager" />
            <span className="font-bold text-lg text-foreground">K-Lovers</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                  isActive(link.href)
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors inline-flex items-center gap-1">
                {isAr ? "المزيد" : "More"}
                <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.href} onClick={() => navigate(link.href)} className={isActive(link.href) ? "bg-accent" : ""}>
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8" aria-label="Toggle dark mode">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              {t("header", "langToggle")}
            </Button>

            {!user && (
              <Button size="sm" variant="outline" asChild className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                <Link
                  to="/free-trial"
                  onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "header_free_trial" }); } catch { /* Analytics must not block navigation. */ } }}
                >
                  🎁 {isAr ? "حصة مجانية" : "Free Trial"}
                </Link>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="h-8 w-8 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                      {profile?.name || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {isAr ? "لوحة التحكم" : "My Dashboard"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/trial-booking")}>
                    <Gift className="h-4 w-4 mr-2" />
                    {isAr ? "احجز حصة مجانية" : "Book Free Trial"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className="h-4 w-4 mr-2" />
                    {isAr ? "ملفي الشخصي" : "My Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/schedule")}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {isAr ? "جدولي" : "My Schedule"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/daily-quiz")}>
                    <Zap className="h-4 w-4 mr-2" />
                    {isAr ? "اختبار يومي" : "Daily Quiz"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/review")}>
                    <Brain className="h-4 w-4 mr-2" />
                    {isAr ? "مراجعة المفردات" : "Vocab Review"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {isAr ? "تسجيل الخروج" : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild>
                <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    isActive(link.href) ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                  {"badge" in link && link.badge && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                      {link.badge as React.ReactNode}
                    </span>
                  )}
                </Link>
              ))}

              <div className="border-t border-border my-2" />

              <Button variant="ghost" size="sm" onClick={toggleTheme} className="gap-2 justify-start">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? (isAr ? "الوضع النهاري" : "Light Mode") : (isAr ? "الوضع الليلي" : "Dark Mode")}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2 justify-start">
                <Globe className="h-4 w-4" />
                {t("header", "langToggle")}
              </Button>

              {user ? (
                <>
                  <Button variant="outline" asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />{isAr ? "لوحة التحكم" : "My Dashboard"}</Link>
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="ghost" size="sm" asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/dashboard/schedule"><CalendarDays className="h-4 w-4 mr-1" />{isAr ? "جدول" : "Schedule"}</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/daily-quiz"><Zap className="h-4 w-4 mr-1" />{isAr ? "اختبار" : "Quiz"}</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/review"><Brain className="h-4 w-4 mr-1" />{isAr ? "مراجعة" : "Review"}</Link>
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" />{isAr ? "تسجيل الخروج" : "Logout"}
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                  <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;
