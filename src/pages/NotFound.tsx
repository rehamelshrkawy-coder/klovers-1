import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Gamepad2, BookOpen, HelpCircle, FileText, Phone } from "lucide-react";

const NotFound = () => {
  useSEO({ title: "Page Not Found", description: "This page doesn't exist.", noindex: true });
  const location = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const QUICK_LINKS = [
    { href: "/", label: isAr ? "الرئيسية" : "Home", icon: Home, desc: isAr ? "العودة للبداية" : "Back to the start" },
    { href: "/free-trial", label: isAr ? "حصة مجانية" : "Free Trial", icon: BookOpen, desc: isAr ? "احجز حصة مجانية" : "Book a free class", badge: isAr ? "مجاني" : "Free" },
    { href: "/games", label: isAr ? "ألعاب مجانية" : "Free Games", icon: Gamepad2, desc: isAr ? "العب بدون تسجيل" : "Play without logging in" },
    { href: "/placement-test", label: isAr ? "اختبار المستوى" : "Placement Test", icon: BookOpen, desc: isAr ? "اعرف مستواك" : "Find your level" },
    { href: "/pricing", label: isAr ? "الأسعار" : "Pricing", icon: FileText, desc: isAr ? "الخطط والأسعار" : "See plans & costs" },
    { href: "/faq", label: isAr ? "الأسئلة الشائعة" : "FAQ", icon: HelpCircle, desc: isAr ? "أسئلة شائعة" : "Common questions" },
  ];

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404: Route not found:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center space-y-8 max-w-xl w-full">

          {/* Hero */}
          <div className="space-y-3">
            <div className="flex justify-center gap-3 text-4xl select-none" aria-hidden="true">
              {["잠", "깐", "!"].map((ch, i) => (
                <span
                  key={ch}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 font-bold text-primary text-outlined border border-primary/20 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms`, animationDuration: "2s" }}
                >
                  {ch}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{isAr ? "잠깐! — \"انتظر!\" بالكورية" : "잠깐! — \"Wait!\" in Korean"}</p>
            <h1 className="text-3xl font-extrabold text-foreground">{isAr ? "الصفحة غير موجودة" : "Page not found"}</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {isAr ? "هذه الصفحة غير موجودة أو تم نقلها. إليك بعض الأماكن التي قد تبحث عنها:" : "This page doesn't exist or has been moved. Here are some places you might be looking for:"}
            </p>
          </div>

          {/* Quick links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon, desc, badge }) => (
              <Link
                key={href}
                to={href}
                className="group flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-md transition-all duration-200 text-center relative"
              >
                {badge && (
                  <span className="absolute top-2 right-2 text-[9px] bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                    {badge}
                  </span>
                )}
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <Button asChild size="lg" className="gap-2">
            <Link to="/"><Home className="h-4 w-4" /> {isAr ? "العودة للرئيسية" : "Back to Home"}</Link>
          </Button>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
