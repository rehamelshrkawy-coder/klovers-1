import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User, ArrowRight, Clock, BookOpen } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  article_type: string;
  hero_image: string;
  hero_alt: string;
  author: string;
  published_at: string | null;
  created_at: string;
  seo_score: number | null;
}

const TYPE_LABEL: Record<string, string> = { howto: "How-To", listicle: "Listicle", longform: "Article", news: "News", review: "Review" };
const TYPE_LABEL_AR: Record<string, string> = { howto: "كيفية", listicle: "قائمة", longform: "مقال", news: "أخبار", review: "مراجعة" };
const TYPE_COLOR: Record<string, string> = {
  howto: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  listicle: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  longform: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  news: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  review: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
};

function readingTime(desc: string) {
  const words = desc.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const HomeBlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, description, article_type, hero_image, hero_alt, author, published_at, created_at, seo_score")
      .eq("published", true)
      .eq("lang", language)
      .order("seo_score", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setPosts((data as BlogPost[]) || []);
        setLoading(false);
      });
  }, [language]);

  if (!loading && posts.length === 0) return null;

  const isAr = language === "ar";
  const labels = isAr ? TYPE_LABEL_AR : TYPE_LABEL;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-muted border border-border px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" />
            {isAr ? "📝 المدونة" : "📝 Blog"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-2">
            {isAr ? "أحدث المقالات" : "Latest from Our Blog"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {isAr ? "نصائح وأدلة ورؤى لرحلتك في تعلم اللغة الكورية." : "Tips, guides, and insights for your Korean learning journey."}
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {posts.map((post, idx) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                <article className="h-full rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                  {/* Hero image */}
                  {post.hero_image ? (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <OptimizedImage
                        src={post.hero_image}
                        alt={post.hero_alt || post.title}
                        variant="card"
                        priority={idx === 0}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/30" />
                    </div>
                  )}

                  <div className="p-5">
                    {/* Type badge */}
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-3 ${TYPE_COLOR[post.article_type] || "bg-muted text-muted-foreground border-border"}`}>
                      {labels[post.article_type] || post.article_type}
                    </span>

                    {/* Attraction badges */}
                    {idx === 0 && (
                      <span className="ms-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800">
                        ⭐ {isAr ? "مميز" : "Featured"}
                      </span>
                    )}
                    {idx > 0 && (post.seo_score ?? 0) >= 80 && (
                      <span className="ms-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        ✨ {isAr ? "موصى به" : "Top Pick"}
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-foreground line-clamp-2 mt-1 mb-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {post.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[80px]">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {readingTime(post.description)} min
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Button variant="outline" asChild size="lg" className="gap-2">
            <Link to="/blog">
              {isAr ? "عرض جميع المقالات" : "View All Articles"}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeBlogSection;
