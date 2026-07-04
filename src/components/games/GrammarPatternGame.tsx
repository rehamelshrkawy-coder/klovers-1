import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight, Star } from "lucide-react";

interface PatternQuestion {
  english: string;
  pattern: string;
  patternMeaning: string;
  options: string[];
  correct: string;
  explanation: string;
}

interface GrammarLevel {
  level: number;
  title: string;
  emoji: string;
  description: string;
  questions: PatternQuestion[];
}

const LEVELS: GrammarLevel[] = [
  {
    level: 1,
    title: "Connecting Actions",
    emoji: "🔗",
    description: "Pattern: V + -고 (and then / and)",
    questions: [
      {
        english: "I go to school and study.",
        pattern: "-고",
        patternMeaning: "and / and then",
        options: ["학교에 가고 공부해요.", "학교에 가서 공부해요.", "학교에 가면 공부해요.", "학교에 가도 공부해요."],
        correct: "학교에 가고 공부해요.",
        explanation: "-고 simply connects two actions sequentially. 가다 + -고 = 가고.",
      },
      {
        english: "I eat breakfast and drink coffee.",
        pattern: "-고",
        patternMeaning: "and / and then",
        options: ["아침을 먹고 커피를 마셔요.", "아침을 먹어서 커피를 마셔요.", "아침을 먹으면 커피를 마셔요.", "아침을 먹지만 커피를 마셔요."],
        correct: "아침을 먹고 커피를 마셔요.",
        explanation: "먹다 + -고 = 먹고. The subjects of both actions are the same person.",
      },
      {
        english: "She is smart and kind.",
        pattern: "-고",
        patternMeaning: "and (adjective)",
        options: ["그녀는 똑똑하고 친절해요.", "그녀는 똑똑해서 친절해요.", "그녀는 똑똑하면 친절해요.", "그녀는 똑똑한데 친절해요."],
        correct: "그녀는 똑똑하고 친절해요.",
        explanation: "-고 connects adjectives too: 똑똑하다 + -고 = 똑똑하고.",
      },
    ],
  },
  {
    level: 2,
    title: "Cause & Effect",
    emoji: "💡",
    description: "Pattern: V/A + -아/어서 (because / so)",
    questions: [
      {
        english: "I'm tired so I'll rest.",
        pattern: "-아/어서",
        patternMeaning: "because / so",
        options: ["피곤해서 쉴 거예요.", "피곤하고 쉴 거예요.", "피곤하면 쉴 거예요.", "피곤한데 쉴 거예요."],
        correct: "피곤해서 쉴 거예요.",
        explanation: "피곤하다 + -아/어서 = 피곤해서. This expresses the cause (tired) → result (will rest).",
      },
      {
        english: "Because it's raining, I'll take an umbrella.",
        pattern: "-아/어서",
        patternMeaning: "because",
        options: ["비가 와서 우산을 가져갈 거예요.", "비가 오고 우산을 가져갈 거예요.", "비가 오면 우산을 가져갈 거예요.", "비가 오는데 우산을 가져갈 거예요."],
        correct: "비가 와서 우산을 가져갈 거예요.",
        explanation: "오다 + -아/어서 = 와서. Note the 와 contraction (오 + 아 = 와).",
      },
      {
        english: "I liked it because it was delicious.",
        pattern: "-아/어서",
        patternMeaning: "because",
        options: ["맛있어서 좋았어요.", "맛있고 좋았어요.", "맛있으면 좋아요.", "맛있는데 좋았어요."],
        correct: "맛있어서 좋았어요.",
        explanation: "맛있다 + -어서 = 맛있어서. Past tense goes on the final verb, not on -아/어서.",
      },
    ],
  },
  {
    level: 3,
    title: "Conditions & Hypotheticals",
    emoji: "🔀",
    description: "Pattern: V/A + -(으)면 (if / when)",
    questions: [
      {
        english: "If it's delicious, I'll order more.",
        pattern: "-(으)면",
        patternMeaning: "if / when",
        options: ["맛있으면 더 주문할 거예요.", "맛있어서 더 주문할 거예요.", "맛있고 더 주문할 거예요.", "맛있는데 더 주문할 거예요."],
        correct: "맛있으면 더 주문할 거예요.",
        explanation: "맛있다 ends in consonant ㅅ, so use -으면: 맛있 + 으면 = 맛있으면.",
      },
      {
        english: "If you go to Korea, please eat 삼겹살.",
        pattern: "-(으)면",
        patternMeaning: "if",
        options: ["한국에 가면 삼겹살을 드세요.", "한국에 가서 삼겹살을 드세요.", "한국에 가고 삼겹살을 드세요.", "한국에 갔으면 삼겹살을 드세요."],
        correct: "한국에 가면 삼겹살을 드세요.",
        explanation: "가다 ends in vowel, so use -면 directly: 가 + 면 = 가면.",
      },
      {
        english: "When spring comes, flowers bloom.",
        pattern: "-(으)면",
        patternMeaning: "when",
        options: ["봄이 오면 꽃이 피어요.", "봄이 와서 꽃이 피어요.", "봄이 오고 꽃이 피어요.", "봄이 오는데 꽃이 피어요."],
        correct: "봄이 오면 꽃이 피어요.",
        explanation: "-(으)면 expresses both 'if' and 'when'. Here it's used for a natural recurring event.",
      },
    ],
  },
  {
    level: 4,
    title: "Ability & Permission",
    emoji: "💪",
    description: "Pattern: V + -(으)ㄹ 수 있다/없다 (can/cannot)",
    questions: [
      {
        english: "I can speak Korean.",
        pattern: "-(으)ㄹ 수 있다",
        patternMeaning: "can do",
        options: ["한국어를 할 수 있어요.", "한국어를 하고 있어요.", "한국어를 하면 있어요.", "한국어를 해서 있어요."],
        correct: "한국어를 할 수 있어요.",
        explanation: "하다 → 할 수 있다. The -(으)ㄹ form attaches before 수 있다.",
      },
      {
        english: "I can't swim.",
        pattern: "-(으)ㄹ 수 없다",
        patternMeaning: "cannot do",
        options: ["수영할 수 없어요.", "수영을 못 있어요.", "수영하고 없어요.", "수영하면 없어요."],
        correct: "수영할 수 없어요.",
        explanation: "수영하다 → 수영할 수 없다. Alternatively 수영을 못 해요 also works but 할 수 없다 is the formal pattern.",
      },
      {
        english: "Can you eat spicy food?",
        pattern: "-(으)ㄹ 수 있다",
        patternMeaning: "can do (question)",
        options: ["매운 음식을 먹을 수 있어요?", "매운 음식을 먹으면 있어요?", "매운 음식을 먹어서 있어요?", "매운 음식을 먹고 있어요?"],
        correct: "매운 음식을 먹을 수 있어요?",
        explanation: "먹다 + -(으)ㄹ 수 있다: 먹 ends in consonant → 먹을 수 있다. Question: 먹을 수 있어요?",
      },
    ],
  },
  {
    level: 5,
    title: "Desire & Intention",
    emoji: "🎯",
    description: "Patterns: -고 싶다 (want to) · -(으)려고 하다 (intend to)",
    questions: [
      {
        english: "I want to go to Korea.",
        pattern: "-고 싶다",
        patternMeaning: "want to",
        options: ["한국에 가고 싶어요.", "한국에 가면 싶어요.", "한국에 가서 싶어요.", "한국에 갈 싶어요."],
        correct: "한국에 가고 싶어요.",
        explanation: "V + -고 싶다 = want to V. 가다 + -고 싶다 = 가고 싶다 → 가고 싶어요 (polite).",
      },
      {
        english: "I intend to study Korean.",
        pattern: "-(으)려고 하다",
        patternMeaning: "intend to / planning to",
        options: ["한국어를 공부하려고 해요.", "한국어를 공부하고 싶어요.", "한국어를 공부하면 해요.", "한국어를 공부해서 해요."],
        correct: "한국어를 공부하려고 해요.",
        explanation: "-(으)려고 하다 expresses a plan/intention. 공부하다 → 공부하려고 하다 → 공부하려고 해요.",
      },
      {
        english: "I want to eat 비빔밥.",
        pattern: "-고 싶다",
        patternMeaning: "want to",
        options: ["비빔밥을 먹고 싶어요.", "비빔밥을 먹으려고 싶어요.", "비빔밥을 먹어서 싶어요.", "비빔밥을 먹을 싶어요."],
        correct: "비빔밥을 먹고 싶어요.",
        explanation: "먹다 + -고 싶다 = 먹고 싶다. Don't mix patterns: 먹으려고 싶다 is wrong.",
      },
    ],
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

const GrammarPatternGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [levelDone, setLevelDone] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const called = useRef(false);
  const totalQuestions = LEVELS.reduce((s, l) => s + l.questions.length, 0);

  const level = LEVELS[currentLevel];
  const q = level?.questions[qIndex];

  useEffect(() => {
    if (gameOver && !called.current) {
      called.current = true;
      onGameComplete?.(score, totalAnswered);
    }
  }, [gameOver, score, totalAnswered, onGameComplete]);

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.correct;
    if (correct) setScore(s => s + 1);
    setTotalAnswered(t => t + 1);
  };

  const next = () => {
    if (qIndex + 1 >= level.questions.length) {
      setLevelDone(true);
      return;
    }
    setQIndex(i => i + 1);
    setSelected(null);
  };

  const nextLevel = () => {
    if (currentLevel + 1 >= LEVELS.length) {
      setGameOver(true);
      return;
    }
    setCurrentLevel(l => l + 1);
    setQIndex(0);
    setSelected(null);
    setLevelDone(false);
  };

  const restart = () => {
    called.current = false;
    setCurrentLevel(0); setQIndex(0); setScore(0);
    setTotalAnswered(0); setSelected(null);
    setLevelDone(false); setGameOver(false);
  };

  if (gameOver) {
    const pct = Math.round((score / totalAnswered) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold">All 5 Levels Complete! 🎉</h2>
        <p className="text-muted-foreground">{score}/{totalAnswered} correct ({pct}%)</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {LEVELS.map(l => <span key={l.level} className="text-2xl">{l.emoji}</span>)}
        </div>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </div>
    );
  }

  // Level complete screen
  if (levelDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center px-4 max-w-md mx-auto">
        <div className="text-6xl">{level.emoji}</div>
        <h2 className="text-2xl font-bold">Level {level.level} Complete!</h2>
        <p className="text-muted-foreground text-sm">{level.title} — {level.description}</p>
        {currentLevel + 1 < LEVELS.length && (
          <Card className="p-4 w-full text-left bg-primary/5 border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Next up:</p>
            <p className="font-bold text-foreground">{LEVELS[currentLevel + 1].emoji} Level {LEVELS[currentLevel + 1].level}: {LEVELS[currentLevel + 1].title}</p>
            <p className="text-sm text-muted-foreground">{LEVELS[currentLevel + 1].description}</p>
          </Card>
        )}
        <Button onClick={nextLevel} className="gap-2 w-full">
          {currentLevel + 1 >= LEVELS.length ? <><Trophy className="h-4 w-4" /> Finish!</> : <><ArrowRight className="h-4 w-4" /> Next Level</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
      {/* Level bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {LEVELS.map((l, i) => (
          <div key={l.level} className={`flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentLevel ? "bg-primary text-primary-foreground" : i < currentLevel ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
            {i < currentLevel ? "✓" : l.emoji} Lv{l.level}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{level.emoji} {level.title}</span>
        <span className="font-medium text-foreground" aria-live="polite" aria-atomic="true">{score} correct</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(qIndex / level.questions.length) * 100}%` }} />
      </div>

      {/* Pattern banner */}
      <Card className="p-3 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono">{q.pattern}</Badge>
          <span className="text-sm text-muted-foreground">{q.patternMeaning}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
      </Card>

      {/* Question */}
      <Card className="p-5">
        <p className="text-xs text-muted-foreground mb-2">Translate using the pattern above:</p>
        <p className="text-xl font-bold text-foreground">{q.english}</p>
      </Card>

      {selected && (
        <Card role="alert" className={`p-3 border-l-4 text-sm ${selected === q.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">{selected === q.correct ? "✅ Correct!" : `❌ Answer: ${q.correct}`}</p>
          <p className="text-xs text-muted-foreground">{q.explanation}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose the correct answer">
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
          {qIndex + 1 >= level.questions.length
            ? <><Star className="h-4 w-4" /> Level Complete!</>
            : <><ArrowRight className="h-4 w-4" /> Next Question</>}
        </Button>
      )}
    </div>
  );
};

export default GrammarPatternGame;
