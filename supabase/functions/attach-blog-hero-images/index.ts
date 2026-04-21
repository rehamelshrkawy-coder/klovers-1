/**
 * attach-blog-hero-images
 *
 * One-off utility: pulls lead images from Wikipedia REST API for a mapped
 * set of blog slugs, uploads each to the `blog-images` storage bucket,
 * and updates blog_posts with hero_image, hero_alt, hero_caption.
 *
 * Used to backfill hero images for the April 2026 batch of 10 Korean
 * language articles when LOVABLE_API_KEY (used by generate-blog-image)
 * was in an invalid format and PEXELS_API_KEY was not configured.
 *
 * Invoke with POST (no body needed). Re-invocations overwrite existing
 * hero fields for slugs listed in TARGETS.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Target {
  slug: string;
  wikiTitles: string[];
  alt: string;
  caption: string;
}

const TARGETS: Target[] = [
  { slug: "how-to-introduce-yourself-in-korean", wikiTitles: ["Hanbok", "Korean_name"], alt: "People wearing Hanbok, ready to introduce themselves in Korean", caption: "A Hanbok greeting — the perfect Korean self-introduction moment." },
  { slug: "korean-question-words-guide", wikiTitles: ["Gyeongbokgung", "Bukchon_Hanok_Village"], alt: "Gyeongbokgung palace — where every Korean visitor asks questions", caption: "Asking questions at Gyeongbokgung — real-life Korean practice." },
  { slug: "korean-past-tense-conjugation-guide", wikiTitles: ["Sejong_the_Great", "Korean_literature", "Gyeongbokgung"], alt: "Statue of Sejong the Great, creator of Hangul", caption: "King Sejong — the scholar who gave Korean its written past." },
];

async function fetchWikipediaImage(title: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const resp = await fetch(url, { headers: { "User-Agent": "Klovers-Blog-Hero/1.0 (learnkorean@kloversegy.com)" } });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.originalimage?.source || data.thumbnail?.source || null;
}

async function downloadAndUpload(
  photoUrl: string,
  slug: string,
  admin: ReturnType<typeof createClient>
): Promise<string> {
  const imgResp = await fetch(photoUrl, { headers: { "User-Agent": "Klovers-Blog-Hero/1.0 (learnkorean@kloversegy.com)" } });
  if (!imgResp.ok) throw new Error(`download ${imgResp.status}`);
  const contentType = imgResp.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const bytes = new Uint8Array(await imgResp.arrayBuffer());
  const fileName = `hero-${slug}-${Date.now()}.${ext}`;
  const { error } = await admin.storage.from("blog-images").upload(fileName, bytes, { contentType, upsert: false });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data: urlData } = admin.storage.from("blog-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, string>[] = [];

  for (const t of TARGETS) {
    try {
      const { data: existing } = await admin
        .from("blog_posts")
        .select("slug,title")
        .eq("slug", t.slug)
        .maybeSingle();
      if (!existing) { results.push({ slug: t.slug, status: "not_found" }); continue; }

      let wikiSrc: string | null = null;
      let used = "";
      for (const title of t.wikiTitles) {
        wikiSrc = await fetchWikipediaImage(title);
        if (wikiSrc) { used = title; break; }
      }
      if (!wikiSrc) { results.push({ slug: t.slug, status: "no_wiki_image" }); continue; }

      const publicUrl = await downloadAndUpload(wikiSrc, t.slug, admin);
      const { error: updErr } = await admin
        .from("blog_posts")
        .update({ hero_image: publicUrl, hero_alt: t.alt.slice(0, 125), hero_caption: t.caption })
        .eq("slug", t.slug);
      if (updErr) throw new Error(`update: ${updErr.message}`);
      results.push({ slug: t.slug, status: "replaced", url: publicUrl, wiki: used });
    } catch (e) {
      results.push({ slug: t.slug, status: "error", error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
