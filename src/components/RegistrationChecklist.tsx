import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

interface RegistrationChecklistProps {
  userId: string;
  enrollmentId: string;
  items: ChecklistItem[];
  onItemCompleted: (key: string, value: string) => void;
  autoFocusField?: string;
}

const TIMEZONES = [
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// Korean course levels — sourced from the canonical single source of truth
// in @/constants/levels so writes to profiles.level always use the short keys
// (hangul, l1 … l6) that match schedule_packages / enrollments / placement_tests.
const LEVELS = LEVEL_SELECT_OPTIONS;

const RegistrationChecklist = ({ userId, enrollmentId, items, onItemCompleted, autoFocusField }: RegistrationChecklistProps) => {
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFocusField) return;
    const incomplete = items.find((i) => i.key === autoFocusField && !i.completed);
    if (!incomplete) return;

    if (autoFocusField === "Preferred class days") {
      navigate("/dashboard/schedule");
      return;
    }

    setEditingField(autoFocusField);
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, [autoFocusField, items, navigate]);

  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 100;

  if (completed === total) return null;

  const handleSaveProfile = async (field: string, value: string) => {
    if (!value.trim()) return;
    setSaving(true);
    // The checklist "Korean level" picker only lists canonical course keys
    // (hangul, l1…l6). Course logic reads profiles.course_level_key, so write
    // there whenever the admin is setting a course level — keep the free-form
    // self-assessment column (profiles.level) for any other field.
    const payload: Record<string, string> =
      field === "level"
        ? { course_level_key: value.trim(), level: value.trim() }
        : { [field]: value.trim() };
    const { error } = await supabase
      .from("profiles")
      .update(payload as any)
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Could not save. Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Saved!" });
    onItemCompleted(field === "name" ? "Full name" : field === "level" ? "Korean level" : "Country", value.trim());
    setEditingField(null);
    setFieldValue("");
  };

  const handleSaveTimezone = async (value: string) => {
    if (!value) return;
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ timezone: value })
      .eq("id", enrollmentId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Could not save timezone.", variant: "destructive" });
      return;
    }
    toast({ title: "Timezone saved!" });
    onItemCompleted("Timezone", value);
    setEditingField(null);
  };

  const renderAction = (item: ChecklistItem) => {
    if (item.completed) return null;

    const key = item.key;

    // Preferred class days → link to schedule page
    if (key === "Preferred class days") {
      return (
        <Button size="sm" variant="default" onClick={() => navigate("/dashboard/schedule")}>
          Go to My Schedule <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      );
    }

    // Inline editors
    if (editingField === key) {
      if (key === "Korean level") {
        return (
          <div className="flex items-center gap-2">
            <Select onValueChange={(v) => handleSaveProfile("level", v)} disabled={saving}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        );
      }

      if (key === "Timezone") {
        return (
          <div className="flex items-center gap-2">
            <Select onValueChange={handleSaveTimezone} disabled={saving}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        );
      }

      // Text input for name / country
      const dbField = key === "Full name" ? "name" : "country";
      return (
        <div className="flex items-center gap-2">
          <Input
            className="h-8 w-[160px] text-sm"
            placeholder={key}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveProfile(dbField, fieldValue)}
          />
          <Button size="sm" variant="default" disabled={saving || !fieldValue.trim()} onClick={() => handleSaveProfile(dbField, fieldValue)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      );
    }

    // Default: "Fix" button to open inline editor
    return (
      <Button size="sm" variant="outline" onClick={() => { setEditingField(key); setFieldValue(""); }}>
        Fill in
      </Button>
    );
  };

  return (
    <Card ref={cardRef} className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Complete your registration
        </CardTitle>
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
          {completed} of {total} steps complete — fill these to finalize your enrollment.
        </p>
        <Progress value={progress} className="h-2 mt-2 bg-amber-200 dark:bg-amber-900 [&>div]:bg-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-amber-400 shrink-0" />
              )}
              <span className={`text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                {item.label}
              </span>
            </div>
            {renderAction(item)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RegistrationChecklist;
