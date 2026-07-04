import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";
import Korean from "@/components/Korean";
import { useGameData, GameVocabItem } from "@/hooks/useGameData";

interface Question { korean: string; romanization: string; meaning: string; }

const FALLBACK: Question[] = [
  { korean: "안녕하세요", romanization: "annyeonghaseyo", meaning: "Hello" },
  { korean: "감사합니다", romanization: "gamsahamnida", meaning: "Thank you" },
  { korean: "친구", romanization: "chingu", meaning: "Friend" },
  { korean: "학교", romanization: "hakgyo", meaning: "School" },
  { korean: "사랑", romanization: "sarang", meaning: "Love" },
  { korean: "음식", romanization: "eumsik", meaning: "Food" },
  { korean: "공부", romanization: "gongbu", meaning: "Study" },
  { korean: "한국", romanization: "hanguk", meaning: "Korea" },
  { korean: "물", romanization: "mul", meaning: "Water" },
  { korean: "네", romanization: "ne", meaning: "Yes" },
  { korean: "아니요", romanization: "aniyo", meaning: "No" },
  { korean: "선생님", romanization: "seonsaengnim", meaning: "Teacher" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function buildQuestions(vocab: GameVocabItem[]): Question[] {
  // Only use vocab that has romanization data
  const withRom = vocab.filter(v => v.romanization && v.romanization.trim() !== "");
  return withRom.length >= 8 ? shuffleArray(withRom).slice(0, 14) : FALLBACK;
}

const RomanizationGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { vocab, loading: gameDataLoading } = useGameData();
  const totalRounds = 10;
  const vocabRef = useRef(vocab);
  useEffect(() => { vocabRef.current = vocab; }, [vocab]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [usingLesson, setUsingLesson] = useState(false);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const xpAwardedRef = useRef(false);

  const initQuestions = useCallback(() => {
    const built = buildQuestions(vocabRef.current);
    const withRom = vocabRef.current.filter(v => v.romanization?.trim());
    setUsingLesson(withRom.length >= 8);
    setQuestions(shuffleArray(built).slice(0, totalRounds));
    setRound(0); setScore(0); setInput(""); setFeedback(null);
    xpAwardedRef.current = false;
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (!gameDataLoading && !initialized.current) { initialized.current = true; initQuestions(); }
  }, [gameDataLoading, initQuestions]);

  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, score, totalRounds, onGameComplete]);

  const handleSubmit = () => {
    if (feedback || !questions.length) return;
    const correct = input.trim().toLowerCase() === questions[round].romanization.toLowerCase();
    if (correct) setScore(s => s + 1);
    setFeedback(correct ? "correct" : "wrong");
  };

  const nextRound = () => {
    if (round + 1 >= totalRounds) { setRound(round + 1); return; }
    setRound(r => r + 1); setInput(""); setFeedback(null);
  };

  if (gameDataLoading || !questions.length) {
    return <section className="py-12 px-4"><div className="max-w-lg mx-auto text-center text-muted-foreground animate-pulse">Loading vocab…</div></section>;
  }

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Romanization Complete!</h2>
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
          <p className="text-sm text-muted-foreground">Type the romanization (pronunciation) of:</p>
          <Korean className="text-5xl font-bold text-foreground block">{q.korean}</Korean>
          <p className="text-muted-foreground text-sm">{q.meaning}</p>
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. annyeonghaseyo"
              disabled={!!feedback}
              className="border-2 border-border rounded-lg px-4 py-2 text-center text-lg bg-card text-foreground w-52 focus:outline-none focus:border-foreground/40"
            />
            {!feedback && <Button onClick={handleSubmit}>Check</Button>}
          </div>
          {feedback && (
            <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
              {feedback === "correct" ? "✅ Correct! +5 XP" : `❌ Answer: ${q.romanization}`}
            </p>
          )}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">Next <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={initQuestions} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> Restart</Button>
      </div>
    </section>
  );
};

export default RomanizationGame;
