import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight } from "lucide-react";

interface HonorificQuestion {
  casual: string;
  casualMeaning: string;
  honorific: string;
  options: string[];
  explanation: string;
  category: string;
}

const QUESTIONS: HonorificQuestion[] = [
  {
    casual: "먹어요",
    casualMeaning: "(you/they) eat",
    honorific: "드세요",
    options: ["드세요", "먹으세요", "잡수세요", "드려요"],
    explanation: "먹다 (eat) → 드시다 (honorific). 드세요 is 드시다 + -어요. Used when speaking to or about someone you respect.",
    category: "Eating/Drinking",
  },
  {
    casual: "자요",
    casualMeaning: "(you/they) sleep",
    honorific: "주무세요",
    options: ["주무세요", "자시세요", "쉬세요", "누우세요"],
    explanation: "자다 (sleep) → 주무시다 (honorific). An entirely different verb: 주무시다.",
    category: "Daily Actions",
  },
  {
    casual: "말해요",
    casualMeaning: "(you/they) speak / say",
    honorific: "말씀하세요",
    options: ["말씀하세요", "말하시세요", "이야기하세요", "말씀드려요"],
    explanation: "말하다 (speak) → 말씀하시다 (honorific). 말씀 is the honorific noun for 말(words/speech).",
    category: "Communication",
  },
  {
    casual: "있어요",
    casualMeaning: "(you/they) are / have",
    honorific: "계세요",
    options: ["계세요", "있으세요", "있으시어요", "되세요"],
    explanation: "있다 (exist/be) → 계시다 (honorific). 계세요 is used for people being present in a place or having something.",
    category: "Existence",
  },
  {
    casual: "아파요",
    casualMeaning: "(you/they) are sick",
    honorific: "편찮으세요",
    options: ["편찮으세요", "아프세요", "불편하세요", "힘드세요"],
    explanation: "아프다 (sick/in pain) → 편찮으시다 (honorific). Used when asking about or describing an elder's health.",
    category: "Health",
  },
  {
    casual: "죽었어요",
    casualMeaning: "(they) died",
    honorific: "돌아가셨어요",
    options: ["돌아가셨어요", "죽으셨어요", "가셨어요", "없어지셨어요"],
    explanation: "죽다 (die) → 돌아가시다 (honorific). 돌아가시다 literally means 'returned (to heaven)' — used respectfully.",
    category: "Sensitive Topics",
  },
  {
    casual: "줘요",
    casualMeaning: "give (to me)",
    honorific: "주세요",
    options: ["주세요", "드려요", "드리세요", "받으세요"],
    explanation: "줘요 is casual (give me). 주세요 is the polite request form. Note: 드리다 means 'give' upward (from lower to higher status).",
    category: "Giving/Receiving",
  },
  {
    casual: "알아요",
    casualMeaning: "(you) know",
    honorific: "아세요",
    options: ["아세요", "알으세요", "알고 계세요", "아시겠어요"],
    explanation: "알다 (know) + -시- (honorific marker) + -어요 = 아세요. The ㄹ drops before 시: 알 + 시 = 아시.",
    category: "Cognition",
  },
  {
    casual: "보여요",
    casualMeaning: "(you) see / it can be seen",
    honorific: "보이세요",
    options: ["보이세요", "보세요", "보시어요", "보실게요"],
    explanation: "보이다 (to be visible) + -시- = 보이시다 → 보이세요. Different from 보다 (to look at).",
    category: "Senses",
  },
  {
    casual: "집에 있어요",
    casualMeaning: "(you) are at home",
    honorific: "집에 계세요",
    options: ["집에 계세요", "집에 있으세요", "집이세요", "집에 계십니까"],
    explanation: "있어요 (casual) → 계세요 (honorific) for people. 집에 계세요 = 'Are you at home?' / 'They are at home.'",
    category: "Location",
  },
  {
    casual: "밥 먹었어요?",
    casualMeaning: "Did (you) eat?",
    honorific: "식사하셨어요?",
    options: ["식사하셨어요?", "밥 드셨어요?", "먹으셨어요?", "식사하셨습니까?"],
    explanation: "Both 밥 드셨어요? and 식사하셨어요? are correct honorifics. 식사하시다 uses the noun 식사 (meal) + 하시다. More formal than 드시다.",
    category: "Eating/Drinking",
  },
  {
    casual: "어디 가요?",
    casualMeaning: "Where are you going?",
    honorific: "어디 가세요?",
    options: ["어디 가세요?", "어디 가시어요?", "어디 가셔요?", "어디 가십니까?"],
    explanation: "가다 (go) + -시- + -어요 = 가세요. The polite honorific form for asking elders/respected people where they are going.",
    category: "Daily Actions",
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

const HonorificGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
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
    if (opt === q.honorific) setScore(s => s + 1);
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
        <h2 className="text-2xl font-bold">존댓말 Complete! 🙇</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🌟 Very respectful!" : pct >= 60 ? "👍 Getting there!" : "📚 Keep practicing!"}</div>
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{q.category}</Badge>
          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs">존댓말</Badge>
        </div>
        <p className="text-xs text-muted-foreground">What is the honorific (존댓말) form of:</p>
        <div className="space-y-0.5">
          <p className="text-2xl font-bold text-foreground">{q.casual}</p>
          <p className="text-sm text-muted-foreground italic">"{q.casualMeaning}"</p>
        </div>
      </Card>

      {selected && (
        <Card role="alert" className={`p-3 border-l-4 text-sm ${selected === q.honorific ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">{selected === q.honorific ? "✅ Correct!" : `❌ Answer: ${q.honorific}`}</p>
          <p className="text-xs text-muted-foreground">{q.explanation}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose the correct honorific form">
        {q.options.map(opt => {
          let extra = "";
          if (selected) {
            if (opt === q.honorific) extra = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            else if (opt === selected) extra = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 line-through";
          }
          return (
            <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
              aria-label={opt}
              aria-pressed={selected === opt ? true : undefined}
              className={`w-full text-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${selected ? extra || "border-border opacity-50" : "border-border hover:border-primary hover:bg-primary/5"}`}>
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

export default HonorificGame;
