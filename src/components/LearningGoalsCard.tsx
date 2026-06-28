import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLearningGoals } from "@/hooks/useLearningGoals";
import { Target, Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function LearningGoalsCard() {
  const {
    goals,
    createGoal,
    deleteGoal,
    getCompletionPercentage,
    getDaysRemaining,
  } = useLearningGoals();

  const [isOpen, setIsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    type: "daily_vocab",
    value: "10",
    period: "daily",
  });

  const handleCreateGoal = async () => {
    if (!newGoal.name.trim() || !newGoal.value) return;

    const value = parseInt(newGoal.value, 10);
    if (isNaN(value) || value <= 0) return;

    const success = await createGoal(
      newGoal.type,
      newGoal.name,
      value,
      newGoal.period
    );

    if (success) {
      setNewGoal({ name: "", type: "daily_vocab", value: "10", period: "daily" });
      setIsOpen(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
  };

  const getGoalEmoji = (goalType: string): string => {
    const emojiMap: Record<string, string> = {
      daily_vocab: "📚",
      weekly_lessons: "📖",
      monthly_xp: "⭐",
      streak_days: "🔥",
    };
    return emojiMap[goalType] || "🎯";
  };

  if (goals.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <Target className="h-8 w-8 mx-auto text-blue-600" />
            <p className="font-medium text-foreground">No Learning Goals Yet</p>
            <p className="text-sm text-muted-foreground">
              Create a goal to stay motivated and track progress
            </p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Learning Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium" htmlFor="learning-goal-name">Goal Name</label>
                    <Input
                      id="learning-goal-name"
                      placeholder="e.g., Learn 50 new words"
                      value={newGoal.name}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="learning-goal-type">Goal Type</label>
                    <Select value={newGoal.type} onValueChange={(value) =>
                      setNewGoal({ ...newGoal, type: value })
                    }>
                      <SelectTrigger id="learning-goal-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_vocab">Daily Vocabulary</SelectItem>
                        <SelectItem value="weekly_lessons">Weekly Lessons</SelectItem>
                        <SelectItem value="monthly_xp">Monthly XP</SelectItem>
                        <SelectItem value="streak_days">Streak Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="learning-goal-target">Target Value</label>
                    <Input
                      id="learning-goal-target"
                      type="number"
                      placeholder="e.g., 50"
                      value={newGoal.value}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, value: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="learning-goal-period">Time Period</label>
                    <Select value={newGoal.period} onValueChange={(value) =>
                      setNewGoal({ ...newGoal, period: value })
                    }>
                      <SelectTrigger id="learning-goal-period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full">
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Learning Goals
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Learning Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium" htmlFor="learning-goal-name">Goal Name</label>
                <Input
                  id="learning-goal-name"
                  placeholder="e.g., Learn 50 new words"
                  value={newGoal.name}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="learning-goal-type">Goal Type</label>
                <Select value={newGoal.type} onValueChange={(value) =>
                  setNewGoal({ ...newGoal, type: value })
                }>
                  <SelectTrigger id="learning-goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_vocab">Daily Vocabulary</SelectItem>
                    <SelectItem value="weekly_lessons">Weekly Lessons</SelectItem>
                    <SelectItem value="monthly_xp">Monthly XP</SelectItem>
                    <SelectItem value="streak_days">Streak Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="learning-goal-target">Target Value</label>
                <Input
                  id="learning-goal-target"
                  type="number"
                  placeholder="e.g., 50"
                  value={newGoal.value}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, value: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="learning-goal-period">Time Period</label>
                <Select value={newGoal.period} onValueChange={(value) =>
                  setNewGoal({ ...newGoal, period: value })
                }>
                  <SelectTrigger id="learning-goal-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const percentage = getCompletionPercentage(goal);
          const daysRemaining = getDaysRemaining(goal);

          return (
            <div
              key={goal.id}
              className="p-3 rounded-lg border border-border bg-card space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getGoalEmoji(goal.goal_type)}</span>
                    <p className="font-medium text-foreground">{goal.goal_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goal.current_progress} / {goal.target_value}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <Progress value={percentage} className="h-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{percentage}% Complete</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {daysRemaining} days left
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
