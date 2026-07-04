import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const NUMBERS = [
  { korean: "하나", sino: "일", value: 1 },
  { korean: "둘", sino: "이", value: 2 },
  { korean: "셋", sino: "삼", value: 3 },
  { korean: "넷", sino: "사", value: 4 },
  { korean: "다섯", sino: "오", value: 5 },
  { korean: "여섯", sino: "육", value: 6 },
  { korean: "일곱", sino: "칠", value: 7 },
  { korean: "여덟", sino: "팔", value: 8 },
  { korean: "아홉", sino: "구", value: 9 },
  { korean: "열", sino: "십", value: 10 },
  { korean: "스물", sino: "이십", value: 20 },
  { korean: "서른", sino: "삼십", value: 30 },
  { korean: "백", sino: "백", value: 100 },
  { korean: "천", sino: "천", value: 1000 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const NumbersGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [questions, setQuestions] = useState(() => shuffleArray(NUMBERS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>(() => {
    const q = shuffleArray(NUMBERS).slice(0, totalRounds);
    return generateOptions(q[0].value);
  });

  function generateOptions(correct: number): number[] {
    const opts = new Set<number>([correct]);
    while (opts.size < 4) { const r = NUMBERS[Math.floor(Math.random() * NUMBERS.length)].value; opts.add(r); }
    return shuffleArray([...opts]);
  }

  const handleAnswer = (value: number) => {
    if (feedback) return; setSelected(value);
    if (value === questions[round].value) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => {
    const next = round + 1;
    if (next >= totalRounds) { setRound(next); return; }
    setRound(next); setOptions(generateOptions(questions[next].value)); setFeedback(null); setSelected(null);
  };

  const restart = () => {
    const q = shuffleArray(NUMBERS).slice(0, totalRounds);
    setQuestions(q); setRound(0); setScore(0); setFeedback(null); setSelected(null); setOptions(generateOptions(q[0].value));
  };

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.numbersComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  const useNative = Math.random() > 0.5;

  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{score * 5} XP</Badge>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.numbersPrompt")}</p>
          <p className="text-4xl font-bold text-foreground">{useNative ? q.korean : q.sino}</p>
          <p className="text-xs text-muted-foreground">{useNative ? t("games.nativeKorean") : t("games.sinoKorean")}</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the correct number">
            {options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={String(opt)}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-4 rounded-lg text-xl font-bold border-2 transition-all ${
                  feedback && opt === q.value ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected && opt !== q.value ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? t("games.correctFeedback") : t("games.numbersWrong").replace("{value}", String(q.value))}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default NumbersGame;
