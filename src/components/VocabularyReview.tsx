import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2 } from "lucide-react";
import { SRSCard } from "@/hooks/useSRS";
import Korean from "@/components/Korean";

interface VocabularyReviewProps {
  cards: SRSCard[];
  onComplete: (vocabId: number, quality: number) => Promise<void>;
  isLoading?: boolean;
}

export function VocabularyReview({
  cards,
  onComplete,
  isLoading = false,
}: VocabularyReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const speakKorean = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRating = async (quality: number) => {
    if (!currentCard || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onComplete(currentCard.lesson_vocabulary_id, quality);

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // All cards reviewed
        setCurrentIndex(cards.length);
      }
    } catch (error) {
      console.error("Failed to record review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">Loading cards...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-bold mb-2">🎉 All Caught Up!</h3>
        <p className="text-muted-foreground">
          No vocabulary items need review today. Great job!
        </p>
      </div>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-bold mb-2">✨ Review Complete!</h3>
        <p className="text-muted-foreground mb-6">
          You reviewed {cards.length} vocabulary items today.
        </p>
        <Button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
        >
          Start Another Session
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div
        className="h-64 cursor-pointer perspective"
        onClick={() => setIsFlipped(!isFlipped)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsFlipped((flipped) => !flipped);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Show Korean word" : "Show word meaning"}
      >
        <Card
          className={`h-full flex items-center justify-center transition-all duration-300 ${
            isFlipped ? "bg-blue-50 dark:bg-blue-950" : "bg-white dark:bg-slate-800"
          } border-2 hover:shadow-lg`}
        >
          <CardContent className="text-center p-8">
            {isFlipped ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">MEANING</p>
                <p className="text-3xl font-bold">{currentCard.meaning}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">KOREAN</p>
                <Korean className="text-5xl font-bold mb-4 block">{currentCard.korean}</Korean>
                <p className="text-lg text-muted-foreground">
                  {currentCard.romanization}
                </p>

                {/* Audio Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakKorean(currentCard.korean);
                  }}
                  className="mt-4"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Pronounce
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Click to flip • Reviewed {currentCard.review_count} times
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Buttons */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-center">
          How well did you remember this?
        </p>
        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRating(0)}
            className="text-xs"
            title="Complete blackout - did not recognize"
          >
            😕
            <span className="hidden sm:inline ml-1">Again</span>
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRating(1)}
            className="text-xs"
            title="Incorrect response, but remembered correctly"
          >
            😐
            <span className="hidden sm:inline ml-1">Hard</span>
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRating(2)}
            className="text-xs"
            title="Correct response, but with serious difficulty"
          >
            🤔
            <span className="hidden sm:inline ml-1">Ok</span>
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRating(3)}
            className="text-xs"
            title="Correct response, but after some hesitation"
          >
            🙂
            <span className="hidden sm:inline ml-1">Good</span>
          </Button>
          <Button
            variant="default"
            disabled={isSubmitting}
            onClick={() => handleRating(4)}
            className="text-xs"
            title="Correct response without hesitation"
          >
            😄
            <span className="hidden sm:inline ml-1">Easy</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Rating affects when this card will reappear
        </p>
      </div>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>
            <strong>Tip:</strong> Rate honestly - "Again" resets the card,
            while "Easy" extends the interval longest.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
