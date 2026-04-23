import { useSEO } from "@/hooks/useSEO";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import rehamKorea1 from "@/assets/reham-korea-1.jpg";
import rehamKorea2 from "@/assets/reham-korea-2.jpg";

const TRUST_STATS = [
  { value: "12+", label: "Years Teaching" },
  { value: "500+", label: "Students Taught" },
  { value: "4.9 ★", label: "Average Rating" },
  { value: "15+", label: "Countries" },
  { value: "A1–C2", label: "All Levels" },
];

const AboutPage = () => {
  useSEO({ title: "About Us", description: "Meet the Klovers team. Our certified teachers bring years of experience teaching Korean to students worldwide.", canonical: "https://kloversegy.com/about" });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "about-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "url": "https://kloversegy.com/about",
      "name": "About Klovers — Korean Lovers Academy",
      "description": "Certified Korean teacher, born from a love of the language and a mission to make it accessible worldwide.",
      "mainEntity": { "@id": "https://kloversegy.com/#organization" }
    });
    document.head.appendChild(script);
    return () => { document.getElementById("about-schema")?.remove(); };
  }, []);

  const { t, tArray } = useLanguage();
  const experienceItems = tArray("aboutPage", "experience.items") as string[];

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground text-center mb-4">
              {t("aboutPage", "title")}
            </h1>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto text-base md:text-lg">
              Certified Korean teacher, born from a love of the language and a mission to make it accessible worldwide.
            </p>

            {/* Trust stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-3xl mx-auto mb-12">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="text-center bg-card border border-border rounded-xl px-4 py-4">
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              <div className="rounded-xl overflow-hidden shadow-md">
                <img src={rehamKorea1} alt="Reham Elshrkawy visiting traditional Korean architecture" className="w-full h-72 object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-md">
                <img src={rehamKorea2} alt="Reham Elshrkawy at the Korean seaside" className="w-full h-72 object-cover" />
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-12">
              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "story.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("aboutPage", "story.content")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "philosophy.title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("aboutPage", "philosophy.content")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {t("aboutPage", "experience.title")}
                  </h2>
                  <ul className="space-y-3">
                    {experienceItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Mid-page CTA */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container mx-auto px-4 text-center max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Ready to start?</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Join thousands of students learning Korean
            </h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Not sure where to begin? Take our free placement test and discover your level in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/placement-test">🎯 Free Placement Test</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
