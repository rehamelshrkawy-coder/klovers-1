import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const COLORS = [
  { korean: "빨간색", english: "Red", hex: "#EF4444" },
  { korean: "파란색", english: "Blue", hex: "#3B82F6" },
  { korean: "노란색", english: "Yellow", hex: "#EAB308" },
  { korean: "초록색", english: "Green", hex: "#22C55E" },
  { korean: "보라색", english: "Purple", hex: "#A855F7" },
  { korean: "주황색", english: "Orange", hex: "#F97316" },
  { korean: "분홍색", english: "Pink", hex: "#EC4899" },
  { korean: "하얀색", english: "White", hex: "#F8FAFC" },
  { korean: "검은색", english: "Black", hex: "#1E293B" },
  { korean: "갈색", english: "Brown", hex: "#92400E" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function generateQ(colors: typeof COLORS) {
  const q = colors[0];
  const opts = new Set([q.english]);
  while (opts.size < 4) opts.add(COLORS[Math.floor(Math.random() * COLORS.length)].english);
  return { question: q, options: shuffleArray([...opts]) };
}

const ColorMatchGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [qData, setQData] = useState(() => generateQ(shuffleArray(COLORS)));

  const handleAnswer = (ans: string) => {
    if (feedback) return; setSelected(ans);
    if (ans === qData.question.english) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => {
    if (round + 1 >= totalRounds) { setRound(round + 1); return; }
    setRound(r => r + 1); setQData(generateQ(shuffleArray(COLORS))); setFeedback(null); setSelected(null);
  };

  const restart = () => {
    setRound(0); setScore(0); setFeedback(null); setSelected(null); setQData(generateQ(shuffleArray(COLORS)));
  };

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.colorsComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{score * 5} XP</Badge>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.colorsPrompt")}</p>
          <div className="w-24 h-24 rounded-2xl mx-auto border border-border shadow-sm" style={{ backgroundColor: qData.question.hex }} />
          <p className="text-3xl font-bold text-foreground">{qData.question.korean}</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the correct color name">
            {qData.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={opt}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-3 rounded-lg font-semibold border-2 transition-all ${
                  feedback && opt === qData.question.english ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? t("games.correctFeedback") : t("games.colorsWrong").replace("{answer}", qData.question.english)}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default ColorMatchGame;
