import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { RotateCcw, Trophy, Heart, Zap } from "lucide-react";

interface HangulChar {
  char: string;
  romanization: string;
  type: "vowel" | "consonant";
}

const HANGUL_CHARS: HangulChar[] = [
  { char: "ㄱ", romanization: "g/k", type: "consonant" },
  { char: "ㄴ", romanization: "n", type: "consonant" },
  { char: "ㄷ", romanization: "d/t", type: "consonant" },
  { char: "ㄹ", romanization: "r/l", type: "consonant" },
  { char: "ㅁ", romanization: "m", type: "consonant" },
  { char: "ㅂ", romanization: "b/p", type: "consonant" },
  { char: "ㅅ", romanization: "s", type: "consonant" },
  { char: "ㅇ", romanization: "ng/silent", type: "consonant" },
  { char: "ㅈ", romanization: "j", type: "consonant" },
  { char: "ㅊ", romanization: "ch", type: "consonant" },
  { char: "ㅋ", romanization: "k", type: "consonant" },
  { char: "ㅌ", romanization: "t", type: "consonant" },
  { char: "ㅍ", romanization: "p", type: "consonant" },
  { char: "ㅎ", romanization: "h", type: "consonant" },
  { char: "ㅏ", romanization: "a", type: "vowel" },
  { char: "ㅑ", romanization: "ya", type: "vowel" },
  { char: "ㅓ", romanization: "eo", type: "vowel" },
  { char: "ㅕ", romanization: "yeo", type: "vowel" },
  { char: "ㅗ", romanization: "o", type: "vowel" },
  { char: "ㅛ", romanization: "yo", type: "vowel" },
  { char: "ㅜ", romanization: "u", type: "vowel" },
  { char: "ㅠ", romanization: "yu", type: "vowel" },
  { char: "ㅡ", romanization: "eu", type: "vowel" },
  { char: "ㅣ", romanization: "i", type: "vowel" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(correct: HangulChar, pool: HangulChar[]): string[] {
  const others = shuffleArray(pool.filter((c) => c.char !== correct.char)).slice(0, 3);
  const options = [...others.map((o) => o.romanization), correct.romanization];
  return shuffleArray(options);
}

const HangulQuizGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const { t } = useLanguage();
  const totalRounds = 10;
  const maxLives = 3;

  const [queue, setQueue] = useState<HangulChar[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(maxLives);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const initGame = useCallback(() => {
    const q = shuffleArray(HANGUL_CHARS).slice(0, totalRounds);
    setQueue(q);
    setRound(0);
    setScore(0);
    setLives(maxLives);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setIsCorrect(null);
    setGameOver(false);
    setShowHint(false);
    setOptions(generateOptions(q[0], HANGUL_CHARS));
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (gameOver && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      onGameComplete?.(score, totalRounds);
    }
  }, [gameOver, score, totalRounds, onGameComplete]);

  const currentChar = queue[round];

  const handleAnswer = (answer: string) => {
    if (selected !== null || gameOver) return;
    setSelected(answer);
    const correct = answer === currentChar.romanization;
    setIsCorrect(correct);

    if (correct) {
      const newStreak = streak + 1;
      setScore((s) => s + (newStreak >= 3 ? 2 : 1));
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 800);
        return;
      }
    }

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= totalRounds) {
        setGameOver(true);
      } else {
        setRound(nextRound);
        setOptions(generateOptions(queue[nextRound], HANGUL_CHARS));
        setSelected(null);
        setIsCorrect(null);
        setShowHint(false);
      }
    }, 900);
  };

  const progress = ((round + (gameOver ? 1 : 0)) / totalRounds) * 100;

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("games.hangulHeader")}
          </h2>
          <p className="text-muted-foreground">
            {t("games.hangulSubtitle")}
          </p>
        </div>

        <div className="flex justify-center gap-3 md:gap-5 mb-4 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            {t("games.score")}: {score}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <div className="flex gap-0.5">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart key={i} className={`h-3.5 w-3.5 ${i < lives ? "fill-destructive text-destructive" : "text-muted-foreground/30"}`} />
              ))}
            </div>
          </Badge>
          {streak >= 2 && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm animate-in fade-in">
              <Zap className="h-3.5 w-3.5 text-primary-text" /> {streak}x Streak!
            </Badge>
          )}
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        {!gameOver && currentChar ? (
          <>
            <Card className="max-w-xs mx-auto mb-8 p-8 text-center border-2 border-border bg-card relative">
              <div className="absolute -top-3 -end-3 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                {round + 1}/{totalRounds}
              </div>
              <span className="text-7xl md:text-8xl font-bold text-foreground block mb-3 select-none">
                {currentChar.char}
              </span>
              <Badge variant="outline" className="text-xs">
                {currentChar.type === "vowel" ? `🔴 ${t("games.vowel")}` : `🔵 ${t("games.consonant")}`}
              </Badge>
              {showHint && (
                <p className="text-xs text-muted-foreground mt-2 animate-in fade-in">
                  {t("games.hintText").replace("{type}", currentChar.type === "vowel" ? t("games.vowel") : t("games.consonant"))}
                </p>
              )}
              {!showHint && selected === null && (
                <button onClick={() => setShowHint(true)} className="text-xs text-muted-foreground/60 hover:text-muted-foreground mt-2 underline">
                  {t("games.needHint")}
                </button>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {options.map((opt) => {
                let style = "bg-card border-border hover:border-foreground/30 hover:shadow-sm";
                if (selected !== null) {
                  if (opt === currentChar.romanization) {
                    style = "bg-primary/15 border-primary/50 shadow-md";
                  } else if (opt === selected && !isCorrect) {
                    style = "bg-destructive/10 border-destructive/50";
                  } else {
                    style = "bg-muted/50 border-border opacity-50";
                  }
                }
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null}
                    className={`rounded-lg border-2 p-4 text-center font-semibold text-lg transition-all duration-200 ${style} ${selected === null ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className={`text-center mt-4 text-sm font-medium animate-in fade-in ${isCorrect ? "text-foreground" : "text-destructive"}`}>
                {isCorrect
                  ? streak >= 3
                    ? t("games.streakBonus")
                    : t("games.correctSimple")
                  : t("games.wrongAnswer").replace("{answer}", currentChar.romanization)}
              </div>
            )}
          </>
        ) : gameOver ? (
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="max-w-sm mx-auto p-8 border-2 border-border">
              <div className="flex justify-center gap-1 mb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Trophy
                    key={i}
                    className={`h-8 w-8 ${i < (score >= 8 ? 3 : score >= 5 ? 2 : 1) ? "text-primary-text [filter:drop-shadow(0_0_3px_hsl(var(--primary)))]" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {lives > 0 ? t("games.quizComplete") : t("games.gameOver")}
              </h3>
              <div className="space-y-1 text-muted-foreground">
                <p>{t("games.score")}: <span className="font-bold text-foreground">{score}</span> {t("games.points")}</p>
                <p>{t("games.bestStreak")}: <span className="font-bold text-foreground">{bestStreak}x</span></p>
                <p>{t("games.round")}: {round + (lives > 0 ? 1 : 0)}/{totalRounds}</p>
              </div>
            </Card>
            <Button variant="outline" onClick={initGame} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t("games.playAgain")}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default HangulQuizGame;
