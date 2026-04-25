import { useLanguage } from "@/contexts/LanguageContext";
import { Users, BookOpen, Award, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { logLeadEvent } from "@/lib/leadTracking";

const highlightIcons = [Users, BookOpen, Award];

const MeetTeacher = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  const highlights = tArray("teacher", "highlights") as { label: string; description: string }[];

  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-5 border border-black/15 shadow-sm">
            Our Educators
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
            {t("teacher", "title")}
          </h2>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

          {/* Photo column */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Subtle warm glow backdrop */}
              <div className="absolute -inset-6 rounded-3xl bg-amber-200/20 blur-3xl" />
              {/* Decorative border offset */}
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-3xl border-2 border-amber-300/50" />
              {/* Photo card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-200 ring-1 ring-black/10 w-72 md:w-80 lg:w-96">
                <img
                  src={rehamPhoto}
                  alt={t("teacher", "name")}
                  className="w-full aspect-[3/4] object-cover object-top"
                />
                {/* Name overlay at bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-5">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-amber-300 shrink-0" />
                    <span className="text-amber-300 text-xs font-bold tracking-wider uppercase">TOPIK Certified</span>
                  </div>
                  <p className="text-white font-bold text-lg leading-tight">{t("teacher", "name")}</p>
                  <p className="text-amber-300 text-sm font-semibold mt-0.5">{isAr ? "المدرّسة الرئيسية" : "Lead Korean Instructor"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text column */}
          <div className="flex flex-col gap-8">

            {/* Bio */}
            <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              <p className="text-foreground font-medium">{t("teacher", "bio1")}</p>
              <p>{t("teacher", "bio2")}</p>
              <p>{t("teacher", "bio3")}</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {highlights.map((item, index) => {
                const Icon = highlightIcons[index];
                return (
                  <div
                    key={index}
                    className="group flex flex-col items-center text-center bg-muted/50 hover:bg-amber-50 border border-border hover:border-amber-300 rounded-2xl p-4 md:p-5 transition-all duration-300 ring-1 ring-black/5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center mb-3 transition-colors border border-black/10">
                      <Icon className="h-5 w-5 text-amber-700" />
                    </div>
                    <span className="text-foreground font-extrabold text-lg md:text-xl leading-none">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground text-xs md:text-sm mt-1 leading-snug">
                      {item.description}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Team note */}
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed border-l-2 border-amber-400 pl-4 italic">
              {t("teacher", "bio4")}
            </p>

            {/* Typical student timeline — pedagogical clarity */}
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {isAr ? "مسار طالب عادي" : "Typical student journey"}
              </p>
              <div className="flex gap-0 items-stretch">
                {(isAr ? [
                  { m: "شهر ١", desc: "هانغل + تحيات" },
                  { m: "شهر ٣", desc: "محادثات A2" },
                  { m: "شهر ٦", desc: "B1 واثق" },
                ] : [
                  { m: "Month 1", desc: "Hangul + greetings" },
                  { m: "Month 3", desc: "A2 conversations" },
                  { m: "Month 6", desc: "Confident B1" },
                ]).map(({ m, desc }, i, arr) => (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1 text-center relative">
                    <div className="flex items-center w-full">
                      <div className={`h-px flex-1 bg-border ${i === 0 ? "opacity-0" : ""}`} />
                      <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shrink-0" />
                      <div className={`h-px flex-1 bg-border ${i === arr.length - 1 ? "opacity-0" : ""}`} />
                    </div>
                    <p className="text-[10px] font-bold text-primary">{m}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Button
                size="lg"
                asChild
                className="gap-2 text-base font-bold h-12 px-8"
                onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "meet_teacher_cta" }); } catch {} }}
              >
                <Link to="/free-trial">
                  {t("teacher", "cta")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MeetTeacher;
