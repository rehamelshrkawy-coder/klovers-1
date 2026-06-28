import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArticleSpec {
  title: string;
  slug: string;
  target_keyword: string;
  search_intent: string;
  article_type: string;
  priority: string;
  reason: string;
}

interface GeneratedArticle {
  title: string;
  slug: string;
  description: string;        // 150-160 chars, keyword-rich
  keywords: string[];         // 5-7 keywords
  content: string;            // Full markdown body
  article_type: string;
  cta_text: string;
  cta_url: string;
  seo_score: number;
}

interface GenerationResult {
  slug: string;
  title: string;
  id?: string;
  status: "created" | "exists" | "error";
  error?: string;
}

// ── Word targets per article type ─────────────────────────────────────────────

const WORD_TARGETS: Record<string, { min: number; structure: string }> = {
  howto: {
    min: 900,
    structure: `Use numbered steps (### Step 1, ### Step 2…). Include a brief intro, 6-8 steps with explanations, a tips section, and a conclusion with CTA.`,
  },
  listicle: {
    min: 1000,
    structure: `Use numbered or bulleted items with H2/H3 subheadings. Include an intro paragraph, 8-12 list items each with 2-3 sentences of explanation, and a conclusion with CTA.`,
  },
  longform: {
    min: 1400,
    structure: `Use H2 and H3 headings to organize 5-7 main sections. Include an intro, detailed body with examples, a comparison table (|col|col| format), and a conclusion with CTA.`,
  },
  news: {
    min: 500,
    structure: `Use 3-4 H2 sections. Include a lead paragraph, key facts, context, and a brief conclusion.`,
  },
  review: {
    min: 700,
    structure: `Use H2 sections for different aspects. Include a comparison table, pros/cons, and a verdict section with CTA.`,
  },
};

// ── CTA URL mapping by keyword/intent ─────────────────────────────────────────

function pickCtaUrl(keyword: string, intent: string): string {
  const k = keyword.toLowerCase();
  if (intent === "transactional" || k.includes("enroll") || k.includes("course") || k.includes("class")) return "/enroll-now";
  if (k.includes("pric") || k.includes("cost") || k.includes("fee")) return "/pricing";
  if (k.includes("test") || k.includes("level") || k.includes("beginner") || k.includes("start")) return "/placement-test";
  if (k.includes("book") || k.includes("textbook") || k.includes("alphabet") || k.includes("hangul")) return "/textbook";
  if (k.includes("course") || k.includes("learn")) return "/courses";
  return "/enroll-now";
}

// ── Compute SEO score (matches BlogManager.tsx algorithm) ─────────────────────

function computeSeoScore(article: GeneratedArticle): number {
  let score = 0;
  const kw = article.keywords[0]?.toLowerCase() ?? "";

  // Title (20 pts)
  if (article.title) {
    score += 5;
    if (article.title.length >= 30 && article.title.length <= 60) score += 10;
    if (article.title.toLowerCase().includes(kw)) score += 5;
  }

  // Description (20 pts)
  if (article.description) {
    score += 5;
    if (article.description.length >= 120 && article.description.length <= 160) score += 10;
    if (article.description.toLowerCase().includes(kw)) score += 5;
  }

  // Content (25 pts)
  const wordCount = article.content.trim().split(/\s+/).length;
  if (article.content) score += 5;
  if (wordCount >= 800) score += 15;
  if (/^#{2,3}\s/m.test(article.content)) score += 5;

  // Keywords (5 pts)
  if (article.keywords.length >= 3) score += 5;
  else if (article.keywords.length >= 1) score += 2;

  // CTA (5 pts)
  if (article.cta_text && article.cta_url) score += 5;

  return Math.min(score, 100);
}

// ── AI call ───────────────────────────────────────────────────────────────────

async function callAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) throw new Error("rate_limited");
    if (res.status === 402) throw new Error("credits_exhausted");
    throw new Error(`AI error ${res.status}: ${err.slice(0, 100)}`);
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

// ── Article generator ─────────────────────────────────────────────────────────

async function generateArticle(spec: ArticleSpec, apiKey: string): Promise<GeneratedArticle> {
  const target = WORD_TARGETS[spec.article_type] ?? WORD_TARGETS.longform;
  const ctaUrl = pickCtaUrl(spec.target_keyword, spec.search_intent);

  const prompt = `You are a senior SEO content writer for Klovers, a Korean language learning platform targeting Arabic speakers and K-drama fans (primarily Egyptian / Middle East market).

Write a complete, publish-ready blog article with the following spec:
- Title: "${spec.title}"
- Target keyword: "${spec.target_keyword}"
- Article type: ${spec.article_type}
- Search intent: ${spec.search_intent}
- Min word count: ${target.min} words
- Audience: Arabic speakers learning Korean, K-drama enthusiasts, beginners
- Structure guide: ${target.structure}

Content requirements:
- First paragraph must include the target keyword naturally
- Use Korean words with romanization in parentheses where relevant, e.g. 안녕하세요 (annyeonghaseyo)
- Include at least one Markdown table (| col | col |) unless article_type is "news"
- End with a clear call-to-action paragraph that links to ${ctaUrl}
- Write in a friendly, educational, encouraging tone
- Internal links: reference /textbook, /courses, or /placement-test naturally in the text at least once

Return ONLY a JSON object with no markdown wrapper:
{
  "title": "exact title as given",
  "slug": "${spec.slug}",
  "description": "150-160 char SEO meta description containing '${spec.target_keyword}'",
  "keywords": ["${spec.target_keyword}", "keyword2", "keyword3", "keyword4", "keyword5"],
  "content": "# Title\\n\\nFull article in Markdown (${target.min}+ words)...",
  "article_type": "${spec.article_type}",
  "cta_text": "short compelling CTA button label (max 40 chars)",
  "cta_url": "${ctaUrl}"
}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<GeneratedArticle>(raw);
  if (!parsed) throw new Error("Failed to parse AI response");

  // Ensure slug stays what we specified (AI sometimes changes it)
  parsed.slug = spec.slug;
  parsed.title = spec.title;
  parsed.seo_score = computeSeoScore(parsed);

  return parsed;
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

  let body: { articles?: ArticleSpec[] } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Request body required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const specs = body.articles ?? [];
  if (specs.length === 0 || specs.length > 5) {
    return new Response(
      JSON.stringify({ error: "Provide 1–5 articles to generate" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Check for existing slugs (avoid duplicates) ───────────────────────────
  const requestedSlugs = specs.map((s) => s.slug);
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug")
    .in("slug", requestedSlugs);

  const existingSlugs = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  // ── Generate all articles in parallel ─────────────────────────────────────
  const results: GenerationResult[] = await Promise.all(
    specs.map(async (spec): Promise<GenerationResult> => {
      if (existingSlugs.has(spec.slug)) {
        return { slug: spec.slug, title: spec.title, status: "exists" };
      }

      try {
        const article = await generateArticle(spec, apiKey);

        const { data: inserted, error } = await supabase
          .from("blog_posts")
          .insert({
            title: article.title,
            slug: article.slug,
            description: article.description,
            keywords: article.keywords,
            content: article.content,
            article_type: article.article_type,
            cta_text: article.cta_text,
            cta_url: article.cta_url,
            seo_score: article.seo_score,
            lang: "en",
            published: false,
            author: "Klovers Team",
          })
          .select("id")
          .single();

        if (error) throw new Error(error.message);

        return {
          slug: article.slug,
          title: article.title,
          id: inserted?.id,
          status: "created",
        };
      } catch (err: any) {
        return {
          slug: spec.slug,
          title: spec.title,
          status: "error",
          error: err.message,
        };
      }
    })
  );

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "exists").length;
  const failed = results.filter((r) => r.status === "error").length;

  return new Response(
    JSON.stringify({ results, summary: { created, skipped, failed } }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
