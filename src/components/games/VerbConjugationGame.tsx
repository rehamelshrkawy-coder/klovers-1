import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { useGameData, GameExerciseItem } from "@/hooks/useGameData";

interface Question { base: string; form: string; answer: string; options: string[]; }

const VERBS: Question[] = [
  { base: "가다 (to go)", form: "Polite present", answer: "가요", options: ["가요", "갔어요", "갈 거예요", "가세요"] },
  { base: "먹다 (to eat)", form: "Polite present", answer: "먹어요", options: ["먹어요", "먹었어요", "먹을 거예요", "드세요"] },
  { base: "하다 (to do)", form: "Polite present", answer: "해요", options: ["해요", "했어요", "할 거예요", "하세요"] },
  { base: "보다 (to see)", form: "Polite past", answer: "봤어요", options: ["봐요", "봤어요", "볼 거예요", "보세요"] },
  { base: "오다 (to come)", form: "Polite present", answer: "와요", options: ["와요", "왔어요", "올 거예요", "오세요"] },
  { base: "마시다 (to drink)", form: "Polite present", answer: "마셔요", options: ["마셔요", "마셨어요", "마실 거예요", "드세요"] },
  { base: "읽다 (to read)", form: "Polite past", answer: "읽었어요", options: ["읽어요", "읽었어요", "읽을 거예요", "읽으세요"] },
  { base: "쓰다 (to write)", form: "Polite present", answer: "써요", options: ["써요", "썼어요", "쓸 거예요", "쓰세요"] },
  { base: "자다 (to sleep)", form: "Polite future", answer: "잘 거예요", options: ["자요", "잤어요", "잘 거예요", "주무세요"] },
  { base: "사다 (to buy)", form: "Polite past", answer: "샀어요", options: ["사요", "샀어요", "살 거예요", "사세요"] },
  { base: "듣다 (to listen)", form: "Polite present", answer: "들어요", options: ["들어요", "들었어요", "들을 거예요", "들으세요"] },
  { base: "만나다 (to meet)", form: "Polite present", answer: "만나요", options: ["만나요", "만났어요", "만날 거예요", "만나세요"] },
];

const FILLER_OPTIONS = ["해요", "했어요", "할 거예요", "하세요"];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function buildQuestions(exercises: GameExerciseItem[]): Question[] {
  if (exercises.length >= 5) {
    return shuffleArray(exercises).slice(0, 12).map(e => {
      const answer = e.options[e.correct_index] ?? e.options[0] ?? "";
      const opts = e.options.length >= 2
        ? e.options
        : [...e.options, ...FILLER_OPTIONS.filter(o => !e.options.includes(o))].slice(0, 4);
      return { base: e.question, form: e.explanation || "", answer, options: opts };
    });
  }
  return VERBS;
}

const VerbConjugationGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const { exercises, loading: gameDataLoading } = useGameData();
  const totalRounds = 10;

  const exercisesRef = useRef(exercises);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [usingLessonExercises, setUsingLessonExercises] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const xpAwardedRef = useRef(false);

  const initQuestions = useCallback(() => {
    const built = buildQuestions(exercisesRef.current);
    setUsingLessonExercises(exercisesRef.current.length >= 5);
    setQuestions(shuffleArray(built).slice(0, totalRounds));
    setRound(0);
    setScore(0);
    setFeedback(null);
    setSelected(null);
    xpAwardedRef.current = false;
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (!gameDataLoading && !initialized.current) {
      initialized.current = true;
      initQuestions();
    }
  }, [gameDataLoading, initQuestions]);

  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  const handleAnswer = (ans: string) => {
    if (feedback || questions.length === 0) return;
    setSelected(ans);
    if (ans === questions[round].answer) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setFeedback(null); setSelected(null); };

  if (gameDataLoading || questions.length === 0) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center text-muted-foreground animate-pulse">Loading exercises…</div>
      </section>
    );
  }

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.verbsComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={initQuestions} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <div className="flex items-center gap-2">
            {usingLessonExercises && <Badge variant="outline" className="text-xs gap-1">📚 From your lessons</Badge>}
            <Badge variant="secondary" aria-live="polite" aria-atomic="true"><Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />{score * 5} XP</Badge>
          </div>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.verbsPrompt")}</p>
          <p className="text-2xl font-bold text-foreground">{q.base}</p>
          {q.form && <Badge variant="outline">{q.form}</Badge>}
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose the correct verb conjugation">
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
        <Button variant="ghost" size="sm" onClick={initQuestions} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default VerbConjugationGame;
