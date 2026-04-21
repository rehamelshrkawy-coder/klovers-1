import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Check, Eye, Pencil, Trash2, Undo2, X } from "lucide-react";
import type { Enrollment } from "@/types/admin";
import { formatMoney } from "@/lib/format";

export interface EnrollmentCardProps {
  enrollment: Enrollment;
  isActionableTab: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;

  // Per-row editing state
  editingPrice: string | undefined;
  onStartEditPrice: (e: Enrollment) => void;
  onChangeEditPrice: (id: string, value: string) => void;

  // Per-row reminder busy flag
  isSendingReminder: boolean;
  onSendPaymentMethodReminder: (e: Enrollment) => void;

  // Level fallback from CRM leads
  resolvedLevelFallback: string;

  // Action handlers
  onApprove: (e: Enrollment) => void;
  onApproveAndMatch: (e: Enrollment) => void;
  onReject: (e: Enrollment) => void;
  onRevert: (e: Enrollment) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (e: Enrollment) => void;
  onRequestResubmission: (e: Enrollment) => void;
}

function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "";
  if (method === "vodafone_cash") return "Vodafone Cash";
  if (method === "instapay") return "InstaPay";
  if (method === "bank_transfer") return "Bank Transfer";
  return method;
}

function EnrollmentCardInner(props: EnrollmentCardProps) {
  const {
    enrollment: e,
    isActionableTab,
    isSelected,
    onToggleSelect,
    editingPrice,
    onStartEditPrice,
    onChangeEditPrice,
    isSendingReminder,
    onSendPaymentMethodReminder,
    resolvedLevelFallback,
    onApprove,
    onApproveAndMatch,
    onReject,
    onRevert,
    onDelete,
    onViewReceipt,
    onRequestResubmission,
  } = props;

  const overdueDays = e.negative_since
    ? Math.max(0, Math.floor((Date.now() - new Date(e.negative_since).getTime()) / 86400000))
    : 0;

  const preferredDay = e.preferred_day || (e.preferred_days && e.preferred_days.length > 0 ? e.preferred_days[0] : null);
  const missingSchedule = !e.level || (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0));
  const isActionableStatus =
    e.approval_status === "PENDING" ||
    e.approval_status === "UNDER_REVIEW" ||
    e.approval_status === "PENDING_PAYMENT";
  const egyptMissingPaymentMethod =
    e.currency === "EGP" &&
    !e.payment_method &&
    (e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW");

  return (
    <Card className={isSelected ? "ring-2 ring-primary/50 animate-flash-bg" : ""}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {isActionableTab && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect(e.id, !!checked)}
                className="mt-1 shrink-0"
                aria-label={`Select enrollment for ${e.profiles?.name || e.profiles?.email}`}
              />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">{e.profiles?.name || "Unknown"} — {e.profiles?.email}</p>
                {e.negative_since && (
                  <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">
                    Overdue {overdueDays}d
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {e.plan_type} · {e.duration}mo · {e.classes_included} classes · {formatMoney(e.amount, e.currency)} · Ref: {e.tx_ref || "—"}
                {e.payment_method && <> · <span className="font-medium">{paymentMethodLabel(e.payment_method)}</span></>}
                {egyptMissingPaymentMethod && (
                  <span className="inline-flex items-center gap-1.5 ml-2">
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">
                      ⚠ Missing payment method
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs border-amber-400 text-amber-700 hover:bg-amber-50"
                      disabled={isSendingReminder}
                      onClick={() => onSendPaymentMethodReminder(e)}
                    >
                      {isSendingReminder ? "Sending…" : "Send Reminder"}
                    </Button>
                  </span>
                )}
                {e.payment_date && <> · Paid: {e.payment_date}</>}
                {e.due_at && e.approval_status === "PENDING_PAYMENT" && <> · Due: {new Date(e.due_at).toLocaleString()}</>}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Unit price:</span>
                {editingPrice !== undefined ? (
                  <Input
                    type="number"
                    className="h-7 w-24"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    value={editingPrice}
                    onChange={(ev) => onChangeEditPrice(e.id, ev.target.value)}
                  />
                ) : (
                  <span className="text-sm font-medium text-foreground">${Math.round(e.unit_price)}</span>
                )}
              </div>

              {e.plan_type === "group" && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">Level:</span>
                    {resolvedLevelFallback ? (
                      <Badge variant="outline">{resolvedLevelFallback.replace(/_/g, " ")}</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Missing level</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground shrink-0">Day:</span>
                    {preferredDay ? (
                      <Badge variant="secondary" className="text-xs">{preferredDay}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not set</span>
                    )}
                    {e.preferred_time && <span className="text-xs text-muted-foreground">· {e.preferred_time}</span>}
                    {e.timezone && <span className="text-xs text-muted-foreground">· {e.timezone.replace(/_/g, " ")}</span>}
                  </div>
                  {missingSchedule && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Legacy / Missing registration schedule
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onRequestResubmission(e)}
                      >
                        Request Resubmission
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {e.approval_status === "APPROVED" && (e.preferred_day || (e.preferred_days && e.preferred_days.length > 0)) && (
                <p className="text-xs text-muted-foreground">
                  📅 {e.preferred_day || e.preferred_days?.join(", ")} {e.preferred_time ? `· ${e.preferred_time}` : ""}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={e.payment_provider === "stripe" ? "default" : "secondary"}>
                {e.payment_provider === "stripe" ? "Stripe" : "Manual"}
              </Badge>
              <Badge variant={e.approval_status === "APPROVED" ? "default" : e.approval_status === "REJECTED" ? "destructive" : "secondary"}>
                {e.approval_status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={!e.receipt_url || e.receipt_url.length === 0}
                className={e.receipt_url && e.receipt_url.length > 0
                  ? "border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-950/30"
                  : "opacity-50 cursor-not-allowed"
                }
                title={e.receipt_url && e.receipt_url.length > 0 ? "View payment receipt" : "No receipt uploaded yet"}
                onClick={() => onViewReceipt(e)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {e.receipt_url && e.receipt_url.length > 0 ? "Receipt ✓" : "No Receipt"}
              </Button>
              {isActionableStatus && (
                <>
                  <Button size="sm" variant="outline" onClick={() => onStartEditPrice(e)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {e.plan_type === "group" ? (
                    <Button size="sm" onClick={() => onApproveAndMatch(e)}>
                      <Check className="h-4 w-4 mr-1" /> Approve & Match
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => onApprove(e)}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => onReject(e)}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </>
              )}
              {e.approval_status === "APPROVED" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Undo2 className="h-4 w-4 mr-1" /> Revert
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revert approval?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the enrollment back to Pending and deduct {e.classes_included} credits from the student.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onRevert(e)}>Revert</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" aria-label="Delete enrollment">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete enrollment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this enrollment record for {e.profiles?.name || "this student"}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(e.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Shallow memoization: re-renders only when the enrollment object, selection,
// editing-price value, or sending-reminder flag change. Callback identity is
// assumed to be stable-ish across renders (the parent re-creates them, but
// the common case where *other* rows change will bail out).
export const EnrollmentCard = memo(EnrollmentCardInner, (a, b) => {
  return (
    a.enrollment === b.enrollment &&
    a.isActionableTab === b.isActionableTab &&
    a.isSelected === b.isSelected &&
    a.editingPrice === b.editingPrice &&
    a.isSendingReminder === b.isSendingReminder &&
    a.resolvedLevelFallback === b.resolvedLevelFallback
  );
});
