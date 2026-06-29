import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import FinalCTA from "@/components/FinalCTA";
import OptimizedImage from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, ArrowRight, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  article_type: string;
  hero_image: string;
  hero_alt: string;
  author: string;
  lang: string;
  published_at: string | null;
  created_at: string;
  seo_score: number | null;
}

const TYPE_LABEL: Record<string, string> = {
  howto: "How-To",
  listicle: "Listicle",
  longform: "Article",
  news: "News",
  review: "Review",
};

const TYPE_COLOR: Record<string, string> = {
  howto: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  listicle: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  longform: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  news: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  review: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
};

const BlogPage = () => {
  useSEO({
    title: "Korean Language Blog",
    description: "Explore Klovers blog for Korean language tips, culture insights, grammar guides, and study resources.",
    canonical: "https://kloversegy.com/blog",
  });

  const [activeType, setActiveType] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(18);
  const { language } = useLanguage();

  const { data: posts = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["blog_posts", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, description, keywords, article_type, hero_image, hero_alt, author, lang, published_at, created_at, seo_score")
        .eq("published", true)
        .eq("lang", language)
        .order("seo_score", { ascending: false, nullsFirst: false })
        .order("published_at", { ascending: false })
        .limit(60);
      if (error) throw new Error(error.message);
      return (data as BlogPost[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const fetchError = queryError ? (queryError as Error).message : null;

  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    posts.forEach(p => { if (p.article_type) seen.add(p.article_type.toLowerCase()); });
    return Array.from(seen);
  }, [posts]);

  const filteredPosts = useMemo(() =>
    activeType ? posts.filter(p => p.article_type?.toLowerCase() === activeType) : posts,
  [posts, activeType]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  // BreadcrumbList JSON-LD for the listing page
  useEffect(() => {
    const el = document.createElement("script");
    el.id = "blog-list-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://kloversegy.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://kloversegy.com/blog" },
      ],
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Page header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">
              {language === "ar" ? "📝 المدونة" : "📝 Blog"}
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
              {language === "ar" ? "مدونة K-Lovers" : "K-Lovers Blog"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {language === "ar"
                ? "نصائح وأدلة ورؤى لرحلتك في تعلم اللغة الكورية."
                : "Tips, guides, and insights for your Korean learning journey."}
            </p>
          </div>

          {/* Type filter pills + count */}
          {!loading && posts.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <Button
                size="sm"
                variant={activeType === null ? "default" : "outline"}
                onClick={() => { setActiveType(null); setVisibleCount(18); }}
              >
                All <span className="ml-1.5 text-xs opacity-70">({posts.length})</span>
              </Button>
              {typeOptions.map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant={activeType === type ? "default" : "outline"}
                  onClick={() => { setActiveType(type); setVisibleCount(18); }}
                  className={activeType !== type ? (TYPE_COLOR[type] ? `border ${TYPE_COLOR[type].split(" ")[2]} hover:opacity-80` : "") : ""}
                >
                  <span className={activeType !== type ? TYPE_COLOR[type]?.split(" ").slice(0, 2).join(" ") : ""}>
                    {TYPE_LABEL[type] || type}
                  </span>
                  <span className="ml-1.5 text-xs opacity-70">({posts.filter(p => p.article_type?.toLowerCase() === type).length})</span>
                </Button>
              ))}
            </div>
          )}

          {/* Error state */}
          {fetchError && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <h2 className="font-semibold text-foreground">
                {language === "ar" ? "تعذّر تحميل المقالات" : "Couldn't load articles"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">{fetchError}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                {language === "ar" ? "حاول مرة أخرى" : "Try again"}
              </Button>
            </div>
          )}

          {/* Card grid */}
          {!fetchError && loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-16 text-lg">
              {posts.length === 0
                ? (language === "ar" ? "لا توجد مقالات منشورة بعد. تحقق قريباً!" : "No articles published yet. Check back soon!")
                : "No articles in this category."}
            </p>
          ) : (
            <>
              <ol className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePosts.map((post, idx) => (
                  <li key={post.id}>
                    <Link to={`/blog/${post.slug}`} className="group block h-full">
                      <article className="h-full rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 flex flex-col">

                        {/* Thumbnail */}
                        <div className="aspect-video overflow-hidden bg-muted group-hover:bg-muted/80 transition-colors">
                          <OptimizedImage
                            src={post.hero_image}
                            alt={post.hero_alt || post.title}
                            variant="card"
                            priority={idx < 3}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                          {/* Type badge + attraction badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[post.article_type] || "bg-muted text-muted-foreground border-border"}`}>
                              {TYPE_LABEL[post.article_type] || post.article_type}
                            </span>
                            {idx === 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                ⭐ {language === "ar" ? "مميز" : "Featured"}
                              </span>
                            )}
                            {(post.seo_score ?? 0) >= 88 && idx > 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                                ✨ {language === "ar" ? "موصى به" : "Top Pick"}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h2 className="text-lg font-bold text-foreground line-clamp-2 leading-snug mb-2">
                            {post.title}
                          </h2>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1 mb-4">
                            {post.description}
                          </p>

                          {/* Footer: author / date */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto flex-wrap gap-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author}
                            </span>
                            <time
                              dateTime={post.published_at || post.created_at}
                              className="flex items-center gap-1"
                            >
                              <CalendarDays className="h-3 w-3" />
                              {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </time>
                          </div>

                          {/* Read more */}
                          <div className="flex items-center gap-1 text-primary text-outlined text-sm font-semibold mt-3 group-hover:gap-2 transition-all">
                            {language === "ar" ? "اقرأ المزيد" : "Read article"}
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  </li>
                ))}
              </ol>

              {/* Load More */}
              {visibleCount < filteredPosts.length && (
                <div className="flex justify-center mt-10">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount(c => c + 18)}
                  >
                    {language === "ar" ? "تحميل المزيد" : "Load more articles"}
                    <span className="ml-2 text-xs opacity-60">
                      ({filteredPosts.length - visibleCount} {language === "ar" ? "متبقية" : "remaining"})
                    </span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-20">
          <FinalCTA />
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default BlogPage;
