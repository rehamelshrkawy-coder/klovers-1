import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Search, AlertCircle, Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeLevel } from "@/constants/levels";
import type { Enrollment, Lead } from "@/types/admin";
import { ADMIN_PAGE_SIZE as PAGE_SIZE } from "@/lib/admin-utils";
import { EnrollmentCard } from "@/components/admin/EnrollmentCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  enrollments: Enrollment[];
  loading: boolean;
  enrollmentSearch: string;
  setEnrollmentSearch: (v: string) => void;
  debouncedEnrollmentSearch: string;
  enrollmentPage: number;
  setEnrollmentPage: (fn: (p: number) => number) => void;
  selectedEnrollmentIds: Set<string>;
  setSelectedEnrollmentIds: (fn: (prev: Set<string>) => Set<string>) => void;
  bulkApproving: boolean;
  handleBulkApprove: () => Promise<void>;
  showLegacyEnrollments: boolean;
  setShowLegacyEnrollments: (v: boolean) => void;
  legacyEnrollmentCount: number;
  showOverdueOnly: boolean;
  setShowOverdueOnly: (fn: (v: boolean) => boolean) => void;
  editingUnitPrice: Record<string, string>;
  setEditingUnitPrice: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  sendingReminder: Set<string>;
  onSendPaymentMethodReminder: (e: Enrollment) => Promise<void>;
  sendingResend: Set<string>;
  onResendPaymentEmail: (e: Enrollment) => Promise<void>;
  onResendApprovalEmail: (e: Enrollment) => Promise<void>;
  onEnrollmentAction: (e: Enrollment, action: "APPROVED" | "REJECTED") => Promise<void>;
  onReject: (e: Enrollment) => void;
  onRevert: (e: Enrollment) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewReceipt: (e: Enrollment) => Promise<void>;
  onRequestResubmission: (e: Enrollment) => Promise<void>;
  onSendClassLink: (e: Enrollment) => void;
  setAdminTab: (tab: string) => void;
  leadsByEmail: Record<string, Lead>;
  invalidateAll: () => void;
}

export function EnrollmentsTab({
  enrollments, loading, enrollmentSearch, setEnrollmentSearch,
  debouncedEnrollmentSearch, enrollmentPage, setEnrollmentPage,
  selectedEnrollmentIds, setSelectedEnrollmentIds, bulkApproving, handleBulkApprove,
  showLegacyEnrollments, setShowLegacyEnrollments, legacyEnrollmentCount,
  showOverdueOnly, setShowOverdueOnly, editingUnitPrice, setEditingUnitPrice,
  sendingReminder, onSendPaymentMethodReminder, sendingResend,
  onResendPaymentEmail, onResendApprovalEmail, onEnrollmentAction, onReject,
  onRevert, onDelete, onViewReceipt, onRequestResubmission, onSendClassLink,
  setAdminTab, leadsByEmail, invalidateAll,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base">Enrollments</CardTitle>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLegacyEnrollments}
                  onChange={(e) => setShowLegacyEnrollments(e.target.checked)}
                  className="rounded"
                />
                Show Legacy ({legacyEnrollmentCount})
              </label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async () => {
                  const { data, error } = await supabase.rpc("backfill_missing_enrollments");
                  if (error) {
                    toast({ title: "Backfill failed", description: error.message, variant: "destructive" });
                  } else {
                    const result = data as Record<string, number> | null;
                    toast({ title: "Backfill complete", description: `Fixed: ${result?.fixed ?? 0}, Remaining: ${result?.remaining ?? 0}` });
                    invalidateAll();
                  }
                }}
              >
                Backfill Missing
              </Button>
            </div>
          </div>
        </CardHeader>
        {/* Funnel summary strip */}
        {!loading && (() => {
          const paidUnplaced = enrollments.filter(e => e.payment_status === "PAID" && !e.matched_at && e.approval_status !== "REJECTED" && e.approval_status !== "CANCELLED").length;
          const noLink = enrollments.filter(e => e.approval_status === "APPROVED" && e.matched_at && !e.class_link_sent_at).length;
          const pendingReceipt = enrollments.filter(e => (e.payment_provider === "egypt_manual" || e.payment_provider === "manual") && (!e.receipt_url || e.receipt_url === "" || e.receipt_url === "manual") && (e.approval_status === "PENDING" || e.approval_status === "UNDER_REVIEW")).length;
          if (paidUnplaced === 0 && noLink === 0 && pendingReceipt === 0) return null;
          return (
            <div className="flex flex-wrap gap-2 px-6 pb-3">
              {paidUnplaced > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
                  ⏳ {paidUnplaced} paid, awaiting placement
                </div>
              )}
              {noLink > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-medium dark:bg-red-950/20 dark:border-red-800 dark:text-red-400">
                  🔗 {noLink} approved, no class link sent
                </div>
              )}
              {pendingReceipt > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-400">
                  📄 {pendingReceipt} missing receipt
                </div>
              )}
            </div>
          );
        })()}
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-2 space-y-2">
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border/40">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-1/3 opacity-70" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="under_review" onValueChange={() => setEnrollmentPage(() => 0)}>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email or plan…"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search enrollments by name, email or plan"
                    type="search"
                  />
                </div>
                <Button
                  size="sm"
                  variant={showOverdueOnly ? "default" : "outline"}
                  onClick={() => setShowOverdueOnly(v => !v)}
                  className="shrink-0 gap-1.5"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {!isMobile && "Overdue only"}
                </Button>
              </div>
              {(() => {
                const missing = enrollments.filter(e => e.currency === "EGP" && !e.payment_method && (e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW"));
                if (missing.length === 0) return null;
                return (
                  <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 mb-3">
                    <span className="text-sm text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {missing.length} Egypt enrollment{missing.length > 1 ? "s" : ""} missing payment method
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
                      disabled={missing.some(e => sendingReminder.has(e.id))}
                      onClick={async () => { for (const e of missing) await onSendPaymentMethodReminder(e); }}
                    >
                      Notify All ({missing.length})
                    </Button>
                  </div>
                );
              })()}
              <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3 h-auto bg-transparent p-0 w-full">
                {[
                  { value: "under_review", label: "Under Review", count: enrollments.filter(e => e.approval_status === "UNDER_REVIEW").length },
                  { value: "pending_payment", label: "Pending Payment", count: enrollments.filter(e => e.approval_status === "PENDING_PAYMENT").length },
                  { value: "pending", label: "Pending", count: enrollments.filter(e => e.approval_status === "PENDING").length },
                  { value: "approved", label: "Approved", count: enrollments.filter(e => e.approval_status === "APPROVED").length },
                  { value: "rejected", label: "Rejected", count: enrollments.filter(e => e.approval_status === "REJECTED").length },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="shrink-0 rounded-full px-4 py-2 text-xs border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                    {t.label} ({t.count})
                  </TabsTrigger>
                ))}
              </TabsList>

              {(["pending_payment", "under_review", "pending", "approved", "rejected"] as const).map((tab) => {
                const isLegacy = (e: Enrollment) => (!e.level || e.level.trim() === '') && (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0));
                const filtered = enrollments.filter((e) => {
                  const matchesTab = tab === "pending_payment" ? e.approval_status === "PENDING_PAYMENT"
                    : tab === "under_review" ? e.approval_status === "UNDER_REVIEW"
                    : tab === "pending" ? e.approval_status === "PENDING"
                    : tab === "approved" ? e.approval_status === "APPROVED"
                    : e.approval_status === "REJECTED";
                  if (!matchesTab) return false;
                  const isActionable = e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW";
                  if (!showLegacyEnrollments && isLegacy(e) && !isActionable) return false;
                  if (showOverdueOnly && !e.negative_since) return false;
                  if (debouncedEnrollmentSearch) {
                    const q = debouncedEnrollmentSearch.toLowerCase();
                    const name = e.profiles?.name?.toLowerCase() ?? "";
                    const email = e.profiles?.email?.toLowerCase() ?? "";
                    const plan = e.plan_type?.toLowerCase() ?? "";
                    if (!name.includes(q) && !email.includes(q) && !plan.includes(q)) return false;
                  }
                  return true;
                });
                const isActionableTab = tab === "under_review" || tab === "pending_payment";
                const enrollPageCount = Math.ceil(filtered.length / PAGE_SIZE);
                const pagedEnrollments = filtered.slice(enrollmentPage * PAGE_SIZE, (enrollmentPage + 1) * PAGE_SIZE);
                const allPageSelected = pagedEnrollments.length > 0 && pagedEnrollments.every(e => selectedEnrollmentIds.has(e.id));
                return (
                  <TabsContent key={tab} value={tab} className="space-y-4">
                    {isActionableTab && filtered.length > 1 && (
                      <div className="flex items-center gap-2 px-1 pb-1 border-b border-border">
                        <Checkbox
                          id={`select-all-${tab}`}
                          checked={allPageSelected}
                          onCheckedChange={(checked) => {
                            setSelectedEnrollmentIds(prev => {
                              const next = new Set(prev);
                              pagedEnrollments.forEach(e => checked ? next.add(e.id) : next.delete(e.id));
                              return next;
                            });
                          }}
                        />
                        <label htmlFor={`select-all-${tab}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                          {allPageSelected ? "Deselect all on page" : `Select all on page (${pagedEnrollments.length})`}
                        </label>
                      </div>
                    )}
                    {filtered.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No {tab.replace(/_/g, " ")} enrollments.</p>
                    ) : pagedEnrollments.map((e) => {
                      const profileEmail = e.profiles?.email?.toLowerCase() ?? "";
                      const leadLvl = profileEmail && leadsByEmail[profileEmail]?.level?.trim()
                        ? normalizeLevel(leadsByEmail[profileEmail].level)
                        : "";
                      const resolvedLevelFallback = (e.level?.trim() ? normalizeLevel(e.level) : null) ?? leadLvl ?? "";
                      return (
                        <EnrollmentCard
                          key={e.id}
                          enrollment={e}
                          isActionableTab={isActionableTab}
                          isSelected={selectedEnrollmentIds.has(e.id)}
                          onToggleSelect={(id, checked) => {
                            setSelectedEnrollmentIds(prev => {
                              const next = new Set(prev);
                              if (checked) next.add(id); else next.delete(id);
                              return next;
                            });
                          }}
                          editingPrice={editingUnitPrice[e.id]}
                          onStartEditPrice={(en) => setEditingUnitPrice(prev => ({ ...prev, [en.id]: String(en.unit_price) }))}
                          onChangeEditPrice={(id, val) => setEditingUnitPrice(prev => ({ ...prev, [id]: val }))}
                          isSendingReminder={sendingReminder.has(e.id)}
                          onSendPaymentMethodReminder={onSendPaymentMethodReminder}
                          resolvedLevelFallback={resolvedLevelFallback}
                          onApprove={(en) => onEnrollmentAction(en, "APPROVED")}
                          onApproveAndMatch={async (en) => { await onEnrollmentAction(en, "APPROVED"); setAdminTab("group-matcher"); }}
                          onReject={onReject}
                          onRevert={onRevert}
                          onDelete={onDelete}
                          onViewReceipt={onViewReceipt}
                          onRequestResubmission={onRequestResubmission}
                          onSendClassLink={(en) => { onSendClassLink(en); }}
                          onResendPaymentEmail={onResendPaymentEmail}
                          onResendApprovalEmail={onResendApprovalEmail}
                        />
                      );
                    })}
                    {enrollPageCount > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                          Page {enrollmentPage + 1} of {enrollPageCount} · {filtered.length} enrollments
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" disabled={enrollmentPage === 0} onClick={() => setEnrollmentPage(p => p - 1)} aria-label="Previous page">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" disabled={enrollmentPage >= enrollPageCount - 1} onClick={() => setEnrollmentPage(p => p + 1)} aria-label="Next page">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Sticky bulk action bar */}
      {selectedEnrollmentIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background/95 backdrop-blur border border-border shadow-xl rounded-2xl px-5 py-3 animate-slide-up">
          <p className="text-sm font-semibold text-foreground">
            {selectedEnrollmentIds.size} enrollment{selectedEnrollmentIds.size > 1 ? "s" : ""} selected
          </p>
          <Button size="sm" onClick={handleBulkApprove} disabled={bulkApproving}>
            {bulkApproving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Approving…</> : <><Check className="h-4 w-4 mr-1.5" /> Approve All</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedEnrollmentIds(() => new Set())}>
            <X className="h-4 w-4 mr-1.5" /> Clear
          </Button>
        </div>
      )}
    </>
  );
}
