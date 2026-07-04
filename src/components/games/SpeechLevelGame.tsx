import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight, ChevronUp } from "lucide-react";

type Level = "formal" | "polite" | "casual";

interface Question {
  source: string;
  sourceLevel: Level;
  targetLevel: Level;
  targetLabel: string;
  english: string;
  options: string[];
  correct: string;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    source: "저는 학생입니다.",
    sourceLevel: "formal",
    targetLevel: "polite",
    targetLabel: "Polite (해요체)",
    english: "I am a student.",
    options: ["저는 학생이에요.", "나는 학생이야.", "저는 학생이야.", "나는 학생이에요."],
    correct: "저는 학생이에요.",
    explanation: "합쇼체 (-입니다) → 해요체 (-이에요). 저는 stays. 나는 would be too casual for 해요체.",
  },
  {
    source: "뭐 먹을래?",
    sourceLevel: "casual",
    targetLevel: "polite",
    targetLabel: "Polite (해요체)",
    english: "What do you want to eat?",
    options: ["뭐 드실래요?", "뭐 먹을래요?", "뭐 드시겠습니까?", "뭐 드세요?"],
    correct: "뭐 먹을래요?",
    explanation: "Adding -요 to a casual sentence makes it polite (해요체). 먹을래 → 먹을래요. 드시다 is a different (honorific) verb.",
  },
  {
    source: "지금 어디 가세요?",
    sourceLevel: "polite",
    targetLevel: "casual",
    targetLabel: "Casual (반말)",
    english: "Where are you going now?",
    options: ["지금 어디 가?", "지금 어디 가니?", "지금 어디 가요?", "지금 어디 갈래?"],
    correct: "지금 어디 가?",
    explanation: "해요체 (-세요 / -요) → 반말: remove -요 and change -세요 to the base stem. 가세요 → 가.",
  },
  {
    source: "감사합니다.",
    sourceLevel: "formal",
    targetLevel: "polite",
    targetLabel: "Polite (해요체)",
    english: "Thank you.",
    options: ["감사해요.", "고마워.", "감사하세요.", "고마워요."],
    correct: "감사해요.",
    explanation: "감사합니다 (합쇼체) → 감사해요 (해요체). Both use the same stem 감사하다.",
  },
  {
    source: "오늘 날씨 좋다.",
    sourceLevel: "casual",
    targetLevel: "polite",
    targetLabel: "Polite (해요체)",
    english: "The weather is nice today.",
    options: ["오늘 날씨 좋아요.", "오늘 날씨 좋습니다.", "오늘 날씨 좋으세요.", "오늘 날씨 좋아."],
    correct: "오늘 날씨 좋아요.",
    explanation: "Add -요 to the casual ending: 좋다 → 좋아 (casual) → 좋아요 (polite). 좋습니다 is formal, not polite.",
  },
  {
    source: "밥 먹었어요?",
    sourceLevel: "polite",
    targetLevel: "casual",
    targetLabel: "Casual (반말)",
    english: "Did you eat?",
    options: ["밥 먹었어?", "밥 먹었니?", "밥 먹었습니까?", "밥 드셨어?"],
    correct: "밥 먹었어?",
    explanation: "Remove -요 from past polite ending: 먹었어요 → 먹었어. This is the simplest 반말 conversion.",
  },
  {
    source: "어디서 오셨습니까?",
    sourceLevel: "formal",
    targetLevel: "polite",
    targetLabel: "Polite (해요체)",
    english: "Where are you from?",
    options: ["어디서 오셨어요?", "어디서 왔어요?", "어디 왔어?", "어디서 오셨습니까?"],
    correct: "어디서 오셨어요?",
    explanation: "합쇼체 (-셨습니까) → 해요체 (-셨어요). The honorific stem 오시다 is kept in polite speech.",
  },
  {
    source: "잠깐만요.",
    sourceLevel: "polite",
    targetLevel: "casual",
    targetLabel: "Casual (반말)",
    english: "Just a moment.",
    options: ["잠깐만.", "잠깐요.", "잠깐합니다.", "잠깐이야."],
    correct: "잠깐만.",
    explanation: "Removing -요 from 잠깐만요 gives the casual 잠깐만. These short interjection-style phrases simplify this way.",
  },
  {
    source: "저도 몰라요.",
    sourceLevel: "polite",
    targetLevel: "formal",
    targetLabel: "Formal (합쇼체)",
    english: "I don't know either.",
    options: ["저도 모릅니다.", "나도 몰라.", "저도 모르세요.", "저도 몰라요."],
    correct: "저도 모릅니다.",
    explanation: "해요체 (-요) → 합쇼체 (-ㅂ니다/-습니다). 모르다 → 모릅니다. 저도 stays as it's already formal pronoun.",
  },
  {
    source: "지금 바빠.",
    sourceLevel: "casual",
    targetLevel: "formal",
    targetLabel: "Formal (합쇼체)",
    english: "I'm busy now.",
    options: ["지금 바쁩니다.", "지금 바빠요.", "지금 바쁘세요.", "지금 바빠요?"],
    correct: "지금 바쁩니다.",
    explanation: "Casual → Formal: 바빠 (반말) → 바쁩니다 (합쇼체). Note the ㅂ irregular: 바쁘다 + -ㅂ니다 → 바쁩니다.",
  },
];

const LEVEL_COLORS: Record<Level, string> = {
  formal: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  polite: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  casual: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
};
const LEVEL_LABEL: Record<Level, string> = {
  formal: "Formal 합쇼체",
  polite: "Polite 해요체",
  casual: "Casual 반말",
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SpeechLevelGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
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
        <div>
          <h2 className="text-2xl font-bold">Speech Level Master!</h2>
          <p className="text-muted-foreground mt-1">{score}/{totalRounds} correct ({pct}%)</p>
        </div>
        <div className="text-3xl">{pct >= 80 ? "🎖️ Excellent!" : pct >= 60 ? "👍 Good job!" : "📚 Keep practicing!"}</div>
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

      {/* Task */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={LEVEL_COLORS[q.sourceLevel]}>{LEVEL_LABEL[q.sourceLevel]}</Badge>
          <ChevronUp className="h-3 w-3 text-muted-foreground rotate-90" />
          <Badge className={LEVEL_COLORS[q.targetLevel]}>{q.targetLabel}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Convert this sentence to {q.targetLabel}:</p>
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

      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose the correct speech level form">
        {q.options.map(opt => {
          let extra = "";
          if (selected) {
            if (opt === q.correct) extra = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            else if (opt === selected) extra = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 line-through";
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected}
              aria-label={opt}
              aria-pressed={selected === opt ? true : undefined}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${selected ? extra || "border-border opacity-50" : "border-border hover:border-primary hover:bg-primary/5"}`}
            >
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

export default SpeechLevelGame;
