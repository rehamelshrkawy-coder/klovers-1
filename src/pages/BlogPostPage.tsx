import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import OptimizedImage from "@/components/OptimizedImage";
import BlogComments from "@/components/BlogComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, User, ArrowRight, Clock, ChevronRight, Share2, Copy, Check, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  article_type: string;
  hero_image: string;
  hero_alt: string;
  hero_caption: string;
  hero_image_2: string;
  hero_alt_2: string;
  hero_caption_2: string;
  cta_text: string;
  cta_url: string;
  content: string;
  author: string;
  lang: string;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  howto: "How-To",
  listicle: "Listicle",
  longform: "Article",
  news: "News",
  review: "Review",
};

const TYPE_LABEL_AR: Record<string, string> = {
  howto: "شرح عملي",
  listicle: "قائمة",
  longform: "مقال",
  news: "أخبار",
  review: "مراجعة",
};

const TYPE_COLOR: Record<string, string> = {
  howto: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  listicle: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  longform: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  news: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  review: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Pick<BlogPost, "id"|"title"|"slug"|"description"|"hero_image"|"hero_alt"|"article_type"|"author"|"published_at"|"created_at">[]>([]);
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Set canonical immediately from slug so Google doesn't see homepage canonical during load
  useEffect(() => {
    if (!slug) return;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://kloversegy.com/blog/${slug}`;
    // Robots: ensure indexable
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "index, follow");
  }, [slug]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      setFetchError(null);
      try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPost(data as BlogPost);
        // Track view — fire-and-forget, non-blocking
        (supabase as any).rpc("increment_blog_view", { post_slug: slug }).then(() => {});
        // Fetch related posts: same article_type, exclude current
        supabase
          .from("blog_posts")
          .select("id, title, slug, description, hero_image, hero_alt, article_type, author, published_at, created_at")
          .eq("published", true)
          .eq("lang", data.lang || "en")
          .eq("article_type", data.article_type)
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(3)
          .then(({ data: rel }) => {
            if (rel && rel.length > 0) {
              setRelatedPosts(rel as any);
            } else {
              // Fallback: any recent posts in same lang
              supabase
                .from("blog_posts")
                .select("id, title, slug, description, hero_image, hero_alt, article_type, author, published_at, created_at")
                .eq("published", true)
                .eq("lang", data.lang || "en")
                .neq("slug", slug)
                .order("published_at", { ascending: false })
                .limit(3)
                .then(({ data: fallback }) => setRelatedPosts((fallback as any) || []));
            }
          });
      } else if (language === "ar" && !slug.endsWith("-ar")) {
        const { data: arData } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", `${slug}-ar`)
          .eq("published", true)
          .maybeSingle();
        setPost(arData as BlogPost | null);
      } else {
        setPost(null);
      }
      setLoading(false);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load article");
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, language]);

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!post) return;

    document.title = `${post.title} | Klovers Blog`;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const locale = post.lang === "ar" ? "ar_EG" : "en_US";
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;

    const fallbackImage = "https://kloversegy.com/klovers-logo.jpg";
    const ogImage = post.hero_image || fallbackImage;

    // Basic meta
    setMeta("description", post.description);
    setMeta("keywords", (post.keywords || []).join(", "));
    setMeta("robots", "index, follow");

    // Open Graph
    setMeta("og:title", post.title, "property");
    setMeta("og:description", post.description, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:url", `https://kloversegy.com/blog/${post.slug}`, "property");
    setMeta("og:locale", locale, "property");
    setMeta("og:site_name", "Klovers", "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:image:alt", post.hero_alt || post.title, "property");

    // Article meta
    setMeta("article:published_time", post.published_at || post.created_at, "property");
    if (post.updated_at) setMeta("article:modified_time", post.updated_at, "property");
    setMeta("article:author", post.author, "property");
    setMeta("article:section", TYPE_LABEL[post.article_type] || post.article_type, "property");

    // article:tag — one per keyword (requires multiple elements)
    document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
    (post.keywords || []).forEach((kw) => {
      const el = document.createElement("meta");
      el.setAttribute("property", "article:tag");
      el.content = kw;
      document.head.appendChild(el);
    });

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:site", "@kloversegy");
    setMeta("twitter:title", post.title);
    setMeta("twitter:description", post.description);
    setMeta("twitter:image", ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://kloversegy.com/blog/${post.slug}`;

    // JSON-LD: BlogPosting with enhanced metadata
    let jsonLd = document.getElementById("blog-jsonld");
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.id = "blog-jsonld";
      jsonLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `https://kloversegy.com/blog/${post.slug}`,
      headline: post.title,
      description: post.description,
      image: [ogImage],
      author: {
        "@type": "Organization",
        name: post.author,
        url: "https://kloversegy.com"
      },
      publisher: {
        "@type": "Organization",
        name: "Klovers — Korean Lovers Academy",
        logo: { "@type": "ImageObject", url: "https://kloversegy.com/klovers-logo.jpg", width: 512, height: 512 },
        url: "https://kloversegy.com"
      },
      datePublished: post.published_at || post.created_at,
      ...(post.updated_at ? { dateModified: post.updated_at } : {}),
      url: `https://kloversegy.com/blog/${post.slug}`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://kloversegy.com/blog/${post.slug}` },
      inLanguage: post.lang || "en",
      wordCount,
      keywords: (post.keywords || []).join(", "),
      articleSection: TYPE_LABEL[post.article_type] || post.article_type,
      articleBody: post.content?.substring(0, 500) + "...",
      speakable: {
        "@type": "SpeakableSpecification",
        "xpath": ["/html/head/title", "/html/body/article/h1", "/html/body/article/p"]
      }
    });

    // JSON-LD: BreadcrumbList
    let breadcrumbLd = document.getElementById("breadcrumb-jsonld");
    if (!breadcrumbLd) {
      breadcrumbLd = document.createElement("script");
      breadcrumbLd.id = "breadcrumb-jsonld";
      breadcrumbLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(breadcrumbLd);
    }
    breadcrumbLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://kloversegy.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://kloversegy.com/blog" },
        { "@type": "ListItem", position: 3, name: post.title, item: `https://kloversegy.com/blog/${post.slug}` },
      ],
    });

    return () => {
      document.title = "Klovers";
      jsonLd?.remove();
      breadcrumbLd?.remove();
      canonical?.remove();
      document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
    };
  }, [post]);

  const readingTime = post?.content ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)) : null;
  const isRtl = post?.lang === "ar";

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <h1 className="font-semibold text-foreground">{isAr ? "تعذر تحميل هذا المقال" : "Couldn't load this article"}</h1>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">{isAr ? "حاول مرة أخرى" : "Try again"}</Button>
              <Button asChild variant="ghost">
                <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />{isAr ? "العودة للمدونة" : "Back to Blog"}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-full max-w-sm" />
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 text-center px-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">{isAr ? "المقال غير موجود" : "Article not found"}</h1>
          <Button asChild variant="outline">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />{isAr ? "العودة للمدونة" : "Back to Blog"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-20">
        <article
          className="container mx-auto px-4 max-w-[720px]"
          dir={isRtl ? "rtl" : "ltr"}
          lang={post.lang || "en"}
        >
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">{isAr ? "الرئيسية" : "Home"}</Link>
              </li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">{isAr ? "المدونة" : "Blog"}</Link>
              </li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="text-foreground font-medium truncate max-w-[260px]" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

          {/* Type badge */}
          <div className="mb-4">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLOR[post.article_type] || "bg-muted text-muted-foreground border-border"}`}>
              {(isAr ? TYPE_LABEL_AR : TYPE_LABEL)[post.article_type] || post.article_type}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Description / standfirst */}
          <p className="text-lg text-foreground/70 mb-6 leading-relaxed font-serif">
            {post.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-y border-border py-3 mb-8 flex-wrap">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{post.author}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <time dateTime={post.published_at || post.created_at}>
                {new Date(post.published_at || post.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </span>
            {readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {isAr ? `${readingTime} دقيقة قراءة` : `${readingTime} min read`}
              </span>
            )}
          </div>

          {/* Hero Image 1 */}
          <OptimizedImage
            src={post.hero_image}
            alt={post.hero_alt || post.title}
            caption={post.hero_caption}
            isHero
            className="w-full object-cover"
          />

          {/* Hero Image 2 */}
          {post.hero_image_2 && (
            <OptimizedImage
              src={post.hero_image_2}
              alt={post.hero_alt_2 || post.title}
              caption={post.hero_caption_2}
              isHero
              className="w-full object-cover"
            />
          )}

          {/* Article body */}
          <div className={`prose prose-base max-w-none font-serif
            prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pt-6 prose-h2:border-t prose-h2:border-border
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-foreground/90 prose-p:leading-[1.85] prose-p:my-5 prose-p:text-[1.05rem]
            prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
            prose-strong:text-foreground prose-strong:font-bold
            prose-em:text-foreground/80
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground/80
            prose-li:text-foreground/90 prose-li:text-[1.05rem] prose-li:leading-relaxed prose-li:my-1.5
            prose-ul:my-5 prose-ol:my-5
            prose-ul:list-disc prose-ol:list-decimal
            prose-code:font-mono prose-code:text-[0.9em] prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:shadow-sm
            prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:mx-auto
            prose-hr:border-border prose-hr:my-10
            prose-table:w-full prose-th:bg-muted/60 prose-th:text-foreground prose-th:font-semibold prose-td:text-foreground/80 prose-td:border-border prose-th:border-border
            ${isRtl ? "text-right" : ""}
          `}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* CTA block — custom if set, default otherwise */}
          <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl text-center space-y-4">
            <p className="text-sm font-bold text-foreground uppercase tracking-widest">
              {post.cta_text ? (isAr ? "مستعد للبدء؟" : "Ready to start?") : (isAr ? "ابدأ تعلّم الكورية اليوم" : "Start learning Korean today")}
            </p>
            <h3 className="text-xl font-bold text-foreground">
              {post.cta_text || (isAr ? "اكتشف مستواك مع اختبار تحديد المستوى المجاني وانضم لأكثر من 1,000 طالب." : "Find your level with our free placement test and join 1,000+ students.")}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Button asChild size="lg" className="gap-2">
                <Link to={post.cta_url || "/placement-test"}>
                  {post.cta_url ? (isAr ? "ابدأ الآن" : "Get Started") : (isAr ? "🎯 خذ اختبار تحديد المستوى المجاني" : "🎯 Take the Free Placement Test")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/enroll">{isAr ? "📚 عرض الدورات والأسعار" : "📚 View Courses & Pricing"}</Link>
              </Button>
            </div>
          </div>

          {/* Share row */}
          <div className="mt-8 pt-6 border-t border-border flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> {isAr ? "مشاركة" : "Share"}
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isAr ? "تم النسخ!" : "Copied!") : (isAr ? "نسخ الرابط" : "Copy link")}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.href)}`}
              onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.href)}`, { cta_label: "blog_share", metadata: { slug: post.slug } }); }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-green-700"
            >
              💬 WhatsApp
            </a>
          </div>

          {/* Tags */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          )}

          {/* Comments */}
          <BlogComments postId={post.id} isAr={isAr} />

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-14 pt-10 border-t border-border">
              <h2 className="text-lg font-bold text-foreground mb-5">{isAr ? "قد يعجبك أيضاً" : "You might also like"}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    to={`/blog/${rp.slug}`}
                    className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="aspect-video overflow-hidden bg-muted group-hover:bg-muted/80 transition-colors">
                      <OptimizedImage
                        src={rp.hero_image}
                        alt={rp.hero_alt || rp.title}
                        variant="card"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[rp.article_type] || "bg-muted text-muted-foreground border-border"}`}>
                        {(isAr ? TYPE_LABEL_AR : TYPE_LABEL)[rp.article_type] || rp.article_type}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground mt-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(rp.published_at || rp.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to blog */}
          <div className="mt-8">
            <Button asChild variant="outline" size="sm">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />{isAr ? "جميع المقالات" : "All Articles"}
              </Link>
            </Button>
          </div>
        </article>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default BlogPostPage;
