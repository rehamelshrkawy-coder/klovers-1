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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse optional filters from body
  let bookFilter: string | null = null;
  let limitCount = 1;
  try {
    const body = await req.json();
    bookFilter = body.book || null;
    limitCount = body.limit || 1;
  } catch { /* no body */ }

  // Get all lessons, optionally filtered by book
  let query = supabase
    .from("textbook_lessons")
    .select("id, sort_order, title_en, title_ko, description, book")
    .eq("is_published", true)
    .order("sort_order");

  if (bookFilter) {
    query = query.eq("book", bookFilter);
  }

  const { data: lessons } = await query;

  if (!lessons || lessons.length === 0) {
    return new Response(JSON.stringify({ error: "No lessons found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check which lessons already have vocab content
  const { data: existingVocab } = await supabase.from("lesson_vocabulary").select("lesson_id");
  const populatedIds = new Set((existingVocab || []).map((v: any) => v.lesson_id));
  const unpopulated = lessons.filter((l: any) => !populatedIds.has(l.id));

  if (unpopulated.length === 0) {
    return new Response(JSON.stringify({ message: "All lessons already have content", total: lessons.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let generated = 0;
  const errors: string[] = [];

  // Process limited batch — stop on first rate limit
  const toProcess = unpopulated.slice(0, Math.min(limitCount, unpopulated.length));
  const rateLimited = false;

  for (const lesson of toProcess) {
    if (rateLimited) break;
    try {
      const isDailyRoutine = (lesson as any).book === "daily-routine";
      const isKDrama = (lesson as any).book === "kdrama";
      const topikLevel = (isDailyRoutine || isKDrama) ? 1 : (lesson.sort_order <= 45 ? 1 : 2);
      const levelDesc = topikLevel === 1 ? "TOPIK 1 (beginner/A1-A2)" : "TOPIK 2 (elementary-intermediate/A2-B1)";

      const contextHint = isDailyRoutine
        ? `This is a "Daily Routine Korean" lesson focused on everyday actions and practical vocabulary for the topic "${lesson.title_en}". Focus heavily on action verbs, common phrases, and practical expressions used in daily life for this specific activity.`
        : isKDrama
        ? `This is a "K-Drama Korean" lesson. Generate content inspired by Korean drama scenes for the topic "${lesson.title_en}". Include dramatic expressions, emotional vocabulary, and conversational phrases commonly heard in K-Dramas. Make dialogues feel like actual drama scenes.`
        : "";

      const prompt = `Generate Korean language lesson content for ${levelDesc}, Lesson ${lesson.sort_order}: "${lesson.title_en}" (${lesson.title_ko}). Description: ${lesson.description}. ${contextHint}

Return a JSON object with these exact keys:
{
  "vocabulary": [{"korean":"...","romanization":"...","meaning":"..."}],
  "grammar": [{"title":"...","structure":"...","explanation":"...","examples":[{"korean":"...","english":"..."}]}],
  "dialogue": [{"speaker":"...","korean":"...","romanization":"...","english":"..."}],
  "exercises": [{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}],
  "reading": [{"korean_text":"...","english_text":"..."}]
}

Requirements:
- vocabulary: 8-12 items relevant to the lesson topic
- grammar: 2-3 grammar points with 2-3 examples each
- dialogue: 4-6 lines of natural conversation
- exercises: 4-5 multiple choice questions
- reading: 1 short paragraph (4-6 sentences) with translation
- All Korean must be accurate and natural
- Content should be appropriate for ${levelDesc} level
- Return ONLY valid JSON, no markdown`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        errors.push(`Lesson ${lesson.sort_order}: AI error ${aiRes.status} - ${errText.substring(0, 100)}`);
        continue;
      }

      const aiData = await aiRes.json();
      const text = aiData.choices?.[0]?.message?.content || "";
      let content: any;
      try {
        content = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      } catch {
        errors.push(`Lesson ${lesson.sort_order}: Failed to parse AI response`);
        continue;
      }

      // Insert all content
      if (content.vocabulary?.length > 0) {
        await supabase.from("lesson_vocabulary").insert(
          content.vocabulary.map((v: any, idx: number) => ({
            lesson_id: lesson.id, korean: v.korean, romanization: v.romanization || "", meaning: v.meaning, sort_order: idx + 1,
          }))
        );
      }
      if (content.grammar?.length > 0) {
        await supabase.from("lesson_grammar").insert(
          content.grammar.map((g: any, idx: number) => ({
            lesson_id: lesson.id, title: g.title, structure: g.structure || "", explanation: g.explanation || "", examples: g.examples || [], sort_order: idx + 1,
          }))
        );
      }
      if (content.dialogue?.length > 0) {
        await supabase.from("lesson_dialogues").insert(
          content.dialogue.map((d: any, idx: number) => ({
            lesson_id: lesson.id, speaker: d.speaker, korean: d.korean, romanization: d.romanization || "", english: d.english, sort_order: idx + 1,
          }))
        );
      }
      if (content.exercises?.length > 0) {
        await supabase.from("lesson_exercises").insert(
          content.exercises.map((e: any, idx: number) => ({
            lesson_id: lesson.id, question: e.question, options: e.options || [], correct_index: e.correct_index ?? 0, explanation: e.explanation || "", sort_order: idx + 1,
          }))
        );
      }
      if (content.reading?.length > 0) {
        await supabase.from("lesson_reading").insert(
          content.reading.map((r: any, idx: number) => ({
            lesson_id: lesson.id, korean_text: r.korean_text, english_text: r.english_text || "", sort_order: idx + 1,
          }))
        );
      }

      generated++;
    } catch (err) {
      errors.push(`Lesson ${lesson.sort_order}: ${err.message}`);
    }
  }

  return new Response(
    JSON.stringify({ generated, remaining: unpopulated.length - generated, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
