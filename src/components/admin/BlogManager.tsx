import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Upload, Sparkles, TrendingUp, Languages } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

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
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  seo_score: number;
}

const ARTICLE_TYPES = [
  { value: "howto", label: "How-To" },
  { value: "listicle", label: "Listicle" },
  { value: "longform", label: "Long-form" },
  { value: "news", label: "News" },
  { value: "review", label: "Review" },
];

const CTA_URL_OPTIONS = [
  { value: "/enroll-now", label: "Enroll Now" },
  { value: "/courses", label: "Courses" },
  { value: "/pricing", label: "Pricing" },
  { value: "/contact", label: "Contact" },
  { value: "/about", label: "About" },
  { value: "/faq", label: "FAQ" },
  { value: "/signup", label: "Sign Up" },
  { value: "/blog", label: "Blog" },
];

const generateCtaText = (title: string) => {
  if (!title) return "Start learning Korean today";
  const short = title.length > 40 ? title.slice(0, 40).replace(/\s+\S*$/, "…") : title;
  return `Ready? ${short} — Enroll Now!`;
};

/** Analyze title + description to pick the best CTA URL */
const generateCtaUrl = (title: string, description: string = "", articleType: string = "longform"): string => {
  const text = `${title} ${description}`.toLowerCase();

  // Pricing / cost related
  if (/price|pricing|cost|fee|afford|budget|cheap|expensive|plan|subscription/i.test(text)) return "/pricing";

  // FAQ / questions
  if (/faq|question|ask|how does|what is|common/i.test(text)) return "/faq";

  // Contact / inquiry
  if (/contact|reach|email|call|inquiry|support|help/i.test(text)) return "/contact";

  // About / story / team
  if (/about|story|team|teacher|instructor|who we|our mission/i.test(text)) return "/about";

  // Course detail / syllabus / curriculum
  if (/course|syllabus|curriculum|class|lesson|program|level|topik|beginner|intermediate|advanced/i.test(text)) return "/courses";

  // Sign up / register / join
  if (/sign\s?up|register|join|create account|get started/i.test(text)) return "/signup";

  // News articles link to blog
  if (articleType === "news") return "/blog";

  // Default: enroll
  return "/enroll-now";
};

const emptyPost = (): Partial<BlogPost> => ({
  title: "",
  slug: "",
  description: "",
  keywords: [],
  article_type: "longform",
  hero_image: "",
  hero_alt: "",
  hero_caption: "",
  hero_image_2: "",
  hero_alt_2: "",
  hero_caption_2: "",
  cta_text: "Start learning Korean today",
  cta_url: "/enroll-now",
  content: "",
  author: "KLovers Team",
  lang: "en",
  published: false,
  seo_score: 0,
});

/** Calculate SEO score out of 100 */
const calculateSeoScore = (post: Partial<BlogPost>, keywords: string): number => {
  let score = 0;
  const kws = keywords.split(",").map(k => k.trim()).filter(Boolean);

  // Title: exists (5) + length 30-60 chars (10) + contains keyword (5)
  if (post.title) {
    score += 5;
    if (post.title.length >= 30 && post.title.length <= 60) score += 10;
    else if (post.title.length > 0) score += 3;
    if (kws.some(k => post.title!.toLowerCase().includes(k.toLowerCase()))) score += 5;
  }

  // Description: exists (5) + length 120-160 chars (10) + contains keyword (5)
  if (post.description) {
    score += 5;
    if (post.description.length >= 120 && post.description.length <= 160) score += 10;
    else if (post.description.length >= 50) score += 5;
    if (kws.some(k => post.description!.toLowerCase().includes(k.toLowerCase()))) score += 5;
  }

  // Content: exists (5) + 300+ words (10) + 800+ words (5) + keyword density (5)
  if (post.content) {
    score += 5;
    const wordCount = post.content.split(/\s+/).length;
    if (wordCount >= 800) score += 15;
    else if (wordCount >= 300) score += 10;
    else if (wordCount >= 100) score += 5;

    // Has headings
    if (/^##?\s/m.test(post.content)) score += 5;
  }

  // Hero image 1: exists (5) + alt text (5)
  if (post.hero_image) { score += 5; }
  if (post.hero_alt && post.hero_alt.length > 10) score += 5;

  // Hero image 2: exists (3) + alt text (2)
  if (post.hero_image_2) score += 3;
  if (post.hero_alt_2 && post.hero_alt_2.length > 10) score += 2;

  // Keywords: 3+ keywords (5)
  if (kws.length >= 3) score += 5;
  else if (kws.length >= 1) score += 2;

  // CTA: exists (5)
  if (post.cta_text && post.cta_url) score += 5;

  return Math.min(score, 100);
};

const getSeoColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-destructive";
};

const getSeoLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
};

const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<BlogPost>>(emptyPost());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingImage2, setGeneratingImage2] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [translating, setTranslating] = useState<string | null>(null);

  const liveScore = calculateSeoScore(editing, keywordsInput);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openNew = () => {
    setEditing(emptyPost());
    setKeywordsInput("");
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing({ ...post });
    setKeywordsInput((post.keywords || []).join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.title || !editing.slug || !editing.content) {
      toast({ title: "Missing fields", description: "Title, slug, and content are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const seoScore = calculateSeoScore(editing, keywordsInput);
    const payload = {
      title: editing.title,
      slug: editing.slug,
      description: editing.description || "",
      keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
      article_type: editing.article_type || "longform",
      hero_image: editing.hero_image || "",
      hero_alt: editing.hero_alt || "",
      hero_caption: editing.hero_caption || "",
      hero_image_2: editing.hero_image_2 || "",
      hero_alt_2: editing.hero_alt_2 || "",
      hero_caption_2: editing.hero_caption_2 || "",
      cta_text: editing.cta_text || "",
      cta_url: editing.cta_url || "",
      content: editing.content,
      author: editing.author || "KLovers Team",
      lang: editing.lang || "en",
      published: editing.published || false,
      published_at: editing.published ? (editing.published_at || new Date().toISOString()) : null,
      seo_score: seoScore,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing.id ? "Post updated" : "Post created" });
      setDialogOpen(false);
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted" });
      fetchPosts();
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const newPublished = !post.published;
    const { error } = await supabase.from("blog_posts").update({
      published: newPublished,
      published_at: newPublished ? (post.published_at || new Date().toISOString()) : post.published_at,
    }).eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchPosts();
    }
  };

  const handleTranslate = async (post: BlogPost) => {
    if (post.lang !== "en") {
      toast({ title: "Only English articles can be translated", variant: "destructive" });
      return;
    }
    setTranslating(post.id);
    try {
      const { data, error } = await supabase.functions.invoke("translate-article", {
        body: { slug: post.slug },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Article translated to Arabic!", description: `Slug: ${data.slug}` });
      fetchPosts();
    } catch (e: any) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setTranslating(null);
    }
  };

  const handleTranslateToEn = async (post: BlogPost) => {
    if (post.lang !== "ar") return;
    if (!post.slug.endsWith("-ar")) {
      toast({ title: "Cannot auto-translate", description: "This Arabic post's slug doesn't follow the -ar convention.", variant: "destructive" });
      return;
    }
    setTranslating(post.id);
    try {
      const { data, error } = await supabase.functions.invoke("translate-article", {
        body: { slug: post.slug, direction: "ar-to-en" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Article translated to English!", description: `Slug: ${data.slug}` });
      fetchPosts();
    } catch (e: any) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setTranslating(null);
    }
  };

  const enSlugs = new Set(posts.filter((p) => p.lang === "en").map((p) => p.slug));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setUploadState = imageNum === 1 ? setUploading : setUploading2;
    setUploadState(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Upload error", description: error.message, variant: "destructive" });
      setUploadState(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
    if (imageNum === 1) {
      setEditing((prev) => ({ ...prev, hero_image: urlData.publicUrl }));
    } else {
      setEditing((prev) => ({ ...prev, hero_image_2: urlData.publicUrl }));
    }
    setUploadState(false);
    toast({ title: "Image uploaded" });
  };

  const generateAiImage = async (imageNum: 1 | 2) => {
    if (!editing.title) {
      toast({ title: "Title required", description: "Enter a title first.", variant: "destructive" });
      return;
    }
    const setGen = imageNum === 1 ? setGeneratingImage : setGeneratingImage2;
    setGen(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-image", {
        body: {
          title: editing.title + (imageNum === 2 ? " - visual guide" : ""),
          description: editing.description || "",
          article_type: editing.article_type || "longform",
          keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (imageNum === 1) {
        setEditing((prev) => ({
          ...prev,
          hero_image: data.hero_image,
          hero_alt: data.hero_alt,
          hero_caption: data.hero_caption,
        }));
      } else {
        setEditing((prev) => ({
          ...prev,
          hero_image_2: data.hero_image,
          hero_alt_2: data.hero_alt,
          hero_caption_2: data.hero_caption,
        }));
      }
      toast({ title: `SEO image ${imageNum} generated!` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setGen(false);
    }
  };

  const filtered = posts.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" disabled={!!translating} onClick={async () => {
            const enPosts = posts.filter(p => p.lang === "en");
            for (const post of enPosts) {
              await handleTranslate(post);
            }
          }}>
            <Languages className="h-4 w-4" /> Translate All
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No posts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lang</TableHead>
                <TableHead>SEO Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.article_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{post.lang === "ar" ? "AR" : "EN"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={post.seo_score || 0} className="w-16 h-2" />
                      <span className={`text-xs font-semibold ${getSeoColor(post.seo_score || 0)}`}>
                        {post.seo_score || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {post.lang === "en" && (
                      <Button variant="ghost" size="icon" onClick={() => handleTranslate(post)} disabled={translating === post.id} title="Translate to Arabic" aria-label="Translate to Arabic">
                        <Languages className={`h-4 w-4 ${translating === post.id ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                    {post.lang === "ar" && post.slug.endsWith("-ar") && !enSlugs.has(post.slug.replace(/-ar$/, "")) && (
                      <Button variant="ghost" size="icon" onClick={() => handleTranslateToEn(post)} disabled={translating === post.id} title="Translate to English" aria-label="Translate to English">
                        <Languages className={`h-4 w-4 text-blue-600 ${translating === post.id ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} title={post.published ? "Unpublish" : "Publish"} aria-label={post.published ? "Unpublish post" : "Publish post"}>
                      {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(post)} aria-label="Edit post">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Delete post"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete post?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete "{post.title}".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(post.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>

          {/* Live SEO Score */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">SEO Score</span>
                <span className={`text-sm font-bold ${getSeoColor(liveScore)}`}>
                  {liveScore}% — {getSeoLabel(liveScore)}
                </span>
              </div>
              <Progress value={liveScore} className="h-2" />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditing((prev) => ({
                      ...prev,
                      title,
                      slug: prev?.id ? prev.slug : generateSlug(title),
                      cta_text: generateCtaText(title),
                      cta_url: generateCtaUrl(title, prev?.description || "", prev?.article_type || "longform"),
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">{(editing.title || "").length}/60 chars (30-60 ideal)</p>
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={editing.slug || ""} onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (meta)</Label>
              <Textarea
                value={editing.description || ""}
                onChange={(e) => {
                  const description = e.target.value;
                  setEditing((prev) => ({
                    ...prev,
                    description,
                    cta_url: generateCtaUrl(prev?.title || "", description, prev?.article_type || "longform"),
                  }));
                }}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">{(editing.description || "").length}/160 chars (120-160 ideal)</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Article Type</Label>
                <Select value={editing.article_type || "longform"} onValueChange={(v) => setEditing((prev) => ({ ...prev, article_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARTICLE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={editing.author || ""} onChange={(e) => setEditing((prev) => ({ ...prev, author: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={editing.lang || "en"} onValueChange={(v) => setEditing((prev) => ({ ...prev, lang: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} placeholder="korean, learn, beginner" />
              <p className="text-xs text-muted-foreground">3+ keywords recommended for SEO</p>
            </div>

            {/* Hero Image 1 */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Hero Image 1 (Primary)</Label>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs"
                  disabled={generatingImage || !editing.title}
                  onClick={() => generateAiImage(1)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingImage ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input value={editing.hero_image || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_image: e.target.value }))} placeholder="URL or upload" className="flex-1" />
                    <Button variant="outline" size="icon" asChild className="relative" disabled={uploading} aria-label="Upload hero image 1">
                      <label>
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleImageUpload(e, 1)} />
                      </label>
                    </Button>
                  </div>
                  {editing.hero_image && (
                    <img src={editing.hero_image} alt="Preview" className="h-24 w-full object-cover rounded mt-1" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Alt Text (SEO)</Label>
                  <Input value={editing.hero_alt || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_alt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Caption</Label>
                  <Input value={editing.hero_caption || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_caption: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Hero Image 2 */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Hero Image 2 (Secondary)</Label>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-xs"
                  disabled={generatingImage2 || !editing.title}
                  onClick={() => generateAiImage(2)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingImage2 ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input value={editing.hero_image_2 || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_image_2: e.target.value }))} placeholder="URL or upload" className="flex-1" />
                    <Button variant="outline" size="icon" asChild className="relative" disabled={uploading2} aria-label="Upload hero image 2">
                      <label>
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleImageUpload(e, 2)} />
                      </label>
                    </Button>
                  </div>
                  {editing.hero_image_2 && (
                    <img src={editing.hero_image_2} alt="Preview 2" className="h-24 w-full object-cover rounded mt-1" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Alt Text (SEO)</Label>
                  <Input value={editing.hero_alt_2 || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_alt_2: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Caption</Label>
                  <Input value={editing.hero_caption_2 || ""} onChange={(e) => setEditing((prev) => ({ ...prev, hero_caption_2: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input value={editing.cta_text || ""} onChange={(e) => setEditing((prev) => ({ ...prev, cta_text: e.target.value }))} placeholder="Start Learning Korean Today!" />
              </div>
              <div className="space-y-2">
                <Label>CTA URL</Label>
                <div className="flex gap-2">
                  <Select
                    value={CTA_URL_OPTIONS.some(o => o.value === editing.cta_url) ? editing.cta_url : "custom"}
                    onValueChange={(v) => {
                      if (v !== "custom") setEditing((prev) => ({ ...prev, cta_url: v }));
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_URL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={editing.cta_url || ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, cta_url: e.target.value }))}
                    placeholder="/enroll-now"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown) *</Label>
              <Textarea
                value={editing.content || ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
                rows={16}
                className="font-mono text-sm"
                placeholder="Write your article in Markdown..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={editing.published || false}
                onCheckedChange={(v) => setEditing((prev) => ({ ...prev, published: v }))}
              />
              <Label>Published</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing.id ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(BlogManager);
