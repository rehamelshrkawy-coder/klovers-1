import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { useGameData, GameVocabItem } from "@/hooks/useGameData";

interface Question { scrambled: string; answer: string; english: string; }

const WORDS: Question[] = [
  { scrambled: "랑사", answer: "사랑", english: "Love" },
  { scrambled: "구친", answer: "친구", english: "Friend" },
  { scrambled: "교학", answer: "학교", english: "School" },
  { scrambled: "생선", answer: "선생", english: "Teacher" },
  { scrambled: "복행", answer: "행복", english: "Happiness" },
  { scrambled: "족가", answer: "가족", english: "Family" },
  { scrambled: "행여", answer: "여행", english: "Travel" },
  { scrambled: "악음", answer: "음악", english: "Music" },
  { scrambled: "화문", answer: "문화", english: "Culture" },
  { scrambled: "사역", answer: "역사", english: "History" },
  { scrambled: "계세", answer: "세계", english: "World" },
  { scrambled: "연자", answer: "자연", english: "Nature" },
  { scrambled: "간시", answer: "시간", english: "Time" },
  { scrambled: "래미", answer: "미래", english: "Future" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

function scrambleKorean(word: string): string {
  const chars = [...word];
  if (chars.length < 2) return word;
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  if (chars.join("") === word) { [chars[0], chars[1]] = [chars[1], chars[0]]; }
  return chars.join("");
}

function buildQuestions(vocab: GameVocabItem[]): Question[] {
  if (vocab.length >= 10) {
    return shuffleArray(vocab)
      .slice(0, 14)
      .map(v => ({ scrambled: scrambleKorean(v.korean), answer: v.korean, english: v.meaning }));
  }
  return WORDS;
}

const WordScrambleGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const { vocab, loading: gameDataLoading } = useGameData();
  const totalRounds = 10;

  const vocabRef = useRef(vocab);
  useEffect(() => { vocabRef.current = vocab; }, [vocab]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [usingLessonVocab, setUsingLessonVocab] = useState(false);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const xpAwardedRef = useRef(false);

  const initQuestions = useCallback(() => {
    const built = buildQuestions(vocabRef.current);
    setUsingLessonVocab(vocabRef.current.length >= 10);
    setQuestions(shuffleArray(built).slice(0, totalRounds));
    setRound(0);
    setScore(0);
    setInput("");
    setFeedback(null);
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

  const handleSubmit = () => {
    if (feedback || questions.length === 0) return;
    const isCorrect = input.trim() === questions[round].answer;
    if (isCorrect) { setScore(s => s + 1); setFeedback("correct"); }
    else setFeedback("wrong");
  };

  const nextRound = () => { if (round + 1 >= totalRounds) { setRound(round + 1); return; } setRound(r => r + 1); setInput(""); setFeedback(null); };

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
        <h2 className="text-2xl font-bold text-foreground">{t("games.scrambleComplete")}</h2>
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
          <p className="text-sm text-muted-foreground">{t("games.scramblePrompt")}</p>
          <p className="text-5xl font-bold text-foreground tracking-widest">{q.scrambled}</p>
          <p className="text-muted-foreground">{t("games.scrambleHint").replace("{hint}", q.english)}</p>
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder={t("games.scramblePlaceholder")}
              disabled={!!feedback}
              className="border-2 border-border rounded-lg px-4 py-2 text-center text-xl font-bold bg-card text-foreground w-48 focus:outline-none focus:border-foreground/40"
            />
            {!feedback && <Button onClick={handleSubmit}>{t("games.scrambleCheck")}</Button>}
          </div>
          {feedback && <p role="alert" className={feedback === "correct" ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {feedback === "correct" ? t("games.correctFeedback") : t("games.wrongPrefix").replace("{answer}", q.answer)}
          </p>}
        </Card>
        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={initQuestions} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default WordScrambleGame;
