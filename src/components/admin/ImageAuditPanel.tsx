import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Play, Wrench, CheckCircle, AlertCircle, XCircle,
  ChevronDown, ChevronRight, Image, Languages, Globe,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageIssue {
  code: string;
  field: string;
  current_value: string | null;
  severity: "error" | "warning";
  message: string;
}

interface PostAuditResult {
  id: string;
  title: string;
  slug: string;
  lang: string;
  published: boolean;
  issues: ImageIssue[];
  ai_alt1: string | null;
  ai_alt2: string | null;
  issue_count: number;
  status: "ok" | "warning" | "error";
}

interface ParityPost {
  id: string;
  slug: string;
  lang: string;
  has_alt: boolean;
  has_alt_correct_lang: boolean;
  published: boolean;
  hero_image: string | null;
}

interface ParityGroup {
  slug_base: string;
  hero_image_en: string | null;
  hero_image_ar: string | null;
  images_match: boolean;
  posts: ParityPost[];
  has_en: boolean;
  has_ar: boolean;
  is_complete: boolean;
  missing_langs: string[];
  match_method: "slug" | "standalone_ar";
  debug: {
    en_slug_searched: string | null;
    ar_slug_searched: string | null;
    counterpart_found: boolean;
  };
}

interface AuditSummary {
  total_posts: number;
  posts_with_errors: number;
  posts_with_warnings: number;
  posts_ok: number;
  missing_images: number;
  missing_alt_text: number;
  wrong_language_alt: number;
  en_posts: number;
  ar_posts: number;
  bilingual_pairs: number;
  unpaired_posts: number;
  ai_fixes_available: number;
  fixes_applied: number;
}

interface AuditResponse {
  summary: AuditSummary;
  report: PostAuditResult[];
  parity: ParityGroup[];
  ai_calls_made: number;
  errors?: string[];
}

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
  if (status === "warning") return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
}

function SeverityBadge({ severity }: { severity: "error" | "warning" }) {
  return severity === "error" ? (
    <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold border bg-red-100 text-red-700 border-red-200">error</span>
  ) : (
    <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold border bg-yellow-100 text-yellow-700 border-yellow-200">warning</span>
  );
}

function LangBadge({ lang }: { lang: string }) {
  const isAr = lang === "ar";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold border ${isAr ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
      {isAr ? "AR" : "EN"}
    </span>
  );
}

// ── Post row ──────────────────────────────────────────────────────────────────

function PostRow({ item }: { item: PostAuditResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <StatusIcon status={item.status} />

        <span className="flex-1 font-medium text-sm truncate">{item.title}</span>

        <div className="flex items-center gap-2 shrink-0">
          <LangBadge lang={item.lang} />
          {!item.published && (
            <Badge variant="outline" className="text-xs text-muted-foreground">draft</Badge>
          )}
          {item.issue_count > 0 && (
            <span className="rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5">
              {item.issue_count} issue{item.issue_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-4 py-4 space-y-4 text-sm">
          {item.issues.length === 0 ? (
            <p className="text-green-600 font-medium">All image checks passed.</p>
          ) : (
            <div className="space-y-2">
              {item.issues.map((issue, i) => (
                <div key={i} className={`flex gap-3 p-2 rounded border text-xs ${issue.severity === "error" ? "border-red-200 bg-red-50/50" : "border-yellow-200 bg-yellow-50/50"}`}>
                  <SeverityBadge severity={issue.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{issue.message}</p>
                    {issue.current_value && (
                      <p className="text-muted-foreground mt-0.5 truncate">
                        Current: <span className="font-mono">"{issue.current_value}"</span>
                      </p>
                    )}
                    <p className="text-muted-foreground font-mono mt-0.5">field: {issue.field}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI-generated alt text */}
          {(item.ai_alt1 || item.ai_alt2) && (
            <div>
              <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5" />
                AI-generated alt text ({item.lang === "ar" ? "Arabic" : "English"})
              </p>
              <div className="p-2 rounded bg-background border text-xs space-y-1.5">
                {item.ai_alt1 && (
                  <div>
                    <span className="font-medium">Image 1: </span>
                    <span dir={item.lang === "ar" ? "rtl" : "ltr"}>{item.ai_alt1}</span>
                  </div>
                )}
                {item.ai_alt2 && (
                  <div>
                    <span className="font-medium">Image 2: </span>
                    <span dir={item.lang === "ar" ? "rtl" : "ltr"}>{item.ai_alt2}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Debug info per parity group ───────────────────────────────────────────────

function DebugInfo({ group }: { group: ParityGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-dashed pt-1.5 mt-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Debug Info
      </button>
      {open && (
        <div className="mt-1.5 p-2 rounded bg-muted/30 text-xs font-mono space-y-1">
          <div>Slug base: <span className="text-primary">{group.slug_base}</span></div>
          <div>Match method: {group.match_method}</div>
          <div>EN slug searched: {group.debug.en_slug_searched ?? "—"}</div>
          <div>AR slug searched: {group.debug.ar_slug_searched ?? "—"}</div>
          <div>Counterpart found: {group.debug.counterpart_found ? "Yes" : "No"}</div>
          <div>Images match: {group.images_match ? "Yes" : "No"}</div>
          {group.hero_image_en && (
            <div className="truncate">EN image: <span className="text-blue-600" title={group.hero_image_en}>{group.hero_image_en}</span></div>
          )}
          {group.hero_image_ar && (
            <div className="truncate">AR image: <span className="text-green-600" title={group.hero_image_ar}>{group.hero_image_ar}</span></div>
          )}
          {!group.images_match && group.hero_image_en && group.hero_image_ar && (
            <div className="text-yellow-600">⚠ Hero images differ between EN and AR versions</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Parity section ────────────────────────────────────────────────────────────

function ParitySection({ groups }: { groups: ParityGroup[] }) {
  const [open, setOpen] = useState(true);
  const completeCount = groups.filter((g) => g.is_complete).length;

  return (
    <Card className="rounded-xl">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <Globe className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Arabic ↔ English Bilingual Parity ({groups.length})</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {completeCount} complete · {groups.length - completeCount} incomplete
        </span>
      </button>

      {open && (
        <CardContent className="border-t pt-4 space-y-3">
          {groups.map((group, idx) => (
            <div key={idx} className={`rounded-lg border p-3 text-sm space-y-2 ${group.is_complete ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/30"}`}>
              <div className="flex items-center gap-2">
                <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs text-muted-foreground truncate" title={group.slug_base}>
                  {group.slug_base}
                </span>
                {group.match_method === "standalone_ar" && (
                  <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold border bg-orange-100 text-orange-700 border-orange-200">
                    standalone AR
                  </span>
                )}
                {group.is_complete
                  ? <CheckCircle className="h-4 w-4 text-green-500 ml-auto shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-500 ml-auto shrink-0" />
                }
              </div>

              {/* Per-language rows */}
              <div className="space-y-1">
                {group.posts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <LangBadge lang={p.lang} />
                    <span className="font-mono text-primary truncate max-w-[200px]" title={`/blog/${p.slug}`}>
                      /{p.slug}
                    </span>
                    <span className="ml-auto flex items-center gap-2 shrink-0">
                      {p.has_alt
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500" aria-label="Has alt text" />
                        : <XCircle className="h-3.5 w-3.5 text-red-500" aria-label="Missing alt text" />
                      }
                      {p.has_alt_correct_lang
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500" aria-label="Correct language" />
                        : <AlertCircle className="h-3.5 w-3.5 text-yellow-500" aria-label="Wrong language" />
                      }
                      {p.published
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500" aria-label="Published" />
                        : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" aria-label="Draft" />
                      }
                    </span>
                  </div>
                ))}
              </div>

              {/* Missing languages */}
              {group.missing_langs.length > 0 && (
                <p className="text-xs text-red-600 font-medium">
                  Missing {group.missing_langs.map((l) => l.toUpperCase()).join(", ")} version
                </p>
              )}

              {/* Debug info */}
              <DebugInfo group={group} />

              {/* Legend */}
              <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t border-dashed">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> alt text</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> correct lang</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> published</span>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

function ImageAuditPanel() {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "parity">("posts");
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "ok">("all");

  async function runAudit(mode: "analyze" | "fix") {
    if (mode === "analyze") setLoading(true);
    else setFixing(true);

    try {
      const { data, error } = await supabase.functions.invoke("image-audit", {
        body: { mode },
      });

      if (error) throw error;

      setResult(data as AuditResponse);
      toast({
        title: mode === "analyze" ? "Image audit complete" : "Fixes applied",
        description:
          mode === "analyze"
            ? `${data.summary.total_posts} posts audited · ${data.summary.posts_with_errors} errors · ${data.summary.posts_with_warnings} warnings`
            : `${data.summary.fixes_applied} posts updated with new alt text`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
      setFixing(false);
    }
  }

  const summary = result?.summary;
  const report = result?.report ?? [];

  const filteredReport = filter === "all" ? report : report.filter((r) => r.status === filter);

  const filterCounts = {
    all: report.length,
    error: report.filter((r) => r.status === "error").length,
    warning: report.filter((r) => r.status === "warning").length,
    ok: report.filter((r) => r.status === "ok").length,
  };

  const incompleteGroupCount = result?.parity.filter((g) => !g.is_complete).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5 text-primary" />
            Image & Alt Text Audit
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Checks all posts (published + drafts) for missing images, missing or wrong-language alt text,
            and Arabic ↔ English bilingual parity. Zero AI tokens for detection — AI only generates fixes.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => runAudit("analyze")} disabled={loading || fixing}>
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Auditing…</>
              : <><Play className="h-4 w-4 mr-2" /> Run Audit</>
            }
          </Button>
          {result && result.summary.ai_fixes_available > 0 && (
            <Button variant="outline" onClick={() => runAudit("fix")} disabled={loading || fixing}>
              {fixing
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Applying…</>
                : <><Wrench className="h-4 w-4 mr-2" /> Apply Alt Text Fixes ({result.summary.ai_fixes_available})</>
              }
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: summary.total_posts, color: "" },
            { label: "Errors", value: summary.posts_with_errors, color: "text-red-600" },
            { label: "Warnings", value: summary.posts_with_warnings, color: "text-yellow-600" },
            { label: "OK", value: summary.posts_ok, color: "text-green-600" },
            { label: "No Image", value: summary.missing_images, color: "text-red-600" },
            { label: "No Alt Text", value: summary.missing_alt_text, color: "text-red-600" },
            { label: "Wrong Lang", value: summary.wrong_language_alt, color: "text-orange-600" },
            { label: "Unpaired", value: summary.unpaired_posts, color: "text-yellow-600" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="rounded-xl">
              <CardContent className="pt-3 pb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* EN/AR split */}
      {summary && (
        <div className="flex gap-3">
          <Card className="rounded-xl flex-1">
            <CardContent className="pt-3 pb-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600">{summary.en_posts}</span>
              <div>
                <p className="text-xs text-muted-foreground">English posts</p>
                <p className="text-xs text-muted-foreground">{summary.bilingual_pairs} paired with Arabic</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl flex-1">
            <CardContent className="pt-3 pb-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-green-600">{summary.ar_posts}</span>
              <div>
                <p className="text-xs text-muted-foreground">Arabic posts</p>
                <p className="text-xs text-muted-foreground">{summary.bilingual_pairs} paired with English</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Errors */}
      {result?.errors && result.errors.length > 0 && (
        <Card className="rounded-xl border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-destructive mb-2">Errors during audit</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tab switcher */}
      {result && (
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Post Issues ({result.report.length})
          </button>
          <button
            onClick={() => setActiveTab("parity")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "parity" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Globe className="h-3.5 w-3.5" />
            Bilingual Parity
            {incompleteGroupCount > 0 && (
              <span className="ml-1 rounded-full bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 leading-none">
                {incompleteGroupCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Posts tab */}
      {result && activeTab === "posts" && (
        <div className="space-y-3">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            {(["all", "error", "warning", "ok"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {f} ({filterCounts[f]})
                </button>
            ))}
          </div>

          {filteredReport.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No posts match this filter.</p>
          ) : (
            filteredReport.map((item) => <PostRow key={item.id} item={item} />)
          )}
        </div>
      )}

      {/* Parity tab */}
      {result && activeTab === "parity" && (
        <ParitySection groups={result.parity} />
      )}
    </div>
  );
}

export default memo(ImageAuditPanel);
