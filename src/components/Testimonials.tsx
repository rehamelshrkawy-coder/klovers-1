import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AVATAR_COLORS = [
  "from-[#E8D9FF] to-[#EFE6FF]",
  "from-[#D6E8FF] to-[#D7F7F7]",
  "from-[#FFD9E6] to-[#FFE5CC]",
  "from-[#FFE5CC] to-[#DFFFE6]",
  "from-[#CFF7D3] to-[#D7F7F7]",
  "from-[#EFE6FF] to-[#D6E8FF]",
];

const STATS = [
  { value: "500+", label: "Students Taught" },
  { value: "4.9 ★", label: "Average Rating" },
  { value: "15+", label: "Countries" },
  { value: "98%", label: "Would Recommend" },
];

const Testimonials = () => {
  const { t, tArray } = useLanguage();
  const items = tArray("testimonials", "items") as { name: string; quote: string; location: string; photo?: string }[];
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    refs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setVisible(p => new Set(p).add(i)); obs.disconnect(); } },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [items.length]);

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-background">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-200/15 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/15 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-widest mb-4 border border-black/15 shadow-sm">
            Student Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("testimonials", "title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("testimonials", "subtitle")}
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
          {STATS.map((s) => (
            <div key={s.label} className="text-center bg-card border border-border rounded-xl px-4 py-4 hover:border-amber-300 transition-colors">
              <div className="text-xl md:text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <div
              key={index}
              ref={el => { refs.current[index] = el; }}
              style={{ transitionDelay: `${index * 100}ms` }}
              className={`group relative bg-card border border-border rounded-2xl p-6 hover:border-amber-300 hover:shadow-xl transition-all duration-500 ease-out flex flex-col ${
                visible.has(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* Large decorative quote */}
              <div className="absolute top-4 right-5 text-6xl font-serif text-amber-400/15 leading-none select-none group-hover:text-amber-400/25 transition-colors">
                "
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed italic flex-1 mb-6">
                "{item.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 shadow-md overflow-hidden ${item.photo ? "" : `bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} flex items-center justify-center`}`}>
                  {item.photo
                    ? <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-sm">{item.name.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
