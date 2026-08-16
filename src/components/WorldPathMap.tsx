import { Link } from "react-router-dom";
import { WORLDS, getWorldForLesson, getWorldProgress, type World } from "@/constants/worlds";
import { isBossChallenge, isCheckpointLesson } from "@/constants/gamification";
import { LessonProgressDots } from "@/components/GamificationUI";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Zap, Crown, Gamepad2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  sort_order: number;
}

interface LessonProgress {
  vocab_done: boolean;
  grammar_done: boolean;
  dialogue_done: boolean;
  exercises_done: boolean;
  reading_done: boolean;
  chapter_completed: boolean;
}

interface WorldPathMapProps {
  lessons: Lesson[];
  lessonProgress: Record<number, LessonProgress>;
  userId: string | null;
  bookSlug: string;
}

function WorldHeader({ world, progress, isAr }: { world: World; progress: { completed: number; total: number; percent: number }; isAr: boolean }) {
  const isComplete = progress.percent === 100;

  return (
    <div className="relative mb-2">
      <div
        className={cn(
          "rounded-2xl border-2 p-5 transition-all",
          isComplete ? "border-primary/50 bg-primary/5" : "border-border bg-card"
        )}
        style={{ borderColor: isComplete ? world.color : undefined }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{world.emoji}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">
              {isAr ? world.nameAr : world.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? world.descriptionAr : world.description}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm font-bold text-foreground">{progress.completed}/{progress.total}</p>
            {isComplete && <CheckCircle2 className="h-5 w-5 text-primary ms-auto" />}
          </div>
        </div>
        <Progress value={progress.percent} className="h-2" />
      </div>
    </div>
  );
}

function LessonNode({
  lesson,
  lp,
  index,
  worldColor,
  isAr,
  bookSlug,
}: {
  lesson: Lesson;
  lp?: LessonProgress;
  index: number;
  worldColor: string;
  isAr: boolean;
  bookSlug: string;
}) {
  const completed = lp?.chapter_completed;
  const boss = isBossChallenge(lesson.sort_order);
  const checkpoint = isCheckpointLesson(lesson.sort_order);
  const hasProgress = lp && (lp.vocab_done || lp.grammar_done || lp.dialogue_done || lp.exercises_done || lp.reading_done);

  // Zigzag offset pattern for Duolingo-style path
  const offsets = [0, 40, 60, 40, 0, -40, -60, -40];
  const offset = offsets[index % offsets.length];

  return (
    <div className="relative flex flex-col items-center" style={{ marginLeft: `${offset}px` }}>
      {/* Connector line */}
      {index > 0 && (
        <div className="w-0.5 h-6 bg-border -mt-1 mb-1" />
      )}

      <Link
        to={`/textbook/${bookSlug}/${lesson.sort_order}`}
        aria-label={isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}
        className={cn(
          "group relative flex flex-col items-center transition-all hover:scale-105",
        )}
      >
        {/* Node circle */}
        <div
          className={cn(
            "relative w-16 h-16 rounded-full flex items-center justify-center text-2xl border-[3px] transition-all shadow-md",
            completed
              ? "border-primary bg-primary/10 shadow-primary/20"
              : hasProgress
              ? "border-primary/50 bg-card shadow-primary/10"
              : "border-border bg-card hover:border-primary/40"
          )}
          style={{
            borderColor: completed ? worldColor : undefined,
            boxShadow: completed ? `0 4px 12px ${worldColor}33` : undefined,
          }}
        >
          {boss && !completed && (
            <Crown className="absolute -top-2 -right-2 h-5 w-5 text-destructive" />
          )}
          {completed && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <span className="text-2xl">{lesson.emoji}</span>
        </div>

        {/* Label */}
        <div className="mt-2 text-center max-w-[140px]">
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            boss ? "text-destructive" : checkpoint ? "text-primary" : "text-muted-foreground"
          )}>
            {boss ? "🐉 Boss" : checkpoint ? "🏁 CP" : `M${lesson.sort_order}`}
          </p>
          <p className="text-xs font-semibold text-foreground leading-tight truncate">
            {isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}
          </p>
          {lp && <LessonProgressDots progress={lp} />}
        </div>
      </Link>
    </div>
  );
}

export default function WorldPathMap({ lessons, lessonProgress, userId, bookSlug }: WorldPathMapProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-8">
      {WORLDS.map((world) => {
        const worldLessons = lessons.filter(
          (l) => l.sort_order >= world.lessonRange[0] && l.sort_order <= world.lessonRange[1]
        );

        if (worldLessons.length === 0) return null;

        const progress = getWorldProgress(world, lessonProgress as any, lessons);

        return (
          <div key={world.key}>
            <WorldHeader world={world} progress={progress} isAr={isAr} />

            {/* Vertical path */}
            <div className="flex flex-col items-center py-4 gap-2">
              {worldLessons.map((lesson, i) => (
                <LessonNode
                  key={lesson.id}
                  lesson={lesson}
                  lp={lessonProgress[lesson.id]}
                  index={i}
                  worldColor={world.color}
                  isAr={isAr}
                  bookSlug={bookSlug}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Games CTA Banner */}
      <Link
        to="/games"
        className="group block rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 p-5 text-center transition-all mt-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="rounded-full bg-primary border border-black/25 p-2.5 group-hover:bg-[#E6E600] transition-colors">
            <Gamepad2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-start">
            <p className="font-bold text-foreground text-lg">
              {isAr ? "العب ألعاباً لكسب المزيد من XP!" : "Play Games for More XP!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAr ? "تدرب على المفردات والحروف الكورية بطريقة ممتعة" : "Practice vocab & Hangul with fun mini-games"}
            </p>
          </div>
          <span className="text-2xl">🎮</span>
        </div>
      </Link>
    </div>
  );
}
