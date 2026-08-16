import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sun, Clapperboard, Brain, Play, Loader2, CheckCircle2, AlertCircle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRICULUM_STATS } from "@/constants/koreanCurriculum";

// ─── Orchestra sections ────────────────────────────────────────────────
const ORCHESTRA_SECTIONS = [
  { key: "vocabulary", emoji: "🎹", name: "Vocabulary Maestro", nameKo: "어휘 명인", desc: "12–18 words with romanization, part-of-speech, SRS hints" },
  { key: "grammar", emoji: "🎸", name: "Grammar Architect", nameKo: "문법 건축가", desc: "3–5 patterns with formal/informal forms & common mistakes" },
  { key: "pronunciation", emoji: "🎻", name: "Pronunciation Coach", nameKo: "발음 코치", desc: "Batchim rules, liaison (연음), minimal pairs" },
  { key: "dialogue", emoji: "🎤", name: "Conversation Director", nameKo: "대화 감독", desc: "8–14 line realistic multi-turn dialogue" },
  { key: "reading", emoji: "📖", name: "Reading Analyst", nameKo: "독해 분석가", desc: "Short + extended level-appropriate reading passages" },
  { key: "cultural", emoji: "🌸", name: "Cultural Contextualist", nameKo: "문화 맥락가", desc: "Honorifics, social customs, Confucian context notes" },
  { key: "professional", emoji: "👔", name: "Professional Expert", nameKo: "전문어 전문가", desc: "Business / academic language — TOPIK 4–6 only" },
] as const;

const BOOKS = [
  { key: "all", label: "All Books", icon: BookOpen },
  { key: "korean-1", label: "Korean Textbook", icon: BookOpen },
  { key: "daily-routine", label: "Daily Routine", icon: Sun },
  { key: "kdrama", label: "K-Drama Korean", icon: Clapperboard },
  { key: "grammar-mastery", label: "Grammar Mastery", icon: Brain },
] as const;

const LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "0", label: "Foundation (Hangul)" },
  { value: "1", label: "Level 1 — TOPIK 1 / A1" },
  { value: "2", label: "Level 2 — TOPIK 2 / A2" },
  { value: "3", label: "Level 3 — TOPIK 3 / B1" },
  { value: "4", label: "Level 4 — TOPIK 4 / B2" },
  { value: "5", label: "Level 5 — TOPIK 5 / C1" },
  { value: "6", label: "Level 6 — TOPIK 6 / C2" },
];

type SectionStatus = "idle" | "running" | "done" | "error";
type SeedStatus = "idle" | "running" | "done" | "error";

interface OrchestraResult {
  lesson_id: number;
  title: string;
  sections: string[];
  error?: string;
}

interface SeedResult {
  inserted?: number;
  total?: number;
  by_book?: Record<string, number>;
  dry_run?: boolean;
  error?: string;
}

export default function KoreanOrchestrator() {
  const [selectedBook, setSelectedBook] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [batchSize, setBatchSize] = useState<string>("1");

  const [seedStatus, setSeedStatus] = useState<SeedStatus>("idle");
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);

  const [orchestraStatus, setOrchestraStatus] = useState<SectionStatus>("idle");
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({});
  const [orchestraResults, setOrchestraResults] = useState<OrchestraResult[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  // ─── Seed lessons ──────────────────────────────────────────────────
  const handleSeed = async (dryRun = false) => {
    setSeedStatus("running");
    setSeedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("seed-textbook-lessons", {
        body: {
          book: selectedBook === "all" ? undefined : selectedBook,
          dry_run: dryRun,
        },
      });
      if (error) throw error;
      setSeedResult(data as SeedResult);
      setSeedStatus("done");
    } catch (err: any) {
      setSeedResult({ error: err.message });
      setSeedStatus("error");
    }
  };

  // ─── Run orchestra ─────────────────────────────────────────────────
  const handleOrchestrate = async () => {
    setOrchestraStatus("running");
    setOrchestraResults([]);
    setProcessedCount(0);

    // Mark all sections as running
    const initStatuses: Record<string, SectionStatus> = {};
    ORCHESTRA_SECTIONS.forEach((s) => { initStatuses[s.key] = "running"; });
    setSectionStatuses(initStatuses);

    try {
      const limit = parseInt(batchSize, 10);
      const body: Record<string, unknown> = { limit };
      if (selectedBook !== "all") body.book = selectedBook;
      if (selectedLevel !== "all") body.topik_level = parseInt(selectedLevel, 10);

      const { data, error } = await supabase.functions.invoke("orchestrate-korean-analysis", { body });
      if (error) throw error;

      const resp = data as { lessons_processed: number; remaining: number; results: OrchestraResult[] };
      setOrchestraResults(resp.results ?? []);
      setProcessedCount(resp.lessons_processed ?? 0);
      setTotalToProcess(resp.remaining ?? 0);

      // Update section statuses based on results
      const sectionDone = new Set<string>();
      const sectionError = new Set<string>();
      (resp.results ?? []).forEach((r) => {
        if (r.error) { ORCHESTRA_SECTIONS.forEach((s) => sectionError.add(s.key)); }
        else { r.sections.forEach((s) => sectionDone.add(s)); }
      });

      const updated: Record<string, SectionStatus> = {};
      ORCHESTRA_SECTIONS.forEach((s) => {
        updated[s.key] = sectionError.has(s.key) ? "error" : sectionDone.has(s.key) ? "done" : "idle";
      });
      setSectionStatuses(updated);
      setOrchestraStatus("done");
    } catch (err: any) {
      const errStatuses: Record<string, SectionStatus> = {};
      ORCHESTRA_SECTIONS.forEach((s) => { errStatuses[s.key] = "error"; });
      setSectionStatuses(errStatuses);
      setOrchestraStatus("error");
      setOrchestraResults([{ lesson_id: 0, title: "Error", sections: [], error: err.message }]);
    }
  };

  const sectionStatusIcon = (status: SectionStatus) => {
    if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary-text" />;
    if (status === "done") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <span className="h-4 w-4 rounded-full bg-muted inline-block" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          🎼 Korean Language Orchestra
        </h1>
        <p className="text-muted-foreground mt-1">
          Seed all {CURRICULUM_STATS.totalLessons} lesson shells, then conduct 7 AI specialists to generate PhD-quality content.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(CURRICULUM_STATS.byBook).map(([book, count]) => (
          <Card key={book} className="text-center p-4">
            <p className="text-2xl font-bold text-primary-text">{count}</p>
            <p className="text-xs text-muted-foreground">{book}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="seed">
        <TabsList className="mb-6">
          <TabsTrigger value="seed">🌱 Step 1 — Seed Lessons</TabsTrigger>
          <TabsTrigger value="orchestrate">🎼 Step 2 — Run Orchestra</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: SEED ─── */}
        <TabsContent value="seed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-500" />
                Seed Lesson Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Inserts all lesson records (title, emoji, sort_order, TOPIK level) into{" "}
                <code className="bg-muted px-1 rounded text-xs">textbook_lessons</code>. Safe to run multiple times — uses upsert.
              </p>

              <div className="flex flex-wrap gap-3">
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKS.map((b) => (
                      <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSeed(true)}
                  disabled={seedStatus === "running"}
                >
                  {seedStatus === "running" ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
                  Dry Run (Preview)
                </Button>
                <Button
                  onClick={() => handleSeed(false)}
                  disabled={seedStatus === "running"}
                  className="gap-2"
                >
                  {seedStatus === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-4 w-4" />}
                  Seed Lessons
                </Button>
              </div>

              {seedResult && (
                <div className={cn(
                  "rounded-lg border p-4 text-sm",
                  seedStatus === "done" ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
                )}>
                  {seedResult.error ? (
                    <p className="text-destructive font-semibold">{seedResult.error}</p>
                  ) : seedResult.dry_run ? (
                    <div>
                      <p className="font-semibold mb-2">Dry run — would insert {seedResult.total} lessons:</p>
                      {Object.entries(seedResult.by_book ?? {}).map(([b, n]) => (
                        <p key={b} className="text-muted-foreground">{b}: {n} lessons</p>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-green-600">✓ Inserted {seedResult.inserted} lessons</p>
                      {Object.entries(seedResult.by_book ?? {}).map(([b, n]) => (
                        <p key={b} className="text-muted-foreground">{b}: {n}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: ORCHESTRATE ─── */}
        <TabsContent value="orchestrate">
          <div className="space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>🎼 Orchestra Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Book" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOKS.map((b) => (
                        <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={batchSize} onValueChange={setBatchSize}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 lesson</SelectItem>
                      <SelectItem value="2">2 lessons</SelectItem>
                      <SelectItem value="3">3 lessons</SelectItem>
                      <SelectItem value="5">5 lessons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleOrchestrate}
                  disabled={orchestraStatus === "running"}
                  size="lg"
                  className="gap-2"
                >
                  {orchestraStatus === "running"
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Play className="h-5 w-5" />}
                  {orchestraStatus === "running" ? "Conducting…" : "Conduct Orchestra"}
                </Button>

                {processedCount > 0 && (
                  <div>
                    <Progress value={processedCount / (processedCount + totalToProcess) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {processedCount} processed · {totalToProcess} remaining
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orchestra sections */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ORCHESTRA_SECTIONS.map((section) => {
                const status = sectionStatuses[section.key] ?? "idle";
                return (
                  <Card
                    key={section.key}
                    className={cn(
                      "transition-all",
                      status === "done" && "border-green-500/40 bg-green-500/5",
                      status === "error" && "border-destructive/40 bg-destructive/5",
                      status === "running" && "border-primary/40 bg-primary/5 animate-pulse",
                    )}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-3xl">{section.emoji}</span>
                        {sectionStatusIcon(status)}
                      </div>
                      <p className="font-bold text-sm text-foreground">{section.name}</p>
                      <p className="text-xs text-primary-text font-medium mb-1">{section.nameKo}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{section.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Results */}
            {orchestraResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {orchestraResults.map((r, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between rounded-lg border p-3 text-sm",
                      r.error ? "border-destructive/20 bg-destructive/5" : "border-border"
                    )}>
                      <div>
                        <p className="font-medium text-foreground">{r.title}</p>
                        {r.error ? (
                          <p className="text-destructive text-xs">{r.error}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.sections.map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {r.error
                        ? <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        : <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
