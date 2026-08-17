import { Link } from "react-router-dom";
import {
  GRAMMAR_MASTERY_WORLDS,
  getGrammarMasteryWorldProgress,
  type GrammarMasteryWorld,
} from "@/constants/grammarMasteryWorlds";
import { LessonProgressDots } from "@/components/GamificationUI";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, Gamepad2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  title_ar?: string;
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

interface Props {
  lessons: Lesson[];
  lessonProgress: Record<number, LessonProgress>;
  userId: string | null;
  bookSlug: string;
}

function WorldHeader({
  world,
  progress,
  isAr,
}: {
  world: GrammarMasteryWorld;
  progress: { completed: number; total: number; percent: number };
  isAr: boolean;
}) {
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-foreground">
                {isAr ? world.nameAr : world.name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {world.nameKo}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? world.descriptionAr : world.description}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm font-bold text-foreground">
              {progress.completed}/{progress.total}
            </p>
            {isComplete && <CheckCircle2 className="h-5 w-5 text-primary ms-auto" />}
          </div>
        </div>
        <Progress value={progress.percent} className="h-2" />
      </div>
    </div>
  );
}

export default function GrammarMasteryPathMap({ lessons, lessonProgress, userId, bookSlug }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 rounded-2xl border border-dashed border-border bg-muted/30">
        <Gamepad2 className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">
          {isAr ? "العب الألعاب لمزيد من XP!" : "Play Games for More XP!"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isAr ? "تدرب على المفردات والهانغول بألعاب ممتعة" : "Practice vocab & Hangul with fun mini-games"}
        </p>
        <Link
          to="/games"
          className="mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {isAr ? "العب الآن" : "Play Now"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {GRAMMAR_MASTERY_WORLDS.map((world) => {
        const worldLessons = lessons.filter(
          (l) => l.sort_order >= world.lessonRange[0] && l.sort_order <= world.lessonRange[1]
        );
        if (worldLessons.length === 0) return null;

        const progress = getGrammarMasteryWorldProgress(world, lessonProgress, lessons);
        const prevWorldComplete =
          world.id === 1 ||
          (() => {
            const prev = GRAMMAR_MASTERY_WORLDS[world.id - 2];
            if (!prev) return true;
            const prevProgress = getGrammarMasteryWorldProgress(prev, lessonProgress, lessons);
            return prevProgress.percent === 100;
          })();

        return (
          <div key={world.key}>
            <WorldHeader world={world} progress={progress} isAr={isAr} />
            <div className="flex flex-col items-center gap-3 py-4">
              {worldLessons.map((lesson, idx) => {
                const lp = lessonProgress[lesson.id];
                const completed = lp?.chapter_completed;
                const isFirst = idx === 0;
                const prevLesson = worldLessons[idx - 1];
                const prevDone = isFirst ? prevWorldComplete : lessonProgress[prevLesson.id]?.chapter_completed;
                const locked = !userId || (!prevDone && !completed);

                return (
                  <div key={lesson.id} className="flex flex-col items-center gap-1">
                    {idx > 0 && (
                      <div className={cn("w-0.5 h-4", completed ? "bg-primary" : "bg-border")} />
                    )}
                    <Link
                      to={locked ? "#" : `/textbook/${bookSlug}/${lesson.sort_order}`}
                      onClick={(e) => locked && e.preventDefault()}
                      className={cn(
                        "relative flex items-center gap-3 w-72 rounded-xl border px-4 py-3 shadow-sm transition-all",
                        completed
                          ? "border-primary/40 bg-primary/5 hover:shadow-md"
                          : locked
                          ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                      )}
                    >
                      <span className="text-2xl">{lesson.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide truncate">
                          {isAr
                            ? `نمط ${lesson.sort_order}`
                            : `Pattern ${lesson.sort_order}`}
                        </p>
                        <p className="text-sm font-bold text-foreground truncate">
                          {lesson.title_en}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{lesson.title_ko}</p>
                      </div>
                      {locked ? (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : completed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : null}
                      {lp && !locked && (
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
                          <LessonProgressDots progress={lp} />
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
