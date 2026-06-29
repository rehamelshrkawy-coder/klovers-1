import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authorization = await authorizeRequest(req, "admin");
  if (!authorization.ok) return authorizationError(authorization, corsHeaders);

  try {
    const { slug, direction = "en-to-ar" } = await req.json();
    if (!slug) throw new Error("slug is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // ── Determine source/target based on direction ───────────────────────────
    const isReverse = direction === "ar-to-en";
    const sourceLang = isReverse ? "ar" : "en";
    const targetLang = isReverse ? "en" : "ar";

    let targetSlug: string;
    if (isReverse) {
      if (!slug.endsWith("-ar")) throw new Error("AR post slug must end with -ar for reverse translation");
      targetSlug = slug.replace(/-ar$/, "");
    } else {
      targetSlug = `${slug}-ar`;
    }

    // Fetch the source article
    const { data: post, error: fetchErr } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("lang", sourceLang)
      .single();

    if (fetchErr || !post) throw new Error(`${sourceLang.toUpperCase()} article not found: ${fetchErr?.message || slug}`);

    // Check if target version already exists
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", targetSlug)
      .maybeSingle();

    // ── Build translation prompt ─────────────────────────────────────────────
    const langInstructions = isReverse
      ? `You are a professional English translator specializing in Korean language education content. Translate the following blog article from Arabic to English.

IMPORTANT RULES:
- Translate ALL text naturally into English
- Keep Korean words/phrases in their original form (한글, 안녕하세요, etc.)
- Keep markdown formatting intact (##, **, -, links, etc.)
- Keep any URLs unchanged
- Make the English text flow naturally, not word-for-word translation
- Use clear, engaging English suitable for an international audience`
      : `You are a professional Arabic translator specializing in Korean language education content. Translate the following blog article from English to Arabic (Modern Standard Arabic).

IMPORTANT RULES:
- Translate ALL text naturally into Arabic
- Keep Korean words/phrases in their original form (한글, 안녕하세요, etc.)
- Keep markdown formatting intact (##, **, -, links, etc.)
- Keep any URLs unchanged
- Make the Arabic text flow naturally, not word-for-word translation
- Use appropriate Arabic punctuation`;

    const prompt = `${langInstructions}

Translate each field separately and return a JSON object with these keys:
- title (string)
- description (string)
- content (string - full markdown)
- hero_alt (string)
- hero_caption (string)
- hero_alt_2 (string, can be empty)
- hero_caption_2 (string, can be empty)
- cta_text (string)
- keywords (array of ${targetLang === "ar" ? "Arabic" : "English"} keyword strings)

Here is the article to translate:

TITLE: ${post.title}
DESCRIPTION: ${post.description}
HERO_ALT: ${post.hero_alt || ""}
HERO_CAPTION: ${post.hero_caption || ""}
HERO_ALT_2: ${post.hero_alt_2 || ""}
HERO_CAPTION_2: ${post.hero_caption_2 || ""}
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

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI API error: ${aiRes.status} - ${errText}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    let translated;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      translated = JSON.parse(jsonMatch[0]);
    } catch (e) {
      throw new Error("Failed to parse AI translation response: " + e.message);
    }

    const targetPost = {
      title: translated.title || post.title,
      slug: targetSlug,
      description: translated.description || post.description,
      keywords: translated.keywords || post.keywords,
      article_type: post.article_type,
      hero_image: post.hero_image,
      hero_alt: translated.hero_alt || post.hero_alt,
      hero_caption: translated.hero_caption || post.hero_caption,
      hero_image_2: post.hero_image_2,
      hero_alt_2: translated.hero_alt_2 || post.hero_alt_2,
      hero_caption_2: translated.hero_caption_2 || post.hero_caption_2,
      cta_text: translated.cta_text || post.cta_text,
      cta_url: post.cta_url,
      content: translated.content || post.content,
      author: post.author,
      lang: targetLang,
      published: post.published,
      published_at: post.published_at,
      seo_score: post.seo_score,
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(targetPost)
        .eq("id", existing.id)
        .select("id, slug")
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(targetPost)
        .select("id, slug")
        .single();
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ success: true, slug: targetSlug, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
