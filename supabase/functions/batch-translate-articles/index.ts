import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function translateOne(supabase: any, post: any, apiKey: string): Promise<string> {
  const arSlug = `${post.slug}-ar`;

  // Check if Arabic version already exists
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", arSlug)
    .maybeSingle();

  if (existing) return `skipped:${arSlug}`;

  const prompt = `You are a professional Arabic translator. Translate this blog article from English to Arabic (Modern Standard Arabic).

RULES:
- Translate ALL text naturally into Arabic
- Keep Korean words/phrases in their original form (한글, 안녕하세요, etc.)
- Keep markdown formatting intact (##, **, -, links, etc.)  
- Keep URLs unchanged
- Use appropriate Arabic punctuation

Return ONLY a JSON object with these keys:
- title (string)
- description (string)
- content (string - full markdown)
- hero_alt (string)
- hero_caption (string)
- cta_text (string)
- keywords (array of Arabic keyword strings)

TITLE: ${post.title}
DESCRIPTION: ${post.description}
HERO_ALT: ${post.hero_alt || ""}
HERO_CAPTION: ${post.hero_caption || ""}
CTA_TEXT: ${post.cta_text || ""}
KEYWORDS: ${(post.keywords || []).join(", ")}

CONTENT:
${post.content}`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (aiRes.status === 429) {
    // Rate limited - wait and retry once
    await new Promise(r => setTimeout(r, 10000));
    return translateOne(supabase, post, apiKey);
  }

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    throw new Error(`AI error ${aiRes.status}: ${errText.slice(0, 200)}`);
  }

  const aiData = await aiRes.json();
  const rawContent = aiData.choices?.[0]?.message?.content || "";

  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");
  const translated = JSON.parse(jsonMatch[0]);

  const arPost = {
    title: translated.title || post.title,
    slug: arSlug,
    description: translated.description || post.description,
    keywords: translated.keywords || post.keywords,
    article_type: post.article_type,
    hero_image: post.hero_image,
    hero_alt: translated.hero_alt || post.hero_alt,
    hero_caption: translated.hero_caption || post.hero_caption,
    hero_image_2: post.hero_image_2,
    hero_alt_2: post.hero_alt_2,
    hero_caption_2: post.hero_caption_2,
    cta_text: translated.cta_text || post.cta_text,
    cta_url: post.cta_url,
    content: translated.content || post.content,
    author: post.author,
    lang: "ar",
    published: post.published,
    published_at: post.published_at,
    seo_score: post.seo_score,
  };

  const { error } = await supabase.from("blog_posts").insert(arPost);
  if (error) throw error;

  return `done:${arSlug}`;
}

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
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get all English articles that don't have Arabic versions yet
  const { data: posts, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("lang", "en")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filter to only untranslated articles first
  const { data: existingAr } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("lang", "ar");

  const existingSlugs = new Set((existingAr || []).map((a: any) => a.slug));
  const untranslated = (posts || []).filter((p: any) => !existingSlugs.has(`${p.slug}-ar`));

  console.log(`Found ${untranslated.length} untranslated articles out of ${posts?.length || 0}`);

  // Respond immediately, process in background
  const promise = (async () => {
    const results: string[] = [];
    for (const post of untranslated) {
      try {
        const result = await translateOne(supabase, post, apiKey);
        results.push(result);
        console.log(`Translated: ${result}`);
      } catch (e: any) {
        results.push(`error:${post.slug}:${e.message}`);
        console.error(`Failed: ${post.slug}: ${e.message}`);
      }
      // Delay between translations to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Batch translation complete:", JSON.stringify(results));
  })();

  // Use waitUntil for background processing
  // @ts-expect-error - EdgeRuntime is available in Deno Deploy
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  }

  return new Response(JSON.stringify({ 
    message: `Translation started for ${untranslated.length} untranslated articles (${existingSlugs.size} already exist).`,
    total: posts?.length || 0,
    untranslated: untranslated.length,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
