import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const COUNTERS = [
  { item: "3 people", answer: "세 명", options: ["세 명", "세 개", "세 마리", "세 권"] },
  { item: "2 animals", answer: "두 마리", options: ["두 마리", "두 명", "두 개", "두 잔"] },
  { item: "5 books", answer: "다섯 권", options: ["다섯 권", "다섯 개", "다섯 장", "다섯 병"] },
  { item: "1 cup of coffee", answer: "커피 한 잔", options: ["커피 한 잔", "커피 한 개", "커피 한 병", "커피 한 그릇"] },
  { item: "4 general objects", answer: "네 개", options: ["네 개", "네 명", "네 권", "네 마리"] },
  { item: "2 bottles of water", answer: "물 두 병", options: ["물 두 병", "물 두 잔", "물 두 개", "물 두 그릇"] },
  { item: "1 car/vehicle", answer: "한 대", options: ["한 대", "한 개", "한 명", "한 마리"] },
  { item: "3 sheets of paper", answer: "세 장", options: ["세 장", "세 권", "세 개", "세 병"] },
  { item: "6 years old", answer: "여섯 살", options: ["여섯 살", "여섯 년", "여섯 개", "여섯 번"] },
  { item: "2 bowls of rice", answer: "밥 두 그릇", options: ["밥 두 그릇", "밥 두 잔", "밥 두 개", "밥 두 병"] },
  { item: "1 house/building", answer: "한 채", options: ["한 채", "한 대", "한 개", "한 명"] },
  { item: "3 times", answer: "세 번", options: ["세 번", "세 개", "세 명", "세 대"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const CounterWordsGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [questions] = useState(() => shuffleArray(COUNTERS).slice(0, totalRounds));
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
        <h2 className="text-2xl font-bold text-foreground">{t("games.countersComplete")}</h2>
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
          <p className="text-sm text-muted-foreground">{t("games.countersPrompt")}</p>
          <p className="text-2xl font-bold text-foreground">"{q.item}"</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the correct counter word">
            {shuffleArray(q.options).map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={opt}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-3 rounded-lg font-semibold border-2 transition-all text-lg ${
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

export default CounterWordsGame;
