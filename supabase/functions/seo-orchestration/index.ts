import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  keywords: string[] | null;
  article_type: string | null;
  hero_image: string | null;
  hero_alt: string | null;
  hero_image_2: string | null;
  hero_alt_2: string | null;
  cta_text: string | null;
  cta_url: string | null;
  content: string | null;
  seo_score: number | null;
  lang: string | null;
}

interface AgentReport {
  id: string;
  title: string;
  slug: string;
  lang: string;
  agents_run: string[];
  seo?: SeoAgentResult;
  keyword?: KeywordAgentResult;
  alt_text?: AltTextAgentResult;
  content?: ContentAgentResult;
  marketing?: MarketingAgentResult;
  internal_links?: InternalLinkingResult;
}

// ── Portfolio-level results (not per-post) ────────────────────────────────────

interface TopicGapResult {
  recommended_articles: RecommendedArticle[];
  cannibalization_warnings: CannibalizationWarning[];
  topic_clusters: TopicCluster[];
}

interface RecommendedArticle {
  title: string;
  slug: string;
  target_keyword: string;
  search_intent: "informational" | "navigational" | "transactional";
  article_type: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface CannibalizationWarning {
  post_slugs: string[];
  shared_keyword: string;
  recommendation: string;
}

interface TopicCluster {
  cluster_name: string;
  pillar_slug: string | null;
  supporting_slugs: string[];
  gap: string | null;
}

interface InternalLinkingResult {
  links_to_posts: Array<{ target_slug: string; anchor_text: string }>;
  links_to_pages: Array<{ url: string; anchor_text: string }>;
  missing_link_score: number; // 0-10 (10 = great, 0 = no internal links)
}

interface SeoAgentResult {
  score: number; // 0-10
  top_fixes: string[];
  improved_description?: string;
}

interface KeywordAgentResult {
  primary_keyword: string;
  in_title: boolean;
  in_description: boolean;
  in_headings: boolean;
  in_intro: boolean;
  placement_score: number; // 0-10
  suggestions: string[];
}

interface AltTextAgentResult {
  alt1_score: number; // 0-10
  improved_alt1: string;
  alt2_score: number | null;
  improved_alt2: string | null;
}

interface ContentAgentResult {
  structure_score: number; // 0-10
  word_count: number;
  heading_count: number;
  suggestions: string[];
}

interface MarketingAgentResult {
  cta_score: number; // 0-10
  suggested_cta_text: string;
  suggested_cta_url: string;
  social_caption: string;
}

interface OrchestratorSummary {
  total_posts: number;
  posts_analyzed: number;
  agents_invoked: number;
  ai_calls_made: number;
  avg_seo_score: number | null;
  posts_needing_work: number;
  fixes_applied: number;
  topic_gaps_found: number;
  cannibalization_warnings: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractHeadings(markdown: string): string[] {
  return (markdown.match(/^#{2,3}\s+(.+)$/gm) || [])
    .map((h) => h.replace(/^#{2,3}\s+/, "").trim());
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function firstNChars(text: string, n: number): string {
  return text.slice(0, n);
}

async function callAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("rate_limited");
    if (res.status === 402) throw new Error("credits_exhausted");
    throw new Error(`AI error ${res.status}: ${errText.slice(0, 100)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as T;
  } catch {
    return null;
  }
}

// ── Agent: SEO Analyzer ───────────────────────────────────────────────────────
// Input: title, description, keywords[], current seo_score
// Batch: up to 5 posts per call

async function runSeoAnalyzerAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, SeoAgentResult>> {
  const results = new Map<string, SeoAgentResult>();
  if (posts.length === 0) return results;

  const input = posts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    keywords: (p.keywords ?? []).slice(0, 5),
    current_score: p.seo_score ?? 0,
  }));

  const prompt = `You are an SEO expert. Analyze these blog posts and for each one:
1. Give an overall SEO quality score (0-10)
2. List the top 3 most impactful fixes (concise, actionable)
3. Write an improved meta description (150-160 chars, keyword-rich, compelling) if the current one is weak (<120 chars or missing primary keyword)

Return ONLY a JSON array with no markdown:
[{"id":"...","score":7,"top_fixes":["...","...","..."],"improved_description":"...or null if good enough"}]

Posts:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<Array<{
    id: string; score: number; top_fixes: string[]; improved_description: string | null;
  }>>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set(item.id, {
        score: item.score,
        top_fixes: item.top_fixes ?? [],
        improved_description: item.improved_description ?? undefined,
      });
    }
  }

  return results;
}

// ── Agent: Keyword Placement ──────────────────────────────────────────────────
// Input: title, description, first 200 chars of content, h2/h3 headings

async function runKeywordAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, KeywordAgentResult>> {
  const results = new Map<string, KeywordAgentResult>();
  if (posts.length === 0) return results;

  const input = posts.map((p) => {
    const headings = extractHeadings(p.content ?? "");
    const intro = firstNChars(p.content ?? "", 200);
    return {
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      intro,
      headings,
      keywords: (p.keywords ?? []).slice(0, 3),
    };
  });

  const prompt = `You are an SEO keyword specialist. For each blog post, identify the primary keyword and check its placement.

Return ONLY a JSON array with no markdown:
[{
  "id":"...",
  "primary_keyword":"...",
  "in_title":true,
  "in_description":true,
  "in_headings":false,
  "in_intro":true,
  "placement_score":7,
  "suggestions":["Add primary keyword to an H2 heading","..."]
}]

Posts:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<KeywordAgentResult[]>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set((item as any).id, item);
    }
  }

  return results;
}

// ── Agent: Alt Text ───────────────────────────────────────────────────────────
// Input: hero_alt, hero_alt_2, title, description

async function runAltTextAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, AltTextAgentResult>> {
  const results = new Map<string, AltTextAgentResult>();
  if (posts.length === 0) return results;

  const input = posts.map((p) => ({
    id: p.id,
    title: p.title,
    description: (p.description ?? "").slice(0, 100),
    hero_alt: p.hero_alt ?? "",
    hero_alt_2: p.hero_alt_2 ?? null,
    has_image_2: !!p.hero_image_2,
  }));

  const prompt = `You are an SEO image alt text specialist. For each blog post, rate the existing alt text quality (0-10) and write improved versions (max 125 chars each, descriptive, keyword-rich, accessible).

Rules:
- Good alt text describes the image content AND includes a relevant keyword
- Score 0 for empty alt text, 1-4 for generic/short, 5-7 for adequate, 8-10 for excellent
- Only provide improved_alt2 if has_image_2 is true

Return ONLY a JSON array with no markdown:
[{
  "id":"...",
  "alt1_score":5,
  "improved_alt1":"descriptive alt text here under 125 chars",
  "alt2_score":null,
  "improved_alt2":null
}]

Posts:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<Array<{
    id: string; alt1_score: number; improved_alt1: string;
    alt2_score: number | null; improved_alt2: string | null;
  }>>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set(item.id, {
        alt1_score: item.alt1_score,
        improved_alt1: item.improved_alt1,
        alt2_score: item.alt2_score,
        improved_alt2: item.improved_alt2,
      });
    }
  }

  return results;
}

// ── Agent: Content Quality ────────────────────────────────────────────────────
// Input: word_count, heading_count, has_table, has_list, article_type (metadata only)

async function runContentQualityAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, ContentAgentResult>> {
  const results = new Map<string, ContentAgentResult>();
  if (posts.length === 0) return results;

  const input = posts.map((p) => {
    const content = p.content ?? "";
    const wordCount = countWords(content);
    const headingCount = extractHeadings(content).length;
    const hasTable = content.includes("|---|") || content.includes("| --- |");
    const hasList = /^[-*]\s|^\d+\.\s/m.test(content);
    return {
      id: p.id,
      article_type: p.article_type ?? "longform",
      word_count: wordCount,
      heading_count: headingCount,
      has_table: hasTable,
      has_list: hasList,
    };
  });

  const prompt = `You are a content quality analyst for SEO blog posts. Evaluate each post's content structure.

Expected minimums by type:
- howto: 800+ words, 4+ headings, numbered list
- listicle: 1000+ words, 3+ headings, bulleted list
- longform: 1500+ words, 5+ headings, table or list
- news: 400+ words, 2+ headings
- review: 600+ words, 3+ headings, table

Return ONLY a JSON array with no markdown:
[{
  "id":"...",
  "structure_score":7,
  "word_count":850,
  "heading_count":4,
  "suggestions":["Add a comparison table","Increase word count to 1000+"]
}]

Posts:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<Array<{
    id: string; structure_score: number; word_count: number;
    heading_count: number; suggestions: string[];
  }>>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set(item.id, {
        structure_score: item.structure_score,
        word_count: item.word_count,
        heading_count: item.heading_count,
        suggestions: item.suggestions ?? [],
      });
    }
  }

  return results;
}

// ── Agent: Marketing Copy ─────────────────────────────────────────────────────
// Input: article_type, title, description, top 3 keywords

async function runMarketingAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, MarketingAgentResult>> {
  const results = new Map<string, MarketingAgentResult>();
  if (posts.length === 0) return results;

  const input = posts.map((p) => ({
    id: p.id,
    article_type: p.article_type ?? "longform",
    title: p.title,
    description: (p.description ?? "").slice(0, 120),
    keywords: (p.keywords ?? []).slice(0, 3),
    current_cta_text: p.cta_text ?? "",
    current_cta_url: p.cta_url ?? "",
  }));

  const prompt = `You are a conversion copywriter for a Korean language learning platform (Klovers).
For each blog post, suggest:
1. A compelling CTA button text (max 40 chars, action-oriented)
2. The best CTA URL from: /enroll-now, /courses, /pricing, /placement-test, /textbook
3. A social media caption for Instagram/Facebook (max 200 chars, includes 2-3 hashtags)
4. A CTA quality score (0-10) based on current cta_text and cta_url

Return ONLY a JSON array with no markdown:
[{
  "id":"...",
  "cta_score":4,
  "suggested_cta_text":"Start Learning Free Today",
  "suggested_cta_url":"/placement-test",
  "social_caption":"Discover the secret to learning Korean fast! 🇰🇷 Our step-by-step guide makes Hangul easy. #LearnKorean #KoreanAlphabet #Klovers"
}]

Posts:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<Array<{
    id: string; cta_score: number; suggested_cta_text: string;
    suggested_cta_url: string; social_caption: string;
  }>>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set(item.id, {
        cta_score: item.cta_score,
        suggested_cta_text: item.suggested_cta_text,
        suggested_cta_url: item.suggested_cta_url,
        social_caption: item.social_caption,
      });
    }
  }

  return results;
}

// ── Agent: Topic Cluster (portfolio-level, 1 AI call for all posts) ───────────
// Analyzes the full content portfolio at once to find gaps, overlaps, clusters

async function runTopicClusterAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<TopicGapResult | null> {
  if (posts.length === 0) return null;

  // Only English posts for topic gap analysis (Arabic are translations)
  const enPosts = posts.filter((p) => p.lang === "en");

  const input = enPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    keywords: (p.keywords ?? []).slice(0, 4),
    article_type: p.article_type ?? "longform",
    headings: extractHeadings(p.content ?? "").slice(0, 5),
  }));

  const prompt = `You are an SEO content strategist for Klovers, a Korean language learning platform targeting Arabic speakers and K-drama fans (primarily Egyptian/Middle East market).

Analyze this existing blog portfolio and provide:

1. **recommended_articles**: 6 high-value articles the site is MISSING. Focus on:
   - High-search-volume Korean learning topics for Arabic/Egyptian learners
   - K-drama and K-pop adjacent content
   - TOPIK exam preparation
   - Korean culture and travel
   - Topics that fill clear gaps in the current portfolio

2. **cannibalization_warnings**: Any 2 posts that target the same keyword and compete with each other (if any found)

3. **topic_clusters**: Group existing posts into 3-4 thematic clusters. For each cluster, identify the pillar post (or null if missing) and note any content gap

Return ONLY a JSON object with no markdown:
{
  "recommended_articles": [{
    "title": "...",
    "slug": "...",
    "target_keyword": "...",
    "search_intent": "informational",
    "article_type": "howto",
    "priority": "high",
    "reason": "..."
  }],
  "cannibalization_warnings": [{
    "post_slugs": ["slug1","slug2"],
    "shared_keyword": "...",
    "recommendation": "..."
  }],
  "topic_clusters": [{
    "cluster_name": "...",
    "pillar_slug": "...",
    "supporting_slugs": ["..."],
    "gap": "..."
  }]
}

Existing articles:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  return parseJSON<TopicGapResult>(raw);
}

// ── Agent: Internal Linking (all posts in one call) ───────────────────────────
// For each post, suggests 2-3 links to other posts and 1-2 links to core pages

async function runInternalLinkingAgent(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, InternalLinkingResult>> {
  const results = new Map<string, InternalLinkingResult>();
  if (posts.length === 0) return results;

  // Build compact index: slug → title + first heading
  const index = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    first_heading: extractHeadings(p.content ?? "")[0] ?? "",
    keywords: (p.keywords ?? []).slice(0, 2),
  }));

  // For each post, check existing links in content (rough check)
  const input = posts.map((p) => {
    const content = p.content ?? "";
    const existingLinks = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? []).length;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      existing_link_count: existingLinks,
      intro: firstNChars(content, 150),
    };
  });

  const prompt = `You are an internal linking SEO specialist for Klovers, a Korean language learning platform.

Given the article index and per-post data, suggest internal links for each post:
- 2-3 links to OTHER posts in the index (use exact slugs)
- 1-2 links to core site pages: /courses, /textbook, /placement-test, /pricing, /enroll-now
- Anchor text must be natural and contextual (not "click here")
- Score missing_link_score: 0-10 where 10 = article has great internal linking, 0 = no links at all

Boost connectivity: posts about alphabet/hangul should link to textbook; grammar posts to courses; K-drama posts to other K-drama content.

Article index:
${JSON.stringify(index)}

Per-post analysis:
${JSON.stringify(input)}

Return ONLY a JSON array with no markdown:
[{
  "id":"...",
  "missing_link_score":4,
  "links_to_posts":[
    {"target_slug":"korean-grammar-sentence-structure","anchor_text":"Korean sentence structure guide"},
    {"target_slug":"topik-exam-guide-2025","anchor_text":"prepare for the TOPIK exam"}
  ],
  "links_to_pages":[
    {"url":"/placement-test","anchor_text":"take our free placement test"},
    {"url":"/textbook","anchor_text":"our free Korean textbook"}
  ]
}]`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<Array<{
    id: string;
    missing_link_score: number;
    links_to_posts: Array<{ target_slug: string; anchor_text: string }>;
    links_to_pages: Array<{ url: string; anchor_text: string }>;
  }>>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set(item.id, {
        missing_link_score: item.missing_link_score,
        links_to_posts: item.links_to_posts ?? [],
        links_to_pages: item.links_to_pages ?? [],
      });
    }
  }

  return results;
}

// ── Triage: decide which agents to run per post (zero AI cost) ────────────────

interface TriageResult {
  needsSeo: boolean;
  needsKeyword: boolean;
  needsAltText: boolean;
  needsContent: boolean;
  needsMarketing: boolean;
  needsInternalLinks: boolean;
}

function triagePost(post: BlogPost): TriageResult {
  const keywords = post.keywords ?? [];
  const primaryKeyword = keywords[0] ?? "";
  const titleLower = post.title.toLowerCase();
  const keywordInTitle = primaryKeyword
    ? titleLower.includes(primaryKeyword.toLowerCase())
    : true;

  const wordCount = countWords(post.content ?? "");

  // Check for existing internal links in content (rough heuristic)
  const content = post.content ?? "";
  const linkMatches = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? []).length;

  return {
    needsSeo: (post.seo_score ?? 0) < 70,
    needsKeyword: !keywordInTitle || keywords.length < 3,
    needsAltText:
      !post.hero_alt ||
      post.hero_alt.trim().length < 10 ||
      (!!post.hero_image_2 && (!post.hero_alt_2 || post.hero_alt_2.trim().length < 10)),
    needsContent: wordCount < 800,
    needsMarketing: !post.cta_text || !post.cta_url,
    needsInternalLinks: linkMatches < 2,
  };
}

// ── Batch helper: chunk array into groups of N ────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authorization = await authorizeRequest(req, "admin");
  if (!authorization.ok) return authorizationError(authorization, corsHeaders);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { mode?: string; target?: string; post_ids?: string[] } = {};
  try {
    body = await req.json();
  } catch { /* no body = analyze all blog */ }

  const mode = body.mode ?? "analyze"; // "analyze" | "fix"
  const postIds: string[] | undefined = body.post_ids;

  // ── 1. Fetch posts ──────────────────────────────────────────────────────────
  let query = supabase
    .from("blog_posts")
    .select(
      "id,title,slug,description,keywords,article_type,hero_image,hero_alt,hero_image_2,hero_alt_2,cta_text,cta_url,content,seo_score,lang"
    )
    .eq("published", true);

  if (postIds && postIds.length > 0) {
    query = query.in("id", postIds);
  }

  const { data: posts, error: fetchError } = await query;
  if (fetchError) {
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!posts || posts.length === 0) {
    return new Response(
      JSON.stringify({ error: "No published posts found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── 2. Local triage (zero AI cost) ─────────────────────────────────────────
  const triageMap = new Map<string, TriageResult>();
  const seoQueue: BlogPost[] = [];
  const keywordQueue: BlogPost[] = [];
  const altTextQueue: BlogPost[] = [];
  const contentQueue: BlogPost[] = [];
  const marketingQueue: BlogPost[] = [];
  const internalLinkQueue: BlogPost[] = [];

  for (const post of posts as BlogPost[]) {
    const t = triagePost(post);
    triageMap.set(post.id, t);
    if (t.needsSeo) seoQueue.push(post);
    if (t.needsKeyword) keywordQueue.push(post);
    if (t.needsAltText) altTextQueue.push(post);
    if (t.needsContent) contentQueue.push(post);
    if (t.needsMarketing) marketingQueue.push(post);
    if (t.needsInternalLinks) internalLinkQueue.push(post);
  }

  // ── 3. Run agents in parallel batches (max 5 posts per AI call) ─────────────
  const BATCH = 5;
  let aiCallsMade = 0;

  const seoResults = new Map<string, SeoAgentResult>();
  const keywordResults = new Map<string, KeywordAgentResult>();
  const altTextResults = new Map<string, AltTextAgentResult>();
  const contentResults = new Map<string, ContentAgentResult>();
  const marketingResults = new Map<string, MarketingAgentResult>();
  const internalLinkResults = new Map<string, InternalLinkingResult>();

  const errors: string[] = [];

  // Helper: run batched agent with error isolation
  async function runBatched<T>(
    queue: BlogPost[],
    agentFn: (batch: BlogPost[], apiKey: string) => Promise<Map<string, T>>,
    targetMap: Map<string, T>,
    agentName: string
  ) {
    for (const batch of chunk(queue, BATCH)) {
      try {
        const res = await agentFn(batch, apiKey!);
        aiCallsMade++;
        for (const [id, val] of res) targetMap.set(id, val);
      } catch (err: any) {
        errors.push(`${agentName}: ${err.message}`);
      }
    }
  }

  // Internal linking agent: pass ALL posts as context (single call), returns per-post results
  async function runInternalLinking() {
    if (internalLinkQueue.length === 0) return;
    try {
      const res = await runInternalLinkingAgent(posts as BlogPost[], apiKey!);
      aiCallsMade++;
      for (const [id, val] of res) internalLinkResults.set(id, val);
    } catch (err: any) {
      errors.push(`InternalLinking: ${err.message}`);
    }
  }

  // Topic cluster: single portfolio-level call (always run)
  let topicGapResult: TopicGapResult | null = null;
  async function runTopicCluster() {
    try {
      topicGapResult = await runTopicClusterAgent(posts as BlogPost[], apiKey!);
      aiCallsMade++;
    } catch (err: any) {
      errors.push(`TopicCluster: ${err.message}`);
    }
  }

  await Promise.all([
    runBatched(seoQueue, runSeoAnalyzerAgent, seoResults, "SeoAnalyzer"),
    runBatched(keywordQueue, runKeywordAgent, keywordResults, "KeywordAgent"),
    runBatched(altTextQueue, runAltTextAgent, altTextResults, "AltTextAgent"),
    runBatched(contentQueue, runContentQualityAgent, contentResults, "ContentAgent"),
    runBatched(marketingQueue, runMarketingAgent, marketingResults, "MarketingAgent"),
    runInternalLinking(),
    runTopicCluster(),
  ]);

  // ── 4. Assemble report ──────────────────────────────────────────────────────
  const report: AgentReport[] = (posts as BlogPost[]).map((post) => {
    const t = triageMap.get(post.id)!;
    const agentsRun: string[] = [];
    if (t.needsSeo && seoResults.has(post.id)) agentsRun.push("seo");
    if (t.needsKeyword && keywordResults.has(post.id)) agentsRun.push("keyword");
    if (t.needsAltText && altTextResults.has(post.id)) agentsRun.push("alt_text");
    if (t.needsContent && contentResults.has(post.id)) agentsRun.push("content");
    if (t.needsMarketing && marketingResults.has(post.id)) agentsRun.push("marketing");
    if (t.needsInternalLinks && internalLinkResults.has(post.id)) agentsRun.push("internal_links");

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      lang: post.lang ?? "en",
      agents_run: agentsRun,
      seo: seoResults.get(post.id),
      keyword: keywordResults.get(post.id),
      alt_text: altTextResults.get(post.id),
      content: contentResults.get(post.id),
      marketing: marketingResults.get(post.id),
      internal_links: internalLinkResults.get(post.id),
    };
  });

  // ── 5. Apply fixes if mode="fix" ────────────────────────────────────────────
  let fixesApplied = 0;

  if (mode === "fix") {
    for (const item of report) {
      const updates: Record<string, unknown> = {};

      if (item.alt_text?.improved_alt1 && item.alt_text.alt1_score < 8) {
        updates.hero_alt = item.alt_text.improved_alt1;
      }
      if (item.alt_text?.improved_alt2 && (item.alt_text.alt2_score ?? 0) < 8) {
        updates.hero_alt_2 = item.alt_text.improved_alt2;
      }
      if (item.seo?.improved_description) {
        updates.description = item.seo.improved_description;
      }
      if (item.marketing?.suggested_cta_text) {
        updates.cta_text = item.marketing.suggested_cta_text;
      }
      if (item.marketing?.suggested_cta_url) {
        updates.cta_url = item.marketing.suggested_cta_url;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("blog_posts")
          .update(updates)
          .eq("id", item.id);
        if (!error) fixesApplied++;
      }
    }
  }

  // ── 6. Summary ──────────────────────────────────────────────────────────────
  const postsWithSeoScore = report.filter((r) => r.seo?.score != null);
  const avgSeoScore =
    postsWithSeoScore.length > 0
      ? Math.round(
          postsWithSeoScore.reduce((sum, r) => sum + (r.seo?.score ?? 0), 0) /
            postsWithSeoScore.length
        )
      : null;

  const summary: OrchestratorSummary = {
    total_posts: posts.length,
    posts_analyzed: report.filter((r) => r.agents_run.length > 0).length,
    agents_invoked:
      (seoQueue.length > 0 ? 1 : 0) +
      (keywordQueue.length > 0 ? 1 : 0) +
      (altTextQueue.length > 0 ? 1 : 0) +
      (contentQueue.length > 0 ? 1 : 0) +
      (marketingQueue.length > 0 ? 1 : 0) +
      (internalLinkQueue.length > 0 ? 1 : 0) +
      1, // topic cluster always runs
    ai_calls_made: aiCallsMade,
    avg_seo_score: avgSeoScore,
    posts_needing_work: report.filter((r) => r.agents_run.length > 0).length,
    fixes_applied: fixesApplied,
    topic_gaps_found: topicGapResult?.recommended_articles?.length ?? 0,
    cannibalization_warnings: topicGapResult?.cannibalization_warnings?.length ?? 0,
  };

  return new Response(
    JSON.stringify({
      summary,
      report,
      topic_gaps: topicGapResult,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
