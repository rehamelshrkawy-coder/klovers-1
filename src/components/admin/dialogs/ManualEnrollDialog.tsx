import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import type { OverviewRow } from "@/types/admin";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";

const SESSIONS_BY_DURATION: Record<string, string> = { "1": "4", "3": "12", "6": "24" };

type EnrollForm = {
  plan_type: string;
  duration: string;
  sessions: string;
  amount: string;
  currency: string;
  group_id: string;
  level: string;
  notes: string;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  enrollTarget: OverviewRow | null;
  enrollForm: EnrollForm;
  setEnrollForm: (fn: (prev: EnrollForm) => EnrollForm) => void;
  pkgGroups: { id: string; name: string }[];
  enrollSaving: boolean;
  onEnroll: () => void;
}

export function ManualEnrollDialog({
  open,
  onOpenChange,
  enrollTarget,
  enrollForm,
  setEnrollForm,
  pkgGroups,
  enrollSaving,
  onEnroll,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manually Enroll — {enrollTarget?.name}</DialogTitle>
          <DialogDescription>{enrollTarget?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Plan type */}
          <div className="space-y-1">
            <Label>Plan Type</Label>
            <div className="flex gap-2">
              {(["group", "private"] as const).map(pt => (
                <button
                  key={pt}
                  onClick={() => setEnrollForm(f => ({ ...f, plan_type: pt, group_id: "" }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    enrollForm.plan_type === pt
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {pt === "group" ? "👥 Group" : "👤 Private"}
                </button>
              ))}
            </div>
            {enrollForm.plan_type === "private" && (
              <p className="text-xs text-muted-foreground">Private enrollment — assign a slot via the Matcher after saving.</p>
            )}
          </div>

          {/* Duration + Sessions */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label>Duration</Label>
              <Select
                value={enrollForm.duration}
                onValueChange={v => setEnrollForm(f => ({ ...f, duration: v, sessions: SESSIONS_BY_DURATION[v] ?? f.sessions }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label>Sessions</Label>
              <Input
                type="number"
                min="1"
                value={enrollForm.sessions}
                onChange={e => setEnrollForm(f => ({ ...f, sessions: e.target.value }))}
              />
            </div>
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label>Amount paid</Label>
              <Input
                type="number"
                min="0"
                placeholder="Enter amount..."
                value={enrollForm.amount}
                onChange={e => setEnrollForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="w-28 space-y-1">
              <Label>Currency</Label>
              <Select value={enrollForm.currency} onValueChange={v => setEnrollForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGP">EGP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Group — only for group plan */}
          {enrollForm.plan_type === "group" && (
            <div className="space-y-1">
              <Label>Group *</Label>
              <Select value={enrollForm.group_id} onValueChange={v => setEnrollForm(f => ({ ...f, group_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
                <SelectContent>
                  {pkgGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Level */}
          <div className="space-y-1">
            <Label>Level</Label>
            <Select value={enrollForm.level || "__none__"} onValueChange={v => setEnrollForm(f => ({ ...f, level: v === "__none__" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Not set —</SelectItem>
                {LEVEL_SELECT_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
                <SelectItem value="A2 Elementary">A2 Elementary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea value={enrollForm.notes} onChange={e => setEnrollForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Payment reference, special notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={onEnroll}
            disabled={enrollSaving || (enrollForm.plan_type === "group" && !enrollForm.group_id) || !enrollForm.amount}
          >
            {enrollSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Enroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
