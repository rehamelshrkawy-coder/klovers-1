import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { calculateSM2 } from "@/lib/sm2";

// Re-export so callers that previously imported from useSRS still work
export { calculateSM2 } from "@/lib/sm2";

export interface SRSCard {
  id: number;
  lesson_vocabulary_id: string;
  korean: string;
  romanization: string;
  meaning: string;
  next_review_date: string;
  interval_days: number;
  difficulty_factor: number;
  review_count: number;
  lesson_id: number;
}

interface SRSState {
  dueCards: SRSCard[];
  totalDue: number;
  loading: boolean;
  error: string | null;
}

/**
 * Calculate next review date from an interval in days.
 */
function getNextReviewDate(intervalDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date;
}

/**
 * Hook for managing spaced repetition reviews (SM-2 algorithm).
 */
export function useSRS(): SRSState & {
  recordReview: (vocabId: string, quality: number) => Promise<void>;
  initializeVocabulary: (vocabIds: string[]) => Promise<void>;
} {
  const { user } = useAuth();
  const [state, setState] = useState<SRSState>({
    dueCards: [],
    totalDue: 0,
    loading: true,
    error: null,
  });

  // Fetch cards due for review today
  const fetchDueCards = async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        loading: false,
        dueCards: [],
        totalDue: 0,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from("vocabulary_review_history")
        .select(
          `
          id,
          lesson_vocabulary_id,
          next_review_date,
          interval_days,
          difficulty_factor,
          review_count,
          lesson_vocabulary (
            korean,
            romanization,
            meaning,
            lesson_id
          )
        `
        )
        .eq("user_id", user.id)
        .lte("next_review_date", new Date().toISOString().split("T")[0])
        .order("next_review_date", { ascending: true });

      if (error) throw error;

      const cards: SRSCard[] = (data || []).map((item) => ({
        id: item.id,
        lesson_vocabulary_id: item.lesson_vocabulary_id,
        korean: item.lesson_vocabulary.korean,
        romanization: item.lesson_vocabulary.romanization,
        meaning: item.lesson_vocabulary.meaning,
        next_review_date: item.next_review_date,
        interval_days: item.interval_days,
        difficulty_factor: item.difficulty_factor,
        review_count: item.review_count,
        lesson_id: item.lesson_vocabulary.lesson_id,
      }));

      setState({
        dueCards: cards,
        totalDue: cards.length,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch cards",
      }));
    }
  };

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchDueCards();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Record a review with quality rating (0-5)
  const recordReview = async (vocabId: string, quality: number) => {
    if (!user) return;

    try {
      // Get current review record
      const { data: review, error: fetchError } = await supabase
        .from("vocabulary_review_history")
        .select("id, difficulty_factor, interval_days, review_count, next_review_date")
        .eq("user_id", user.id)
        .eq("lesson_vocabulary_id", vocabId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new SM-2 values
      const currentDifficulty = review?.difficulty_factor || 2.5;
      const currentInterval = review?.interval_days || 0;
      const currentCount = review?.review_count || 0;

      const { newDifficulty, newInterval } = calculateSM2(
        quality,
        currentDifficulty,
        currentInterval
      );

      const nextReviewDate = getNextReviewDate(newInterval);

      // Update review record
      const { error: updateError } = await supabase
        .from("vocabulary_review_history")
        .update({
          difficulty_factor: newDifficulty,
          interval_days: newInterval,
          next_review_date: nextReviewDate.toISOString().split("T")[0],
          review_count: currentCount + 1,
          quality_last_review: quality,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("lesson_vocabulary_id", vocabId);

      if (updateError) throw updateError;

      // Refresh due cards list
      await fetchDueCards();
    } catch (err) {
      console.error("Failed to record review:", err);
      throw err;
    }
  };

  // Initialize vocabulary review history for new vocabulary items
  const initializeVocabulary = async (vocabIds: string[]) => {
    if (!user || vocabIds.length === 0) return;

    try {
      const recordsToInsert = vocabIds.map((vocabId) => ({
        user_id: user.id,
        lesson_vocabulary_id: vocabId,
        next_review_date: new Date().toISOString().split("T")[0], // Available immediately
        difficulty_factor: 2.5,
        interval_days: 1,
        review_count: 0,
      }));

      // Use upsert to avoid duplicates
      const { error } = await supabase
        .from("vocabulary_review_history")
        .upsert(recordsToInsert, {
          onConflict: "user_id,lesson_vocabulary_id",
        });

      if (error) throw error;

      // Refresh after initialization
      await fetchDueCards();
    } catch (err) {
      console.error("Failed to initialize vocabulary:", err);
      throw err;
    }
  };

  return {
    ...state,
    recordReview,
    initializeVocabulary,
  };
}
