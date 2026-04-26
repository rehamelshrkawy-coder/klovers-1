import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Enrollment } from "@/types/admin";

interface Props {
  target: Enrollment | null;
  reason: "payment_not_received" | "time_slots_unavailable" | "other";
  setReason: (r: "payment_not_received" | "time_slots_unavailable" | "other") => void;
  note: string;
  setNote: (n: string) => void;
  rejecting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function RejectEnrollmentDialog({
  target,
  reason,
  setReason,
  note,
  setNote,
  rejecting,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Enrollment</DialogTitle>
          <DialogDescription>
            {target?.profiles?.name || "Unknown"} — {target?.profiles?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Reason *</p>
            <div className="space-y-2">
              {([
                { value: "payment_not_received", label: "💳 Payment not received", desc: "We couldn't confirm the transfer." },
                { value: "time_slots_unavailable", label: "📅 Time slots unavailable", desc: "Student gets a link to pick new available slots." },
                { value: "other", label: "✏️ Other", desc: "Provide a note below." },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReason(opt.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${reason === opt.value ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/40"}`}
                >
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Additional note (optional)</p>
            <Textarea
              placeholder="e.g. Please re-enroll with a clearer receipt."
              value={note}
              onChange={ev => setNote(ev.target.value)}
              maxLength={300}
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={rejecting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={rejecting}>
            {rejecting ? "Rejecting…" : "Confirm Reject & Notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
