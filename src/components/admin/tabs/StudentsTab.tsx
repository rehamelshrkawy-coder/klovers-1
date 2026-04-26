import { lazy, Suspense, memo } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n/config";
import { cn } from "@/lib/utils";
import { getDerivedStatusBadgeVariant } from "@/lib/badge-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Search, Download, Trash2, AlertCircle, ChevronLeft, ChevronRight,
  UserPlus, Copy, Mail, Eraser, Columns3,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import type { OverviewRow } from "@/types/admin";
import { AT_RISK_SESSION_THRESHOLD, exportCSV } from "@/lib/admin-utils";
import { formatMoney, formatDate } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminAttendancePanel = lazy(() => import("@/components/admin/AdminAttendancePanel"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

type StudentCol = "country" | "level" | "attendance" | "source" | "joined";
const ALL_STUDENT_COLS: StudentCol[] = ["country", "level", "attendance", "source", "joined"];
const STUDENT_COL_LABELS: Record<StudentCol, string> = {
  country: "Country", level: "Level", attendance: "Attendance %", source: "Source", joined: "Joined",
};

interface FilterOption { value: string; label: string }

interface Props {
  overviewRows: OverviewRow[];
  filteredUsers: OverviewRow[];
  sortedUsers: OverviewRow[];
  pagedUsers: OverviewRow[];
  totalPages: number;
  studentPage: number;
  setStudentPage: (fn: (p: number) => number) => void;
  studentFilter: string;
  setStudentFilter: (v: string) => void;
  levelFilter: string;
  setLevelFilter: (v: string) => void;
  studentSearch: string;
  setStudentSearch: (v: string) => void;
  studentSort: { col: string; dir: "asc" | "desc" };
  setStudentSort: (fn: (s: { col: string; dir: "asc" | "desc" }) => { col: string; dir: "asc" | "desc" }) => void;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  visibleStudentCols: Set<StudentCol>;
  toggleStudentCol: (c: StudentCol) => void;
  studentFilterOptions: FilterOption[];
  loading: boolean;
  setAdminTab: (tab: string) => void;
  onDeleteStudent: (userId: string) => Promise<void>;
  onManualEnroll: (u: OverviewRow) => void;
  invalidateAll: () => void;
}

export const StudentsTab = memo(function StudentsTab({
  overviewRows, filteredUsers, sortedUsers, pagedUsers, totalPages,
  studentPage, setStudentPage, studentFilter, setStudentFilter,
  levelFilter, setLevelFilter, studentSearch, setStudentSearch,
  studentSort, setStudentSort, selectedStudentId, setSelectedStudentId,
  visibleStudentCols, toggleStudentCol, studentFilterOptions, loading,
  setAdminTab, onDeleteStudent, onManualEnroll, invalidateAll,
}: Props) {
  const { t } = useTranslation("admin");
  const isMobile = useIsMobile();

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base">{t("students.title")}</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Read-only overview of every student. For manual enrollment, packages, or legacy records use
                  <button
                    type="button"
                    onClick={() => setAdminTab("manage")}
                    className="underline underline-offset-2 hover:text-foreground ml-1"
                  >
                    Student Admin →
                  </button>
                </p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">{filteredUsers.length} of {overviewRows.length}</p>
            </div>
            {/* Responsive student filters */}
            {isMobile ? (
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {studentFilterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
                {studentFilterOptions.map(opt => (
                  <Button
                    key={opt.value}
                    variant={studentFilter === opt.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setStudentFilter(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
            {/* Search + Level filter + Export */}
            <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("students.searchPlaceholder")}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search students by name or email"
                  type="search"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("students.allLevels")}</SelectItem>
                  {LEVEL_SELECT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size={isMobile ? "icon" : "sm"} aria-label="Toggle table columns">
                    <Columns3 className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">{t("students.columns")}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Visible columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_STUDENT_COLS.map(col => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={visibleStudentCols.has(col)}
                      onCheckedChange={() => toggleStudentCol(col)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {STUDENT_COL_LABELS[col]}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={() => {
                exportCSV(
                  ["Name", "Email", "Country", "Level", "Remaining Sessions", "Status", "Source", "Joined"],
                  filteredUsers.map(u => [u.name, u.email, u.country, u.level, u.sessions_remaining, u.derived_status, u.source_label, new Date(u.joined_at).toLocaleDateString()]),
                  "students"
                );
              }}>
                <Download className="h-4 w-4" />
                {!isMobile && <span className="ml-1">{t("students.exportCsv")}</span>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-2">
              <div className="flex items-center gap-3 py-3 border-b border-border/50">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-40 flex-1" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/2 opacity-70" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              ))}
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm text-foreground">{t("students.noMatch")}</p>
                <p className="text-xs text-muted-foreground">Try clearing filters or adjusting your search term</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStudentFilter("all"); setLevelFilter("all"); setStudentSearch(""); }}
              >
                <Eraser className="h-4 w-4 mr-1.5" /> {t("students.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              {isMobile && (
                <div className="space-y-2 sm:hidden">
                  {pagedUsers.map((u) => {
                    const isAtRisk = u.derived_status === "ACTIVE" && u.sessions_remaining > 0 && u.sessions_remaining <= AT_RISK_SESSION_THRESHOLD;
                    const isLocked = u.derived_status === "LOCKED";
                    return (
                      <div
                        key={u.user_id}
                        className={cn(
                          "rounded-xl border bg-card p-3 space-y-2 cursor-pointer transition-shadow hover:shadow-sm",
                          isAtRisk && "border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20",
                          isLocked && "border-red-300/60 bg-red-50/60 dark:bg-red-950/20"
                        )}
                        onClick={() => setSelectedStudentId(selectedStudentId === u.user_id ? null : (u.enrollment_id ? u.user_id : null))}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{u.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <Badge variant={getDerivedStatusBadgeVariant(u.derived_status)} className="text-xs shrink-0">{u.derived_status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {u.level && <span className="px-1.5 py-0.5 rounded-full bg-muted font-medium">{u.level}</span>}
                          <span>Sessions: <span className="font-mono font-semibold text-foreground">{u.sessions_remaining}</span></span>
                          {u.amount_due > 0 && (
                            <span className="text-destructive font-semibold">Owes {formatMoney(u.amount_due, u.currency)}</span>
                          )}
                          {u.sessions_total > 0 && (
                            <span>
                              Attend: <span className={`font-semibold ${Math.round(((u.sessions_total - u.sessions_remaining) / u.sessions_total) * 100) >= 80 ? "text-green-600" : "text-amber-600"}`}>
                                {Math.round(((u.sessions_total - u.sessions_remaining) / u.sessions_total) * 100)}%
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Desktop table */}
              <div className={cn("border rounded-xl overflow-auto", isMobile && "hidden sm:block")}>
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                      <TableHead className="py-3 px-3 font-semibold">Name</TableHead>
                      <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                      {visibleStudentCols.has("country") && (
                        <TableHead className="py-3 px-3 font-semibold">Country</TableHead>
                      )}
                      {visibleStudentCols.has("level") && (
                        <TableHead className="py-3 px-3 font-semibold">Level</TableHead>
                      )}
                      <TableHead
                        className="py-3 px-3 font-semibold text-center cursor-pointer select-none hover:text-primary"
                        onClick={() => setStudentSort(s => ({ col: "sessions_remaining", dir: s.col === "sessions_remaining" && s.dir === "asc" ? "desc" : "asc" }))}
                        aria-sort={studentSort.col === "sessions_remaining" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Remaining {studentSort.col === "sessions_remaining" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                      </TableHead>
                      {visibleStudentCols.has("attendance") && (
                        <TableHead
                          className="py-3 px-3 font-semibold text-center cursor-pointer select-none hover:text-primary"
                          onClick={() => setStudentSort(s => ({ col: "attendance_pct", dir: s.col === "attendance_pct" && s.dir === "asc" ? "desc" : "asc" }))}
                          aria-sort={studentSort.col === "attendance_pct" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                        >
                          Attend% {studentSort.col === "attendance_pct" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                        </TableHead>
                      )}
                      <TableHead className="py-3 px-3 font-semibold text-center">Negative</TableHead>
                      <TableHead
                        className="py-3 px-3 font-semibold text-right cursor-pointer select-none hover:text-primary"
                        onClick={() => setStudentSort(s => ({ col: "amount_due", dir: s.col === "amount_due" && s.dir === "asc" ? "desc" : "asc" }))}
                        aria-sort={studentSort.col === "amount_due" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Amount Due {studentSort.col === "amount_due" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                      </TableHead>
                      <TableHead
                        className="py-3 px-3 font-semibold text-right cursor-pointer select-none hover:text-primary"
                        onClick={() => setStudentSort(s => ({ col: "remaining_balance", dir: s.col === "remaining_balance" && s.dir === "asc" ? "desc" : "asc" }))}
                        aria-sort={studentSort.col === "remaining_balance" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                      >
                        Balance {studentSort.col === "remaining_balance" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                      </TableHead>
                      <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                      {visibleStudentCols.has("source") && (
                        <TableHead className="py-3 px-3 font-semibold">Source</TableHead>
                      )}
                      {visibleStudentCols.has("joined") && (
                        <TableHead
                          className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-primary"
                          onClick={() => setStudentSort(s => ({ col: "joined_at", dir: s.col === "joined_at" && s.dir === "asc" ? "desc" : "asc" }))}
                          aria-sort={studentSort.col === "joined_at" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                        >
                          Joined {studentSort.col === "joined_at" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                        </TableHead>
                      )}
                      <TableHead className="py-3 px-3 w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedUsers.map((u) => {
                      const isAtRisk = u.derived_status === "ACTIVE" && u.sessions_remaining > 0 && u.sessions_remaining <= AT_RISK_SESSION_THRESHOLD;
                      const isLocked = u.derived_status === "LOCKED";
                      return (
                        <TableRow key={u.user_id} className={cn(
                          "group odd:bg-muted/30 hover:bg-muted/50 transition cursor-pointer",
                          selectedStudentId === u.user_id && "ring-2 ring-primary/40",
                          isAtRisk && "bg-amber-50/60 dark:bg-amber-950/20 odd:bg-amber-50/60",
                          isLocked && "bg-red-50/60 dark:bg-red-950/20 odd:bg-red-50/60"
                        )} onClick={() => setSelectedStudentId(selectedStudentId === u.user_id ? null : (u.enrollment_id ? u.user_id : null))}>
                          <TableCell className="py-3 px-3 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>{u.name || "—"}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                title="Manually enroll"
                                aria-label={`Manually enroll ${u.name || u.email}`}
                                onClick={e => { e.stopPropagation(); onManualEnroll(u); }}
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <div className="flex items-center gap-1 max-w-[240px]">
                              <span className="truncate flex-1 text-sm">{u.email}</span>
                              <button
                                className="shrink-0 p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(u.email); toast({ title: "Copied" }); }}
                                aria-label={`Copy email ${u.email}`}
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                          {visibleStudentCols.has("country") && (
                            <TableCell className="py-3 px-3 text-muted-foreground">{u.country || "—"}</TableCell>
                          )}
                          {visibleStudentCols.has("level") && (
                            <TableCell className="py-3 px-3 text-muted-foreground">{u.level || "—"}</TableCell>
                          )}
                          <TableCell className="py-3 px-3 text-center font-mono">{u.sessions_remaining}</TableCell>
                          {visibleStudentCols.has("attendance") && (
                            <TableCell className="py-3 px-3 text-center">
                              {u.sessions_total > 0 ? (() => {
                                const pct = Math.round(((u.sessions_total - u.sessions_remaining) / u.sessions_total) * 100);
                                return (
                                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${pct >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : pct >= 50 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`} aria-label={`${pct}% attendance`}>
                                    {pct}%
                                  </span>
                                );
                              })() : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          )}
                          <TableCell className="py-3 px-3 text-center font-mono">
                            {u.negative_sessions > 0 ? (
                              <span className="inline-flex items-center gap-1 text-destructive font-semibold" aria-label={`${u.negative_sessions} negative sessions`}>
                                <AlertCircle className="h-3 w-3" aria-hidden="true" /> {u.negative_sessions}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right font-mono" onClick={(e) => e.stopPropagation()}>
                            {u.amount_due > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`mailto:${u.email}?subject=Outstanding Balance - Klovers&body=Hi ${(u.name || "").split(" ")[0]},%0A%0AYou have an outstanding balance of ${formatMoney(u.amount_due, u.currency)}. Please arrange payment at your earliest convenience.%0A%0ABest,%0AKlovers Team`}
                                      className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors text-xs font-semibold"
                                      aria-label={`Send payment request to ${u.name}`}
                                    >
                                      {formatMoney(u.amount_due, u.currency)}
                                      <Mail className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>Send payment request email</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 text-right font-mono">
                            {u.remaining_balance > 0 ? (
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                {formatMoney(u.remaining_balance, u.currency)}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <Badge variant={getDerivedStatusBadgeVariant(u.derived_status)} className="text-xs">{u.derived_status}</Badge>
                          </TableCell>
                          {visibleStudentCols.has("source") && (
                            <TableCell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => {
                                  const f = u.source_label === "Stripe" ? "stripe" : u.source_label === "Egypt" ? "egypt" : null;
                                  if (f) { setStudentFilter(f); setStudentPage(() => 0); }
                                }}
                                title={`Filter by ${u.source_label}`}
                                role="button"
                                aria-label={`Filter students by source: ${u.source_label}`}
                              >
                                {u.source_label}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleStudentCols.has("joined") && (
                            <TableCell className="py-3 px-3 text-muted-foreground text-xs">{formatDate(u.joined_at)}</TableCell>
                          )}
                          <TableCell className="py-3 px-3 w-10" onClick={(e) => e.stopPropagation()}>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  className="p-1 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/40 transition-colors"
                                  aria-label="Delete student"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("students.deleteConfirmTitle")}</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete {u.name || u.email}'s profile. This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("students.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDeleteStudent(u.user_id)}>{t("students.delete")}</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {studentPage + 1} of {totalPages} · {sortedUsers.length} results
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={studentPage === 0} onClick={() => setStudentPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={studentPage >= totalPages - 1} onClick={() => setStudentPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Attendance Panel */}
      {selectedStudentId && (() => {
        const student = overviewRows.find(u => u.user_id === selectedStudentId);
        if (!student || !student.enrollment_id) return null;
        return (
          <Suspense fallback={<TabLoader />}>
            <AdminAttendancePanel
              enrollmentId={student.enrollment_id}
              userId={student.user_id}
              studentName={student.name || student.email}
              sessionsRemaining={student.sessions_remaining}
              negativeSessions={student.negative_sessions}
              amountDue={student.amount_due}
              currency={student.currency}
              derivedStatus={student.derived_status}
              onClose={() => setSelectedStudentId(null)}
              onUpdated={invalidateAll}
            />
          </Suspense>
        );
      })()}
    </>
  );
});
