import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { useGameData, GameVocabItem } from "@/hooks/useGameData";

interface Question { korean: string; answer: string; options: string[]; }

const PHRASES: Question[] = [
  { korean: "오빠!", answer: "Older brother (from a girl)", options: ["Older brother (from a girl)", "Older sister", "Friend", "Boss"] },
  { korean: "사랑해", answer: "I love you", options: ["I love you", "I miss you", "I like you", "Thank you"] },
  { korean: "미안해", answer: "I'm sorry (casual)", options: ["I'm sorry (casual)", "Thank you", "Goodbye", "Hello"] },
  { korean: "대박!", answer: "Amazing!/Awesome!", options: ["Amazing!/Awesome!", "Oh no!", "Help!", "Careful!"] },
  { korean: "진짜?", answer: "Really?", options: ["Really?", "Why?", "When?", "Where?"] },
  { korean: "아이고!", answer: "Oh my!/Goodness!", options: ["Oh my!/Goodness!", "Ouch!", "Help!", "Watch out!"] },
  { korean: "헐!", answer: "OMG!/No way!", options: ["OMG!/No way!", "Yes!", "Thanks!", "Hello!"] },
  { korean: "괜찮아", answer: "It's okay / I'm fine", options: ["It's okay / I'm fine", "I'm sorry", "I'm hungry", "I'm tired"] },
  { korean: "보고 싶어", answer: "I miss you", options: ["I miss you", "I love you", "I see you", "I need you"] },
  { korean: "짜증나!", answer: "So annoying!", options: ["So annoying!", "So fun!", "So beautiful!", "So delicious!"] },
  { korean: "어떡해!", answer: "What do I do?!", options: ["What do I do?!", "How are you?", "Where is it?", "Who is it?"] },
  { korean: "화이팅!", answer: "You can do it! / Fighting!", options: ["You can do it! / Fighting!", "Be careful!", "Goodbye!", "Sorry!"] },
  { korean: "맛있다!", answer: "It's delicious!", options: ["It's delicious!", "It's pretty!", "It's cold!", "It's hot!"] },
  { korean: "가자!", answer: "Let's go!", options: ["Let's go!", "Stop!", "Wait!", "Come here!"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function buildQuestions(vocab: GameVocabItem[]): Question[] {
  if (vocab.length >= 8) {
    const shuffled = shuffleArray(vocab);
    const allMeanings = vocab.map(v => v.meaning);
    return shuffled.slice(0, 14).map(v => {
      const wrongs = shuffleArray(allMeanings.filter(m => m !== v.meaning)).slice(0, 3);
      return { korean: v.korean, answer: v.meaning, options: shuffleArray([v.meaning, ...wrongs]) };
    });
  }
  return PHRASES;
}

const KDramaQuizGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const { vocab, loading: gameDataLoading } = useGameData();
  const totalRounds = 10;

  const vocabRef = useRef(vocab);
  useEffect(() => { vocabRef.current = vocab; }, [vocab]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [usingLessonVocab, setUsingLessonVocab] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const xpAwardedRef = useRef(false);

  const initQuestions = useCallback(() => {
    const built = buildQuestions(vocabRef.current);
    setUsingLessonVocab(vocabRef.current.length >= 8);
    setQuestions(shuffleArray(built).slice(0, totalRounds));
    setRound(0);
    setScore(0);
    setFeedback(null);
    setSelected(null);
    xpAwardedRef.current = false;
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (!gameDataLoading && !initialized.current) {
      initialized.current = true;
      initQuestions();
    }
  }, [gameDataLoading, initQuestions]);

  useEffect(() => {
    if (round >= totalRounds && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(score, totalRounds); }
  }, [round, totalRounds, score, onGameComplete]);

  const handleAnswer = (ans: string) => {
    if (feedback || questions.length === 0) return;
    setSelected(ans);
    if (ans === questions[round].answer) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setFeedback(null); setSelected(null); };

  if (gameDataLoading || questions.length === 0) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center text-muted-foreground animate-pulse">Loading vocab…</div>
      </section>
    );
  }

  if (round >= totalRounds) {
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">{t("games.kdramaComplete")}</h2>
        <p className="text-muted-foreground">{score}/{totalRounds} {t("games.correct")}</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{score * 5} XP</Badge>
        <Button onClick={initQuestions} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
      </Card></section>
    );
  }

  const q = questions[round];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {round + 1}/{totalRounds}</Badge>
          <div className="flex items-center gap-2">
            {usingLessonVocab && <Badge variant="outline" className="text-xs gap-1">📚 From your lessons</Badge>}
            <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{score * 5} XP</Badge>
          </div>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.kdramaPrompt")}</p>
          <p className="text-4xl font-bold text-foreground">{q.korean}</p>
          <p className="text-xs text-muted-foreground">{t("games.kdramaMeaning")}</p>
          <div className="grid gap-3" role="group" aria-label="Choose the correct meaning">
            {q.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                aria-label={opt}
                aria-pressed={selected === opt ? true : undefined}
                className={`p-3 rounded-lg font-medium border-2 transition-all text-left ${
                  feedback && opt === q.answer ? "border-green-500 bg-green-500/10 text-foreground" :
                  feedback && opt === selected ? "border-destructive bg-destructive/10 text-foreground" :
                  "border-border bg-card text-foreground hover:border-foreground/30"
                }`}>{opt}</button>
            ))}
          </div>
          {feedback && <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? "✅ 대박! +5 XP" : t("games.wrongPrefix").replace("{answer}", q.answer)}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={initQuestions} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default KDramaQuizGame;
