import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight } from "lucide-react";

type NegationType = "안" | "못" | "지 않다" | "지 못하다";

interface NegationQuestion {
  positive: string;
  english: string;
  negationType: NegationType;
  typeLabel: string;
  options: string[];
  correct: string;
  explanation: string;
}

const QUESTIONS: NegationQuestion[] = [
  {
    positive: "저는 커피를 마셔요.",
    english: "I drink coffee.",
    negationType: "안",
    typeLabel: "Simple negation: 안",
    options: ["저는 커피를 안 마셔요.", "저는 커피를 못 마셔요.", "저는 커피를 안 마십니다.", "저는 커피를 마시지 않아요."],
    correct: "저는 커피를 안 마셔요.",
    explanation: "안 is placed directly before the verb: 안 + 마셔요. This expresses a choice not to drink coffee.",
  },
  {
    positive: "저는 수영을 해요.",
    english: "I swim.",
    negationType: "못",
    typeLabel: "Inability: 못",
    options: ["저는 수영을 못 해요.", "저는 수영을 안 해요.", "저는 수영을 하지 못해요.", "저는 수영을 못 합니다."],
    correct: "저는 수영을 못 해요.",
    explanation: "못 negates due to inability or external circumstances. 못 + 해요 = can't swim (don't have the ability).",
  },
  {
    positive: "날씨가 좋아요.",
    english: "The weather is nice.",
    negationType: "지 않다",
    typeLabel: "Formal negation: -지 않다",
    options: ["날씨가 좋지 않아요.", "날씨가 안 좋아요.", "날씨가 못 좋아요.", "날씨가 좋지 않습니다."],
    correct: "날씨가 좋지 않아요.",
    explanation: "-지 않다 attaches to the verb/adjective stem: 좋다 → 좋지 않다. More formal and common in writing.",
  },
  {
    positive: "한국어를 말해요.",
    english: "I speak Korean.",
    negationType: "지 못하다",
    typeLabel: "Formal inability: -지 못하다",
    options: ["한국어를 말하지 못해요.", "한국어를 말하지 않아요.", "한국어를 못 말해요.", "한국어를 안 말해요."],
    correct: "한국어를 말하지 못해요.",
    explanation: "-지 못하다 = formal/written form of inability. 말하다 → 말하지 못하다. More formal than 못 말하다.",
  },
  {
    positive: "저는 고기를 먹어요.",
    english: "I eat meat.",
    negationType: "안",
    typeLabel: "Simple negation: 안",
    options: ["저는 고기를 안 먹어요.", "저는 고기를 못 먹어요.", "저는 고기가 없어요.", "저는 고기를 먹지 않아요."],
    correct: "저는 고기를 안 먹어요.",
    explanation: "안 + 먹어요 = choosing not to eat meat (e.g. vegetarian by choice). 못 먹어요 would mean unable to eat it.",
  },
  {
    positive: "어제 학교에 갔어요.",
    english: "I went to school yesterday.",
    negationType: "못",
    typeLabel: "Inability: 못",
    options: ["어제 학교에 못 갔어요.", "어제 학교에 안 갔어요.", "어제 학교에 가지 않았어요.", "어제 학교에 가지 못했어요."],
    correct: "어제 학교에 못 갔어요.",
    explanation: "못 갔어요 = couldn't go (due to inability/circumstances). 안 갔어요 = chose not to go.",
  },
  {
    positive: "저는 운동을 해요.",
    english: "I exercise.",
    negationType: "지 않다",
    typeLabel: "Formal negation: -지 않다",
    options: ["저는 운동을 하지 않아요.", "저는 운동을 안 해요.", "저는 운동을 못 해요.", "저는 운동하지 않습니다."],
    correct: "저는 운동을 하지 않아요.",
    explanation: "하다 → 하지 않다. In formal/written Korean, -지 않다 is preferred over 안 + verb.",
  },
  {
    positive: "노래를 잘 불러요.",
    english: "I sing well.",
    negationType: "못",
    typeLabel: "Inability: 못",
    options: ["노래를 잘 못 불러요.", "노래를 안 불러요.", "노래를 못 잘 불러요.", "노래를 불지 못해요."],
    correct: "노래를 잘 못 불러요.",
    explanation: "잘 못 = not well (못 modifies 불러요). Note: 잘못 (one word) means 'wrongly/mistake', so spacing matters!",
  },
  {
    positive: "이 문제를 알아요.",
    english: "I know this problem.",
    negationType: "지 않다",
    typeLabel: "Formal negation: -지 않다",
    options: ["이 문제를 알지 않아요.", "이 문제를 모르지 않아요.", "이 문제를 안 알아요.", "이 문제를 알지 못해요."],
    correct: "이 문제를 알지 않아요.",
    explanation: "알다 → 알지 않다. Note: 모르다 (not know) is the natural antonym, but 알지 않다 is grammatically also correct.",
  },
  {
    positive: "집에 있어요.",
    english: "I am at home.",
    negationType: "안",
    typeLabel: "Simple negation: 안",
    options: ["집에 안 있어요.", "집에 없어요.", "집에 못 있어요.", "집에 있지 않아요."],
    correct: "집에 없어요.",
    explanation: "있다 is special! Its natural negation is 없다, not 안 있다. 집에 없어요 = 'I'm not at home.'",
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TYPE_COLORS: Record<NegationType, string> = {
  "안": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  "못": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  "지 않다": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  "지 못하다": "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
};

const NegationGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const totalRounds = 8;
  const [questions] = useState(() => shuffleArray(QUESTIONS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const called = useRef(false);

  const q = questions[round];

  useEffect(() => {
    if (gameOver && !called.current) {
      called.current = true;
      onGameComplete?.(score, totalRounds);
    }
  }, [gameOver, score, onGameComplete]);

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (round + 1 >= totalRounds) { setGameOver(true); return; }
    setRound(r => r + 1);
    setSelected(null);
  };

  const restart = () => {
    called.current = false;
    setRound(0); setScore(0); setSelected(null); setGameOver(false);
  };

  if (gameOver) {
    const pct = Math.round((score / totalRounds) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold">부정문 Complete! ✋</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🌟 Excellent!" : pct >= 60 ? "👍 Good job!" : "📚 Keep practicing!"}</div>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {round + 1} of {totalRounds}</span>
        <span className="font-medium text-foreground" aria-live="polite" aria-atomic="true">{score} correct</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(round / totalRounds) * 100}%` }} />
      </div>

      <Card className="p-5 space-y-3">
        <Badge className={TYPE_COLORS[q.negationType]}>{q.typeLabel}</Badge>
        <p className="text-xs text-muted-foreground">Negate this sentence using <span className="font-mono font-bold">{q.negationType}</span>:</p>
        <div>
          <p className="text-xl font-bold text-foreground">{q.positive}</p>
          <p className="text-sm text-muted-foreground italic">"{q.english}"</p>
        </div>
      </Card>

      {selected && (
        <Card role="alert" className={`p-3 border-l-4 text-sm ${selected === q.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">{selected === q.correct ? "✅ Correct!" : `❌ Answer: ${q.correct}`}</p>
          <p className="text-xs text-muted-foreground">{q.explanation}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose the correct negation">
        {q.options.map(opt => {
          let extra = "";
          if (selected) {
            if (opt === q.correct) extra = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            else if (opt === selected) extra = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 line-through";
          }
          return (
            <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
              aria-label={opt}
              aria-pressed={selected === opt ? true : undefined}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${selected ? extra || "border-border opacity-50" : "border-border hover:border-primary hover:bg-primary/5"}`}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected && (
        <Button onClick={next} className="w-full gap-2">
          {round + 1 >= totalRounds ? <><Trophy className="h-4 w-4" /> See Results</> : <><ArrowRight className="h-4 w-4" /> Next</>}
        </Button>
      )}
    </div>
  );
};

export default NegationGame;
