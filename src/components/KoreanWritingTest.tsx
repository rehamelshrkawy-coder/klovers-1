import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, RotateCcw, Keyboard, PenLine, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WritingPrompt {
  id: string;
  type: "type_word" | "type_sentence" | "free_write";
  prompt: string;
  promptAr?: string;
  answer: string;
  hint?: string;
}

interface KoreanWritingTestProps {
  vocab: { id: string; korean: string; romanization: string; meaning: string }[];
  dialogue: { id: string; korean: string; english: string }[];
  lessonTitle: string;
  onComplete?: (score: number, total: number) => void;
}

const KoreanWritingTest = ({ vocab, dialogue, lessonTitle, onComplete }: KoreanWritingTestProps) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate prompts from lesson data
  const prompts: WritingPrompt[] = (() => {
    const items: WritingPrompt[] = [];

    // Word typing prompts from vocab
    vocab.slice(0, 6).forEach((v) => {
      items.push({
        id: `word_${v.id}`,
        type: "type_word",
        prompt: isAr ? `اكتب الكلمة الكورية لـ: "${v.meaning}"` : `Type the Korean word for: "${v.meaning}"`,
        answer: v.korean,
        hint: v.romanization,
      });
    });

    // Sentence typing from dialogue
    dialogue.slice(0, 3).forEach((d) => {
      items.push({
        id: `sent_${d.id}`,
        type: "type_sentence",
        prompt: isAr ? `اكتب هذه الجملة بالكورية: "${d.english}"` : `Type this sentence in Korean: "${d.english}"`,
        answer: d.korean,
      });
    });

    // Free writing prompt
    if (items.length > 0) {
      items.push({
        id: "free_write_1",
        type: "free_write",
        prompt: isAr
          ? `اكتب 2-3 جمل بالكورية عن "${lessonTitle}"`
          : `Write 2-3 sentences in Korean about "${lessonTitle}"`,
        answer: "",
      });
    }

    return items;
  })();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [freeWriteInput, setFreeWriteInput] = useState("");
  const [results, setResults] = useState<Record<string, { correct: boolean; userAnswer: string }>>({});
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const completedRef = useRef(false);

  const current = prompts[currentIndex];
  const totalGraded = prompts.filter((p) => p.type !== "free_write").length;

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const normalizeKorean = (str: string) => str.trim().replace(/\s+/g, " ");

  const checkAnswer = useCallback(() => {
    if (!current) return;

    if (current.type === "free_write") {
      // Free write: just record it, award if they wrote something with Korean characters
      const hasKorean = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(freeWriteInput);
      setResults((prev) => ({
        ...prev,
        [current.id]: { correct: hasKorean && freeWriteInput.length >= 5, userAnswer: freeWriteInput },
      }));
    } else {
      const isCorrect = normalizeKorean(userInput) === normalizeKorean(current.answer);
      setResults((prev) => ({
        ...prev,
        [current.id]: { correct: isCorrect, userAnswer: userInput },
      }));
    }

    if (currentIndex < prompts.length - 1) {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setUserInput("");
        setFreeWriteInput("");
        setShowHint(false);
      }, 1200);
    } else {
      setIsComplete(true);
    }
  }, [current, currentIndex, userInput, freeWriteInput, prompts.length]);

  // Notify parent on completion
  useEffect(() => {
    if (isComplete && !completedRef.current) {
      completedRef.current = true;
      const correctCount = Object.values(results).filter((r) => r.correct).length;
      onComplete?.(correctCount, prompts.length);
    }
  }, [isComplete, results, onComplete, prompts.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userInput.trim()) {
      checkAnswer();
    }
  };

  const resetTest = () => {
    setCurrentIndex(0);
    setUserInput("");
    setFreeWriteInput("");
    setResults({});
    setShowHint(false);
    setIsComplete(false);
    completedRef.current = false;
  };

  if (prompts.length === 0) {
    return (
      <div className="text-center py-8">
        <Keyboard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          {isAr ? "لا توجد تمارين كتابة لهذا الدرس بعد" : "No writing exercises available for this lesson yet"}
        </p>
      </div>
    );
  }

  if (isComplete) {
    const correctCount = Object.values(results).filter((r) => r.correct).length;
    const score = Math.round((correctCount / prompts.length) * 100);

    return (
      <div className="space-y-6">
        {/* Score summary */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-4xl font-bold text-foreground mb-2">
            {correctCount}/{prompts.length}
          </p>
          <p className={cn(
            "text-lg font-semibold mb-1",
            score >= 80 ? "text-green-600 dark:text-green-400" : score >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive"
          )}>
            {score >= 80 ? "🎉 " : score >= 50 ? "👍 " : "📝 "}
            {score >= 80
              ? (isAr ? "ممتاز! كتابتك رائعة!" : "Excellent! Great typing skills!")
              : score >= 50
              ? (isAr ? "جيد! تحتاج بعض الممارسة" : "Good! Keep practicing!")
              : (isAr ? "حاول مرة أخرى - الممارسة تصنع المعجزات!" : "Try again — practice makes perfect!")}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {isAr ? "نتيجة الكتابة" : "Writing Score"}: {score}%
          </p>
          <Button onClick={resetTest} variant="default" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {isAr ? "أعد المحاولة" : "Try Again"}
          </Button>
        </div>

        {/* Review answers */}
        <div className="space-y-3">
          {prompts.map((p) => {
            const result = results[p.id];
            if (!result) return null;
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-lg border p-4",
                  result.correct ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {result.correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{p.prompt}</p>
                    <p className="text-foreground font-medium">
                      {isAr ? "إجابتك" : "Your answer"}: <span className="font-korean">{result.userAnswer || "—"}</span>
                    </p>
                    {p.answer && !result.correct && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {isAr ? "الإجابة الصحيحة" : "Correct"}: <span className="font-korean font-bold">{p.answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const result = results[current?.id];
  const answered = !!result;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1}/{prompts.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all rounded-full"
            style={{ width: `${((currentIndex + 1) / prompts.length) * 100}%` }}
          />
        </div>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium",
          current?.type === "type_word"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : current?.type === "type_sentence"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        )}>
          {current?.type === "type_word"
            ? (isAr ? "كلمة" : "Word")
            : current?.type === "type_sentence"
            ? (isAr ? "جملة" : "Sentence")
            : (isAr ? "كتابة حرة" : "Free Write")}
        </span>
      </div>

      {/* Current prompt */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          {current?.type === "free_write" ? (
            <PenLine className="h-5 w-5 text-primary" />
          ) : (
            <Keyboard className="h-5 w-5 text-primary" />
          )}
          <p className="text-lg font-semibold text-foreground">{current?.prompt}</p>
        </div>

        {current?.hint && (
          <div className="mb-4">
            {showHint ? (
              <p className="text-sm text-muted-foreground italic">
                💡 {isAr ? "تلميح" : "Hint"}: {current.hint}
              </p>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="text-sm text-primary hover:underline"
              >
                {isAr ? "إظهار التلميح" : "Show hint"}
              </button>
            )}
          </div>
        )}

        {answered ? (
          <div className={cn(
            "rounded-lg p-4",
            result.correct ? "bg-green-500/10" : "bg-destructive/10"
          )}>
            <div className="flex items-center gap-2 mb-1">
              {result.correct ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={cn("font-medium", result.correct ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                {result.correct ? (isAr ? "صحيح!" : "Correct!") : (isAr ? "خطأ" : "Incorrect")}
              </span>
            </div>
            {!result.correct && current?.answer && (
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "الإجابة" : "Answer"}: <span className="font-korean font-bold text-foreground">{current.answer}</span>
              </p>
            )}
          </div>
        ) : current?.type === "free_write" ? (
          <div className="space-y-3">
            <Textarea
              value={freeWriteInput}
              onChange={(e) => setFreeWriteInput(e.target.value)}
              placeholder={isAr ? "اكتب بالكورية هنا..." : "Type in Korean here..."}
              className="min-h-[120px] text-lg font-korean"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "💡 فعّل لوحة مفاتيح كورية على جهازك للكتابة بالكورية"
                : "💡 Enable Korean keyboard on your device to type in Korean"}
            </p>
            <Button
              onClick={checkAnswer}
              disabled={freeWriteInput.trim().length < 2}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4 rtl-flip" />
              {isAr ? "إرسال" : "Submit"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAr ? "اكتب بالكورية..." : "Type in Korean..."}
              className="text-xl font-korean text-center h-14"
              dir="ltr"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground text-center">
              {isAr
                ? "💡 فعّل لوحة مفاتيح كورية واضغط Enter"
                : "💡 Enable Korean keyboard & press Enter to submit"}
            </p>
            <Button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="w-full gap-2"
            >
              <ArrowRight className="h-4 w-4 rtl-flip" />
              {isAr ? "تحقق" : "Check"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KoreanWritingTest;
