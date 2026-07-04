import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight } from "lucide-react";

type Tense = "present" | "past" | "future";

interface TenseQuestion {
  source: string;
  sourceTense: Tense;
  targetTense: Tense;
  english: string;
  options: string[];
  correct: string;
  explanation: string;
}

const QUESTIONS: TenseQuestion[] = [
  {
    source: "저는 밥을 먹어요.",
    sourceTense: "present",
    targetTense: "past",
    english: "I eat rice.",
    options: ["저는 밥을 먹었어요.", "저는 밥을 먹을 거예요.", "저는 밥을 먹었습니다.", "저는 밥을 먹겠어요."],
    correct: "저는 밥을 먹었어요.",
    explanation: "먹어요 (present) → 먹었어요 (past). Past tense: verb stem + -았/었어요. 먹다 → 먹 + 었어요 = 먹었어요.",
  },
  {
    source: "친구를 만났어요.",
    sourceTense: "past",
    targetTense: "future",
    english: "I met a friend.",
    options: ["친구를 만날 거예요.", "친구를 만나요.", "친구를 만나겠어요.", "친구를 만날게요."],
    correct: "친구를 만날 거예요.",
    explanation: "만났어요 (past) → 만날 거예요 (future). Future: verb stem + -(으)ㄹ 거예요. 만나다 → 만날 거예요.",
  },
  {
    source: "내일 공부할 거예요.",
    sourceTense: "future",
    targetTense: "present",
    english: "I will study tomorrow.",
    options: ["지금 공부해요.", "지금 공부했어요.", "지금 공부할 거예요.", "지금 공부하겠어요."],
    correct: "지금 공부해요.",
    explanation: "할 거예요 (future) → 해요 (present). Note: '내일' changes to '지금' for the present context.",
  },
  {
    source: "비가 와요.",
    sourceTense: "present",
    targetTense: "past",
    english: "It is raining.",
    options: ["비가 왔어요.", "비가 올 거예요.", "비가 왔습니다.", "비가 올게요."],
    correct: "비가 왔어요.",
    explanation: "오다 (come/rain) → 왔어요 (past). 오 + 았어요 → 왔어요 (vowel contraction: 오 + 아 = 와).",
  },
  {
    source: "저는 한국에 갔어요.",
    sourceTense: "past",
    targetTense: "future",
    english: "I went to Korea.",
    options: ["저는 한국에 갈 거예요.", "저는 한국에 가요.", "저는 한국에 가겠어요.", "저는 한국에 갈게요."],
    correct: "저는 한국에 갈 거예요.",
    explanation: "갔어요 (past) → 갈 거예요 (future). 가다 → 가 + ㄹ 거예요 = 갈 거예요.",
  },
  {
    source: "음악을 들을 거예요.",
    sourceTense: "future",
    targetTense: "past",
    english: "I will listen to music.",
    options: ["음악을 들었어요.", "음악을 들어요.", "음악을 들겠어요.", "음악을 듣겠어요."],
    correct: "음악을 들었어요.",
    explanation: "들을 거예요 (future) → 들었어요 (past). 듣다 is ㄷ-irregular: 듣 → 들 + 었어요 = 들었어요.",
  },
  {
    source: "책을 읽어요.",
    sourceTense: "present",
    targetTense: "future",
    english: "I read a book.",
    options: ["책을 읽을 거예요.", "책을 읽었어요.", "책을 읽겠어요.", "책을 읽을게요."],
    correct: "책을 읽을 거예요.",
    explanation: "읽어요 (present) → 읽을 거예요 (future). 읽다 ends in consonant cluster → 읽 + 을 거예요 = 읽을 거예요.",
  },
  {
    source: "어제 영화를 봤어요.",
    sourceTense: "past",
    targetTense: "present",
    english: "I watched a movie yesterday.",
    options: ["지금 영화를 봐요.", "지금 영화를 볼 거예요.", "지금 영화를 봤어요.", "지금 영화를 보겠어요."],
    correct: "지금 영화를 봐요.",
    explanation: "봤어요 (past) → 봐요 (present). 보다 → 봐요. Note: time word changes from 어제 to 지금.",
  },
  {
    source: "내일 운동할 거예요.",
    sourceTense: "future",
    targetTense: "past",
    english: "I will exercise tomorrow.",
    options: ["어제 운동했어요.", "어제 운동해요.", "어제 운동하겠어요.", "어제 운동하겠습니다."],
    correct: "어제 운동했어요.",
    explanation: "할 거예요 (future) → 했어요 (past). 하다 past tense: 했어요. Time word: 내일 → 어제.",
  },
  {
    source: "지금 자요.",
    sourceTense: "present",
    targetTense: "future",
    english: "I am sleeping now.",
    options: ["나중에 잘 거예요.", "나중에 잤어요.", "나중에 자겠어요.", "나중에 자요."],
    correct: "나중에 잘 거예요.",
    explanation: "자요 (present) → 잘 거예요 (future). 자다 → 자 + ㄹ 거예요 = 잘 거예요.",
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

const TENSE_COLORS: Record<Tense, string> = {
  present: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  past: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  future: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
};
const TENSE_LABELS: Record<Tense, string> = {
  present: "Present 현재",
  past: "Past 과거",
  future: "Future 미래",
};

const TenseShiftGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
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
        <h2 className="text-2xl font-bold">시제 Master! ⏱️</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🌟 Time master!" : pct >= 60 ? "👍 Good work!" : "📚 Keep practicing!"}</div>
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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={TENSE_COLORS[q.sourceTense]}>{TENSE_LABELS[q.sourceTense]}</Badge>
          <span className="text-muted-foreground text-sm">→</span>
          <Badge className={TENSE_COLORS[q.targetTense]}>{TENSE_LABELS[q.targetTense]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Convert to {TENSE_LABELS[q.targetTense]}:</p>
        <div>
          <p className="text-xl font-bold text-foreground">{q.source}</p>
          <p className="text-sm text-muted-foreground italic">"{q.english}"</p>
        </div>
      </Card>

      {selected && (
        <Card role="alert" className={`p-3 border-l-4 text-sm ${selected === q.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">{selected === q.correct ? "✅ Correct!" : `❌ Answer: ${q.correct}`}</p>
          <p className="text-xs text-muted-foreground">{q.explanation}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose the correct tense form">
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

export default TenseShiftGame;
