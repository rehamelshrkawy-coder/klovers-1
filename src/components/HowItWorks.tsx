import { Card, CardContent } from "@/components/ui/card";
import { Video, Users, MessageCircle, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const stepIcons = [Video, Users, MessageCircle, TrendingUp];

const HowItWorks = () => {
  const { t, tArray } = useLanguage();
  const steps = tArray("howItWorks", "steps") as { title: string; description: string }[];

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
            {t("howItWorks", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t("howItWorks", "subtitle")}
          </p>
        </div>

        {/* dir="ltr" keeps step order 1→4 left-to-right even in RTL locales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto" dir="ltr">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              // Wrapper carries the relative context so the badge is NOT clipped by the Card
              <div key={index} className="relative pt-3">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-black/25">
                    {index + 1}
                  </span>
                </div>
                <Card className="group hover:shadow-md transition-all duration-300 border-border hover:border-primary/40 text-center h-full">
                  <CardContent className="pt-8 pb-6 px-4">
                    <div className="w-12 h-12 rounded-xl bg-primary border border-black/25 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#E6E600] transition-colors">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    {/* dir="auto" lets each card's text flow in the document's language direction */}
                    <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base" dir="auto">{step.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed" dir="auto">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8">
            <Link to="/free-trial">
              {t("howItWorks", "cta")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
