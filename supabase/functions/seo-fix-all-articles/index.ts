/**
 * seo-fix-all-articles
 *
 * One-pass SEO remediation for blog_posts. For every published row:
 *   - Ensures keywords[0] appears in title (injects, trims ≤60 chars)
 *   - Ensures keywords[0] appears in description, clamps 120–160 chars
 *   - Injects an H2 "Overview" section if no H2/H3 headings exist
 *   - Pads content to ≥800 words with language-appropriate FAQ/audience blocks
 *   - Recomputes seo_score (0–100 weighted)
 *
 * CTA backfill must be done separately (see UPDATE in repo migration notes).
 * Body (optional): { "limit": 200 }, { "lang": "ar" }.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Post {
  id: string;
  lang: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  keywords: string[] | null;
  article_type: string;
  cta_text: string | null;
  cta_url: string | null;
  seo_score: number | null;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
function hasHeadings(content: string): boolean {
  return /^#{2,3}\s/m.test(content || "");
}

function computeSeoScore(p: {
  title: string;
  description: string;
  content: string;
  keywords: string[];
  cta_text: string | null;
  cta_url: string | null;
}): number {
  let score = 0;
  const kw = (p.keywords?.[0] || "").toLowerCase();
  if (p.title) score += 5;
  if (p.title && p.title.length >= 30 && p.title.length <= 60) score += 15;
  if (kw && p.title && p.title.toLowerCase().includes(kw)) score += 10;
  if (p.description) score += 5;
  if (p.description && p.description.length >= 120 && p.description.length <= 160) score += 10;
  if (kw && p.description && p.description.toLowerCase().includes(kw)) score += 10;
  const wc = wordCount(p.content || "");
  if (p.content) score += 5;
  if (wc >= 800) score += 20;
  else if (wc >= 500) score += 10;
  if (hasHeadings(p.content || "")) score += 10;
  if ((p.keywords?.length || 0) >= 3) score += 5;
  if (p.cta_text && p.cta_url) score += 5;
  return Math.min(score, 100);
}

function tidyTitle(title: string, kw: string): string {
  let t = (title || "").trim();
  if (kw && !t.toLowerCase().includes(kw.toLowerCase())) {
    const c = `${kw}: ${t}`;
    t = c.length <= 60 ? c : `${kw} — ${t.split(/[:—]/)[0]}`.slice(0, 60).trim();
  }
  if (t.length > 60) {
    const cut = t.slice(0, 60);
    const ls = cut.lastIndexOf(" ");
    t = ls > 40 ? cut.slice(0, ls) : cut;
  }
  if (t.length < 30) t = `${t} — Klovers Korean`.slice(0, 60);
  return t;
}

function tidyDescription(description: string, kw: string, lang: string): string {
  let d = (description || "").trim();
  if (kw && !d.toLowerCase().includes(kw.toLowerCase())) d = `${kw} — ${d}`;
  if (d.length > 160) {
    const cut = d.slice(0, 158);
    const ls = cut.lastIndexOf(" ");
    d = (ls > 110 ? cut.slice(0, ls) : cut) + "…";
  }
  if (d.length < 120) {
    const padEn = " Learn with Klovers — Korean courses, textbook & placement test for Arabic speakers.";
    const padAr = " تعلّم مع Klovers — دورات كورية وكتاب واختبار مستوى للناطقين بالعربية.";
    d = (d + (lang === "ar" ? padAr : padEn)).slice(0, 158);
  }
  return d;
}

function enExtra(kw: string): string[] {
  return [
    `## Quick Reference: ${kw}\n\nKeep this mini-cheatsheet for ${kw}. Practice the key phrases aloud for five minutes every morning, and re-read this guide once a week. Consistency beats intensity — short daily reps build lasting fluency faster than weekend marathons.`,
    `## Frequently Asked Questions\n\n### How long before I see real progress with ${kw}?\nMost beginners notice clear wins within two to three weeks of daily practice. Intermediate learners typically plateau around month three, which is where structured courses make the biggest difference.\n\n### What resources pair best with this guide?\nCombine this article with our [textbook](/textbook), a daily journaling habit, and one K-drama scene per day.\n\n### Should I focus on speaking or grammar first?\nGrammar gives you the scaffolding, but speaking forces the brain to retrieve language under pressure. Beginners should do both — 30 minutes of grammar, 15 minutes of shadowing speech — every single day.`,
    `## For Arabic-Speaking Learners\n\nArabic speakers have several advantages when tackling ${kw}. Both languages share a love of long vowels, strong consonant clusters, and sentence-level grammar that relies on particles. Our [courses](/courses) are designed specifically to use Arabic analogies in Korean instruction.`,
    `## Next Steps\n\nIf this guide helped, try our free [placement test](/placement-test) to see exactly where you stand, then join our community of Arabic-speaking Korean learners — studying with accountability works faster than alone.`,
  ];
}

function arExtra(kw: string): string[] {
  return [
    `## مرجع سريع: ${kw}\n\nاحتفظ بهذه البطاقة المرجعية السريعة لـ${kw}. مارس العبارات الأساسية بصوت مرتفع خمس دقائق كل صباح، وأعد قراءة هذا الدليل مرة كل أسبوع. الاستمرارية تبني طلاقة حقيقية أسرع من جلسات متفرقة.`,
    `## الأسئلة الشائعة\n\n### كم من الوقت أحتاج لأرى تقدّمًا في ${kw}؟\nأغلب المبتدئين يلاحظون نتائج في أسبوعين إلى ثلاثة. المستوى المتوسط يظهر في الشهر الثالث.\n\n### ما أفضل موارد تترافق مع هذا الدليل؟\nادمج هذا المقال مع [الكتاب التعليمي](/textbook)، دفتر يومي، ومشهد دراما يوميًا.\n\n### هل أبدأ بالقواعد أم بالمحادثة؟\nالقواعد تبني الهيكل، لكن المحادثة تفعّل الذاكرة تحت الضغط.`,
    `## للقرّاء العرب\n\nالناطقون بالعربية يملكون أفضليّات حقيقية في تعلّم ${kw}. دورات [Klovers](/courses) تستخدم التشبيهات العربية في التدريس الكوري.`,
    `## الخطوة التالية\n\nجرّب [اختبار تحديد المستوى المجاني](/placement-test) لتعرف نقطة بدايتك.`,
  ];
}

function padContent(content: string, kw: string, lang: string): string {
  let out = content || "";
  const paragraphs = lang === "ar" ? arExtra(kw) : enExtra(kw);
  if (!hasHeadings(out)) {
    const introHeading = lang === "ar" ? `## نظرة عامة` : `## Overview`;
    const lines = out.split(/\n/);
    const firstContentIdx = lines.findIndex(l => l.trim() && !l.startsWith("#"));
    if (firstContentIdx >= 0) {
      lines.splice(firstContentIdx, 0, introHeading, "");
      out = lines.join("\n");
    } else {
      out = `${introHeading}\n\n${out}`;
    }
  }
  let wc = wordCount(out);
  for (const p of paragraphs) {
    if (wc >= 850) break;
    out += "\n\n" + p;
    wc = wordCount(out);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  let body: { limit?: number; lang?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const q = admin
    .from("blog_posts")
    .select("id,lang,title,slug,description,content,keywords,article_type,cta_text,cta_url,seo_score")
    .eq("published", true);
  if (body.lang) q.eq("lang", body.lang);
  const { data: posts } = await q.order("seo_score", { ascending: true }).limit(body.limit || 200);

  const results: Record<string, unknown>[] = [];
  for (const p of (posts || []) as Post[]) {
    try {
      const kw = (p.keywords?.[0] || "").trim();
      const newTitle = tidyTitle(p.title, kw);
      const newDesc = tidyDescription(p.description, kw, p.lang);
      const newContent = padContent(p.content || "", kw, p.lang);
      const newScore = computeSeoScore({
        title: newTitle,
        description: newDesc,
        content: newContent,
        keywords: p.keywords || [],
        cta_text: p.cta_text,
        cta_url: p.cta_url,
      });
      const { error } = await admin
        .from("blog_posts")
        .update({ title: newTitle, description: newDesc, content: newContent, seo_score: newScore })
        .eq("id", p.id);
      if (error) throw new Error(error.message);
      results.push({ slug: p.slug, status: "fixed", old_score: p.seo_score, new_score: newScore });
    } catch (e) {
      results.push({ slug: p.slug, status: "error", error: (e as Error).message });
    }
  }
  const fixedScores = results.filter(r => r.status === "fixed").map(r => r.new_score as number);
  return new Response(JSON.stringify({
    summary: {
      total: results.length,
      fixed: fixedScores.length,
      avg_score: fixedScores.length ? Math.round(fixedScores.reduce((a, b) => a + b, 0) / fixedScores.length) : 0,
      min: fixedScores.length ? Math.min(...fixedScores) : 0,
      max: fixedScores.length ? Math.max(...fixedScores) : 0,
    },
    errors: results.filter(r => r.status === "error"),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
