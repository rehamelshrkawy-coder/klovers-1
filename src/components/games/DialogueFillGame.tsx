import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Sparkles, ArrowRight, MessageCircle } from "lucide-react";

interface DialogueLine { speaker: "A" | "B"; text: string; english: string; }
interface Scene {
  title: string;
  context: string;
  dialogue: DialogueLine[];
  blankIndex: number; // which B-line is the question
  options: string[];
  correct: string;
  explanation: string;
}

const SCENES: Scene[] = [
  {
    title: "At a Café ☕",
    context: "You're ordering coffee at a Korean café.",
    dialogue: [
      { speaker: "A", text: "어서 오세요! 뭘 드릴까요?", english: "Welcome! What can I get you?" },
      { speaker: "B", text: "___", english: "Americano, please." },
    ],
    blankIndex: 1,
    options: ["아메리카노 주세요.", "아메리카노 좋아해요.", "아메리카노 있어요?", "아메리카노 마셔요."],
    correct: "아메리카노 주세요.",
    explanation: "주세요 = 'please give me'. Use it when ordering or requesting something politely.",
  },
  {
    title: "Meeting a Friend 👋",
    context: "You run into a Korean friend you haven't seen in a while.",
    dialogue: [
      { speaker: "A", text: "오랜만이에요! 잘 지냈어요?", english: "Long time no see! Have you been well?" },
      { speaker: "B", text: "___", english: "Yes, I've been well. And you?" },
    ],
    blankIndex: 1,
    options: ["네, 잘 지냈어요. 당신은요?", "네, 잘 지냈어요. 어떻게 지냈어요?", "아니요, 잘 못 지냈어요.", "네, 반가워요!"],
    correct: "네, 잘 지냈어요. 어떻게 지냈어요?",
    explanation: "어떻게 지냈어요? = 'How have you been?' — the natural follow-up when replying to this greeting.",
  },
  {
    title: "Asking for Directions 🗺️",
    context: "You're lost and need to find the subway station.",
    dialogue: [
      { speaker: "A", text: "지하철역이 어디 있어요?", english: "Where is the subway station?" },
      { speaker: "B", text: "___", english: "Go straight and turn left." },
    ],
    blankIndex: 1,
    options: ["직진하고 왼쪽으로 가세요.", "지하철을 타세요.", "역이 멀어요.", "버스를 타세요."],
    correct: "직진하고 왼쪽으로 가세요.",
    explanation: "직진하다 = go straight, 왼쪽 = left, -고 = and then. Directions use -세요 for polite commands.",
  },
  {
    title: "Studying Together 📚",
    context: "You're asking a classmate to study together.",
    dialogue: [
      { speaker: "A", text: "오늘 같이 공부할 수 있어요?", english: "Can we study together today?" },
      { speaker: "B", text: "___", english: "Sorry, I have other plans today." },
    ],
    blankIndex: 1,
    options: ["미안해요, 오늘 다른 약속이 있어요.", "네, 공부 좋아해요.", "아니요, 내일 해요.", "저도 몰라요."],
    correct: "미안해요, 오늘 다른 약속이 있어요.",
    explanation: "약속 = promise / appointment / plans. 다른 약속이 있어요 is the natural way to say 'I have other plans'.",
  },
  {
    title: "At a Restaurant 🍽️",
    context: "The waiter asks if you enjoyed your meal.",
    dialogue: [
      { speaker: "A", text: "음식이 맛있었어요?", english: "Was the food delicious?" },
      { speaker: "B", text: "___", english: "Yes, it was very delicious! Thank you." },
    ],
    blankIndex: 1,
    options: ["네, 정말 맛있었어요! 감사합니다.", "음식을 먹었어요.", "저는 배고파요.", "아, 괜찮아요."],
    correct: "네, 정말 맛있었어요! 감사합니다.",
    explanation: "맛있었어요 = past tense of 맛있다 (delicious). 정말 = really/very. 감사합니다 = thank you (formal).",
  },
  {
    title: "Making Plans 📅",
    context: "A friend invites you to see a movie on Saturday.",
    dialogue: [
      { speaker: "A", text: "토요일에 영화 보러 갈래요?", english: "Do you want to go see a movie on Saturday?" },
      { speaker: "B", text: "___", english: "Sounds good! What time?" },
    ],
    blankIndex: 1,
    options: ["좋아요! 몇 시에요?", "영화를 좋아해요.", "토요일은 바빠요.", "잘 모르겠어요."],
    correct: "좋아요! 몇 시에요?",
    explanation: "좋아요! = Great! / Sounds good! 몇 시에요? = What time? — a natural follow-up to accepting plans.",
  },
  {
    title: "Shopping 🛍️",
    context: "You want to try on clothes in a store.",
    dialogue: [
      { speaker: "A", text: "도와드릴까요?", english: "Can I help you?" },
      { speaker: "B", text: "___", english: "Can I try this on?" },
    ],
    blankIndex: 1,
    options: ["이거 입어 봐도 돼요?", "이거 얼마예요?", "이거 좋아해요.", "이거 사고 싶어요."],
    correct: "이거 입어 봐도 돼요?",
    explanation: "-어 봐도 돼요? = 'Is it okay to try ~?' The 봐도 되다 pattern asks for permission to do something.",
  },
  {
    title: "Introducing Yourself 🤝",
    context: "First day of Korean class — introducing yourself.",
    dialogue: [
      { speaker: "A", text: "안녕하세요! 이름이 뭐예요?", english: "Hello! What's your name?" },
      { speaker: "B", text: "___", english: "My name is Sara. Nice to meet you." },
    ],
    blankIndex: 1,
    options: ["저는 사라예요. 반가워요.", "사라 좋아해요.", "제 이름은 몰라요.", "사라입니까?"],
    correct: "저는 사라예요. 반가워요.",
    explanation: "저는 [name]예요/이에요 = 'I am [name]'. 반가워요 = 'Nice to meet you' (informal polite).",
  },
  {
    title: "At the Doctor 🏥",
    context: "You're at the clinic and the doctor asks about your symptoms.",
    dialogue: [
      { speaker: "A", text: "어디가 아프세요?", english: "Where does it hurt?" },
      { speaker: "B", text: "___", english: "My head hurts and I have a fever." },
    ],
    blankIndex: 1,
    options: ["머리가 아프고 열이 있어요.", "저는 아파요.", "병원에 가고 싶어요.", "약을 주세요."],
    correct: "머리가 아프고 열이 있어요.",
    explanation: "머리 = head, 아프다 = to hurt, -고 = and, 열이 있다 = to have a fever. -고 connects two related facts.",
  },
  {
    title: "Apologising 😅",
    context: "You accidentally bumped into someone.",
    dialogue: [
      { speaker: "A", text: "아, 죄송합니다!", english: "Oh, I'm sorry!" },
      { speaker: "B", text: "___", english: "It's okay, don't worry." },
    ],
    blankIndex: 1,
    options: ["괜찮아요, 신경 쓰지 마세요.", "감사합니다.", "저도 미안해요.", "아니요, 죄송해요."],
    correct: "괜찮아요, 신경 쓰지 마세요.",
    explanation: "괜찮아요 = It's okay. 신경 쓰지 마세요 = 'Don't worry about it' (lit. don't use your mind on it).",
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

const DialogueFillGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const totalRounds = 8;
  const [scenes] = useState(() => shuffleArray(SCENES).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const called = useRef(false);

  const scene = scenes[round];

  useEffect(() => {
    if (gameOver && !called.current) {
      called.current = true;
      onGameComplete?.(score, totalRounds);
    }
  }, [gameOver, score, onGameComplete]);

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === scene.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (round + 1 >= totalRounds) { setGameOver(true); return; }
    setRound(r => r + 1);
    setSelected(null);
  };

  const restart = () => {
    called.current = false;
    setRound(0);
    setScore(0);
    setSelected(null);
    setGameOver(false);
  };

  if (gameOver) {
    const pct = Math.round((score / totalRounds) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conversation Complete!</h2>
          <p className="text-muted-foreground mt-1">You got {score} out of {totalRounds} correct ({pct}%)</p>
        </div>
        <div className="text-4xl font-bold text-primary">{pct >= 80 ? "🌟 Excellent!" : pct >= 60 ? "👍 Good job!" : "📚 Keep practicing!"}</div>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Scene {round + 1} of {totalRounds}</span>
        <span className="font-medium text-foreground">{score} correct</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((round) / totalRounds) * 100}%` }} />
      </div>

      {/* Scene header */}
      <div className="text-center">
        <Badge variant="secondary" className="gap-1 text-xs mb-1">{scene.title}</Badge>
        <p className="text-xs text-muted-foreground italic">{scene.context}</p>
      </div>

      {/* Dialogue */}
      <Card className="p-4 space-y-3">
        {scene.dialogue.map((line, i) => {
          const isBlank = i === scene.blankIndex;
          const isA = line.speaker === "A";
          return (
            <div key={i} className={`flex gap-3 ${isA ? "" : "flex-row-reverse"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isA ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"}`}>
                {line.speaker}
              </div>
              <div className={`flex-1 ${isA ? "" : "text-right"}`}>
                {isBlank ? (
                  <div className="inline-block bg-muted border-2 border-dashed border-primary/40 rounded-xl px-4 py-2 min-h-[40px] min-w-[120px]">
                    {selected ? (
                      <p className="text-sm font-medium text-foreground">{selected}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Choose below...</p>
                    )}
                  </div>
                ) : (
                  <div className={`inline-block rounded-xl px-4 py-2 ${isA ? "bg-blue-50 dark:bg-blue-900/20" : "bg-green-50 dark:bg-green-900/20"}`}>
                    <p className="text-sm font-medium text-foreground">{line.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{line.english}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Feedback */}
      {selected && (
        <Card className={`p-3 border-l-4 text-sm ${selected === scene.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">{selected === scene.correct ? "✅ Correct!" : `❌ The answer was: ${scene.correct}`}</p>
          <p className="text-muted-foreground text-xs">{scene.explanation}</p>
        </Card>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 gap-2">
        {scene.options.map(opt => {
          const variant: "outline" | "default" | "destructive" = "outline";
          let extra = "";
          if (selected) {
            if (opt === scene.correct) extra = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            else if (opt === selected) extra = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 line-through";
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150 font-medium ${selected ? extra || "border-border text-muted-foreground opacity-60" : "border-border hover:border-primary hover:bg-primary/5"}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected && (
        <Button onClick={next} className="w-full gap-2">
          {round + 1 >= totalRounds ? <><Trophy className="h-4 w-4" /> See Results</> : <><ArrowRight className="h-4 w-4" /> Next Scene</>}
        </Button>
      )}
    </div>
  );
};

export default DialogueFillGame;
