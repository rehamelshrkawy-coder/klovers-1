import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

const GREETINGS = [
  { situation: "Meeting someone for the first time", answer: "처음 뵙겠습니다", options: ["안녕하세요", "처음 뵙겠습니다", "잘 가세요", "감사합니다"] },
  { situation: "Saying goodbye (to someone leaving)", answer: "안녕히 가세요", options: ["안녕히 가세요", "안녕히 계세요", "감사합니다", "미안합니다"] },
  { situation: "Saying goodbye (you are leaving)", answer: "안녕히 계세요", options: ["안녕히 가세요", "안녕히 계세요", "잘 가", "또 봐요"] },
  { situation: "Thanking someone formally", answer: "감사합니다", options: ["감사합니다", "고마워", "미안합니다", "괜찮아요"] },
  { situation: "Apologizing formally", answer: "죄송합니다", options: ["죄송합니다", "미안해", "괜찮아요", "감사합니다"] },
  { situation: "Before eating a meal", answer: "잘 먹겠습니다", options: ["잘 먹겠습니다", "잘 먹었습니다", "맛있어요", "배불러요"] },
  { situation: "After finishing a meal", answer: "잘 먹었습니다", options: ["잘 먹겠습니다", "잘 먹었습니다", "맛있었어요", "감사합니다"] },
  { situation: "Answering the phone", answer: "여보세요", options: ["여보세요", "안녕하세요", "네", "뭐예요"] },
  { situation: "Cheering someone on", answer: "화이팅!", options: ["화이팅!", "안녕!", "잘 가!", "감사합니다!"] },
  { situation: "Saying 'nice to meet you'", answer: "만나서 반갑습니다", options: ["만나서 반갑습니다", "처음 뵙겠습니다", "안녕하세요", "잘 지내세요"] },
  { situation: "Asking 'how are you?'", answer: "잘 지내세요?", options: ["잘 지내세요?", "어디 가세요?", "뭐 해요?", "안녕하세요?"] },
  { situation: "Saying 'excuse me' to get attention", answer: "저기요", options: ["저기요", "죄송합니다", "실례합니다", "여보세요"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const GreetingMasterGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const [questions] = useState(() => shuffleArray(GREETINGS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleAnswer = (ans: string) => {
    if (feedback) return; setSelected(ans);
    if (ans === questions[round].answer) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setFeedback(null); setSelected(null); };
  const restart = () => { setRound(0); setScore(0); setFeedback(null); setSelected(null); };

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.greetingsComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <Badge variant="secondary" aria-live="polite" aria-atomic="true"><Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />{score * 5} XP</Badge>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.greetingsPrompt")}</p>
          <p className="text-xl font-bold text-foreground">"{q.situation}"</p>
          <div className="grid gap-3" role="group" aria-label="Choose the correct greeting">
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
            {feedback === "correct" ? "✅ 잘했어요! +5 XP" : t("games.wrongPrefix").replace("{answer}", q.answer)}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default GreetingMasterGame;
