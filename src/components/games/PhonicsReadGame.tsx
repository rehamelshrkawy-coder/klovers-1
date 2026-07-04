import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { useGameData, GameVocabItem } from "@/hooks/useGameData";

interface Question { romanization: string; meaning: string; answer: string; options: string[]; }

const FALLBACK_VOCAB: GameVocabItem[] = [
  { korean: "안녕하세요", romanization: "annyeonghaseyo", meaning: "Hello" },
  { korean: "감사합니다", romanization: "gamsahamnida", meaning: "Thank you" },
  { korean: "친구", romanization: "chingu", meaning: "Friend" },
  { korean: "학교", romanization: "hakgyo", meaning: "School" },
  { korean: "사랑", romanization: "sarang", meaning: "Love" },
  { korean: "음식", romanization: "eumsik", meaning: "Food" },
  { korean: "공부", romanization: "gongbu", meaning: "Study" },
  { korean: "한국", romanization: "hanguk", meaning: "Korea" },
  { korean: "물", romanization: "mul", meaning: "Water" },
  { korean: "행복", romanization: "haengbok", meaning: "Happiness" },
  { korean: "선생님", romanization: "seonsaengnim", meaning: "Teacher" },
  { korean: "가족", romanization: "gajok", meaning: "Family" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function buildQuestions(vocab: GameVocabItem[]): Question[] {
  const withRom = vocab.filter(v => v.romanization?.trim());
  const pool = withRom.length >= 8 ? withRom : FALLBACK_VOCAB;
  const shuffled = shuffleArray(pool);
  const allKorean = pool.map(v => v.korean);
  return shuffled.slice(0, 14).map(v => {
    const wrongs = shuffleArray(allKorean.filter(k => k !== v.korean)).slice(0, 3);
    return { romanization: v.romanization, meaning: v.meaning, answer: v.korean, options: shuffleArray([v.korean, ...wrongs]) };
  });
}

const PhonicsReadGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { vocab, loading: gameDataLoading } = useGameData();
  const totalRounds = 10;
  const vocabRef = useRef(vocab);
  useEffect(() => { vocabRef.current = vocab; }, [vocab]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [usingLesson, setUsingLesson] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const xpAwardedRef = useRef(false);

  const initQuestions = useCallback(() => {
    const built = buildQuestions(vocabRef.current);
    const withRom = vocabRef.current.filter(v => v.romanization?.trim());
    setUsingLesson(withRom.length >= 8);
    setQuestions(shuffleArray(built).slice(0, totalRounds));
    setRound(0); setScore(0); setFeedback(null); setSelected(null);
    xpAwardedRef.current = false;
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (!gameDataLoading && !initialized.current) { initialized.current = true; initQuestions(); }
  }, [gameDataLoading, initQuestions]);

  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, score, totalRounds, onGameComplete]);

  const handleAnswer = (ans: string) => {
    if (feedback || !questions.length) return;
    setSelected(ans);
    const correct = ans === questions[round].answer;
    if (correct) setScore(s => s + 1);
    setFeedback(correct ? "correct" : "wrong");
  };

  const nextRound = () => {
    if (round + 1 >= totalRounds) { setRound(round + 1); return; }
    setRound(r => r + 1); setFeedback(null); setSelected(null);
  };

  if (gameDataLoading || !questions.length) {
    return <section className="py-12 px-4"><div className="max-w-lg mx-auto text-center text-muted-foreground animate-pulse">Loading vocab…</div></section>;
  }

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Phonics Complete!</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={initQuestions} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Round {round + 1}/{totalRounds}</Badge>
          <div className="flex items-center gap-2">
            {usingLesson && <Badge variant="outline" className="text-xs">📚 From your lessons</Badge>}
            <Badge variant="secondary" aria-live="polite" aria-atomic="true"><Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />{score * 5} XP</Badge>
          </div>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Choose the Korean spelling for:</p>
          <p className="text-3xl font-bold text-foreground tracking-wide">{q.romanization}</p>
          <p className="text-muted-foreground text-sm italic">{q.meaning}</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the correct Korean spelling">
            {q.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={opt}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-3 rounded-lg font-bold border-2 transition-all text-2xl ${
                  feedback && opt === q.answer ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? "✅ Correct! +5 XP" : `❌ Answer: ${q.answer}`}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">Next <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={initQuestions} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> Restart</Button>
      </div>
    </section>
  );
};

export default PhonicsReadGame;
