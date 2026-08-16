import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, ArrowRight, Zap, Trophy, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GAMES = [
  { emoji: "🃏", title: "Memory Match",     desc: "Match Korean words to meanings",   color: "from-[#FFE5CC]/40 to-[#FFE5CC]/10", border: "hover:border-[#FFE5CC]",  hot: true  },
  { emoji: "⚡", title: "Hangul Quiz",      desc: "Master Korean alphabet fast",       color: "from-[#D6E8FF]/40 to-[#D6E8FF]/10",   border: "hover:border-[#D6E8FF]",    hot: false },
  { emoji: "🎬", title: "K-Drama Quiz",     desc: "Learn through K-Drama phrases",     color: "from-[#FFD9E6]/40 to-[#FFD9E6]/10",   border: "hover:border-[#FFD9E6]",    hot: true  },
  { emoji: "🧩", title: "Sentence Builder", desc: "Arrange words into sentences",      color: "from-[#E8D9FF]/40 to-[#E8D9FF]/10", border: "hover:border-[#E8D9FF]", hot: false },
  { emoji: "🔢", title: "Numbers Game",     desc: "Korean numbers & counting",         color: "from-[#CFF7D3]/40 to-[#CFF7D3]/10", border: "hover:border-[#CFF7D3]",   hot: false },
  { emoji: "🎨", title: "Color Match",      desc: "Colors in Korean",                  color: "from-[#FFD9E6]/40 to-[#FFD9E6]/10",     border: "hover:border-[#FFD9E6]",     hot: false },
  { emoji: "📝", title: "Verb Conjugation", desc: "Conjugate verbs correctly",         color: "from-[#FFE5CC]/40 to-[#FFE5CC]/10", border: "hover:border-[#FFE5CC]", hot: false },
  { emoji: "👋", title: "Greeting Master",  desc: "Greetings & polite expressions",    color: "from-[#D7F7F7]/40 to-[#D7F7F7]/10",   border: "hover:border-[#D7F7F7]",    hot: false },
  { emoji: "↔️", title: "Opposites",        desc: "Learn antonyms in Korean",          color: "from-[#EFE6FF]/40 to-[#EFE6FF]/10", border: "hover:border-[#EFE6FF]", hot: false },
  { emoji: "✏️", title: "Fill the Blank",   desc: "Complete the sentences",            color: "from-[#D7F7F7]/40 to-[#D7F7F7]/10",   border: "hover:border-[#D7F7F7]",    hot: false },
  { emoji: "🔀", title: "Word Scramble",    desc: "Unscramble Korean words",           color: "from-[#DFFFE6]/40 to-[#DFFFE6]/10",   border: "hover:border-[#DFFFE6]",    hot: false },
  { emoji: "🔢", title: "Counter Words",    desc: "Korean counting classifiers",       color: "from-[#FFE5CC]/40 to-[#FFE5CC]/10", border: "hover:border-[#FFE5CC]",   hot: false },
  { emoji: "⏰", title: "Time Teller",      desc: "Tell time in Korean",               color: "from-[#EFE6FF]/40 to-[#EFE6FF]/10", border: "hover:border-[#EFE6FF]", hot: false },
];

const STATS = [
  { icon: Gamepad2, value: "13",   label: "Games"    },
  { icon: Zap,      value: "+XP",  label: "Every Win" },
  { icon: Trophy,   value: "Free", label: "Forever"   },
  { icon: Star,     value: "4.9★", label: "Rated"     },
];

const HOMEPAGE_GAMES = GAMES.slice(0, 6);

const HomeGamesSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-4 relative overflow-hidden bg-muted/20">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div
          className={`text-center mb-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary-text px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-black/15 shadow-sm">
            <Gamepad2 className="h-4 w-4" />
            {t("games.learnPlay")}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
            {t("games.homeTitle")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            {t("games.homeSubtitle")}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
                <div className="h-7 w-7 rounded-lg bg-primary/15 border border-black/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="text-start">
                  <p className="font-bold text-foreground text-sm leading-none">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Games grid */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8 transition-all duration-700 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {HOMEPAGE_GAMES.map((game) => (
            <button
              key={game.title}
              onClick={() => navigate("/games")}
              className={`group relative rounded-2xl bg-gradient-to-br ${game.color} border border-border ${game.border} hover:shadow-lg transition-all duration-200 p-4 text-start cursor-pointer`}
            >
              {game.hot && (
                <span className="absolute top-2 end-2 text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                  🔥
                </span>
              )}
              <div className="text-3xl mb-2">{game.emoji}</div>
              <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{game.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{game.desc}</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-primary-text font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Play now <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}

          {/* "Play All" card */}
          <button
            onClick={() => navigate("/games")}
            className="group rounded-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 p-4 text-start cursor-pointer flex flex-col justify-between shadow-lg shadow-primary/20"
          >
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px] w-fit mb-2">
              All Free
            </Badge>
            <div>
              <p className="font-bold text-primary-foreground text-sm leading-tight">See All 13 Games</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs text-primary-foreground/80">Start now</span>
                <ArrowRight className="h-3 w-3 text-primary-foreground/80 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* XP banner */}
        <div
          className={`bg-gradient-to-r from-primary/15 via-primary/10 to-green-500/10 border border-border rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-center sm:text-start">
            <p className="font-bold text-foreground text-sm">🏆 Earn XP with every game you play</p>
            <p className="text-xs text-muted-foreground">Climb the leaderboard · Unlock badges · Show off your streak</p>
          </div>
          <div className="flex gap-2 text-xs shrink-0">
            {["🥇 Top Learner", "🔥 On Fire", "📚 Scholar"].map((b) => (
              <span key={b} className="bg-card border border-border rounded-full px-2.5 py-1 font-medium text-foreground">{b}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-400 ${visible ? "opacity-100" : "opacity-0"}`}>
          <Button size="lg" onClick={() => navigate("/games")} className="text-base px-10 gap-2 h-12 shadow-lg shadow-primary/25">
            <Gamepad2 className="h-4 w-4" />
            Play All 13 Games Free
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Login to track XP & appear on the leaderboard</p>
        </div>
      </div>
    </section>
  );
};

export default HomeGamesSection;
