import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Lock } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/lib/utils";

export interface InterviewQA {
  id: string;
  interviewer_question_kr: string;
  interviewer_question_en: string;
  interviewer_question_romanization: string;
  model_answer_kr: string;
  model_answer_en: string;
  model_answer_romanization: string;
  is_free: boolean;
}

function PlayBtn({ onClick, label, variant = "kr", disabled }: {
  onClick: () => void; label?: string; variant?: "kr" | "en" | "slow"; disabled?: boolean;
}) {
  const colors = {
    kr: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
    en: "text-green-600 hover:text-green-800 hover:bg-green-50",
    slow: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn("h-8 gap-1 text-xs", colors[variant])}
      onClick={onClick}
      disabled={disabled}
    >
      <Volume2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

export default function InterviewQACard({ qa, index, locked }: {
  qa: InterviewQA;
  index: number;
  locked: boolean;
}) {
  const { speak, isSpeaking } = useSpeech();

  if (locked) {
    return (
      <Card className="rounded-xl relative overflow-hidden">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
          </div>
          <div className="space-y-3 blur-sm select-none pointer-events-none">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div className="h-4 bg-blue-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-blue-100 rounded w-1/2" />
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <div className="h-4 bg-green-200 rounded w-full mb-2" />
              <div className="h-3 bg-green-100 rounded w-2/3" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Lock className="h-8 w-8" />
              <span className="text-sm font-medium">Unlock for $5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-5 space-y-4">
        <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>

        {/* Interviewer Question — male voice */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Interviewer</span>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
            <p className="text-sm font-medium">{qa.interviewer_question_kr}</p>
            <p className="text-[11px] text-muted-foreground italic">{qa.interviewer_question_romanization}</p>
            <p className="text-xs text-muted-foreground">{qa.interviewer_question_en}</p>
          </div>
          <div className="flex gap-1">
            <PlayBtn onClick={() => speak(qa.interviewer_question_kr, { language: "ko-KR", gender: "male" })} label="KR" variant="kr" disabled={isSpeaking} />
            <PlayBtn onClick={() => speak(qa.interviewer_question_en, { language: "en-US", gender: "male" })} label="EN" variant="en" disabled={isSpeaking} />
          </div>
        </div>

        <div className="w-full h-px bg-border" />

        {/* Model Answer (Reham) — female voice */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-green-600">Model Answer</span>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 space-y-1">
            <p className="text-sm font-medium leading-relaxed">{qa.model_answer_kr}</p>
            <p className="text-[11px] text-muted-foreground italic">{qa.model_answer_romanization}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{qa.model_answer_en}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <PlayBtn onClick={() => speak(qa.model_answer_kr, { language: "ko-KR", gender: "female" })} label="KR" variant="kr" disabled={isSpeaking} />
            <PlayBtn onClick={() => speak(qa.model_answer_en, { language: "en-US", gender: "female" })} label="EN" variant="en" disabled={isSpeaking} />
            <PlayBtn onClick={() => speak(qa.model_answer_kr, { language: "ko-KR", rate: 0.7, gender: "female" })} label="Slow" variant="slow" disabled={isSpeaking} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
