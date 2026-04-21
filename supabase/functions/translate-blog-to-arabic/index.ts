/**
 * translate-blog-to-arabic
 *
 * Translates published English blog_posts rows to Arabic using Google's
 * free unofficial translation endpoint (no API key). Inserts each
 * translation as `{slug}-ar` with lang='ar', published=true, same
 * hero_image. Skips any slug that already has an -ar row.
 *
 * Used because LOVABLE_API_KEY is in an invalid format and the
 * batch-translate-articles function's AI calls fail with 401. Swap back
 * to that function once the Lovable key is rotated for higher-quality
 * translations.
 *
 * Body (optional):
 *   { "limit": 10 }                  // cap how many to process this run
 *   { "slugs": ["foo", "bar"] }      // only translate specific slugs
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function gtranslateChunk(text: string, targetLang = "ar"): Promise<string> {
  if (!text.trim()) return text;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!resp.ok) throw new Error(`gtranslate ${resp.status}`);
  const data = await resp.json();
  const segments: string[] = [];
  for (const seg of data[0] || []) {
    if (Array.isArray(seg) && typeof seg[0] === "string") segments.push(seg[0]);
  }
  return segments.join("");
}

function splitIntoChunks(text: string, maxLen = 4500): string[] {
  if (text.length <= maxLen) return [text];
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > maxLen) {
      if (current) chunks.push(current);
      if (p.length > maxLen) {
        const lines = p.split(/\n/);
        let sub = "";
        for (const line of lines) {
          if ((sub + "\n" + line).length > maxLen) {
            if (sub) chunks.push(sub);
            sub = line;
          } else {
            sub = sub ? sub + "\n" + line : line;
          }
        }
        if (sub) { current = sub; } else { current = ""; }
      } else {
        current = p;
      }
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateLong(text: string): Promise<string> {
  const chunks = splitIntoChunks(text);
  const out: string[] = [];
  for (const c of chunks) {
    out.push(await gtranslateChunk(c));
    await new Promise(r => setTimeout(r, 400));
  }
  return out.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: { slugs?: string[]; limit?: number } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const { data: enPosts } = await admin
    .from("blog_posts")
    .select("*")
    .eq("lang", "en")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const { data: arPosts } = await admin
    .from("blog_posts")
    .select("slug")
    .eq("lang", "ar");
  const arSlugs = new Set((arPosts || []).map((r: { slug: string }) => r.slug));

  let candidates = (enPosts || []).filter((p: { slug: string }) => !arSlugs.has(`${p.slug}-ar`));
  if (body.slugs && body.slugs.length) {
    candidates = candidates.filter((p: { slug: string }) => body.slugs!.includes(p.slug));
  }
  const limit = Math.min(body.limit || 10, candidates.length);
  candidates = candidates.slice(0, limit);

  const results: Record<string, unknown>[] = [];

  for (const post of candidates) {
    try {
      const arSlug = `${post.slug}-ar`;
      const [title, description, heroAlt, heroCaption, ctaText, content] = await Promise.all([
        translateLong(post.title || ""),
        translateLong(post.description || ""),
        translateLong(post.hero_alt || ""),
        translateLong(post.hero_caption || ""),
        translateLong(post.cta_text || ""),
        translateLong(post.content || ""),
      ]);
      const translatedKeywords: string[] = [];
      for (const kw of (post.keywords || [])) {
        translatedKeywords.push(await gtranslateChunk(kw));
        await new Promise(r => setTimeout(r, 200));
      }

      const { error } = await admin.from("blog_posts").insert({
        title,
        slug: arSlug,
        description,
        keywords: translatedKeywords,
        article_type: post.article_type,
        hero_image: post.hero_image,
        hero_alt: heroAlt,
        hero_caption: heroCaption,
        hero_image_2: post.hero_image_2,
        hero_alt_2: post.hero_alt_2,
        hero_caption_2: post.hero_caption_2,
        cta_text: ctaText,
        cta_url: post.cta_url,
        content,
        author: post.author,
        lang: "ar",
        published: true,
        published_at: post.published_at,
        seo_score: post.seo_score,
      });
      if (error) throw new Error(error.message);
      results.push({ slug: arSlug, status: "created" });
    } catch (e) {
      results.push({ slug: post.slug, status: "error", error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ processed: candidates.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
