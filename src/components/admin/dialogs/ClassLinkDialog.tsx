import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Link } from "lucide-react";
import type { Enrollment } from "@/types/admin";

interface Props {
  target: Enrollment | null;
  classLinkUrl: string;
  setClassLinkUrl: (v: string) => void;
  sendToGroup: boolean;
  setSendToGroup: (v: boolean) => void;
  slotDay: string;
  setSlotDay: (v: string) => void;
  slotTime: string;
  setSlotTime: (v: string) => void;
  slotTimezone: string;
  setSlotTimezone: (v: string) => void;
  firstClassDate: string;
  setFirstClassDate: (v: string) => void;
  isSending: boolean;
  onSend: () => void;
  onClose: () => void;
}

export function ClassLinkDialog({
  target,
  classLinkUrl,
  setClassLinkUrl,
  sendToGroup,
  setSendToGroup,
  slotDay,
  setSlotDay,
  slotTime,
  setSlotTime,
  slotTimezone: _slotTimezone,
  setSlotTimezone: _setSlotTimezone,
  firstClassDate,
  setFirstClassDate,
  isSending,
  onSend,
  onClose,
}: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" /> Send Class Link
          </DialogTitle>
          <DialogDescription>
            {target && (
              <span>
                Sending to: <strong>{target.profiles?.name || target.profiles?.email || "Unknown"}</strong>
                {sendToGroup && " and their entire group"}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="class-link-url">Meeting Link (Zoom / Google Meet)</Label>
            <Input
              id="class-link-url"
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              value={classLinkUrl}
              onChange={(e) => setClassLinkUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="send-to-group"
              checked={sendToGroup}
              onCheckedChange={(v) => setSendToGroup(!!v)}
            />
            <Label htmlFor="send-to-group" className="cursor-pointer font-normal">
              Send to entire group (all active members)
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="slot-day" className="text-xs text-muted-foreground">Day of week (optional)</Label>
              <Input id="slot-day" placeholder="e.g. Monday" value={slotDay} onChange={(e) => setSlotDay(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slot-time" className="text-xs text-muted-foreground">Time (optional)</Label>
              <Input id="slot-time" placeholder="e.g. 7:00 PM" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="first-class-date" className="text-xs text-muted-foreground">First class date/time — for pre-class reminder (optional)</Label>
            <Input id="first-class-date" type="datetime-local" value={firstClassDate} onChange={(e) => setFirstClassDate(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!classLinkUrl.trim() || isSending}
            onClick={onSend}
          >
            {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : <><Link className="h-4 w-4 mr-2" /> Send Link</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
