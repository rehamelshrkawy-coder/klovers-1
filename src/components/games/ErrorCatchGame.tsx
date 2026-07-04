import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight, Bug } from "lucide-react";

interface ErrorQuestion {
  sentence: string;
  english: string;
  error: string;       // the wrong word/particle
  correction: string;  // the correct version
  options: string[];   // what's wrong, options to replace it
  correct: string;     // correct replacement
  explanation: string;
  category: string;
}

const QUESTIONS: ErrorQuestion[] = [
  {
    sentence: "저는 학교에서 갑니다.",
    english: "I go to school.",
    error: "에서",
    correction: "에",
    options: ["에", "를", "이", "의"],
    correct: "에",
    explanation: "에서 marks location of an action (e.g. 학교에서 공부해요). 에 marks direction/destination. 'Go to school' = 학교에 가다.",
    category: "Particle",
  },
  {
    sentence: "저는 사과을 먹어요.",
    english: "I eat apples.",
    error: "을",
    correction: "를",
    options: ["를", "이", "은", "에"],
    correct: "를",
    explanation: "Object particle: 을 is used after a consonant (밥을, 책을). 사과 ends in a vowel, so 를 is correct: 사과를.",
    category: "Particle",
  },
  {
    sentence: "어제 저는 친구를 만났습니다.",
    english: "Yesterday I met a friend.",
    error: "만났습니다",
    correction: "만났습니다",
    options: ["만났습니다", "만나습니다", "만나겠습니다", "만낫습니다"],
    correct: "만났습니다",
    explanation: "This sentence is actually correct! 만나다 (meet) + 았 (past) + 습니다 = 만났습니다. Learning to spot correct sentences is also a skill!",
    category: "Trick Question",
  },
  {
    sentence: "저는 커피를 마시고 싶습니다.",
    english: "I want to drink coffee.",
    error: "마시고 싶습니다",
    correction: "마시고 싶습니다",
    options: ["마시고 싶습니다", "마셔 싶습니다", "마시면 싶습니다", "마시는 싶습니다"],
    correct: "마시고 싶습니다",
    explanation: "Correct! V + -고 싶다 is the pattern for 'want to'. 마시다 + -고 싶다 = 마시고 싶다 (→ 마시고 싶습니다 formal).",
    category: "Trick Question",
  },
  {
    sentence: "내일 한국에 갈 거예요.",
    english: "I will go to Korea tomorrow.",
    error: "갈 거예요",
    correction: "갈 거예요",
    options: ["갈 거예요", "가을 거예요", "갔을 거예요", "가는 거예요"],
    correct: "갈 거예요",
    explanation: "Correct! -(으)ㄹ 거예요 is the future tense form. 가다 → 갈 거예요. No error here.",
    category: "Trick Question",
  },
  {
    sentence: "저는 한국어가 배워요.",
    english: "I learn Korean.",
    error: "가",
    correction: "를",
    options: ["를", "은", "이", "에"],
    correct: "를",
    explanation: "배우다 (to learn) takes an object, so the object particle 를 is needed. 한국어를 배워요. 가 is a subject particle — wrong here.",
    category: "Particle",
  },
  {
    sentence: "어제 저는 도서관에서 책을 읽었어요.",
    english: "Yesterday I read a book at the library.",
    error: "에서",
    correction: "에서",
    options: ["에서", "에", "를", "이"],
    correct: "에서",
    explanation: "Correct! 에서 marks the location where an action happens. 도서관에서 읽다 = read at the library. This is the correct usage.",
    category: "Trick Question",
  },
  {
    sentence: "비가 와서 우산을 안 가져왔어요.",
    english: "Because it rained, I didn't bring an umbrella.",
    error: "와서",
    correction: "왔는데",
    options: ["왔는데", "오고", "오면", "왔어서"],
    correct: "왔는데",
    explanation: "-아/어서 cannot be used in cause clauses when the result is negative/unexpected. Use -(으)는데 instead: 비가 왔는데 우산을 안 가져왔어요.",
    category: "Connecting Clause",
  },
  {
    sentence: "저는 밥이 먹고 싶어요.",
    english: "I want to eat rice.",
    error: "이",
    correction: "을",
    options: ["을", "가", "는", "에"],
    correct: "을",
    explanation: "With -고 싶다, the object takes 을/를 (object particle). 밥을 먹고 싶다. (Note: 밥이 먹고 싶다 is sometimes heard in spoken Korean but 을 is grammatically standard.)",
    category: "Particle",
  },
  {
    sentence: "저는 공부하기 때문에 피곤해요.",
    english: "I'm tired because I study.",
    error: "하기 때문에",
    correction: "해서",
    options: ["해서", "하는데", "하고", "하면"],
    correct: "해서",
    explanation: "-기 때문에 sounds overly formal for a simple reason. 공부해서 피곤해요 is more natural. -기 때문에 is used in written/formal contexts.",
    category: "Connecting Clause",
  },
  {
    sentence: "저는 요즘 한국 드라마를 봐요.",
    english: "These days I watch Korean dramas.",
    error: "봐요",
    correction: "봐요",
    options: ["봐요", "볼게요", "봤어요", "보겠어요"],
    correct: "봐요",
    explanation: "Correct! For present habitual actions, the present tense 봐요 is right. 요즘 (these days) confirms it's habitual.",
    category: "Trick Question",
  },
  {
    sentence: "한국에 가면 삼겹살 꼭 드세요.",
    english: "If you go to Korea, be sure to eat 삼겹살.",
    error: "드세요",
    correction: "드세요",
    options: ["드세요", "먹으세요", "먹어요", "드셔요"],
    correct: "드세요",
    explanation: "Correct! 드시다 is the honorific form of 먹다/마시다. 드세요 is the polite imperative — appropriate for advising someone politely.",
    category: "Trick Question",
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

const CATEGORY_COLORS: Record<string, string> = {
  "Particle": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  "Connecting Clause": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  "Trick Question": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
};

const ErrorCatchGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const totalRounds = 8;
  const [questions] = useState(() => shuffleArray(QUESTIONS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const called = useRef(false);

  const q = questions[round];
  const isTrick = q?.category === "Trick Question";

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
        <h2 className="text-2xl font-bold">Grammar Detective Done!</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} errors caught ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🔍 Master Detective!" : pct >= 60 ? "🕵️ Good eye!" : "📚 Keep sharpening!"}</div>
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

      {/* Category */}
      <div className="flex items-center gap-2">
        <Bug className="h-4 w-4 text-muted-foreground" />
        <Badge className={CATEGORY_COLORS[q.category] || ""}>{q.category}</Badge>
        {isTrick && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠️ May be correct!</span>}
      </div>

      {/* Sentence */}
      <Card className="p-5 space-y-2">
        <p className="text-xs text-muted-foreground">
          {isTrick ? "Is this sentence correct, or is there an error?" : `The underlined word is wrong. What should replace`} <span className="font-mono bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1 rounded">{q.error}</span>?
        </p>
        <p className="text-xl font-bold text-foreground leading-relaxed">
          {q.sentence.split(q.error).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="underline decoration-red-500 decoration-2 text-red-600 dark:text-red-400">{q.error}</span>
              )}
            </span>
          ))}
        </p>
        <p className="text-sm text-muted-foreground italic">"{q.english}"</p>
      </Card>

      {selected && (
        <Card role="alert" className={`p-3 border-l-4 text-sm ${selected === q.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">
            {selected === q.correct
              ? `✅ Correct! ${isTrick && q.correct === q.error ? "The sentence was correct all along!" : ""}`
              : `❌ Should be: ${q.correct}`}
          </p>
          <p className="text-xs text-muted-foreground">{q.explanation}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose the correct replacement">
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
              className={`w-full text-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${selected ? extra || "border-border opacity-50" : "border-border hover:border-primary hover:bg-primary/5"}`}
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

export default ErrorCatchGame;
