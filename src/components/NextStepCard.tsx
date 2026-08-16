import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RotateCcw, Gamepad2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NextStepCardProps {
  completedType: "lesson" | "quiz" | "game";
  lessonSection?: string;
}

interface NextStep {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: () => void;
  variant?: "default" | "outline";
}

export function NextStepCard({ completedType, lessonSection }: NextStepCardProps) {
  const navigate = useNavigate();

  const getNextSteps = (): NextStep[] => {
    const steps: NextStep[] = [];

    if (completedType === "lesson") {
      steps.push({
        icon: <RotateCcw className="h-4 w-4" />,
        label: "Review Vocabulary",
        description: "Reinforce what you learned with spaced repetition",
        action: () => navigate("/review"),
        variant: "default",
      });

      if (lessonSection !== "exercises") {
        steps.push({
          icon: <BookOpen className="h-4 w-4" />,
          label: "Practice Exercises",
          description: "Test your understanding with exercises",
          action: () => navigate("/textbook"),
          variant: "outline",
        });
      }

      steps.push({
        icon: <Gamepad2 className="h-4 w-4" />,
        label: "Play a Game",
        description: "Make learning fun with vocabulary games",
        action: () => navigate("/games"),
        variant: "outline",
      });
    } else if (completedType === "quiz") {
      steps.push({
        icon: <BookOpen className="h-4 w-4" />,
        label: "Continue Learning",
        description: "Move on to the next lesson",
        action: () => navigate("/textbook"),
        variant: "default",
      });
      steps.push({
        icon: <RotateCcw className="h-4 w-4" />,
        label: "Review Vocabulary",
        description: "Reinforce words with spaced repetition",
        action: () => navigate("/review"),
        variant: "outline",
      });
    } else {
      steps.push({
        icon: <BookOpen className="h-4 w-4" />,
        label: "Back to Lessons",
        description: "Continue your learning journey",
        action: () => navigate("/textbook"),
        variant: "default",
      });
      steps.push({
        icon: <RotateCcw className="h-4 w-4" />,
        label: "Review Vocabulary",
        description: "Practice with spaced repetition",
        action: () => navigate("/review"),
        variant: "outline",
      });
    }

    return steps;
  };

  const steps = getNextSteps();

  return (
    <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight className="h-4 w-4 text-primary-text" />
          <p className="text-sm font-semibold text-foreground">What's next?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <Button
              key={step.label}
              variant={step.variant ?? "outline"}
              size="sm"
              onClick={step.action}
              className="gap-1.5 text-xs h-8"
              title={step.description}
            >
              {step.icon}
              {step.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
