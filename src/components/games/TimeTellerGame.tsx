import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight, Clock } from "lucide-react";

const TIME_QS = [
  { korean: "한 시", answer: "1:00", options: ["1:00", "2:00", "11:00", "10:00"] },
  { korean: "두 시 삼십 분", answer: "2:30", options: ["2:30", "3:30", "12:30", "2:03"] },
  { korean: "세 시", answer: "3:00", options: ["3:00", "4:00", "13:00", "30:00"] },
  { korean: "다섯 시 십오 분", answer: "5:15", options: ["5:15", "5:50", "15:05", "5:05"] },
  { korean: "여덟 시", answer: "8:00", options: ["8:00", "6:00", "9:00", "7:00"] },
  { korean: "열두 시", answer: "12:00", options: ["12:00", "2:00", "10:00", "20:00"] },
  { korean: "아홉 시 사십오 분", answer: "9:45", options: ["9:45", "9:15", "4:45", "9:54"] },
  { korean: "열한 시 이십 분", answer: "11:20", options: ["11:20", "11:02", "10:20", "12:20"] },
  { korean: "네 시 반", answer: "4:30", options: ["4:30", "4:00", "3:30", "4:03"] },
  { korean: "일곱 시 십 분", answer: "7:10", options: ["7:10", "7:01", "10:07", "6:10"] },
  { korean: "여섯 시", answer: "6:00", options: ["6:00", "7:00", "16:00", "60:00"] },
  { korean: "열 시 오 분", answer: "10:05", options: ["10:05", "10:50", "5:10", "10:15"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const TimeTellerGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [questions] = useState(() => shuffleArray(TIME_QS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleAnswer = (ans: string) => {
    if (feedback) return; setSelected(ans);
    if (ans === questions[round].answer) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setFeedback(null); setSelected(null); };
  const restart = () => { setRound(0); setScore(0); setFeedback(null); setSelected(null); };

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.timeComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <Badge variant="secondary" aria-live="polite" aria-atomic="true"><Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />{score * 5} XP</Badge>
        </div>
        <Card className="p-6 text-center space-y-4">
          <Clock className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("games.timePrompt")}</p>
          <p className="text-3xl font-bold text-foreground">{q.korean}</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the correct time">
            {shuffleArray(q.options).map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={opt}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-4 rounded-lg font-bold text-2xl border-2 transition-all ${
                  feedback && opt === q.answer ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? t("games.correctFeedback") : t("games.wrongPrefix").replace("{answer}", q.answer)}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default TimeTellerGame;
