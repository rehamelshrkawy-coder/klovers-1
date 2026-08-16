import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  CreditCard,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const stepIcons = [UserPlus, CreditCard, CheckCircle2];
const stepLinks = ["/signup", "/pricing", "/enroll-now"];

const EnrollSection = () => {
  const { t, tArray } = useLanguage();
  const steps = tArray("enroll", "steps") as {
    title: string; description: string; buttonText?: string;
  }[];

  return (
    <section id="enroll" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-3 text-sm font-medium text-foreground animate-pulse">
            <Clock className="h-5 w-5 text-destructive shrink-0" />
            <span>{t("enroll", "urgency")}</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t("enroll", "badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("enroll", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("enroll", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            const link = stepLinks[index];
            return (
              <Card
                key={index}
                className="relative group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/50 overflow-hidden"
              >
                <div className="absolute -top-2 -start-2 w-12 h-12 bg-primary rounded-br-2xl flex items-center justify-center border-b border-e border-black/25">
                  <span className="text-primary-foreground font-bold text-xl">
                    {index + 1}
                  </span>
                </div>

                <CardContent className="pt-12 pb-6 px-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-black/25 shadow-sm">
                    <Icon className="h-8 w-8 text-primary-foreground transition-colors" />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4">
                    {step.description}
                  </p>

                  <Button asChild className="w-full">
                    <Link to={link}>
                      {step.buttonText || t("enroll", "enrollNow") || "Enroll Now"}
                    </Link>
                  </Button>
                </CardContent>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -end-4 w-8 h-0.5 bg-border" />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EnrollSection;
