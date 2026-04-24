import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const POSTS = [
  {
    title: "How to Learn Hangul in 1 Week: A Complete Beginner Guide",
    slug: "learn-hangul-one-week",
    description: "Hangul, the Korean alphabet, is one of the most logical writing systems in the world. With the right approach you can master all 24 letters in just 7 days — even with no prior Korean experience.",
    keywords: ["hangul", "korean alphabet", "beginner", "learn korean"],
    article_type: "howto",
    hero_image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    hero_alt: "Korean characters written on a notebook",
    author: "Klovers Team",
    lang: "en",
    published: true,
    seo_score: 95,
    published_at: "2025-01-10T08:00:00Z",
    content: `## What Is Hangul?\n\nHangul (한글) is the official alphabet of the Korean language, created in 1443 by King Sejong the Great. Unlike Chinese characters, Hangul is a phonetic alphabet — each symbol represents a sound, making it far easier to learn.\n\n## The Structure of Hangul\n\nHangul has **14 consonants** and **10 vowels**. These combine into syllable blocks:\n\n- 가 = ㄱ (g) + ㅏ (a) = *ga*\n- 한 = ㅎ (h) + ㅏ (a) + ㄴ (n) = *han*\n\n## Your 7-Day Study Plan\n\n### Day 1–2: Basic Vowels\nStart with the 10 basic vowels: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ. Write each one 10 times.\n\n### Day 3–4: Basic Consonants\nLearn the 14 consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ.\n\n### Day 5: Syllable Blocks\nPractise combining: 가 나 다 라 마 바 사 아.\n\n### Day 6: Double Vowels & Consonants\nIntroduce compound vowels ㅐ, ㅔ, ㅘ and double consonants ㄲ, ㄸ, ㅃ.\n\n### Day 7: Read Real Words\nChallenge yourself to read: 한국 (Korea), 사랑 (love), 학교 (school).\n\n## Tips for Success\n\n1. **Write by hand** — muscle memory accelerates learning\n2. **Use flashcard apps** like Anki with audio\n3. **Label objects** around your home in Hangul\n4. **Sing along** to K-pop to practise pronunciation\n\n## Conclusion\n\nHangul is genuinely one of the easiest scripts to learn. By Day 7 you'll be sounding out Korean menus, street signs, and song lyrics. Ready to start? Dive into our [free textbook](/textbook) for structured practice.`,
  },
  {
    title: "50 Essential Korean Phrases Every K-Drama Fan Must Know",
    slug: "korean-phrases-kdrama-fans",
    description: "From heartfelt confessions to dramatic plot twists, K-dramas are packed with reusable phrases. Here are 50 real expressions you'll hear in every episode — with pronunciation tips and usage notes.",
    keywords: ["korean phrases", "kdrama", "korean expressions", "conversational korean"],
    article_type: "listicle",
    hero_image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    hero_alt: "People watching a Korean drama on a laptop",
    author: "Klovers Team",
    lang: "en",
    published: true,
    seo_score: 88,
    published_at: "2025-02-05T09:00:00Z",
    content: `## Why K-Drama Phrases Work for Learning\n\nWatching dramas is one of the most effective ways to pick up natural Korean. The phrases below appear constantly — learn them and you'll understand dialogue much faster.\n\n## Emotions & Feelings\n\n1. **미안해 (Mi-an-hae)** — I'm sorry (informal)\n2. **괜찮아 (Gwaen-chana)** — It's okay / Are you okay?\n3. **사랑해 (Sa-rang-hae)** — I love you\n4. **보고 싶어 (Bo-go si-peo)** — I miss you\n5. **행복해 (Haeng-bok-hae)** — I'm happy\n\n## Common Greetings\n\n6. **안녕하세요 (An-nyeong-ha-se-yo)** — Hello (formal)\n7. **잘 지냈어요? (Jal ji-nae-sseo-yo?)** — How have you been?\n8. **오랜만이에요 (O-raen-man-i-e-yo)** — Long time no see\n\n## At a Restaurant\n\n9. **이거 주세요 (I-geo ju-se-yo)** — Give me this, please\n10. **맛있어요 (Ma-si-sseo-yo)** — It's delicious\n\n*[See the full list in our textbook →](/textbook)*`,
  },
  {
    title: "Korean Sentence Structure: The Complete Grammar Guide",
    slug: "korean-grammar-sentence-structure",
    description: "Korean grammar feels alien at first, but once you understand its Subject-Object-Verb logic and particle system, everything clicks. This guide walks you through the core structures with clear English comparisons.",
    keywords: ["korean grammar", "sentence structure", "SOV", "korean particles"],
    article_type: "longform",
    hero_image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    hero_alt: "Grammar notes and Korean textbook open on a desk",
    author: "Klovers Team",
    lang: "en",
    published: true,
    seo_score: 91,
    published_at: "2025-03-01T08:00:00Z",
    content: `## The Golden Rule: SOV Order\n\nEnglish is Subject-Verb-Object: *I eat rice.*\nKorean is Subject-Object-Verb: *I rice eat.*\n\n> 저는 밥을 먹어요. (I rice eat = I eat rice.)\n\n## Particles: Korean's Secret Weapon\n\nKorean uses **particles** (조사) attached to nouns to show grammatical role:\n\n| Particle | Role | Example |\n|---|---|---|\n| 은/는 | Topic | 저**는** = As for me |\n| 이/가 | Subject | 고양이**가** = The cat (subject) |\n| 을/를 | Object | 책**을** = The book (object) |\n| 에 | Location/time | 학교**에** = At school |\n\n## Verb Conjugation Basics\n\nKorean verbs always end in **-다** in dictionary form and conjugate for formality:\n\n- 먹다 (to eat) → 먹어요 (formal polite) → 먹어 (informal)\n\n## Negation\n\nTwo ways to negate:\n1. Place **안** before the verb: 안 먹어요 = I don't eat\n2. Use **-지 않다**: 먹지 않아요 = I do not eat (more formal)\n\n## Practice Sentences\n\n- 저는 한국어를 공부해요. (I study Korean.)\n- 오늘 날씨가 좋아요. (The weather is nice today.)\n- 친구를 만나고 싶어요. (I want to meet my friend.)`,
  },
  {
    title: "TOPIK Exam Guide 2025: Everything You Need to Pass",
    slug: "topik-exam-guide-2025",
    description: "Whether you're aiming for TOPIK I (beginner) or TOPIK II (advanced), this comprehensive guide covers the exam format, scoring, registration, and the best study strategies to maximise your score.",
    keywords: ["TOPIK", "korean exam", "TOPIK I", "TOPIK II", "korean certificate"],
    article_type: "longform",
    hero_image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    hero_alt: "Student studying with Korean textbooks preparing for an exam",
    author: "Klovers Team",
    lang: "en",
    published: true,
    seo_score: 89,
    published_at: "2025-03-15T08:00:00Z",
    content: `## What Is TOPIK?\n\nTOPIK (Test of Proficiency in Korean) is the official Korean language proficiency exam administered by the Korean government. It's recognised worldwide for university admission, employment, and immigration.\n\n## Exam Levels\n\n| Level | Test | Score Range | Difficulty |\n|---|---|---|---|\n| Level 1 | TOPIK I | 80–139 | A1–A2 |\n| Level 2 | TOPIK I | 140–200 | A2–B1 |\n| Level 3 | TOPIK II | 120–149 | B1–B2 |\n| Level 4 | TOPIK II | 150–189 | B2 |\n| Level 5 | TOPIK II | 190–229 | C1 |\n| Level 6 | TOPIK II | 230–300 | C2 |\n\n## 2025 Exam Dates\n\nTOPIK is held multiple times per year. Check the official TOPIK website for exact dates in your country.\n\n## Study Strategy\n\n1. **Start with vocabulary** — Flashcard apps like Anki work well\n2. **Practise past papers** — Official papers from TOPIK website are free\n3. **Focus on listening** — Watch Korean news and dramas with subtitles\n4. **Writing practice** — TOPIK II has written essays, practice regularly\n\n## Register at Klovers\n\nOur structured courses are aligned to TOPIK levels. [Take our free placement test](/placement-test) to find your starting point.`,
  },
  {
    title: "Korean Food Vocabulary: 60 Words to Order Like a Local",
    slug: "korean-food-vocabulary-guide",
    description: "Visiting Korea or cooking Korean food at home? Master these 60 essential food words and restaurant phrases so you can order confidently, read menus, and discuss Korean cuisine like a local.",
    keywords: ["korean food vocabulary", "korean restaurant", "food words korean", "korean cuisine"],
    article_type: "listicle",
    hero_image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80",
    hero_alt: "Korean dishes spread on a traditional dining table",
    author: "Klovers Team",
    lang: "en",
    published: true,
    seo_score: 82,
    published_at: "2025-04-10T08:00:00Z",
    content: `## Essential Food Words\n\n### Staples\n- 밥 (bap) — rice\n- 국 (guk) — soup\n- 반찬 (banchan) — side dishes\n- 김치 (kimchi) — fermented vegetables\n\n### Proteins\n- 소고기 (so-go-gi) — beef\n- 돼지고기 (dwae-ji-go-gi) — pork\n- 닭고기 (dak-go-gi) — chicken\n- 해물 (hae-mul) — seafood\n\n### Popular Dishes\n- 비빔밥 (bi-bim-bap) — mixed rice bowl\n- 삼겹살 (sam-gyeop-sal) — grilled pork belly\n- 떡볶이 (tteok-bok-ki) — spicy rice cakes\n- 냉면 (naeng-myeon) — cold noodles\n\n## Ordering at a Restaurant\n\n- 메뉴 주세요 — Menu, please\n- 이거 하나 주세요 — One of this, please\n- 맵지 않게 해주세요 — Please make it not spicy\n- 계산서 주세요 — The bill, please\n\n## Describing Taste\n\n- 맛있어요 — Delicious\n- 매워요 — It's spicy\n- 달아요 — It's sweet\n- 짜요 — It's salty`,
  },
  {
    title: "10 Things That Will Surprise You About Korean Culture",
    slug: "korean-culture-surprises",
    description: "Beyond K-pop and K-dramas, Korean culture holds countless fascinating customs — from age-counting systems to the deep importance of 눈치 (nunchi). These 10 cultural insights will transform how you connect with Korean people.",
    keywords: ["korean culture", "korea customs", "korean society", "nunchi"],
    article_type: "listicle",
    hero_image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80",
    hero_alt: "Traditional Korean architecture at sunset",
    author: "Klovers Team",
    lang: "en",
    published: true,
    seo_score: 85,
    published_at: "2025-05-01T08:00:00Z",
    content: `## 1. Koreans Are a Year (or Two) Older in Korea\n\nKorea uses a traditional age-counting system where you're born age 1, and everyone adds a year on January 1st — not on their birthday. A baby born in December could be "2 years old" by Korean reckoning within weeks.\n\n## 2. 눈치 (Nunchi) — The Art of Reading the Room\n\nNunchi is the subtle ability to gauge others' moods and respond appropriately. It's considered a core social skill and central to Korean communication style.\n\n## 3. Age Determines Formality\n\nKorean grammar has six levels of formality. The moment you meet someone, unspoken negotiation happens to establish who is older — because that determines how you speak to each other.\n\n## 4. Sharing Food Is an Act of Love\n\nSharing from communal dishes (not individual plates) is the norm. Refusing food can feel like rejecting the person offering it.\n\n## 5. Drinking Culture Has Deep Rituals\n\nNever pour your own drink — someone else pours for you. And always receive a glass with two hands to show respect.\n\n## 6. Bowing Replaces Handshakes\n\nA slight bow is the standard greeting. The deeper the bow, the more respect shown.\n\n## 7. Fan Death Is a Real Concern\n\nMany Koreans believe sleeping in a closed room with a running fan is dangerous. Fans sold in Korea often have a built-in timer for this reason.\n\n## 8. Your Blood Type Defines Your Personality\n\nKoreans take blood type personality theories seriously — similar to Western astrology. Type B? Prepare to be called selfish at some point.\n\n## 9. Spicy Food Is Non-Negotiable\n\n고추장 (gochujang, red pepper paste) appears in dozens of dishes. Tolerance is expected — but restaurants will usually accommodate.\n\n## 10. Education Pressure Is Intense\n\n수능 (Suneung), the university entrance exam, is so important that planes are grounded during the listening section. Students study 14+ hours a day in the lead-up.`,
  },
  {
    title: "كيف تتعلم الهانغول في أسبوع واحد: دليل المبتدئين",
    slug: "learn-korean-beginner-arabic",
    description: "الهانغول، أبجدية اللغة الكورية، من أكثر أنظمة الكتابة منطقيةً في العالم. مع الأسلوب الصحيح يمكنك إتقان جميع الحروف الـ 24 في 7 أيام فقط — حتى لو لم تدرس الكورية من قبل.",
    keywords: ["هانغول", "الأبجدية الكورية", "مبتدئ", "تعلم الكورية"],
    article_type: "howto",
    hero_image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    hero_alt: "حروف كورية مكتوبة على دفتر ملاحظات",
    author: "فريق Klovers",
    lang: "ar",
    published: true,
    seo_score: 90,
    published_at: "2025-01-15T08:00:00Z",
    content: `## ما هو الهانغول؟\n\nالهانغول (한글) هو الأبجدية الرسمية للغة الكورية، أنشأها الملك سيجونغ العظيم عام 1443. على عكس الحروف الصينية، الهانغول أبجدية صوتية — كل رمز يمثل صوتاً محدداً، مما يجعل تعلمه أسهل بكثير.\n\n## هيكل الهانغول\n\nيتكون الهانغول من **14 حرفاً ساكناً** و**10 حروف متحركة**. تتحد هذه الحروف في كتل مقطعية:\n\n- 가 = ㄱ (g) + ㅏ (a) = *ga*\n- 한 = ㅎ (h) + ㅏ (a) + ㄴ (n) = *han*\n\n## خطة الدراسة لـ 7 أيام\n\n### اليومان 1–2: الحروف المتحركة الأساسية\nابدأ بالحروف المتحركة العشرة: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ. اكتب كل حرف 10 مرات.\n\n### اليومان 3–4: الحروف الساكنة الأساسية\nتعلم الـ 14 حرفاً ساكناً: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ.\n\n### اليوم 5: الكتل المقطعية\nتدرب على التركيب: 가 나 다 라 마 바 사 아.\n\n### اليوم 6: المتحركات والساكنات المركبة\nقدم المتحركات المركبة ㅐ، ㅔ، ㅘ والساكنات المضاعفة ㄲ، ㄸ، ㅃ.\n\n### اليوم 7: اقرأ كلمات حقيقية\nتحدَّ نفسك بقراءة: 한국 (كوريا)، 사랑 (حب)، 학교 (مدرسة).\n\n## نصائح للنجاح\n\n1. **الكتابة اليدوية** — الذاكرة العضلية تسرّع التعلم\n2. **تطبيقات البطاقات التعليمية** مثل Anki مع الصوت\n3. **ضع ملصقات** على الأشياء في منزلك بالهانغول\n\n## الخلاصة\n\nالهانغول هو بالفعل من أسهل الأنظمة الكتابية تعلماً. في اليوم السابع ستستطيع قراءة القوائم الكورية وإشارات الشوارع. هل أنت مستعد؟ ابدأ بـ [كتابنا المجاني](/textbook).`,
  },
  {
    title: "50 عبارة كورية لا غنى عنها لمحبي المسلسلات",
    slug: "korean-phrases-kdrama-arabic",
    description: "من الاعترافات المؤثرة إلى لحظات الدراما المثيرة، المسلسلات الكورية مليئة بعبارات قابلة للاستخدام اليومي. إليك 50 تعبيراً حقيقياً ستسمعه في كل حلقة — مع نصائح النطق وملاحظات الاستخدام.",
    keywords: ["عبارات كورية", "مسلسلات كورية", "تعابير كورية", "محادثة كورية"],
    article_type: "listicle",
    hero_image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    hero_alt: "أشخاص يشاهدون مسلسلاً كورياً على جهاز لابتوب",
    author: "فريق Klovers",
    lang: "ar",
    published: true,
    seo_score: 83,
    published_at: "2025-02-10T08:00:00Z",
    content: `## لماذا عبارات المسلسلات فعّالة في التعلم؟\n\nمشاهدة المسلسلات من أكثر الطرق فاعلية لاكتساب الكورية الطبيعية. العبارات التالية تظهر باستمرار — تعلّمها وستفهم الحوار بشكل أسرع بكثير.\n\n## المشاعر والأحاسيس\n\n1. **미안해 (Mi-an-hae)** — أنا آسف (غير رسمي)\n2. **괜찮아 (Gwaen-chana)** — لا بأس / هل أنت بخير؟\n3. **사랑해 (Sa-rang-hae)** — أحبك\n4. **보고 싶어 (Bo-go si-peo)** — أشتاق إليك\n5. **행복해 (Haeng-bok-hae)** — أنا سعيد\n\n## التحيات الشائعة\n\n6. **안녕하세요 (An-nyeong-ha-se-yo)** — مرحباً (رسمي)\n7. **잘 지냈어요? (Jal ji-nae-sseo-yo?)** — كيف حالك؟\n8. **오랜만이에요 (O-raen-man-i-e-yo)** — لم أرك منذ فترة\n\n## في المطعم\n\n9. **이거 주세요 (I-geo ju-se-yo)** — أعطني هذا من فضلك\n10. **맛있어요 (Ma-si-sseo-yo)** — إنه لذيذ\n\n*[اطلع على القائمة الكاملة في كتابنا ←](/textbook)*`,
  },
  {
    title: "قواعد اللغة الكورية: الدليل الكامل لبناء الجمل",
    slug: "korean-grammar-arabic",
    description: "قواعد الكورية تبدو غريبة في البداية، لكن حين تفهم منطقها (الفاعل-المفعول-الفعل) ونظام الجسيمات، كل شيء يصبح واضحاً. هذا الدليل يأخذك خطوة بخطوة عبر التراكيب الأساسية مع مقارنات واضحة بالعربية.",
    keywords: ["قواعد الكورية", "بناء الجملة", "جسيمات الكورية", "تعلم الكورية"],
    article_type: "longform",
    hero_image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    hero_alt: "ملاحظات قواعد وكتاب كوري مفتوح على مكتب",
    author: "فريق Klovers",
    lang: "ar",
    published: true,
    seo_score: 87,
    published_at: "2025-03-05T08:00:00Z",
    content: `## القاعدة الذهبية: ترتيب الجملة\n\nالعربية: الفاعل + الفعل + المفعول: *أنا آكل الأرز.*\nالكورية: الفاعل + المفعول + الفعل: *أنا الأرز آكل.*\n\n> 저는 밥을 먹어요. (أنا / الأرز / آكل)\n\n## الجسيمات: السر الكوري\n\nتستخدم الكورية **جسيمات** (조사) تُلصق بالأسماء لتحديد وظيفتها النحوية:\n\n| الجسيمة | الوظيفة | مثال |\n|---|---|---|\n| 은/는 | المبتدأ | 저**는** = أما عني |\n| 이/가 | الفاعل | 고양이**가** = القطة (فاعل) |\n| 을/를 | المفعول | 책**을** = الكتاب (مفعول) |\n| 에 | المكان/الزمان | 학교**에** = في المدرسة |\n\n## أساسيات تصريف الأفعال\n\nجميع الأفعال الكورية تنتهي بـ **-다** في صيغة القاموس وتُصرَّف حسب مستوى الرسمية:\n\n- 먹다 (يأكل) ← 먹어요 (رسمي مؤدب) ← 먹어 (غير رسمي)\n\n## جمل تدريبية\n\n- 저는 한국어를 공부해요. (أنا أدرس الكورية.)\n- 오늘 날씨가 좋아요. (الطقس جميل اليوم.)\n- 친구를 만나고 싶어요. (أريد لقاء صديقي.)`,
  },
];

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  // Guard: require a server-side secret to prevent accidental public invocations.
  // Set SEED_SECRET in Supabase Function secrets; pass as Authorization: Bearer <secret>.
  const seedSecret = Deno.env.get("SEED_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!seedSecret || token !== seedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: { slug: string; status: string }[] = [];

  for (const post of POSTS) {
    // Skip if already exists
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", post.slug)
      .maybeSingle();

    if (existing) {
      results.push({ slug: post.slug, status: "skipped (exists)" });
      continue;
    }

    const { error } = await supabase.from("blog_posts").insert(post);
    if (error) {
      results.push({ slug: post.slug, status: `error: ${error.message}` });
    } else {
      results.push({ slug: post.slug, status: "inserted" });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
