import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight, CheckCircle2, XCircle, GripVertical } from "lucide-react";

interface ConversationScene {
  title: string;
  context: string;
  lines: { speaker: "A" | "B"; korean: string; english: string }[];
}

const SCENES: ConversationScene[] = [
  {
    title: "Making a Reservation 📞",
    context: "A customer calls a restaurant to make a reservation.",
    lines: [
      { speaker: "A", korean: "여보세요, 거기 식당이에요?", english: "Hello, is this the restaurant?" },
      { speaker: "B", korean: "네, 맞아요. 예약하실 거예요?", english: "Yes, that's right. Would you like to make a reservation?" },
      { speaker: "A", korean: "네, 토요일 저녁 7시에 두 명이요.", english: "Yes, for two people at 7 PM on Saturday." },
      { speaker: "B", korean: "알겠습니다. 성함이 어떻게 되세요?", english: "Understood. What is your name?" },
    ],
  },
  {
    title: "Asking for Help 🤝",
    context: "A student asks a teacher for help after class.",
    lines: [
      { speaker: "A", korean: "선생님, 잠깐 시간 있으세요?", english: "Teacher, do you have a moment?" },
      { speaker: "B", korean: "네, 무슨 일이에요?", english: "Yes, what is it?" },
      { speaker: "A", korean: "숙제가 이해가 안 돼요.", english: "I don't understand the homework." },
      { speaker: "B", korean: "어떤 부분이 어려워요?", english: "Which part is difficult?" },
    ],
  },
  {
    title: "Buying a Ticket 🎟️",
    context: "Buying a KTX train ticket at the station.",
    lines: [
      { speaker: "A", korean: "서울에서 부산까지 표 한 장 주세요.", english: "One ticket from Seoul to Busan, please." },
      { speaker: "B", korean: "언제 출발하실 거예요?", english: "When are you departing?" },
      { speaker: "A", korean: "내일 오전 10시요.", english: "Tomorrow at 10 AM." },
      { speaker: "B", korean: "편도예요, 왕복이에요?", english: "One-way or round trip?" },
    ],
  },
  {
    title: "At the Pharmacy 💊",
    context: "Getting medicine for a cold.",
    lines: [
      { speaker: "A", korean: "감기약 있어요?", english: "Do you have cold medicine?" },
      { speaker: "B", korean: "네, 증상이 어떠세요?", english: "Yes, what are your symptoms?" },
      { speaker: "A", korean: "목이 아프고 기침이 나요.", english: "I have a sore throat and a cough." },
      { speaker: "B", korean: "이 약을 하루에 세 번 드세요.", english: "Take this medicine three times a day." },
    ],
  },
  {
    title: "Job Interview 💼",
    context: "A candidate at a Korean company interview.",
    lines: [
      { speaker: "B", korean: "자기소개를 해 주세요.", english: "Please introduce yourself." },
      { speaker: "A", korean: "안녕하세요, 저는 김민준이라고 합니다.", english: "Hello, my name is Kim Minjun." },
      { speaker: "B", korean: "왜 저희 회사에 지원하셨어요?", english: "Why did you apply to our company?" },
      { speaker: "A", korean: "한국 문화에 관심이 많고 성장 가능성을 보고 지원했습니다.", english: "I have a great interest in Korean culture and applied seeing the growth potential." },
    ],
  },
  {
    title: "Catching Up 📱",
    context: "Two friends texting after not seeing each other.",
    lines: [
      { speaker: "A", korean: "요즘 어떻게 지내요?", english: "How have you been lately?" },
      { speaker: "B", korean: "바빠서 힘들었어요. 당신은요?", english: "It was tough being busy. How about you?" },
      { speaker: "A", korean: "저도 비슷해요. 이번 주말에 만날까요?", english: "Same here. Shall we meet this weekend?" },
      { speaker: "B", korean: "좋아요! 토요일 오후 어때요?", english: "Sounds good! How about Saturday afternoon?" },
    ],
  },
  {
    title: "Lost and Found 🔍",
    context: "Reporting a lost wallet at a department store.",
    lines: [
      { speaker: "A", korean: "실례합니다, 지갑을 잃어버렸어요.", english: "Excuse me, I lost my wallet." },
      { speaker: "B", korean: "언제 잃어버리셨어요?", english: "When did you lose it?" },
      { speaker: "A", korean: "한 시간 전에 3층에서요.", english: "About an hour ago on the 3rd floor." },
      { speaker: "B", korean: "연락처를 남겨 주시면 연락드릴게요.", english: "If you leave your contact information, we'll get in touch." },
    ],
  },
  {
    title: "Planning a Trip ✈️",
    context: "Friends planning a trip to Jeju Island.",
    lines: [
      { speaker: "A", korean: "제주도 여행 어때요?", english: "How about a trip to Jeju Island?" },
      { speaker: "B", korean: "좋은데요! 언제 갈 거예요?", english: "That's great! When will we go?" },
      { speaker: "A", korean: "다음 달 첫째 주가 어때요?", english: "How about the first week of next month?" },
      { speaker: "B", korean: "좋아요. 숙소는 제가 예약할게요.", english: "Okay. I'll book the accommodation." },
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

const ConversationOrderGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const totalRounds = 6;
  const [scenes] = useState(() => shuffleArray(SCENES).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledLines, setShuffledLines] = useState<typeof SCENES[0]["lines"]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const called = useRef(false);

  useEffect(() => {
    setShuffledLines(shuffleArray(scenes[round]?.lines ?? []));
    setSubmitted(false);
    setIsCorrect(false);
  }, [round, scenes]);

  useEffect(() => {
    if (gameOver && !called.current) {
      called.current = true;
      onGameComplete?.(score, totalRounds);
    }
  }, [gameOver, score, onGameComplete]);

  const scene = scenes[round];

  const moveUp = (idx: number) => {
    if (idx === 0 || submitted) return;
    const next = [...shuffledLines];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setShuffledLines(next);
  };

  const moveDown = (idx: number) => {
    if (idx === shuffledLines.length - 1 || submitted) return;
    const next = [...shuffledLines];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setShuffledLines(next);
  };

  const handleSubmit = () => {
    const correct = shuffledLines.every((l, i) => l.korean === scene.lines[i].korean);
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    if (round + 1 >= totalRounds) { setGameOver(true); return; }
    setRound(r => r + 1);
  };

  const restart = () => {
    called.current = false;
    setRound(0); setScore(0); setGameOver(false);
  };

  if (gameOver) {
    const pct = Math.round((score / totalRounds) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold">Conversation Order Complete!</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🌟 Outstanding!" : pct >= 50 ? "👍 Good effort!" : "📚 Practice more!"}</div>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Round {round + 1} of {totalRounds}</span>
        <span className="font-medium text-foreground" aria-live="polite" aria-atomic="true">{score} correct</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(round / totalRounds) * 100}%` }} />
      </div>

      <div className="text-center">
        <Badge variant="secondary" className="mb-1">{scene.title}</Badge>
        <p className="text-xs text-muted-foreground italic">{scene.context}</p>
      </div>

      <p className="text-sm text-center text-muted-foreground">Arrange the dialogue lines in the correct order:</p>

      {/* Sortable lines */}
      <div className="space-y-2">
        {shuffledLines.map((line, idx) => {
          const isA = line.speaker === "A";
          let borderColor = "border-border";
          if (submitted) {
            borderColor = line.korean === scene.lines[idx].korean
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : "border-red-500 bg-red-50 dark:bg-red-950/20";
          }
          return (
            <Card key={line.korean} className={`p-3 border-2 ${borderColor} transition-colors`}>
              <div className="flex items-start gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${isA ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"}`}>
                  {line.speaker}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{line.korean}</p>
                  {submitted && <p className="text-xs text-muted-foreground">{line.english}</p>}
                </div>
                {!submitted && (
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} aria-label={`Move line ${idx + 1} up`} className="p-1 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground text-xs">▲</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === shuffledLines.length - 1} aria-label={`Move line ${idx + 1} down`} className="p-1 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground text-xs">▼</button>
                  </div>
                )}
                {submitted && (
                  line.korean === scene.lines[idx].korean
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {submitted && !isCorrect && (
        <Card role="alert" className="p-3 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-sm">
          <p className="font-semibold mb-1">Correct order:</p>
          {scene.lines.map((l, i) => (
            <p key={i} className="text-xs text-muted-foreground">{i + 1}. ({l.speaker}) {l.korean}</p>
          ))}
        </Card>
      )}

      {!submitted ? (
        <Button onClick={handleSubmit} className="w-full">Check Order</Button>
      ) : (
        <Button onClick={next} className="w-full gap-2">
          {round + 1 >= totalRounds ? <><Trophy className="h-4 w-4" /> See Results</> : <><ArrowRight className="h-4 w-4" /> Next Round</>}
        </Button>
      )}
    </div>
  );
};

export default ConversationOrderGame;
