import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight, MapPin } from "lucide-react";

interface Situation {
  emoji: string;
  context: string;
  setting: string;
  goal: string;
  options: string[];
  correct: string;
  explanation: string;
}

const SITUATIONS: Situation[] = [
  {
    emoji: "🏪",
    context: "You enter a Korean store and the shopkeeper greets you.",
    setting: "Shop",
    goal: "Politely greet back and let them know you're just browsing.",
    options: ["그냥 봐요.", "안녕하세요, 그냥 구경할게요.", "뭐 있어요?", "저 바빠요."],
    correct: "안녕하세요, 그냥 구경할게요.",
    explanation: "그냥 구경할게요 = 'I'm just browsing.' Starting with 안녕하세요 is polite. -(으)ㄹ게요 expresses your intention.",
  },
  {
    emoji: "📞",
    context: "You call a Korean business and someone picks up.",
    setting: "Phone call",
    goal: "Politely say who you are and ask to speak with Mr. Kim.",
    options: ["김 씨 있어요?", "저는 사라예요, 김 팀장님 계세요?", "김 씨 전화 바꿔줘요.", "저예요, 김 씨 불러요."],
    correct: "저는 사라예요, 김 팀장님 계세요?",
    explanation: "On formal calls: introduce yourself first, then ask if the person is available using 계세요? (honorific for 있어요?).",
  },
  {
    emoji: "🎂",
    context: "It's your Korean friend's birthday and they receive your gift.",
    setting: "Birthday",
    goal: "Wish them a happy birthday in Korean.",
    options: ["오늘 생일이에요?", "생일 축하해요!", "선물 받았어요?", "몇 살이에요?"],
    correct: "생일 축하해요!",
    explanation: "생일 축하해요! = Happy birthday! (polite). 생일 축하합니다! is more formal. Both are correct and warm.",
  },
  {
    emoji: "🚌",
    context: "You're on a bus and an elderly person is standing.",
    setting: "Public transport",
    goal: "Offer your seat respectfully.",
    options: ["여기 앉으세요.", "여기 앉아요!", "제 자리 드릴게요.", "앉고 싶어요?"],
    correct: "여기 앉으세요.",
    explanation: "여기 앉으세요 = 'Please sit here.' Using -(으)세요 to an elder is the natural respectful offer of your seat.",
  },
  {
    emoji: "🍽️",
    context: "You're about to eat with Korean colleagues.",
    setting: "Meal",
    goal: "Say the traditional phrase before eating.",
    options: ["밥 먹어요!", "잘 먹겠습니다.", "맛있겠다!", "빨리 먹어요."],
    correct: "잘 먹겠습니다.",
    explanation: "잘 먹겠습니다 = 'I will eat well' — said before a meal as thanks to whoever prepared/provided the food. Essential Korean etiquette.",
  },
  {
    emoji: "🎓",
    context: "Your Korean teacher gave you feedback that really helped you improve.",
    setting: "Classroom",
    goal: "Thank your teacher sincerely in an appropriate way.",
    options: ["고마워요 선생님!", "선생님 덕분에 많이 늘었어요, 감사합니다.", "감사해요!", "도움 됐어요."],
    correct: "선생님 덕분에 많이 늘었어요, 감사합니다.",
    explanation: "덕분에 = 'thanks to'. 덕분에 much늘었어요 = 'I improved a lot thanks to you.' Adding this personal acknowledgment makes the thank-you more sincere.",
  },
  {
    emoji: "🏠",
    context: "You arrive as a guest at a Korean person's home.",
    setting: "Someone's home",
    goal: "Say the phrase for entering someone's home as a guest.",
    options: ["안녕하세요!", "실례합니다, 들어가도 돼요?", "들어갈게요.", "왔어요!"],
    correct: "실례합니다, 들어가도 돼요?",
    explanation: "실례합니다 = 'Excuse me / I'm intruding.' 들어가도 돼요? = 'May I come in?' — polite way to announce your arrival.",
  },
  {
    emoji: "🤧",
    context: "Your Korean colleague sneezes loudly.",
    setting: "Office",
    goal: "Say the appropriate response in Korean.",
    options: ["왜 재채기해요?", "건강하세요!", "감기 걸렸어요?", "에취!"],
    correct: "건강하세요!",
    explanation: "건강하세요! = 'Be healthy!' — the Korean equivalent of 'Bless you!' after a sneeze. Literally wishing them good health.",
  },
  {
    emoji: "🍺",
    context: "An older Korean colleague pours you a drink at a company dinner.",
    setting: "Dinner / hoesik",
    goal: "Accept the drink properly using Korean drinking culture etiquette.",
    options: ["직접 받을게요.", "두 손으로 받겠습니다.", "됐어요, 안 마셔요.", "감사해요 그냥 주세요."],
    correct: "두 손으로 받겠습니다.",
    explanation: "두 손으로 받다 = 'receive with two hands'. Receiving a drink with both hands from an elder is respectful Korean etiquette.",
  },
  {
    emoji: "📸",
    context: "You want to take a photo of a Korean person's traditional house.",
    setting: "Sightseeing",
    goal: "Ask politely if you can take a photo.",
    options: ["사진 찍어도 돼요?", "사진이에요!", "찍을게요.", "포즈 취해 주세요."],
    correct: "사진 찍어도 돼요?",
    explanation: "사진 찍어도 돼요? = 'Is it okay to take a photo?' — the polite way to ask for photo permission using -어도 돼요?",
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

const SituationPickGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const totalRounds = 8;
  const [situations] = useState(() => shuffleArray(SITUATIONS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const called = useRef(false);

  const s = situations[round];

  useEffect(() => {
    if (gameOver && !called.current) {
      called.current = true;
      onGameComplete?.(score, totalRounds);
    }
  }, [gameOver, score, onGameComplete]);

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === s.correct) setScore(sc => sc + 1);
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
        <h2 className="text-2xl font-bold">Cultural Expert! 🇰🇷</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} correct ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🌟 You'd fit right in Korea!" : pct >= 60 ? "👍 Getting culturally fluent!" : "📚 Study the culture more!"}</div>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Situation {round + 1} of {totalRounds}</span>
        <span className="font-medium text-foreground" aria-live="polite" aria-atomic="true">{score} correct</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(round / totalRounds) * 100}%` }} />
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{s.emoji}</span>
          <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{s.setting}</Badge>
        </div>
        <p className="text-sm font-medium text-foreground leading-relaxed">{s.context}</p>
        <div className="bg-primary/5 rounded-xl px-3 py-2">
          <p className="text-xs text-primary font-medium">Your goal: {s.goal}</p>
        </div>
      </Card>

      {selected && (
        <Card role="alert" className={`p-3 border-l-4 text-sm ${selected === s.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold mb-1">{selected === s.correct ? "✅ Perfect!" : `❌ Best answer: ${s.correct}`}</p>
          <p className="text-xs text-muted-foreground">{s.explanation}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose the appropriate response for this situation">
        {s.options.map(opt => {
          let extra = "";
          if (selected) {
            if (opt === s.correct) extra = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
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
          {round + 1 >= totalRounds ? <><Trophy className="h-4 w-4" /> See Results</> : <><ArrowRight className="h-4 w-4" /> Next Situation</>}
        </Button>
      )}
    </div>
  );
};

export default SituationPickGame;
