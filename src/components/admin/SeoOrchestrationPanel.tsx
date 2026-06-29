import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Play, Wrench, CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  Sparkles, Link, TrendingUp, AlertTriangle, PlusCircle, FileText, ExternalLink,
  Zap, Target, BarChart2, Globe, BookOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeoAgentResult { score: number; top_fixes: string[]; improved_description?: string; }
interface KeywordAgentResult { primary_keyword: string; in_title: boolean; in_description: boolean; in_headings: boolean; in_intro: boolean; placement_score: number; suggestions: string[]; }
interface AltTextAgentResult { alt1_score: number; improved_alt1: string; alt2_score: number | null; improved_alt2: string | null; }
interface ContentAgentResult { structure_score: number; word_count: number; heading_count: number; suggestions: string[]; }
interface MarketingAgentResult { cta_score: number; suggested_cta_text: string; suggested_cta_url: string; social_caption: string; }
interface InternalLinkingResult { missing_link_score: number; links_to_posts: Array<{ target_slug: string; anchor_text: string }>; links_to_pages: Array<{ url: string; anchor_text: string }>; }
interface RecommendedArticle { title: string; slug: string; target_keyword: string; search_intent: string; article_type: string; priority: "high" | "medium" | "low"; reason: string; }
interface CannibalizationWarning { post_slugs: string[]; shared_keyword: string; recommendation: string; }
interface TopicCluster { cluster_name: string; pillar_slug: string | null; supporting_slugs: string[]; gap: string | null; }
interface TopicGapResult { recommended_articles: RecommendedArticle[]; cannibalization_warnings: CannibalizationWarning[]; topic_clusters: TopicCluster[]; }
interface AgentReport { id: string; title: string; slug: string; lang: string; agents_run: string[]; seo?: SeoAgentResult; keyword?: KeywordAgentResult; alt_text?: AltTextAgentResult; content?: ContentAgentResult; marketing?: MarketingAgentResult; internal_links?: InternalLinkingResult; }
interface OrchestratorSummary { total_posts: number; posts_analyzed: number; agents_invoked: number; ai_calls_made: number; avg_seo_score: number | null; posts_needing_work: number; fixes_applied: number; topic_gaps_found: number; cannibalization_warnings: number; }
interface OrchestrationResponse { summary: OrchestratorSummary; report: AgentReport[]; topic_gaps: TopicGapResult | null; errors?: string[]; }
interface GenerationResult { slug: string; title: string; id?: string; status: "created" | "exists" | "error"; error?: string; }

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, max = 10, label }: { score: number | null | undefined; max?: number; label?: string }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right">{score}/{max}</span>
      {label && <span className="text-xs text-muted-foreground hidden sm:block">{label}</span>}
    </div>
  );
}

function ScoreBadge({ score, title }: { score: number | null | undefined; title?: string }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const color = score >= 8 ? "bg-green-100 text-green-800 border-green-200" : score >= 5 ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-red-100 text-red-800 border-red-200";
  return <span title={title} className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border ${color}`}>{score}/10</span>;
}

function BoolDot({ value, label }: { value: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-xs ${value ? "text-green-700" : "text-muted-foreground"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${value ? "bg-green-500" : "bg-muted-foreground/40"}`} />
      {label}
    </span>
  );
}

// ── Priority badge ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const cls = priority === "high" ? "bg-red-100 text-red-700 border-red-200" : priority === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200";
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold border ${cls} capitalize`}>{priority}</span>;
}

// ── Post row ──────────────────────────────────────────────────────────────────

function PostRow({ item }: { item: AgentReport }) {
  const [open, setOpen] = useState(false);
  const hasIssues = item.agents_run.length > 0;
  const topScore = item.seo?.score ?? item.keyword?.placement_score ?? null;

  return (
    <div className={`border rounded-xl overflow-hidden transition-shadow ${open ? "shadow-md" : "hover:shadow-sm"}`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">/{item.slug}</p>
        </div>

        <Badge variant="outline" className="text-xs shrink-0">{item.lang.toUpperCase()}</Badge>

        {topScore != null && (
          <div className="hidden sm:flex items-center w-28 shrink-0">
            <ScoreBar score={topScore} />
          </div>
        )}

        {hasIssues
          ? <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          : <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t bg-muted/10 px-4 py-4 grid gap-5 text-sm">

          {/* SEO Agent */}
          {item.seo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">SEO Analysis</span>
                <ScoreBar score={item.seo.score} />
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs pl-1">
                {item.seo.top_fixes.map((fix, i) => <li key={i}>{fix}</li>)}
              </ul>
              {item.seo.improved_description && (
                <div className="p-2.5 rounded-lg bg-background border text-xs">
                  <span className="font-medium text-foreground">Improved description: </span>
                  <span className="text-muted-foreground">{item.seo.improved_description}</span>
                </div>
              )}
            </div>
          )}

          {/* Keyword Agent */}
          {item.keyword && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">Keyword — <span className="font-mono text-primary">"{item.keyword.primary_keyword}"</span></span>
                <ScoreBar score={item.keyword.placement_score} />
              </div>
              <div className="flex flex-wrap gap-3">
                <BoolDot value={item.keyword.in_title} label="Title" />
                <BoolDot value={item.keyword.in_description} label="Description" />
                <BoolDot value={item.keyword.in_headings} label="Headings" />
                <BoolDot value={item.keyword.in_intro} label="Intro" />
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs pl-1">
                {item.keyword.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Alt Text Agent */}
          {item.alt_text && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">Alt Text</span>
                <ScoreBar score={item.alt_text.alt1_score} />
              </div>
              <div className="p-2.5 rounded-lg bg-background border text-xs space-y-1.5">
                <p><span className="font-medium">Image 1: </span><span className="text-muted-foreground">{item.alt_text.improved_alt1}</span></p>
                {item.alt_text.improved_alt2 && (
                  <p><span className="font-medium">Image 2: </span><span className="text-muted-foreground">{item.alt_text.improved_alt2}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Content Agent */}
          {item.content && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">Content Structure</span>
                <ScoreBar score={item.content.structure_score} />
                <span className="text-xs text-muted-foreground">{item.content.word_count}w · {item.content.heading_count}h</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs pl-1">
                {item.content.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Marketing Agent */}
          {item.marketing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">Marketing Copy</span>
                <ScoreBar score={item.marketing.cta_score} />
              </div>
              <div className="p-2.5 rounded-lg bg-background border text-xs space-y-1.5">
                <p><span className="font-medium">CTA: </span>"{item.marketing.suggested_cta_text}" → <span className="font-mono text-primary">{item.marketing.suggested_cta_url}</span></p>
                <p><span className="font-medium">Social: </span><span className="text-muted-foreground">{item.marketing.social_caption}</span></p>
              </div>
            </div>
          )}

          {/* Internal Links */}
          {item.internal_links && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">Internal Links</span>
                <ScoreBar score={item.internal_links.missing_link_score} />
              </div>
              <div className="p-2.5 rounded-lg bg-background border text-xs space-y-2">
                {item.internal_links.links_to_posts.map((l, i) => (
                  <p key={i} className="text-muted-foreground">→ <span className="font-mono text-primary">/{l.target_slug}</span> — "{l.anchor_text}"</p>
                ))}
                {item.internal_links.links_to_pages.map((l, i) => (
                  <p key={i} className="text-muted-foreground">→ <span className="font-mono text-primary">{l.url}</span> — "{l.anchor_text}"</p>
                ))}
              </div>
            </div>
          )}

          {item.agents_run.length === 0 && (
            <p className="text-green-600 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> All checks passed — no improvements needed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Topic Gap Panel ────────────────────────────────────────────────────────────

function TopicGapPanel({
  data,
  autoGenResults,
  autoGenerating,
}: {
  data: TopicGapResult;
  autoGenResults: GenerationResult[];
  autoGenerating: boolean;
}) {
  const [clusterOpen, setClusterOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [manualResults, setManualResults] = useState<GenerationResult[]>([]);

  const MAX_SELECT = 5;

  const allGenResults = [...autoGenResults, ...manualResults];
  const createdSlugs = new Set(allGenResults.filter((r) => r.status === "created").map((r) => r.slug));
  const existingSlugs = new Set(allGenResults.filter((r) => r.status === "exists").map((r) => r.slug));
  const errorSlugs = new Set(allGenResults.filter((r) => r.status === "error").map((r) => r.slug));

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < MAX_SELECT) next.add(slug);
      return next;
    });
  }

  async function generateSelected() {
    const specs = data.recommended_articles.filter((a) => selected.has(a.slug));
    if (specs.length === 0) return;
    setGenerating(true);
    setManualResults([]);
    try {
      const { data: res, error } = await supabase.functions.invoke("article-generator", { body: { articles: specs } });
      if (error) throw error;
      setManualResults(res.results ?? []);
      toast({
        title: `${res.summary.created} article${res.summary.created !== 1 ? "s" : ""} created`,
        description: res.summary.skipped > 0 ? `${res.summary.skipped} already existed` : "All drafts saved — review and publish from the Blog tab.",
      });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  const autoCreatedCount = autoGenResults.filter((r) => r.status === "created").length;

  return (
    <div className="space-y-4">

      {/* Auto-gen status banner */}
      {(autoGenerating || autoGenResults.length > 0) && (
        <Card className={`rounded-xl border-2 ${autoGenerating ? "border-primary/30 bg-primary/5" : autoCreatedCount > 0 ? "border-green-300 bg-green-50/60" : "border-border"}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              {autoGenerating
                ? <><Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" /><div><p className="text-sm font-semibold text-primary">Auto-generating top 5 articles…</p><p className="text-xs text-muted-foreground mt-0.5">Writing full SEO-optimised drafts from your top priority gaps</p></div></>
                : <><CheckCircle className="h-5 w-5 text-green-600 shrink-0" /><div><p className="text-sm font-semibold text-green-800">{autoCreatedCount} article draft{autoCreatedCount !== 1 ? "s" : ""} auto-generated</p><p className="text-xs text-muted-foreground mt-0.5">{autoGenResults.filter(r => r.status === "exists").length} already existed · Review and publish from the Blog tab</p></div></>
              }
            </div>
            {!autoGenerating && autoGenResults.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {autoGenResults.map((r) => (
                  <span key={r.slug} className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border font-medium
                    ${r.status === "created" ? "bg-green-100 border-green-300 text-green-800" :
                      r.status === "exists" ? "bg-blue-100 border-blue-300 text-blue-800" :
                      "bg-red-100 border-red-300 text-red-800"}`}>
                    {r.status === "created" ? <CheckCircle className="h-3 w-3" /> : r.status === "exists" ? <FileText className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {r.title ?? r.slug}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommended articles */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              Topic Gaps — Recommended Articles ({data.recommended_articles.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {selected.size > 0 && <span className="text-xs text-muted-foreground">{selected.size}/{MAX_SELECT} selected</span>}
              <Button size="sm" onClick={generateSelected} disabled={selected.size === 0 || generating} className="h-7 text-xs">
                {generating
                  ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Generating…</>
                  : <><FileText className="h-3 w-3 mr-1.5" /> Generate {selected.size > 0 ? `(${selected.size})` : ""}</>
                }
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Top 5 were auto-generated. Select more to generate additional drafts.</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {data.recommended_articles.map((a) => {
            const isCreated = createdSlugs.has(a.slug);
            const isExisting = existingSlugs.has(a.slug);
            const hasError = errorSlugs.has(a.slug);
            const isSelected = selected.has(a.slug);
            const isAutoGen = autoGenResults.some((r) => r.slug === a.slug);
            const errMsg = allGenResults.find((r) => r.slug === a.slug)?.error;

            return (
              <div
                key={a.slug}
                role="checkbox"
                aria-label={`Select recommendation: ${a.title}`}
                tabIndex={isCreated || isExisting || generating || autoGenerating ? -1 : 0}
                aria-checked={isSelected}
                aria-disabled={isCreated || isExisting || generating || autoGenerating}
                onClick={() => !isCreated && !isExisting && !generating && !autoGenerating && toggleSelect(a.slug)}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !isCreated && !isExisting && !generating && !autoGenerating) {
                    event.preventDefault();
                    toggleSelect(a.slug);
                  }
                }}
                className={`flex flex-col gap-1 p-3 rounded-lg border text-sm transition-all select-none
                  ${isCreated ? "border-green-300 bg-green-50/60 cursor-default" :
                    isExisting ? "border-blue-200 bg-blue-50/40 cursor-default" :
                    hasError ? "border-red-200 bg-red-50/40 cursor-default" :
                    isSelected ? "border-primary bg-primary/5 cursor-pointer ring-1 ring-primary/30" :
                    "border bg-muted/20 hover:bg-muted/40 cursor-pointer"}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0">
                    {isCreated ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                     isExisting ? <CheckCircle className="h-4 w-4 text-blue-500" /> :
                     hasError ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                     <span className={`flex h-4 w-4 rounded border-2 items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                       {isSelected && <span className="block h-2 w-2 rounded-sm bg-white" />}
                     </span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight">{a.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <PriorityBadge priority={a.priority} />
                        {isAutoGen && isCreated && (
                          <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-semibold">Auto</span>
                        )}
                        {isCreated && (
                          <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                            view <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="font-mono text-xs bg-background border rounded px-1">{a.target_keyword}</span>
                      <Badge variant="outline" className="text-xs">{a.article_type}</Badge>
                      <Badge variant="outline" className="text-xs">{a.search_intent}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.reason}</p>
                    {isCreated && <p className="text-xs text-green-700 font-medium mt-0.5">Draft created — publish from the Blog tab</p>}
                    {isExisting && <p className="text-xs text-blue-700 mt-0.5">Already exists in blog</p>}
                    {hasError && <p className="text-xs text-red-600 mt-0.5">{errMsg ?? "Generation failed"}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cannibalization warnings */}
      {data.cannibalization_warnings.length > 0 && (
        <Card className="rounded-xl border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Keyword Cannibalization ({data.cannibalization_warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.cannibalization_warnings.map((w, i) => (
              <div key={i} className="text-sm p-2.5 rounded-lg border border-amber-200 bg-background space-y-1">
                <p className="font-medium">"{w.shared_keyword}"</p>
                <p className="text-xs text-muted-foreground">Posts: {w.post_slugs.join(", ")}</p>
                <p className="text-xs">{w.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Topic clusters */}
      {data.topic_clusters.length > 0 && (
        <Card className="rounded-xl">
          <button className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors" onClick={() => setClusterOpen((v) => !v)}>
            {clusterOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Topic Clusters ({data.topic_clusters.length})</span>
          </button>
          {clusterOpen && (
            <CardContent className="pt-0 border-t space-y-2">
              {data.topic_clusters.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border bg-muted/20 text-sm space-y-1">
                  <p className="font-semibold">{c.cluster_name}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Pillar: <span className="font-mono text-foreground">{c.pillar_slug ?? "missing"}</span></p>
                    <p>Supporting: {c.supporting_slugs.join(", ") || "none"}</p>
                    {c.gap && <p className="text-amber-700">Gap: {c.gap}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

function SeoOrchestrationPanel() {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<OrchestrationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "topics">("posts");
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoGenResults, setAutoGenResults] = useState<GenerationResult[]>([]);

  async function runOrchestration(mode: "analyze" | "fix") {
    if (mode === "analyze") { setLoading(true); setAutoGenResults([]); }
    else setFixing(true);

    try {
      const { data, error } = await supabase.functions.invoke("seo-orchestration", { body: { mode } });
      if (error) throw error;

      setResult(data as OrchestrationResponse);
      toast({
        title: mode === "analyze" ? "Analysis complete" : "Fixes applied",
        description: mode === "analyze"
          ? `${data.summary.posts_analyzed} posts analyzed · ${data.summary.ai_calls_made} AI call(s)`
          : `${data.summary.fixes_applied} posts updated`,
      });

      // Auto-generate top 5 articles after analysis
      if (mode === "analyze" && data.topic_gaps?.recommended_articles?.length > 0) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const top5 = [...data.topic_gaps.recommended_articles]
          .sort((a: RecommendedArticle, b: RecommendedArticle) => priorityOrder[a.priority] - priorityOrder[b.priority])
          .slice(0, 5);

        setActiveTab("topics");
        setAutoGenerating(true);
        setLoading(false);

        try {
          const { data: genRes, error: genErr } = await supabase.functions.invoke("article-generator", { body: { articles: top5 } });
          if (genErr) throw genErr;
          setAutoGenResults(genRes.results ?? []);
          toast({
            title: `${genRes.summary.created} article draft${genRes.summary.created !== 1 ? "s" : ""} auto-generated`,
            description: `Top ${top5.length} topic gaps filled · review in Blog tab`,
          });
        } catch (genErr: any) {
          toast({ title: "Auto-generation failed", description: genErr.message ?? "Unknown error", variant: "destructive" });
        } finally {
          setAutoGenerating(false);
        }
        return;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
      setFixing(false);
    }
  }

  const summary = result?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-br from-background to-muted/30 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">SEO Orchestration</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              7 AI agents — SEO quality, keyword placement, alt text, content, marketing copy, topic clusters & internal links.
              Triage runs locally; only posts with gaps use AI tokens. Top 5 topic gaps auto-generate article drafts.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => runOrchestration("analyze")} disabled={loading || fixing || autoGenerating} size="default">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing…</> : <><Play className="h-4 w-4 mr-2" /> Run Analysis + Auto-Generate</>}
          </Button>
          {result && (
            <Button variant="outline" onClick={() => runOrchestration("fix")} disabled={loading || fixing || autoGenerating}>
              {fixing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Applying…</> : <><Wrench className="h-4 w-4 mr-2" /> Apply All Fixes</>}
            </Button>
          )}
        </div>
      </div>

      {/* Summary metric cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Posts Scanned", value: summary.total_posts, icon: BarChart2, color: "text-foreground" },
            { label: "Needing Work", value: summary.posts_needing_work, icon: AlertCircle, color: "text-amber-600" },
            { label: "AI Calls", value: summary.ai_calls_made, icon: Zap, color: "text-primary" },
            { label: "Avg SEO", value: summary.avg_seo_score != null ? `${summary.avg_seo_score}/10` : "—", icon: TrendingUp, color: summary.avg_seo_score != null && summary.avg_seo_score >= 7 ? "text-green-600" : "text-amber-600" },
            { label: "Topic Gaps", value: summary.topic_gaps_found, icon: PlusCircle, color: "text-primary" },
            { label: "Cannibalization", value: summary.cannibalization_warnings, icon: AlertTriangle, color: summary.cannibalization_warnings > 0 ? "text-red-500" : "text-muted-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="rounded-xl">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Errors */}
      {result?.errors && result.errors.length > 0 && (
        <Card className="rounded-xl border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-destructive mb-2">Agent errors</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {result && (
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Post Analysis ({result.report.length})
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "topics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Topic Intelligence
            {(result.summary.topic_gaps_found > 0 || autoGenerating || autoGenResults.length > 0) && (
              <span className={`ml-1 rounded-full text-xs px-1.5 py-0.5 leading-none ${autoGenerating ? "bg-primary animate-pulse text-primary-foreground" : "bg-primary text-primary-foreground"}`}>
                {autoGenerating ? "…" : result.summary.topic_gaps_found + result.summary.cannibalization_warnings}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Post analysis tab */}
      {result?.report && result.report.length > 0 && activeTab === "posts" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            {result.report.length} post{result.report.length !== 1 ? "s" : ""} — click to expand agent details
          </p>
          {result.report.map((item) => <PostRow key={item.id} item={item} />)}
        </div>
      )}

      {/* Topic intelligence tab */}
      {result?.topic_gaps && activeTab === "topics" && (
        <TopicGapPanel data={result.topic_gaps} autoGenResults={autoGenResults} autoGenerating={autoGenerating} />
      )}

      {result?.topic_gaps == null && activeTab === "topics" && result != null && (
        <p className="text-sm text-muted-foreground text-center py-10">Topic analysis unavailable.</p>
      )}
    </div>
  );
}

export default memo(SeoOrchestrationPanel);
