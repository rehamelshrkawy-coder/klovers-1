import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarCheck, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LegacyAttendancePanelProps {
  packageId: string;
  studentId: string;
  studentName: string;
  packageName: string;
  totalClasses: number;
  pricePerClass: number;
  onClose: () => void;
  onUpdated: () => void;
}

interface AttendanceRecord {
  id: string;
  session_date: string;
  marked_at: string;
}

const LegacyAttendancePanel = ({
  packageId, studentId, studentName, packageName,
  totalClasses, pricePerClass, onClose, onUpdated,
}: LegacyAttendancePanelProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance_log")
      .select("id, session_date, marked_at")
      .eq("student_id", studentId)
      .eq("package_id", packageId)
      .order("session_date", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setRecords((data as any[]) || []);
    setLoading(false);
  }, [packageId, studentId]);

  useEffect(() => { void fetchRecords(); }, [fetchRecords]);

  const totalAttended = records.length;
  const remaining = totalClasses - totalAttended;
  const extraSessions = remaining < 0 ? Math.abs(remaining) : 0;
  const amountDue = extraSessions * pricePerClass;

  const attendedDates = useMemo(
    () => records.map(r => new Date(r.session_date + "T00:00:00")),
    [records]
  );

  const handleAddAttendance = async () => {
    if (!selectedDate) {
      toast({ title: "Select a date", variant: "destructive" });
      return;
    }
    setAdding(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      setAdding(false);
      return;
    }

    const { error } = await supabase
      .from("attendance_log")
      .insert({
        student_id: studentId,
        marked_by: user.id,
        session_date: dateStr,
        package_id: packageId,
        notes: "",
      } as any);

    if (error) {
      const msg = error.message?.includes("unique_student_session_date")
        ? "Attendance already recorded for this date."
        : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      // Sync used_classes on the package
      await supabase
        .from("student_packages" as any)
        .update({ used_classes: totalAttended + 1 } as any)
        .eq("id", packageId);

      toast({ title: "Attendance added", description: `Date: ${dateStr}` });
      setSelectedDate(undefined);
      fetchRecords();
      onUpdated();
    }
    setAdding(false);
  };

  const handleRemoveAttendance = async (recordId: string) => {
    const { error } = await supabase
      .from("attendance_log")
      .delete()
      .eq("id", recordId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase
        .from("student_packages" as any)
        .update({ used_classes: Math.max(0, totalAttended - 1) } as any)
        .eq("id", packageId);

      toast({ title: "Attendance removed" });
      fetchRecords();
      onUpdated();
    }
  };

  const modifiers = { attended: attendedDates };
  const modifiersStyles = {
    attended: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderRadius: "9999px",
    },
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Attendance — {studentName}
            {packageName && <span className="text-xs text-muted-foreground font-normal">({packageName})</span>}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">Attended: {totalAttended}/{totalClasses}</Badge>
          {remaining >= 0 ? (
            <Badge variant="default">{remaining} remaining</Badge>
          ) : (
            <>
              <Badge variant="destructive">{extraSessions} extra sessions</Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Due: ${Math.round(amountDue).toLocaleString()}
              </Badge>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className={cn("p-3 pointer-events-auto w-full")}
        />
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Attended</span>
          </div>
        </div>

        <Button
          onClick={handleAddAttendance}
          disabled={adding || !selectedDate}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          {adding ? "Adding..." : selectedDate ? `Add attendance for ${format(selectedDate, "MMM d, yyyy")}` : "Select a date to add"}
        </Button>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet.</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {new Date(r.session_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove attendance?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the attendance record for {r.session_date}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveAttendance(r.id)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegacyAttendancePanel;
