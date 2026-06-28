import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { XP_VALUES, getLeague, BADGES } from "@/constants/gamification";
import { capture } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";

interface UserProgress {
  totalXp: number;
  lessonProgress: Record<number, {
    vocab_done: boolean;
    grammar_done: boolean;
    dialogue_done: boolean;
    exercises_done: boolean;
    reading_done: boolean;
    writing_done: boolean;
    chapter_completed: boolean;
  }>;
  badges: string[];
  streak: {
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
  };
}

export function useGamification() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [progress, setProgress] = useState<UserProgress>({
    totalXp: 0,
    lessonProgress: {},
    badges: [],
    streak: { current_streak: 0, longest_streak: 0, last_activity_date: null },
  });
  const [loading, setLoading] = useState(true);
  const [leaguePromotion, setLeaguePromotion] = useState<{ fromLeague: string; toLeague: string } | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [streakCelebration, setStreakCelebration] = useState<number | null>(null);

  const fetchProgress = useCallback(async (): Promise<UserProgress | null> => {
    if (authLoading) return null;
    if (!userId) { setLoading(false); return null; }

    const [xpRes, progressRes, badgesRes, streakRes] = await Promise.all([
      supabase.from("student_xp").select("xp_earned").eq("user_id", userId),
      supabase.from("student_lesson_progress").select("lesson_id, vocab_done, grammar_done, dialogue_done, exercises_done, reading_done, writing_done, chapter_completed").eq("user_id", userId),
      supabase.from("student_badges").select("badge_key").eq("user_id", userId),
      supabase.from("student_streaks").select("current_streak, longest_streak, last_activity_date").eq("user_id", userId).maybeSingle(),
    ]);

    const totalXp = (xpRes.data || []).reduce((sum: number, r: any) => sum + (r.xp_earned || 0), 0);

    const lessonProgress: Record<number, any> = {};
    (progressRes.data || []).forEach((r: any) => {
      lessonProgress[r.lesson_id] = {
        vocab_done: r.vocab_done,
        grammar_done: r.grammar_done,
        dialogue_done: r.dialogue_done,
        exercises_done: r.exercises_done,
        reading_done: r.reading_done,
        writing_done: r.writing_done,
        chapter_completed: r.chapter_completed,
      };
    });

    const newProgress: UserProgress = {
      totalXp,
      lessonProgress,
      badges: (badgesRes.data || []).map((b: any) => b.badge_key),
      streak: streakRes.data || { current_streak: 0, longest_streak: 0, last_activity_date: null },
    };

    setProgress(newProgress);
    setLoading(false);
    return newProgress;
  }, [authLoading, userId]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const updateStreak = useCallback(async (uid: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("student_streaks")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (!existing) {
      await supabase.from("student_streaks").insert({
        user_id: uid,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      });
      return;
    }

    if (existing.last_activity_date === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = existing.last_activity_date === yesterday.toISOString().split("T")[0];
    const newStreak = wasYesterday ? existing.current_streak + 1 : 1;
    const longestStreak = Math.max(newStreak, existing.longest_streak);

    const updates: any = {
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
    };

    // Award streak_bonus XP when streak continues (not reset)
    if (wasYesterday) {
      await supabase.from("student_xp").insert({
        user_id: uid,
        lesson_id: null,
        activity_type: "streak_bonus",
        xp_earned: XP_VALUES.streak_bonus,
      });
      capture({ event: "streak_continued", streakDays: newStreak });
    } else {
      // Streak broken — track it for churn analysis
      capture({ event: "streak_broken", previousStreak: existing.current_streak });
    }

    const milestones = [
      { threshold: 3, key: "streak_3", flag: "streak_3_earned" },
      { threshold: 7, key: "streak_7", flag: "streak_7_earned" },
      { threshold: 14, key: "streak_14", flag: "streak_14_earned" },
      { threshold: 30, key: "streak_30", flag: "streak_30_earned" },
    ] as const;

    let newMilestone = false;
    for (const m of milestones) {
      if (newStreak >= m.threshold) {
        updates[m.flag] = true;
        await supabase.from("student_badges").upsert(
          { user_id: uid, badge_key: m.key },
          { onConflict: "user_id,badge_key" }
        );
        // Trigger celebration only when this milestone is first crossed
        if (!existing[m.flag] && !newMilestone) {
          newMilestone = true;
          setStreakCelebration(newStreak);
        }
      }
    }

    await supabase.from("student_streaks").update(updates).eq("user_id", uid);
  }, []);

  const awardXp = useCallback(async (lessonId: number | null, activityType: keyof typeof XP_VALUES) => {
    if (!userId) return 0;

    const xp = XP_VALUES[activityType];
    const oldLeague = getLeague(progress.totalXp);
    const oldBadges = new Set(progress.badges);

    // Run XP insert and streak update in parallel — both are independent writes
    await Promise.all([
      supabase.from("student_xp").insert({
        user_id: userId,
        lesson_id: lessonId || null,
        activity_type: activityType,
        xp_earned: xp,
      }),
      updateStreak(userId),
    ]);

    // Single consolidated re-fetch after both writes complete
    const newProgress = await fetchProgress();
    if (newProgress) {
      const newLeague = getLeague(newProgress.totalXp);
      if (newLeague.key !== oldLeague.key) {
        setLeaguePromotion({ fromLeague: oldLeague.key, toLeague: newLeague.key });
        capture({ event: "league_promoted", fromLeague: oldLeague.key, toLeague: newLeague.key, totalXp: newProgress.totalXp });
      }
      const newlyEarned = newProgress.badges.filter(b => !oldBadges.has(b));
      if (newlyEarned.length > 0) {
        setNewBadges(prev => [...prev, ...newlyEarned]);
        newlyEarned.forEach(badgeKey => {
          const badge = BADGES.find(b => b.key === badgeKey);
          if (badge) capture({ event: "badge_earned", badgeKey, badgeName: badge.name });
        });
      }
    }

    return xp;
  }, [userId, progress.totalXp, progress.badges, updateStreak, fetchProgress]);

  const checkBadges = useCallback(async () => {
    if (!userId) return;

    const { data: allProgress } = await supabase
      .from("student_lesson_progress")
      .select("*")
      .eq("user_id", userId);

    if (!allProgress) return;

    const vocabCount = allProgress.filter((p: any) => p.vocab_done).length;
    const grammarCount = allProgress.filter((p: any) => p.grammar_done).length;
    const dialogueCount = allProgress.filter((p: any) => p.dialogue_done).length;
    const chapterCount = allProgress.filter((p: any) => p.chapter_completed).length;

    const lesson1 = allProgress.find((p: any) => p.lesson_id === 1);
    if (lesson1?.chapter_completed) {
      await supabase.from("student_badges").upsert({ user_id: userId, badge_key: "hangul_master" }, { onConflict: "user_id,badge_key" });
    }

    if (vocabCount >= 100) {
      await supabase.from("student_badges").upsert({ user_id: userId, badge_key: "first_100_words" }, { onConflict: "user_id,badge_key" });
    }
    if (grammarCount >= 5) {
      await supabase.from("student_badges").upsert({ user_id: userId, badge_key: "grammar_starter" }, { onConflict: "user_id,badge_key" });
    }
    if (dialogueCount >= 5) {
      await supabase.from("student_badges").upsert({ user_id: userId, badge_key: "conversation_beginner" }, { onConflict: "user_id,badge_key" });
    }
    if (chapterCount >= 5) {
      await supabase.from("student_badges").upsert({ user_id: userId, badge_key: "five_chapters" }, { onConflict: "user_id,badge_key" });
    }
    if (chapterCount >= 45) {
      await supabase.from("student_badges").upsert({ user_id: userId, badge_key: "topik_ready" }, { onConflict: "user_id,badge_key" });
    }
  }, [userId]);

  const markSectionDone = useCallback(async (
    lessonId: number,
    section: "vocab_done" | "grammar_done" | "dialogue_done" | "exercises_done" | "reading_done" | "writing_done"
  ) => {
    if (!userId) return;

    const { data: existing } = await supabase
      .from("student_lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (existing) {
      if (existing[section]) return;
      const updates: any = { [section]: true };

      const allDone = ["vocab_done", "grammar_done", "dialogue_done", "exercises_done", "reading_done", "writing_done"]
        .every(s => s === section ? true : existing[s as keyof typeof existing]);

      if (allDone) {
        updates.chapter_completed = true;
        updates.completed_at = new Date().toISOString();
      }

      await supabase.from("student_lesson_progress").update(updates)
        .eq("user_id", userId).eq("lesson_id", lessonId);

      if (allDone) {
        await awardXp(lessonId, "chapter");
        await supabase.from("student_badges").upsert(
          { user_id: userId, badge_key: "first_chapter" },
          { onConflict: "user_id,badge_key" }
        );
        // Seoul Explorer — completing any K-Drama lesson
        const { data: lessonMeta } = await supabase
          .from("textbook_lessons")
          .select("book")
          .eq("id", lessonId)
          .maybeSingle();
        if (lessonMeta?.book === "kdrama") {
          await awardBadge("seoul_explorer");
        }
      }
    } else {
      await supabase.from("student_lesson_progress").insert({
        user_id: userId,
        lesson_id: lessonId,
        [section]: true,
      });
    }

    const activityMap: Record<string, keyof typeof XP_VALUES> = {
      vocab_done: "vocab",
      grammar_done: "grammar",
      dialogue_done: "dialogue",
      exercises_done: "exercise",
      reading_done: "reading",
      writing_done: "writing",
    };
    const activityType = activityMap[section];
    capture({ event: "lesson_section_complete", lessonId, section, xpEarned: XP_VALUES[activityType] });

    // Run XP award and badge check in parallel — both are independent
    await Promise.all([
      awardXp(lessonId, activityType),
      checkBadges(),
    ]);
    // awardXp already calls fetchProgress internally; no extra re-fetch needed
  }, [userId, awardXp, checkBadges, fetchProgress]);

  const awardGameXp = useCallback(async (gameId: string, score: number, totalRounds: number) => {
    if (!userId || score <= 0) return 0;

    capture({ event: "game_played", gameId, score, totalRounds, xpEarned: score * XP_VALUES.game_complete });

    const xpPerCorrect = XP_VALUES.game_complete;
    const totalXpEarned = score * xpPerCorrect;
    const oldLeague = getLeague(progress.totalXp);
    const oldBadges = new Set(progress.badges);

    await supabase.from("student_xp").insert({
      user_id: userId,
      lesson_id: null,
      activity_type: `game_${gameId}`,
      xp_earned: totalXpEarned,
    });

    await updateStreak(userId);

    await supabase.from("student_badges").upsert(
      { user_id: userId, badge_key: "game_starter" },
      { onConflict: "user_id,badge_key" }
    );

    if (score === totalRounds) {
      await supabase.from("student_badges").upsert(
        { user_id: userId, badge_key: "perfect_game" },
        { onConflict: "user_id,badge_key" }
      );
    }

    const { count } = await supabase
      .from("student_xp")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .like("activity_type", "game_%");

    if ((count || 0) >= 10) {
      await supabase.from("student_badges").upsert(
        { user_id: userId, badge_key: "game_master" },
        { onConflict: "user_id,badge_key" }
      );
    }

    const newProgress = await fetchProgress();
    if (newProgress) {
      const newLeague = getLeague(newProgress.totalXp);
      if (newLeague.key !== oldLeague.key) {
        setLeaguePromotion({ fromLeague: oldLeague.key, toLeague: newLeague.key });
      }
      const newlyEarned = newProgress.badges.filter(b => !oldBadges.has(b));
      if (newlyEarned.length > 0) {
        setNewBadges(prev => [...prev, ...newlyEarned]);
      }
    }

    return totalXpEarned;
  }, [userId, progress.totalXp, progress.badges, updateStreak, fetchProgress]);

  const awardBadge = useCallback(async (badgeKey: string) => {
    if (!userId || progress.badges.includes(badgeKey)) return;
    await supabase.from("student_badges").upsert(
      { user_id: userId, badge_key: badgeKey },
      { onConflict: "user_id,badge_key" }
    );
    setNewBadges(prev => [...prev, badgeKey]);
    setProgress(prev => ({ ...prev, badges: [...prev.badges, badgeKey] }));
  }, [userId, progress.badges]);

  const clearLeaguePromotion = useCallback(() => setLeaguePromotion(null), []);
  const clearNewBadges = useCallback(() => setNewBadges([]), []);
  const clearStreakCelebration = useCallback(() => setStreakCelebration(null), []);

  const league = getLeague(progress.totalXp);

  return {
    userId,
    progress,
    league,
    loading,
    leaguePromotion,
    newBadges,
    streakCelebration,
    awardBadge,
    clearLeaguePromotion,
    clearNewBadges,
    clearStreakCelebration,
    awardXp,
    awardGameXp,
    markSectionDone,
    fetchProgress,
  };
}
