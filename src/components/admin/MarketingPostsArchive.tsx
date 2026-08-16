import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image, Copy, Calendar, Loader2, Film } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface MarketingPost {
  id: string;
  group_id: string | null;
  headline: string;
  caption_text: string;
  ad_primary_text: string;
  description: string;
  image_url_1x1: string | null;
  image_url_4x5: string | null;
  image_url_story: string | null;
  video_url: string | null;
  status: string;
  created_at: string;
}

export default function MarketingPostsArchive() {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  }

  // Group posts by month
  const months = Array.from(
    new Set(posts.map(p => format(parseISO(p.created_at), "yyyy-MM")))
  ).sort((a, b) => b.localeCompare(a));

  const filteredPosts = selectedMonth === "all"
    ? posts
    : posts.filter(p => format(parseISO(p.created_at), "yyyy-MM") === selectedMonth);

  // Group filtered posts by month for display
  const groupedByMonth = filteredPosts.reduce<Record<string, MarketingPost[]>>((acc, post) => {
    const key = format(parseISO(post.created_at), "yyyy-MM");
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  }

  function downloadImage(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  }

  async function downloadAllForMonth(monthKey: string) {
    const monthPosts = groupedByMonth[monthKey];
    if (!monthPosts?.length) return;

    setDownloading(true);
    try {
      // Collect all text content
      let textContent = `# Marketing Posts — ${format(parseISO(monthKey + "-01"), "MMMM yyyy")}\n\n`;

      for (const post of monthPosts) {
        textContent += `---\n## ${post.headline}\n`;
        textContent += `Created: ${format(parseISO(post.created_at), "MMM d, yyyy h:mm a")}\n\n`;
        if (post.caption_text) textContent += `### Caption\n${post.caption_text}\n\n`;
        if (post.ad_primary_text) textContent += `### Ad Primary Text\n${post.ad_primary_text}\n\n`;
        if (post.description) textContent += `### Description\n${post.description}\n\n`;

        const imageUrls = [
          post.image_url_1x1 && `1x1: ${post.image_url_1x1}`,
          post.image_url_4x5 && `4x5: ${post.image_url_4x5}`,
          post.image_url_story && `Story: ${post.image_url_story}`,
        ].filter(Boolean);

        if (imageUrls.length) {
          textContent += `### Image URLs\n${imageUrls.join("\n")}\n\n`;
        }
      }

      // Download text file
      const blob = new Blob([textContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing-posts-${monthKey}.md`;
      a.click();
      URL.revokeObjectURL(url);

      // Also download all images
      let imageCount = 0;
      for (const post of monthPosts) {
        const slug = post.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
        for (const [size, imgUrl] of Object.entries({
          "1x1": post.image_url_1x1,
          "4x5": post.image_url_4x5,
          "story": post.image_url_story,
        })) {
          if (imgUrl) {
            downloadImage(imgUrl, `${slug}-${size}.png`);
            imageCount++;
            // Small delay between downloads to avoid browser blocking
            if (imageCount > 1) await new Promise(r => setTimeout(r, 300));
          }
        }
      }

      toast({
        title: "Download started!",
        description: `Text file + ${imageCount} images for ${format(parseISO(monthKey + "-01"), "MMMM yyyy")}`,
      });
    } catch (err: any) {
      toast({ title: "Download error", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading saved posts…
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-8 text-center text-muted-foreground">
          No saved marketing posts yet. Generate content above to start building your archive.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map(m => (
                <SelectItem key={m} value={m}>
                  {format(parseISO(m + "-01"), "MMMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary">{filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Posts grouped by month */}
      {Object.entries(groupedByMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([monthKey, monthPosts]) => (
          <Card key={monthKey} className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {format(parseISO(monthKey + "-01"), "MMMM yyyy")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{monthPosts.length} posts</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAllForMonth(monthKey)}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 me-1 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 me-1" />
                    )}
                    Download All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {monthPosts.map(post => (
                <div key={post.id} className="border rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{post.headline || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(post.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {post.caption_text && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => copyToClipboard(post.caption_text, "Caption")}>
                          <Copy className="h-3 w-3 me-1" /> Caption
                        </Button>
                      )}
                      {post.ad_primary_text && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => copyToClipboard(post.ad_primary_text, "Ad copy")}>
                          <Copy className="h-3 w-3 me-1" /> Ad
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Reel video preview */}
                  {post.video_url && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="shrink-0 aspect-[9/16] w-24 rounded-lg overflow-hidden border shadow-sm bg-black">
                        <video
                          src={post.video_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-[10px] gap-1 w-fit">
                          <Film className="h-3 w-3" /> Reel
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            const slug = (post.headline || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
                            downloadImage(post.video_url!, `${slug}-reel.webm`);
                          }}
                        >
                          <Download className="h-3 w-3 me-1" /> Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Image thumbnails */}
                  {(post.image_url_1x1 || post.image_url_4x5 || post.image_url_story) && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {([
                        ["1x1", post.image_url_1x1, "aspect-square"],
                        ["4x5", post.image_url_4x5, "aspect-[4/5]"],
                        ["story", post.image_url_story, "aspect-[9/16]"],
                      ] as const).map(([size, url, aspectClass]) => {
                        if (!url) return null;
                        const slug = (post.headline || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
                        return (
                          <div key={size} className="shrink-0 space-y-1">
                            <div className={`${aspectClass} w-20 rounded-lg overflow-hidden border shadow-sm bg-muted`}>
                              <img src={url} alt={`${size}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">{size}</span>
                              <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px]"
                                onClick={() => downloadImage(url, `${slug}-${size}.png`)}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
