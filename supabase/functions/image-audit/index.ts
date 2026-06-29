import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  lang: string | null;
  published: boolean;
  hero_image: string | null;
  hero_alt: string | null;
  hero_image_2: string | null;
  hero_alt_2: string | null;
  keywords: string[] | null;
}

type IssueCode =
  | "missing_hero_image"
  | "missing_hero_alt"
  | "hero_alt_too_short"
  | "missing_hero_alt_2"
  | "hero_alt_2_too_short"
  | "lang_mismatch_alt1"   // alt text is in wrong language
  | "lang_mismatch_alt2"
  | "hero_alt_not_descriptive"; // caught by AI

interface ImageIssue {
  code: IssueCode;
  field: "hero_image" | "hero_alt" | "hero_image_2" | "hero_alt_2";
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
  ai_alt1?: string | null;  // AI-generated alt text for hero_image
  ai_alt2?: string | null;  // AI-generated alt text for hero_image_2
  issue_count: number;
  status: "ok" | "warning" | "error";
}

interface ParityGroup {
  slug_base: string;           // EN slug (or AR slug with -ar stripped)
  hero_image_en: string | null;
  hero_image_ar: string | null;
  images_match: boolean;
  posts: Array<{
    id: string;
    slug: string;
    lang: string;
    has_alt: boolean;
    has_alt_correct_lang: boolean;
    published: boolean;
    hero_image: string | null;
  }>;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function hasArabicChars(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

function isAltMissingOrShort(alt: string | null, minLen = 10): boolean {
  return !alt || alt.trim().length < minLen;
}

function langLabel(lang: string | null): string {
  return (lang ?? "en").toLowerCase();
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

// ── Zero-AI triage ────────────────────────────────────────────────────────────

function auditPost(post: BlogPost): ImageIssue[] {
  const issues: ImageIssue[] = [];
  const lang = langLabel(post.lang);

  // ── Hero image 1 ──────────────────────────────────────────────────────────
  if (!post.hero_image || post.hero_image.trim() === "") {
    issues.push({
      code: "missing_hero_image",
      field: "hero_image",
      current_value: null,
      severity: "error",
      message: "No hero image set — required for SEO and social sharing.",
    });
  } else {
    // Image exists — check alt text
    if (!post.hero_alt || post.hero_alt.trim() === "") {
      issues.push({
        code: "missing_hero_alt",
        field: "hero_alt",
        current_value: null,
        severity: "error",
        message: "Hero image present but alt text is empty.",
      });
    } else if (post.hero_alt.trim().length < 10) {
      issues.push({
        code: "hero_alt_too_short",
        field: "hero_alt",
        current_value: post.hero_alt,
        severity: "warning",
        message: `Alt text too short (${post.hero_alt.trim().length} chars, min 10).`,
      });
    } else {
      // Check language match
      const altHasArabic = hasArabicChars(post.hero_alt);
      if (lang === "ar" && !altHasArabic) {
        issues.push({
          code: "lang_mismatch_alt1",
          field: "hero_alt",
          current_value: post.hero_alt,
          severity: "error",
          message: "Arabic post has non-Arabic alt text — needs translation.",
        });
      } else if (lang === "en" && altHasArabic) {
        issues.push({
          code: "lang_mismatch_alt1",
          field: "hero_alt",
          current_value: post.hero_alt,
          severity: "error",
          message: "English post has Arabic characters in alt text — wrong language.",
        });
      }
    }
  }

  // ── Hero image 2 ──────────────────────────────────────────────────────────
  if (post.hero_image_2 && post.hero_image_2.trim() !== "") {
    if (!post.hero_alt_2 || post.hero_alt_2.trim() === "") {
      issues.push({
        code: "missing_hero_alt_2",
        field: "hero_alt_2",
        current_value: null,
        severity: "error",
        message: "Second image present but alt text is empty.",
      });
    } else if (post.hero_alt_2.trim().length < 10) {
      issues.push({
        code: "hero_alt_2_too_short",
        field: "hero_alt_2",
        current_value: post.hero_alt_2,
        severity: "warning",
        message: `Second image alt text too short (${post.hero_alt_2.trim().length} chars, min 10).`,
      });
    } else {
      const alt2HasArabic = hasArabicChars(post.hero_alt_2);
      if (lang === "ar" && !alt2HasArabic) {
        issues.push({
          code: "lang_mismatch_alt2",
          field: "hero_alt_2",
          current_value: post.hero_alt_2,
          severity: "error",
          message: "Arabic post second image has non-Arabic alt text.",
        });
      } else if (lang === "en" && alt2HasArabic) {
        issues.push({
          code: "lang_mismatch_alt2",
          field: "hero_alt_2",
          current_value: post.hero_alt_2,
          severity: "error",
          message: "English post second image has Arabic alt text — wrong language.",
        });
      }
    }
  }

  return issues;
}

// ── AI Alt Text Generator ─────────────────────────────────────────────────────
// Batch-generates correct-language alt text for posts with missing/wrong alt

async function generateAltText(
  posts: BlogPost[],
  apiKey: string
): Promise<Map<string, { alt1: string | null; alt2: string | null }>> {
  const results = new Map<string, { alt1: string | null; alt2: string | null }>();
  if (posts.length === 0) return results;

  const input = posts.map((p) => ({
    id: p.id,
    title: p.title,
    description: (p.description ?? "").slice(0, 100),
    lang: langLabel(p.lang),
    keywords: (p.keywords ?? []).slice(0, 3),
    has_image_2: !!(p.hero_image_2 && p.hero_image_2.trim()),
    current_alt1: p.hero_alt ?? "",
    current_alt2: p.hero_alt_2 ?? "",
  }));

  const prompt = `You are an SEO image alt text specialist. Generate correct alt text for blog post hero images.

CRITICAL RULES:
- If lang="ar": write alt text IN ARABIC (use Arabic script, not transliteration)
- If lang="en": write alt text IN ENGLISH
- Max 125 characters per alt text
- Include the primary keyword naturally
- Describe the image content based on the article topic
- Only generate alt2 if has_image_2 is true

Return ONLY a JSON array with no markdown:
[{
  "id":"...",
  "alt1":"النص البديل بالعربي هنا",
  "alt2":null
}]

Posts needing alt text:
${JSON.stringify(input)}`;

  const raw = await callAI(apiKey, prompt);
  const parsed = parseJSON<Array<{ id: string; alt1: string; alt2: string | null }>>(raw);

  if (parsed) {
    for (const item of parsed) {
      results.set(item.id, { alt1: item.alt1 ?? null, alt2: item.alt2 ?? null });
    }
  }

  return results;
}

// ── Bilingual parity analysis ──────────────────────────────────────────────────
// Groups posts by slug convention: EN slug "X" pairs with AR slug "X-ar"

function buildParityGroups(
  posts: BlogPost[],
  auditMap: Map<string, ImageIssue[]>
): ParityGroup[] {
  function toParityPost(p: BlogPost) {
    const issues = auditMap.get(p.id) ?? [];
    return {
      id: p.id,
      slug: p.slug,
      lang: langLabel(p.lang),
      has_alt: !isAltMissingOrShort(p.hero_alt),
      has_alt_correct_lang: !issues.some(
        (i) => i.code === "lang_mismatch_alt1" || i.code === "missing_hero_alt" || i.code === "hero_alt_too_short"
      ),
      published: p.published,
      hero_image: p.hero_image,
    };
  }

  // Build slug→post maps
  const enBySlug = new Map<string, BlogPost>();
  const arBySlug = new Map<string, BlogPost>();

  for (const post of posts) {
    const lang = langLabel(post.lang);
    if (lang === "en") enBySlug.set(post.slug, post);
    else if (lang === "ar") arBySlug.set(post.slug, post);
  }

  const groups: ParityGroup[] = [];
  const consumedArSlugs = new Set<string>();

  // 1. For each EN post, look for AR counterpart with slug "X-ar"
  for (const [enSlug, enPost] of enBySlug) {
    const arSlug = `${enSlug}-ar`;
    const arPost = arBySlug.get(arSlug);

    const postEntries = [toParityPost(enPost)];
    if (arPost) {
      postEntries.push(toParityPost(arPost));
      consumedArSlugs.add(arSlug);
    }

    const hasAr = !!arPost;
    const imagesMatch = hasAr
      ? (enPost.hero_image ?? "") === (arPost!.hero_image ?? "")
      : false;

    const missingLangs: string[] = [];
    if (!hasAr) missingLangs.push("ar");

    const isComplete =
      hasAr &&
      postEntries.every((p) => p.has_alt && p.has_alt_correct_lang && p.published);

    groups.push({
      slug_base: enSlug,
      hero_image_en: enPost.hero_image,
      hero_image_ar: arPost?.hero_image ?? null,
      images_match: imagesMatch,
      posts: postEntries,
      has_en: true,
      has_ar: hasAr,
      is_complete: isComplete,
      missing_langs: missingLangs,
      match_method: "slug",
      debug: {
        en_slug_searched: enSlug,
        ar_slug_searched: arSlug,
        counterpart_found: hasAr,
      },
    });
  }

  // 2. Remaining AR posts not yet consumed
  for (const [arSlug, arPost] of arBySlug) {
    if (consumedArSlugs.has(arSlug)) continue;

    const hasArSuffix = arSlug.endsWith("-ar");
    const slugBase = hasArSuffix ? arSlug.replace(/-ar$/, "") : arSlug;
    const enSlugSearched = hasArSuffix ? slugBase : null;

    groups.push({
      slug_base: slugBase,
      hero_image_en: null,
      hero_image_ar: arPost.hero_image,
      images_match: false,
      posts: [toParityPost(arPost)],
      has_en: false,
      has_ar: true,
      is_complete: false,
      missing_langs: ["en"],
      match_method: hasArSuffix ? "slug" : "standalone_ar",
      debug: {
        en_slug_searched: enSlugSearched,
        ar_slug_searched: arSlug,
        counterpart_found: false,
      },
    });
  }

  groups.sort((a, b) => Number(a.is_complete) - Number(b.is_complete));
  return groups;
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

  let body: { mode?: string; post_ids?: string[] } = {};
  try {
    body = await req.json();
  } catch { /* no body */ }

  const mode = body.mode ?? "analyze"; // "analyze" | "fix"
  const postIds: string[] | undefined = body.post_ids;

  // ── 1. Fetch ALL posts (published + drafts) ─────────────────────────────────
  let query = supabase
    .from("blog_posts")
    .select("id,title,slug,description,lang,published,hero_image,hero_alt,hero_image_2,hero_alt_2,keywords")
    .order("lang")
    .order("title");

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
      JSON.stringify({ error: "No posts found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── 2. Zero-AI triage ───────────────────────────────────────────────────────
  const auditMap = new Map<string, ImageIssue[]>();
  const needsAiAlt: BlogPost[] = [];

  for (const post of posts as BlogPost[]) {
    const issues = auditPost(post);
    auditMap.set(post.id, issues);

    const needsAlt =
      issues.some((i) =>
        ["missing_hero_alt", "hero_alt_too_short", "lang_mismatch_alt1",
         "missing_hero_alt_2", "hero_alt_2_too_short", "lang_mismatch_alt2"].includes(i.code)
      ) && !!post.hero_image;

    if (needsAlt) needsAiAlt.push(post);
  }

  // ── 3. AI alt text generation (batched, max 5 per call) ─────────────────────
  const BATCH = 5;
  const aiAltResults = new Map<string, { alt1: string | null; alt2: string | null }>();
  const errors: string[] = [];
  let aiCallsMade = 0;

  const batches: BlogPost[][] = [];
  for (let i = 0; i < needsAiAlt.length; i += BATCH) batches.push(needsAiAlt.slice(i, i + BATCH));

  await Promise.all(
    batches.map(async (batch, idx) => {
      try {
        const res = await generateAltText(batch, apiKey);
        aiCallsMade++;
        for (const [id, val] of res) aiAltResults.set(id, val);
      } catch (err: any) {
        errors.push(`AltGen batch ${idx + 1}: ${err.message}`);
      }
    })
  );

  // ── 4. Bilingual parity ──────────────────────────────────────────────────────
  const parityGroups = buildParityGroups(posts as BlogPost[], auditMap);

  // ── 5. Assemble per-post report ──────────────────────────────────────────────
  const report: PostAuditResult[] = (posts as BlogPost[]).map((post) => {
    const issues = auditMap.get(post.id) ?? [];
    const ai = aiAltResults.get(post.id);
    const hasError = issues.some((i) => i.severity === "error");
    const hasWarning = issues.some((i) => i.severity === "warning");

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      lang: langLabel(post.lang),
      published: post.published,
      issues,
      ai_alt1: ai?.alt1 ?? null,
      ai_alt2: ai?.alt2 ?? null,
      issue_count: issues.length,
      status: hasError ? "error" : hasWarning ? "warning" : "ok",
    };
  });

  // ── 6. Apply fixes if mode="fix" ────────────────────────────────────────────
  let fixesApplied = 0;

  if (mode === "fix") {
    for (const item of report) {
      const updates: Record<string, unknown> = {};
      const ai = aiAltResults.get(item.id);

      if (ai?.alt1) updates.hero_alt = ai.alt1;
      if (ai?.alt2) updates.hero_alt_2 = ai.alt2;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("blog_posts")
          .update(updates)
          .eq("id", item.id);
        if (!error) fixesApplied++;
      }
    }
  }

  // ── 7. Summary ──────────────────────────────────────────────────────────────
  const allPosts = posts as BlogPost[];
  const enPosts = allPosts.filter((p) => langLabel(p.lang) === "en");
  const arPosts = allPosts.filter((p) => langLabel(p.lang) === "ar");
  const completePairs = parityGroups.filter(
    (g) => g.has_en && g.has_ar && g.is_complete
  ).length;
  const bilateralPairs = parityGroups.filter((g) => g.has_en && g.has_ar).length;
  const unpaired = parityGroups.filter((g) => !g.has_en || !g.has_ar).length;

  const summary: AuditSummary = {
    total_posts: allPosts.length,
    posts_with_errors: report.filter((r) => r.status === "error").length,
    posts_with_warnings: report.filter((r) => r.status === "warning").length,
    posts_ok: report.filter((r) => r.status === "ok").length,
    missing_images: report.filter((r) =>
      r.issues.some((i) => i.code === "missing_hero_image")
    ).length,
    missing_alt_text: report.filter((r) =>
      r.issues.some((i) =>
        ["missing_hero_alt", "hero_alt_too_short", "missing_hero_alt_2", "hero_alt_2_too_short"].includes(i.code)
      )
    ).length,
    wrong_language_alt: report.filter((r) =>
      r.issues.some((i) => i.code === "lang_mismatch_alt1" || i.code === "lang_mismatch_alt2")
    ).length,
    en_posts: enPosts.length,
    ar_posts: arPosts.length,
    bilingual_pairs: bilateralPairs,
    unpaired_posts: unpaired,
    ai_fixes_available: needsAiAlt.length,
    fixes_applied: fixesApplied,
  };

  return new Response(
    JSON.stringify({
      summary,
      report,
      parity: parityGroups,
      ai_calls_made: aiCallsMade,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
