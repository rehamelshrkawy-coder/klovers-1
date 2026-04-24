import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, Sparkles, RotateCw, CheckCircle2, XCircle } from "lucide-react";
import Korean from "@/components/Korean";
import { useGameData, GameVocabItem } from "@/hooks/useGameData";

interface FlashCard { korean: string; romanization: string; meaning: string; }

const FALLBACK: FlashCard[] = [
  { korean: "안녕하세요", romanization: "annyeonghaseyo", meaning: "Hello" },
  { korean: "감사합니다", romanization: "gamsahamnida", meaning: "Thank you" },
  { korean: "친구", romanization: "chingu", meaning: "Friend" },
  { korean: "학교", romanization: "hakgyo", meaning: "School" },
  { korean: "사랑", romanization: "sarang", meaning: "Love" },
  { korean: "음식", romanization: "eumsik", meaning: "Food" },
  { korean: "공부", romanization: "gongbu", meaning: "Study" },
  { korean: "한국", romanization: "hanguk", meaning: "Korea" },
  { korean: "물", romanization: "mul", meaning: "Water" },
  { korean: "행복", romanization: "haengbok", meaning: "Happiness" },
  { korean: "선생님", romanization: "seonsaengnim", meaning: "Teacher" },
  { korean: "가족", romanization: "gajok", meaning: "Family" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const FlashcardGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { vocab, loading: gameDataLoading } = useGameData();
  const vocabRef = useRef(vocab);
  useEffect(() => { vocabRef.current = vocab; }, [vocab]);

  const [cards, setCards] = useState<FlashCard[]>([]);
  const [usingLesson, setUsingLesson] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);
  const [done, setDone] = useState(false);
  const xpAwardedRef = useRef(false);

  const initCards = useCallback(() => {
    const pool = vocabRef.current.length >= 8 ? shuffleArray(vocabRef.current).slice(0, 12) : FALLBACK;
    setUsingLesson(vocabRef.current.length >= 8);
    setCards(pool);
    setIndex(0); setFlipped(false); setKnew(0); setDone(false);
    xpAwardedRef.current = false;
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (!gameDataLoading && !initialized.current) { initialized.current = true; initCards(); }
  }, [gameDataLoading, initCards]);

  useEffect(() => {
    if (done && !xpAwardedRef.current) { xpAwardedRef.current = true; onGameComplete?.(knew, cards.length); }
  }, [done, knew, cards.length, onGameComplete]);

  const handleKnew = (didKnow: boolean) => {
    if (didKnow) setKnew(k => k + 1);
    if (index + 1 >= cards.length) { setDone(true); return; }
    setIndex(i => i + 1); setFlipped(false);
  };

  if (gameDataLoading || !cards.length) {
    return <section className="py-12 px-4"><div className="max-w-lg mx-auto text-center text-muted-foreground animate-pulse">Loading vocab…</div></section>;
  }

  if (done) {
    const pct = Math.round((knew / cards.length) * 100);
    return (
      <section className="py-12 px-4"><Card className="max-w-lg mx-auto p-8 text-center space-y-4">
        <Trophy className="h-12 w-12 mx-auto text-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Flashcard Session Done!</h2>
        <p className="text-muted-foreground">You knew <strong>{knew}/{cards.length}</strong> cards ({pct}%)</p>
        <Badge variant="secondary" className="text-lg px-4 py-1">+{knew * 5} XP</Badge>
        <Button onClick={initCards} className="gap-2"><RotateCcw className="h-4 w-4" /> Study Again</Button>
      </Card></section>
    );
  }

  const card = cards[index];
  return (
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Card {index + 1}/{cards.length}</Badge>
          <div className="flex items-center gap-2">
            {usingLesson && <Badge variant="outline" className="text-xs">📚 From your lessons</Badge>}
            <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" />{knew * 5} XP</Badge>
          </div>
        </div>

        {/* Flashcard */}
        <button
          onClick={() => setFlipped(f => !f)}
          className="w-full"
          aria-label={flipped ? "Flip back" : "Flip card to reveal meaning"}
        >
          <Card className={`p-8 text-center space-y-3 min-h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${flipped ? "border-primary/40 bg-primary/5" : "border-border"}`}>
            {!flipped ? (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Korean</p>
                <Korean className="text-5xl font-bold text-foreground block">{card.korean}</Korean>
                <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1"><RotateCw className="h-3 w-3" /> Tap to reveal</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Meaning</p>
                <p className="text-3xl font-bold text-foreground">{card.meaning}</p>
                <p className="text-muted-foreground text-sm">{card.romanization}</p>
                <p className="text-xs text-muted-foreground mt-2">Did you know this?</p>
              </>
            )}
          </Card>
        </button>

        {flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleKnew(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4" /> Got it!
            </Button>
            <Button onClick={() => handleKnew(false)} variant="outline" className="gap-2 border-destructive text-destructive hover:bg-destructive/10">
              <XCircle className="h-4 w-4" /> Still learning
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Tap the card to flip</p>
        )}

        <Button variant="ghost" size="sm" onClick={initCards} className="w-full gap-1"><RotateCcw className="h-3 w-3" /> Restart</Button>
      </div>
    </section>
  );
};

export default FlashcardGame;
