import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { useGameData, GameExerciseItem } from "@/hooks/useGameData";

interface Question { question: string; answer: string; options: string[]; explanation: string; }

const FALLBACK: Question[] = [
  { question: "저는 학생입니다.", answer: "I am a student.", options: ["I am a student.", "I am a teacher.", "I am Korean.", "I am tired."], explanation: "저는 = I (topic), 학생 = student, 입니다 = am/is (formal)" },
  { question: "이것은 책입니다.", answer: "This is a book.", options: ["This is a book.", "This is a pen.", "This is water.", "This is food."], explanation: "이것은 = this (topic), 책 = book, 입니다 = is (formal)" },
  { question: "저는 한국어를 공부합니다.", answer: "I study Korean.", options: ["I study Korean.", "I speak Korean.", "I like Korean.", "I teach Korean."], explanation: "한국어를 = Korean (object), 공부합니다 = study (formal)" },
  { question: "학교에 갑니다.", answer: "I go to school.", options: ["I go to school.", "I am at school.", "I like school.", "I leave school."], explanation: "학교에 = to school, 갑니다 = go (formal)" },
  { question: "오늘 날씨가 좋아요.", answer: "The weather is nice today.", options: ["The weather is nice today.", "Today is my birthday.", "I feel good today.", "I'm going outside today."], explanation: "오늘 = today, 날씨가 = weather (subject), 좋아요 = is good" },
  { question: "배고파요.", answer: "I'm hungry.", options: ["I'm hungry.", "I'm tired.", "I'm cold.", "I'm sleepy."], explanation: "배고파요 = I'm hungry (polite)" },
  { question: "뭐 먹었어요?", answer: "What did you eat?", options: ["What did you eat?", "Are you hungry?", "Do you like food?", "Where did you eat?"], explanation: "뭐 = what, 먹었어요 = ate (polite past)" },
  { question: "저는 커피를 마셔요.", answer: "I drink coffee.", options: ["I drink coffee.", "I like coffee.", "I buy coffee.", "I make coffee."], explanation: "커피를 = coffee (object), 마셔요 = drink (polite)" },
  { question: "한국어 잘 해요!", answer: "Your Korean is good!", options: ["Your Korean is good!", "I love Korean!", "Korean is difficult!", "Speak Korean!"], explanation: "한국어 = Korean, 잘 = well, 해요 = do/speak (polite)" },
  { question: "안녕히 가세요.", answer: "Goodbye (to someone leaving).", options: ["Goodbye (to someone leaving).", "Good morning.", "Thank you.", "Welcome."], explanation: "안녕히 = peacefully, 가세요 = please go — said to someone who is leaving" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function buildQuestions(exercises: GameExerciseItem[]): Question[] {
  if (exercises.length >= 5) {
    return shuffleArray(exercises).slice(0, 12).map(e => {
      const answer = e.options[e.correct_index] ?? e.options[0] ?? "";
      const opts = e.options.length >= 2 ? e.options : [...e.options, "—", "—", "—"].slice(0, 4);
      return { question: e.question, answer, options: opts, explanation: e.explanation || "" };
    });
  }
  return FALLBACK;
}

const SentenceReadGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { exercises, loading: gameDataLoading } = useGameData();
  const totalRounds = 10;
  const exercisesRef = useRef(exercises);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [usingLesson, setUsingLesson] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const xpAwardedRef = useRef(false);

  const initQuestions = useCallback(() => {
    const built = buildQuestions(exercisesRef.current);
    setUsingLesson(exercisesRef.current.length >= 5);
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
    return <section className="py-12 px-4"><div className="max-w-lg mx-auto text-center text-muted-foreground animate-pulse">Loading exercises…</div></section>;
  }

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Reading Complete!</h2>
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
        <Card className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4" /> Read and choose the correct meaning:</p>
          <p className="text-2xl font-bold text-foreground text-center">{q.question}</p>
          <div className="grid gap-3" role="group" aria-label="Choose the correct meaning for this sentence">
            {shuffleArray(q.options).map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={opt}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-3 rounded-lg font-medium border-2 transition-all text-left text-sm ${
                  feedback && opt === q.answer ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && (
            <div role="alert" className={`p-3 rounded-lg text-sm ${feedback === "correct" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
              {feedback === "correct" ? "✅ Correct! +5 XP" : `❌ Answer: ${q.answer}`}
              {q.explanation && <p className="text-muted-foreground text-xs mt-1">{q.explanation}</p>}
            </div>
          )}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">Next <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={initQuestions} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> Restart</Button>
      </div>
    </section>
  );
};

export default SentenceReadGame;
