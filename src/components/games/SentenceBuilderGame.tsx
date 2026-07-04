import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Sparkles, ArrowRight } from "lucide-react";

interface Sentence {
  words: string[];
  correct: string[];
  english: string;
}

const SENTENCES: Sentence[] = [
  { words: ["저는", "학생", "입니다"], correct: ["저는", "학생", "입니다"], english: "I am a student." },
  { words: ["이것은", "책", "입니다"], correct: ["이것은", "책", "입니다"], english: "This is a book." },
  { words: ["한국어를", "공부합니다", "저는"], correct: ["저는", "한국어를", "공부합니다"], english: "I study Korean." },
  { words: ["좋아합니다", "음식을", "한국", "저는"], correct: ["저는", "한국", "음식을", "좋아합니다"], english: "I like Korean food." },
  { words: ["갑니다", "학교에", "저는"], correct: ["저는", "학교에", "갑니다"], english: "I go to school." },
  { words: ["있습니다", "친구가", "한국에", "저는"], correct: ["저는", "한국에", "친구가", "있습니다"], english: "I have a friend in Korea." },
  { words: ["먹습니다", "아침을", "매일", "저는"], correct: ["저는", "매일", "아침을", "먹습니다"], english: "I eat breakfast every day." },
  { words: ["봅니다", "드라마를", "한국", "저는"], correct: ["저는", "한국", "드라마를", "봅니다"], english: "I watch Korean dramas." },
  { words: ["마십니다", "커피를", "저는", "아침에"], correct: ["저는", "아침에", "커피를", "마십니다"], english: "I drink coffee in the morning." },
  { words: ["읽습니다", "책을", "저는", "매일"], correct: ["저는", "매일", "책을", "읽습니다"], english: "I read books every day." },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SentenceBuilderGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>(() => shuffleArray(SENTENCES[0].words));
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const rounds = 8;

  const currentSentence = SENTENCES[round % SENTENCES.length];

  const handleWordClick = (word: string) => {
    if (feedback) return;
    const newPlaced = [...placed, word];
    const newAvailable = available.filter((_, i) => i !== available.indexOf(word));
    setPlaced(newPlaced);
    setAvailable(newAvailable);

    if (newAvailable.length === 0) {
      const isCorrect = newPlaced.join(" ") === currentSentence.correct.join(" ");
      setFeedback(isCorrect ? "correct" : "wrong");
      setTotal(t => t + 1);
      if (isCorrect) setScore(s => s + 1);
    }
  };

  const handleRemoveWord = (index: number) => {
    if (feedback) return;
    const word = placed[index];
    setPlaced(placed.filter((_, i) => i !== index));
    setAvailable([...available, word]);
  };

  const nextRound = () => {
    if (total >= rounds) { setGameOver(true); return; }
    const nextIdx = (round + 1) % SENTENCES.length;
    setRound(nextIdx);
    setPlaced([]);
    setAvailable(shuffleArray(SENTENCES[nextIdx].words));
    setFeedback(null);
  };

  const restart = () => {
    setRound(0); setScore(0); setTotal(0); setPlaced([]);
    setAvailable(shuffleArray(SENTENCES[0].words));
    setFeedback(null); setGameOver(false);
  };

  const xpEarned = score * 5;

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (gameOver && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      onGameComplete?.(score, rounds);
    }
  }, [gameOver, score, rounds, onGameComplete]);

  if (gameOver) {
    return (
      <section className="py-12 px-4">
        <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
          <Trophy className="h-12 w-12 mx-auto text-foreground" />
          <h2 className="text-2xl font-bold text-foreground">{t("games.sentenceComplete")}</h2>
          <p className="text-muted-foreground">{t("games.sentenceScore").replace("{score}", String(score)).replace("{total}", String(rounds))}</p>
          <Badge variant="secondary" className="text-lg px-4 py-1">+{xpEarned} XP</Badge>
          <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> {t("games.playAgain")}</Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{t("games.round")} {total + 1}/{rounds}</Badge>
          <Badge variant="secondary" aria-live="polite" aria-atomic="true"><Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />{score * 5} XP</Badge>
        </div>

        <Card className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">{t("games.sentencePrompt")}</p>
          <p className="text-lg font-semibold text-foreground">"{currentSentence.english}"</p>

          <div className="min-h-[48px] border-2 border-dashed border-border rounded-lg p-3 flex flex-wrap gap-2">
            {placed.length === 0 && <span className="text-muted-foreground text-sm">{t("games.sentencePlaceholder")}</span>}
            {placed.map((word, i) => (
              <button key={i} onClick={() => handleRemoveWord(i)} aria-label={`Remove word: ${word}`} className="px-3 py-1.5 bg-primary/10 text-foreground rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">{word}</button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Available words — click to add to sentence">
            {available.map((word, i) => (
              <button key={i} onClick={() => handleWordClick(word)} aria-label={`Add word: ${word}`} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors border border-border">{word}</button>
            ))}
          </div>

          {feedback && (
            <div role="alert" className={`p-3 rounded-lg text-center ${feedback === "correct" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
              {feedback === "correct" ? t("games.correctFeedback") : t("games.sentenceCorrectOrder").replace("{order}", currentSentence.correct.join(" "))}
            </div>
          )}
        </Card>

        {feedback && <Button onClick={nextRound} className="w-full gap-2">{t("games.next")} <ArrowRight className="h-4 w-4" /></Button>}
        <Button variant="ghost" size="sm" onClick={restart} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> {t("games.restart")}</Button>
      </div>
    </section>
  );
};

export default SentenceBuilderGame;
