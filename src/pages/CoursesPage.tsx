import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoursesSection from "@/components/CoursesSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CoursesPage = () => {
  useSEO({ title: "Korean Courses", description: "Explore Klovers Korean language courses — Beginner to Advanced. Live classes, flexible schedules, and certified teachers.", canonical: "https://kloversegy.com/courses" });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "courses-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Korean Language Courses at Klovers",
      "url": "https://kloversegy.com/courses",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "item": { "@type": "Course", "name": "Beginner Korean (A1–A2)", "description": "Start from scratch with Hangul, basic vocabulary, and essential grammar.", "provider": { "@id": "https://kloversegy.com/#organization" }, "url": "https://kloversegy.com/courses" } },
        { "@type": "ListItem", "position": 2, "item": { "@type": "Course", "name": "Intermediate Korean (B1–B2)", "description": "Build fluency with grammar patterns and real-life conversation practice.", "provider": { "@id": "https://kloversegy.com/#organization" }, "url": "https://kloversegy.com/courses" } },
        { "@type": "ListItem", "position": 3, "item": { "@type": "Course", "name": "Advanced Korean (C1–C2)", "description": "Master advanced Korean and prepare for TOPIK II.", "provider": { "@id": "https://kloversegy.com/#organization" }, "url": "https://kloversegy.com/courses" } }
      ]
    });
    document.head.appendChild(script);
    return () => { document.getElementById("courses-schema")?.remove(); };
  }, []);

  const { t, tArray } = useLanguage();
  const weeklyItems = tArray("courses", "weeklyStructure.items") as { title: string; description: string }[];
  const weeklyIcons = [BookOpen, Clock, RotateCcw];

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <CoursesSection />

        <section className="py-20 md:py-28 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-2">
                {t("courses", "weeklyStructure.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("courses", "weeklyStructure.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {weeklyItems.map((item, index) => {
                const Icon = weeklyIcons[index];
                return (
                  <Card key={index} className="text-center border-border">
                    <CardContent className="p-6">
                      <Icon className="h-8 w-8 text-primary-text mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Button size="lg" asChild>
                <Link to="/pricing">{t("courses", "cta")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CoursesPage;
