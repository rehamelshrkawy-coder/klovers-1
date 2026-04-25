import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { capture } from "@/lib/analytics";

interface NpsModalProps {
  userId: string | null;
  chapterCount: number; // trigger after 3+ chapters
}

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function scoreLabel(s: number): string {
  if (s <= 6) return "Detractor";
  if (s <= 8) return "Passive";
  return "Promoter";
}

function scoreColor(s: number): string {
  if (s <= 6) return "bg-red-100 border-red-300 text-red-800 hover:bg-red-200";
  if (s <= 8) return "bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200";
  return "bg-green-100 border-green-300 text-green-800 hover:bg-green-200";
}

/**
 * NPS modal — appears once when a student completes their 3rd chapter.
 * Score + optional feedback are stored in `student_nps` table and
 * captured as an analytics event.
 */
export default function NpsModal({ userId, chapterCount }: NpsModalProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!userId || chapterCount < 3) return;
    const key = `nps_done_${userId}`;
    if (localStorage.getItem(key)) return;

    // Small delay so it doesn't fire immediately on chapter completion
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [userId, chapterCount]);

  const handleSubmit = async () => {
    if (score === null || !userId) return;

    // Store in DB
    await supabase.from("student_nps" as never).upsert(
      { user_id: userId, score, feedback: feedback.trim() || null },
      { onConflict: "user_id" }
    ).catch(() => {});

    // Track in analytics
    capture({ event: "nps_submitted", score, feedback: feedback.trim() || undefined });

    // Persist so modal never shows again
    localStorage.setItem(`nps_done_${userId}`, "1");
    setSubmitted(true);
    setTimeout(() => setOpen(false), 2500);
  };

  const handleDismiss = () => {
    localStorage.setItem(`nps_done_${userId}`, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md" aria-describedby="nps-description">
        <DialogTitle className="text-center">
          {submitted ? "🎉 شكراً! Thank you!" : "How likely are you to recommend Klovers?"}
        </DialogTitle>

        {submitted ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            Your feedback helps us improve for every student. 화이팅!
          </p>
        ) : (
          <div className="space-y-5 py-2">
            <p id="nps-description" className="text-sm text-muted-foreground text-center">
              On a scale of 0–10, how likely are you to recommend Klovers to a friend?
            </p>

            {/* Score grid */}
            <div role="group" aria-label="NPS score selector" className="grid grid-cols-11 gap-1">
              {SCORES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s)}
                  aria-label={`Score ${s} — ${scoreLabel(s)}`}
                  aria-pressed={score === s}
                  className={`
                    border rounded-lg p-2 text-sm font-bold transition-all
                    ${score === s
                      ? `${scoreColor(s)} ring-2 ring-offset-1 ring-current scale-110`
                      : "border-border hover:bg-muted"
                    }
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Not at all likely</span>
              <span>Extremely likely</span>
            </div>

            {/* Feedback textarea — shows once a score is picked */}
            {score !== null && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="nps-feedback">
                  {score >= 9
                    ? "What do you love most about Klovers? ❤️"
                    : score >= 7
                    ? "What could we improve? 💡"
                    : "What went wrong? We want to fix it. 🙏"}
                </label>
                <Textarea
                  id="nps-feedback"
                  placeholder="Optional — your honest thoughts help us grow"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Skip
              </Button>
              <Button
                size="sm"
                disabled={score === null}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
