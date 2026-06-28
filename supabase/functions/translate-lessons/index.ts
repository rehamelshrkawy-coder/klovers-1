import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const authorization = await authorizeRequest(req, "admin");
  if (!authorization.ok) return authorizationError(authorization, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lessons missing Arabic translations
    const { data: lessons, error } = await supabase
      .from("textbook_lessons")
      .select("id, title_en, description, title_ar, description_ar")
      .or("title_ar.eq.,description_ar.eq.")
      .limit(15);

    if (error) throw error;
    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify({ message: "All lessons already translated", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Translate the following Korean language lesson titles and descriptions from English to Arabic. Keep translations natural, educational, and concise.

Return ONLY a JSON array with objects: { "id": number, "title_ar": "...", "description_ar": "..." }

Lessons:
${JSON.stringify(lessons.map(l => ({ id: l.id, title: l.title_en, description: l.description })), null, 2)}`;

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
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not parse AI response as JSON array");
    
    const translations = JSON.parse(jsonMatch[0]);
    
    let updated = 0;
    for (const t of translations) {
      if (t.title_ar && t.description_ar) {
        const { error: updateError } = await supabase
          .from("textbook_lessons")
          .update({ title_ar: t.title_ar, description_ar: t.description_ar })
          .eq("id", t.id);
        if (!updateError) updated++;
      }
    }

    return new Response(JSON.stringify({ message: `Translated ${updated} lessons`, count: updated, total: lessons.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
