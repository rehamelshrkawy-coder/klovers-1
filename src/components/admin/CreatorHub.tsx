import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Plus, Trash2, ChevronLeft, ChevronRight, Grid3X3, Upload, Monitor, Smartphone, DownloadCloud, Sparkles, Loader2, CheckCircle2, RefreshCw, ImageIcon, Video, Film } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  type PostData,
  type TemplateName,
  type ColorTheme,
  type FormatKey,
  type GridPattern,
  type FormatOption,
  FORMATS,
  THEME_COLORS,
  TEMPLATE_META,
  GRID_PATTERN_META,
  getGridSlots,
  renderPost,
  renderReelCover,
  preloadMascot,
} from "@/lib/canvasRenderer";
import { generateMonthlyPlan, monthlyPostToPostData, generatePublishingCopy, generateReelPublishingCopy, isWhatsAppCTA, CAMPAIGN_CONFIGS, type MonthlyPostType, type GroupData, type CampaignDirection, type ReelScript } from "@/lib/marketingEngine";
import { supabase } from "@/integrations/supabase/client";
import { loadUnsplashForTemplate, loadUnsplashImage } from "@/lib/unsplash";
import { composeReel, downloadBlob, type ReelSlideContent } from "@/lib/reelComposer";

interface StockVideoResult {
  id: number;
  url: string;
  preview: string;
  duration: number;
  width: number;
  height: number;
}

const FONT_STYLES = ["Bold Italic", "Normal", "Small"] as const;

// Premium 30-post content pack — matching instagram-posts.html designs
const PREMIUM_POSTS: { mainText: string; subtitle: string; extraText: string; style: TemplateName }[] = [
  { mainText: "START SPEAKING\nKOREAN\nNOT JUST\nSTUDYING IT.", subtitle: "Live classes that get you talking from day one.", extraText: "#LearnKorean #Klovers #SpeakKorean", style: "klovers_bold" },
  { mainText: "사랑", subtitle: "sa-rang\nLove — The most searched Korean word worldwide", extraText: "#KoreanWord #Klovers #WOTD", style: "klovers_tip" },
  { mainText: "WHY K-DRAMA FANS\nLEARN KOREAN\nFASTER THAN ANYONE", subtitle: "Passion is the best teacher. We just give it structure.", extraText: "#KDrama #LearnKorean #Klovers", style: "klovers_varsity" },
  { mainText: "500+", subtitle: "Students Taught\nFrom 15+ countries — all learning Korean the right way with live classes.", extraText: "#Klovers #KoreanAcademy", style: "klovers_stats" },
  { mainText: "STOP MEMORIZING.\nSTART SPEAKING.", subtitle: "The #1 mistake beginners make is studying grammar without ever opening their mouth. Our live classes fix that.", extraText: "#KoreanTip #Klovers #LearnKorean", style: "klovers_tip" },
  { mainText: "\"I went from zero to ordering in Korean at a restaurant in Seoul — in 3 months.\"", subtitle: "— Sara, Egypt\nKlovers Academy", extraText: "#StudentSuccess #Klovers", style: "klovers_quote" },
  { mainText: "YOUR FAVORITE\nK-DRAMA\nIS YOUR BEST\nTEXTBOOK.", subtitle: "We teach you how to actually learn from what you watch.", extraText: "#KDrama #KPop #LearnKorean #Klovers", style: "klovers_bold" },
  { mainText: "화이팅", subtitle: "hwa-i-ting\nFighting! — Used to cheer someone on", extraText: "#KoreanWord #Klovers #WOTD", style: "klovers_tip" },
  { mainText: "5 REASONS YOU'RE\nNOT IMPROVING", subtitle: "You only use apps, never speak\nYou skip pronunciation practice\nYou study grammar without context\nYou don't have a structured plan\nYou learn alone with no feedback", extraText: "#KoreanTips #Klovers", style: "klovers_list" },
  { mainText: "WHAT HAPPENS\nWHEN YOUR\nKOREAN CLICKS", subtitle: "That moment when you understand without subtitles — we get you there.", extraText: "#LearnKorean #Klovers #KoreanGoals", style: "klovers_varsity" },
  { mainText: "DUOLINGO\nWON'T TEACH\nYOU REAL\nKOREAN.", subtitle: "Apps are fun. But speaking to a real teacher is how you actually learn.", extraText: "#LearnKorean #Klovers #RealKorean", style: "klovers_bold" },
  { mainText: "HANGUL WAS\nDESIGNED TO BE\nLEARNED IN ONE DAY.", subtitle: "King Sejong created the Korean alphabet so anyone could read. We teach you Hangul in your very first class.", extraText: "#Hangul #KoreanTip #Klovers", style: "klovers_tip" },
  { mainText: "4.9★", subtitle: "Average Rating\nRated by real students across 15+ countries. We don't just teach — we deliver results.", extraText: "#Klovers #KoreanAcademy #Rated", style: "klovers_stats" },
  { mainText: "감사합니다", subtitle: "gam-sa-ham-ni-da\nThank you — The first phrase every learner needs", extraText: "#KoreanWord #Klovers #WOTD", style: "klovers_tip" },
  { mainText: "SMALL GROUPS.\nBIG PROGRESS.", subtitle: "Max 6 students per class. Everyone speaks. Everyone improves.", extraText: "#LiveClasses #Klovers #SmallGroup", style: "klovers_varsity" },
  { mainText: "\"I tried apps for a year. Three months with K-Lovers taught me more than all of them combined.\"", subtitle: "— Ahmed, Saudi Arabia\nKlovers Academy", extraText: "#StudentSuccess #Klovers", style: "klovers_quote" },
  { mainText: "FREE TRIAL\nCLASS.\nNO COMMITMENT.\nJUST TRY.", subtitle: "See what real Korean learning feels like — book your free session now.", extraText: "#FreeTrial #LearnKorean #Klovers", style: "klovers_bold" },
  { mainText: "WHAT YOU GET IN\nEVERY CLASS", subtitle: "Live interaction with your teacher\nSpeaking practice every session\nReal Korean, not textbook Korean\nHomework & personalized feedback\nCultural context with every lesson", extraText: "#KoreanClass #Klovers", style: "klovers_list" },
  { mainText: "맛있다", subtitle: "ma-sit-da\nDelicious — Perfect for your next Korean food adventure", extraText: "#KoreanWord #Klovers #WOTD", style: "klovers_tip" },
  { mainText: "YOU DON'T NEED\nTO LIVE IN KOREA\nTO SPEAK KOREAN.", subtitle: "Our students speak Korean from Egypt, Saudi Arabia, UAE, and 12 other countries — all online, all live.", extraText: "#MythBuster #Klovers #OnlineKorean", style: "klovers_tip" },
  { mainText: "YOUR KOREAN\nJOURNEY STARTS\nWITH ONE CLASS", subtitle: "Book your free trial. We handle the rest.", extraText: "#LearnKorean #Klovers #StartNow", style: "klovers_varsity" },
  { mainText: "CONSISTENCY\nBEATS\nTALENT.\nEVERY TIME.", subtitle: "30 minutes a day beats 5 hours on a weekend. Stay consistent.", extraText: "#Motivation #Klovers #LearnKorean", style: "klovers_bold" },
  { mainText: "15+", subtitle: "Countries\nOur community spans the Middle East, North Africa, and beyond. Korean connects us all.", extraText: "#Klovers #Global #KoreanCommunity", style: "klovers_stats" },
  { mainText: "\"My Korean teacher said my pronunciation was nearly perfect. That's K-Lovers training.\"", subtitle: "— Nour, UAE\nKlovers Academy", extraText: "#StudentSuccess #Klovers", style: "klovers_quote" },
  { mainText: "꿈", subtitle: "kkum\nDream — Chase yours. Start learning Korean today.", extraText: "#KoreanWord #Klovers #WOTD", style: "klovers_tip" },
  { mainText: "WATCHING\nK-POP VIDEOS\nISN'T STUDYING.\nBUT IT CAN BE.", subtitle: "We show you how to turn your hobby into real language skills.", extraText: "#KPop #LearnKorean #Klovers", style: "klovers_bold" },
  { mainText: "OUR LEVELS", subtitle: "Beginner — Hangul to basic conversations\nElementary — Daily life Korean\nIntermediate — Express opinions & feelings\nAdvanced — Fluent discussions & formal Korean", extraText: "#KoreanLevels #Klovers", style: "klovers_list" },
  { mainText: "LEARN THE\nCULTURE,\nNOT JUST THE\nLANGUAGE.", subtitle: "Understanding honorifics, age culture, and social norms makes your Korean sound natural — not robotic.", extraText: "#ProTip #Klovers #KoreanCulture", style: "klovers_tip" },
  { mainText: "NEW SEMESTER.\nNEW YOU.\nNEW LANGUAGE.", subtitle: "Limited spots. Enroll now and start your Korean journey this month.", extraText: "#EnrollNow #Klovers #NewSemester", style: "klovers_varsity" },
  { mainText: "THE BEST TIME\nTO START WAS\nYESTERDAY.\nTHE NEXT BEST\nTIME IS NOW.", subtitle: "Book your free trial class — kloversegy.com", extraText: "#Klovers #LearnKorean #StartNow", style: "klovers_bold" },
];

function getMonthlyDefaultPosts(): PostData[] {
  return PREMIUM_POSTS.map((p, i) => ({
    id: uid(),
    mainText: p.mainText,
    subtitle: p.subtitle,
    extraText: p.extraText,
  }));
}

interface MonthlyDraftPost {
  id: string; day: number; postType: MonthlyPostType; caption: string;
  mainText: string; subtitle: string; extraText: string;
  approved: boolean; scheduledDate: string;
  templateName: TemplateName; themeName: ColorTheme;
  useWhatsApp: boolean;
  isReel: boolean;
  reelScript?: ReelScript;
}

const POST_TYPE_AFFINITY: Record<MonthlyPostType, { templateName: TemplateName; themeName: ColorTheme }> = {
  empty_slots:    { templateName: "klovers_alert",        themeName: "yellow" },
  countdown:      { templateName: "klovers_countdown",    themeName: "midnight" },
  testimonial:    { templateName: "klovers_quote",        themeName: "yellow" },
  faq:            { templateName: "klovers_varsity",      themeName: "midnight" },
  referral:       { templateName: "klovers_mascot_left",  themeName: "yellow" },
  discount:       { templateName: "klovers_split",        themeName: "yellow" },
  invite_student: { templateName: "klovers_mascot_right", themeName: "midnight" },
  tip:            { templateName: "klovers_tip",          themeName: "yellow" },
  culture:        { templateName: "klovers_bold",         themeName: "yellow" },
};

// All 18 templates — balanced cycle for 30-post generator
const ALL_TEMPLATES: TemplateName[] = [
  "klovers_bold", "klovers_varsity", "klovers_split",
  "klovers_alert", "klovers_countdown", "klovers_quote", "klovers_tip",
  "klovers_mascot_left", "klovers_mascot_right",
  "klovers_stats", "klovers_list",
  "classic", "character", "minimal", "gradient", "neon", "dark", "editorial",
];
const BALANCE_CYCLE: TemplateName[] = ALL_TEMPLATES;
const BALANCE_THEME: Record<TemplateName, ColorTheme> = {
  klovers_bold: "yellow", klovers_varsity: "midnight", klovers_split: "yellow",
  klovers_alert: "yellow", klovers_countdown: "midnight", klovers_quote: "yellow", klovers_tip: "yellow",
  klovers_mascot_left: "yellow", klovers_mascot_right: "midnight",
  klovers_stats: "midnight", klovers_list: "midnight",
  classic: "yellow", character: "yellow", minimal: "yellow",
  gradient: "yellow", neon: "midnight", dark: "midnight", editorial: "yellow",
};

const PostPreview = memo(function PostPreview({ post, template, theme, size = 270 }: {
  post: PostData; template: TemplateName; theme: ColorTheme; size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    c.width = size;
    c.height = size;
    renderPost(c, post, template, theme, "instagram");
  }, [post.mainText, post.subtitle, post.extraText, template, theme, size]);
  return <canvas ref={ref} style={{ width: size, height: size, display: "block" }} className="rounded-lg" />;
});

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ─── Platform Grid Previews ───
function PlatformGridPreviews({ posts, template, theme, bgImage, postTemplates }: {
  posts: PostData[];
  template: TemplateName;
  theme: ColorTheme;
  bgImage: HTMLImageElement | null;
  postTemplates?: Array<{ template: TemplateName; theme: ColorTheme }>;
}) {
  const igRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const fbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const storyRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const tiktokRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const display = posts.slice(0, 30);
    display.forEach((post, i) => {
      const t = postTemplates?.[i]?.template ?? template;
      const th = postTemplates?.[i]?.theme ?? theme;
      // Instagram 1:1
      const ig = igRefs.current[i];
      if (ig) { ig.width = 300; ig.height = 300; renderPost(ig, post, t, th, "instagram", bgImage); }
      // Facebook
      const fb = fbRefs.current[i];
      if (fb) { fb.width = 360; fb.height = 189; renderPost(fb, post, t, th, "facebook", bgImage); }
      // Story
      const st = storyRefs.current[i];
      if (st) { st.width = 180; st.height = 320; renderPost(st, post, t, th, "story", bgImage); }
      // TikTok
      const tt = tiktokRefs.current[i];
      if (tt) { tt.width = 180; tt.height = 320; renderPost(tt, post, t, th, "tiktok", bgImage); }
    });
  }, [posts, template, theme, bgImage, postTemplates]);

  const display = posts.slice(0, 30);
  if (display.length < 1) return null;

  const cols = 3;

  return (
    <Tabs defaultValue="instagram" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="instagram" className="text-xs gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5" /> Instagram
        </TabsTrigger>
        <TabsTrigger value="facebook" className="text-xs gap-1.5">
          <Monitor className="h-3.5 w-3.5" /> Facebook
        </TabsTrigger>
        <TabsTrigger value="stories" className="text-xs gap-1.5">
          <Smartphone className="h-3.5 w-3.5" /> Stories
        </TabsTrigger>
        <TabsTrigger value="tiktok" className="text-xs gap-1.5">
          <Smartphone className="h-3.5 w-3.5" /> TikTok
        </TabsTrigger>
      </TabsList>

      {/* Instagram Grid 3x3 */}
      <TabsContent value="instagram">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Instagram Profile Grid</span>
              <Badge variant="outline" className="text-[10px]">{display.length} posts</Badge>
            </div>
            {/* Mock IG profile header */}
            <div className="bg-card border rounded-t-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">K</div>
              <div>
                <p className="text-xs font-bold text-foreground">klovers_academy</p>
                <p className="text-[10px] text-muted-foreground">{display.length} posts • 1.2K followers</p>
              </div>
            </div>
            <div
              className="grid gap-0.5 rounded-b-xl overflow-hidden border border-t-0 bg-border"
              style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
            >
              {display.map((post, i) => (
                <canvas
                  key={post.id}
                  ref={el => { igRefs.current[i] = el; }}
                  className="w-full aspect-square"
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1080 — {display.length} posts — How your grid looks on Instagram</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Facebook Timeline */}
      <TabsContent value="facebook">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Facebook Timeline Feed</span>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              {display.slice(0, 4).map((post, i) => (
                <div key={post.id} className="bg-card border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 p-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">K</div>
                    <div>
                      <p className="text-[10px] font-semibold text-foreground">KLovers Academy</p>
                      <p className="text-[9px] text-muted-foreground">Sponsored · 🌐</p>
                    </div>
                  </div>
                  {post.subtitle && <p className="text-[10px] text-foreground px-2.5 pb-1">{post.subtitle}</p>}
                  <canvas
                    ref={el => { fbRefs.current[i] = el; }}
                    className="w-full aspect-[1200/630]"
                  />
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-t text-[9px] text-muted-foreground">
                    <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1200×630 — Facebook timeline preview</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Stories */}
      <TabsContent value="stories">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Instagram Stories Tray</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {display.slice(0, 6).map((post, i) => (
                <div key={post.id} className="shrink-0 space-y-1">
                  <div className="w-20 rounded-xl overflow-hidden border-2 border-primary shadow-md">
                    <canvas
                      ref={el => { storyRefs.current[i] = el; }}
                      className="w-full aspect-[9/16]"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center truncate w-20">
                    {post.mainText.slice(0, 12) || `Story ${i + 1}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1920 — Swipeable story sequence</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TikTok */}
      <TabsContent value="tiktok">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">TikTok Profile Grid</span>
            </div>
            <div
              className="grid gap-0.5 rounded-xl overflow-hidden border bg-border mx-auto"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols * 100 }}
            >
              {display.map((post, i) => (
                <canvas
                  key={post.id}
                  ref={el => { tiktokRefs.current[i] = el; }}
                  className="w-full aspect-[9/16]"
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1920 — TikTok profile grid view</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── All Templates Preview ───
// Show all 10 templates as a selectable gallery
const TEMPLATE_CARDS: TemplateName[] = [
  "klovers_bold", "klovers_varsity", "klovers_split",
  "klovers_alert", "klovers_countdown", "klovers_quote", "klovers_tip",
  "klovers_mascot_left", "klovers_mascot_right",
  "klovers_stats", "klovers_list",
  "classic", "character", "minimal", "gradient", "neon", "dark", "editorial",
];
const TEMPLATE_LABELS: Record<TemplateName, { label: string; desc: string }> = {
  klovers_bold:         { label: "⚡ Bold",      desc: "Big white headlines" },
  klovers_varsity:      { label: "🏆 Varsity",   desc: "Dark + photo overlay" },
  klovers_split:        { label: "✂ Split",      desc: "Diagonal CTA" },
  klovers_alert:        { label: "🔴 Alert",     desc: "Seat counter" },
  klovers_countdown:    { label: "⏳ Countdown", desc: "Days-left ring" },
  klovers_quote:        { label: "💬 Quote",     desc: "Testimonial" },
  klovers_tip:          { label: "💡 Tip",       desc: "Korean word / tip" },
  klovers_mascot_left:  { label: "🧑‍🎓 Mascot L", desc: "Characters left" },
  klovers_mascot_right: { label: "🧑‍🎓 Mascot R", desc: "Characters right" },
  klovers_stats:        { label: "📊 Stats",     desc: "Large number" },
  klovers_list:         { label: "📋 List",      desc: "Numbered items" },
  classic:              { label: "🟨 Classic",   desc: "Yellow background" },
  character:            { label: "🎨 Character", desc: "Illustrated" },
  minimal:              { label: "□ Minimal",    desc: "Border inset" },
  gradient:             { label: "🌈 Gradient",  desc: "Color blend" },
  neon:                 { label: "✨ Neon",      desc: "Dark glow" },
  dark:                 { label: "🌙 Dark",      desc: "Elegant dark" },
  editorial:            { label: "📄 Editorial", desc: "Magazine" },
};

function AllTemplateCards({ post, theme, format, active, onSelect, bgImage }: {
  post: PostData;
  theme: ColorTheme;
  format: FormatKey;
  active: TemplateName;
  onSelect: (t: TemplateName) => void;
  bgImage?: HTMLImageElement | null;
}) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    TEMPLATE_CARDS.forEach((tpl, i) => {
      const c = refs.current[i];
      if (!c) return;
      c.width = 300; c.height = 300;
      renderPost(c, post, tpl, theme, format, bgImage);
    });
  }, [post, theme, format, bgImage]);

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">All Templates ({TEMPLATE_CARDS.length})</h3>
      <div className="grid grid-cols-5 gap-2">
        {TEMPLATE_CARDS.map((tpl, i) => {
          const meta = TEMPLATE_LABELS[tpl];
          const isActive = active === tpl;
          return (
            <button
              key={tpl}
              onClick={() => onSelect(tpl)}
              className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                isActive ? "border-primary shadow-lg shadow-primary/20 scale-[1.03]" : "border-border hover:border-primary/50"
              }`}
            >
              <canvas
                ref={el => { refs.current[i] = el; }}
                className="w-full aspect-square block"
                style={{ imageRendering: "auto" }}
              />
              <div className="px-2 py-1.5 bg-card">
                <p className="text-[11px] font-bold text-foreground leading-none">{meta.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{meta.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function CreatorHub() {
  // Preload mascot image for mascot templates
  useEffect(() => { preloadMascot(); }, []);

  const [posts, setPosts] = useState<PostData[]>(() => getMonthlyDefaultPosts());
  const [activeIndex, setActiveIndex] = useState(0);
  const [template, setTemplate] = useState<TemplateName>("classic");
  const [theme, setTheme] = useState<ColorTheme>("yellow");
  const [format, setFormat] = useState<FormatKey>("instagram");
  const [mainFontStyle, setMainFontStyle] = useState<string>("Bold Italic");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [gridPattern, setGridPattern] = useState<GridPattern>("custom");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDirection>("balanced");

  // ── Monthly generator state ──
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(500);
  const [monthlyDrafts, setMonthlyDrafts] = useState<MonthlyDraftPost[]>([]);
  const [editingDraft, setEditingDraft] = useState<MonthlyDraftPost | null>(null);
  const [editDraftText, setEditDraftText] = useState({ mainText: "", subtitle: "", extraText: "" });
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // ── Reel Maker state ──
  const [reelDraft, setReelDraft] = useState<MonthlyDraftPost | null>(null);
  const [reelStockVideos, setReelStockVideos] = useState<StockVideoResult[]>([]);
  const [reelSearching, setReelSearching] = useState(false);
  const [reelComposing, setReelComposing] = useState(false);
  const [reelProgress, setReelProgress] = useState(0);
  const [reelPickedVideoId, setReelPickedVideoId] = useState<number | null>(null);

  const groupPostsAdded = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePost = posts[activeIndex] || posts[0];

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePost) return;
    const fmt = FORMATS[format];
    const maxPreview = 560;
    const ratio = fmt.h / fmt.w;
    canvas.width = maxPreview;
    canvas.height = maxPreview * ratio;
    renderPost(canvas, activePost, template, theme, format, bgImage);
  }, [activePost, template, theme, format, bgImage]);

  useEffect(() => { redraw(); }, [redraw]);

  // Auto-load Unsplash photo when template or format changes
  useEffect(() => {
    let cancelled = false;
    const fmt = FORMATS[format];
    setUnsplashLoading(true);
    loadUnsplashForTemplate(template, fmt.w, fmt.h).then(img => {
      if (cancelled) return;
      if (img) setBgImage(img);
      setUnsplashLoading(false);
    });
    return () => { cancelled = true; };
  }, [template, format]);

  function updatePost(field: keyof PostData, value: string) {
    setPosts(prev => prev.map((p, i) => i === activeIndex ? { ...p, [field]: value } : p));
  }

  function addPost() {
    const newPost: PostData = { id: uid(), mainText: "", subtitle: "", extraText: "" };
    setPosts(prev => [...prev, newPost]);
    setActiveIndex(posts.length);
  }

  function removePost(idx: number) {
    if (posts.length <= 1) return;
    setPosts(prev => prev.filter((_, i) => i !== idx));
    setActiveIndex(Math.max(0, activeIndex >= idx ? activeIndex - 1 : activeIndex));
  }

  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = URL.createObjectURL(file);
  }

  async function handleUnsplashLoad() {
    setUnsplashLoading(true);
    const fmt = FORMATS[format];
    const img = await loadUnsplashForTemplate(template, fmt.w, fmt.h);
    if (img) {
      setBgImage(img);
      toast({ title: "Photo loaded", description: "Unsplash photo applied as background." });
    } else {
      toast({ title: "Photo failed", description: "Could not load image. Try again.", variant: "destructive" });
    }
    setUnsplashLoading(false);
  }

  function handleDownload() {
    const fmt = FORMATS[format];
    const dlCanvas = document.createElement("canvas");
    dlCanvas.width = fmt.w;
    dlCanvas.height = fmt.h;
    renderPost(dlCanvas, activePost, template, theme, format, bgImage);
    const link = document.createElement("a");
    link.download = `klovers-post-${format}-${Date.now()}.png`;
    link.href = dlCanvas.toDataURL("image/png");
    link.click();
    toast({ title: "Downloaded!", description: `${fmt.w}×${fmt.h} image saved.` });
  }

  function handleDownloadAll() {
    const fmt = FORMATS[format];
    posts.forEach((post, i) => {
      const dlCanvas = document.createElement("canvas");
      dlCanvas.width = fmt.w;
      dlCanvas.height = fmt.h;
      renderPost(dlCanvas, post, template, theme, format, bgImage);
      const link = document.createElement("a");
      link.download = `klovers-${format}-${i + 1}-${Date.now()}.png`;
      link.href = dlCanvas.toDataURL("image/png");
      setTimeout(() => link.click(), i * 200);
    });
    toast({ title: "Downloading all!", description: `${posts.length} images at ${fmt.w}×${fmt.h}` });
  }

  // ── Fetch groups for monthly generator ──
  useEffect(() => {
    (async () => {
      try {
        // Fetch real student count
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        if (count && count > 0) setStudentCount(count);

        const { data: pkgGroups } = await supabase.from("pkg_groups").select("id, name, capacity, package_id, is_active").eq("is_active", true).limit(500);
        if (!pkgGroups?.length) { setGroupsLoading(false); return; }
        const packageIds = [...new Set(pkgGroups.map(g => g.package_id))];
        const { data: packages } = await supabase.from("schedule_packages").select("id, level, day_of_week, start_time, duration_min, capacity, is_active").in("id", packageIds).eq("is_active", true);
        const pkgMap = new Map((packages || []).map(p => [p.id, p]));
        const { data: members } = await supabase.from("pkg_group_members").select("group_id, user_id, member_status").eq("member_status", "active").limit(5000);
        const memberCounts = new Map<string, number>();
        (members || []).forEach(m => { memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1); });
        const DAY_NAMES: Record<number, string> = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
        const fmt12 = (t: string) => { const [h, m] = t.split(":"); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };
        const result: GroupData[] = [];
        for (const g of pkgGroups) {
          const pkg = pkgMap.get(g.package_id); if (!pkg) continue;
          const activeMembers = memberCounts.get(g.id) || 0;
          const seatsLeft = g.capacity - activeMembers; if (seatsLeft <= 0) continue;
          result.push({ id: g.id, name: g.name, level: pkg.level, day_name: DAY_NAMES[pkg.day_of_week] || "Unknown", start_time: fmt12(pkg.start_time), duration_min: pkg.duration_min, capacity: g.capacity, active_members: activeMembers, seats_left: seatsLeft, urgency_label: seatsLeft <= 2 ? "Last Seats" : seatsLeft <= 5 ? "Starting Soon" : "Open Registration", package_id: g.package_id });
        }
        setGroups(result);

        // Prepend real open-slot announcements to the posts panel (once only)
        if (!groupPostsAdded.current && result.length > 0) {
          groupPostsAdded.current = true;
          const urgencyIcon = (seats: number) => seats <= 2 ? "🔥" : seats <= 5 ? "⚡" : "✅";
          const groupPosts: PostData[] = result.map(g => ({
            id: uid(),
            mainText: `${g.level} Korean — ${g.day_name} ${g.start_time}`,
            subtitle: `${urgencyIcon(g.seats_left)} ${g.seats_left} seat${g.seats_left === 1 ? "" : "s"} left — Register now before it fills up!`,
            extraText: "#OpenClass #LearnKorean #Klovers #" + g.day_name,
          }));
          setPosts(prev => [...groupPosts, ...prev]);
        }
      } catch { /* silently fail */ }
      finally { setGroupsLoading(false); }
    })();
  }, []);

  // Auto-generate 30 posts once groups finish loading so the grid shows immediately
  const autoGenDone = useRef(false);
  useEffect(() => {
    if (!groupsLoading && !autoGenDone.current) {
      autoGenDone.current = true;
      // Generate 30-post plan silently
      const today = new Date();
      const monthlyPosts = generateMonthlyPlan(groups, 10, "KLOVERS10", "en", selectedCampaign, studentCount);
      const recentTemplates: TemplateName[] = [];
      const drafts: MonthlyDraftPost[] = monthlyPosts.map((post, i) => {
        const d = new Date(today); d.setDate(d.getDate() + i);
        const pd = monthlyPostToPostData(post);
        let { templateName: tpl, themeName: thm } = POST_TYPE_AFFINITY[post.postType];
        if (recentTemplates.length >= 2 &&
            recentTemplates[recentTemplates.length - 1] === tpl &&
            recentTemplates[recentTemplates.length - 2] === tpl) {
          const others = BALANCE_CYCLE.filter(t => t !== tpl);
          tpl = others[i % others.length];
          thm = BALANCE_THEME[tpl];
        }
        recentTemplates.push(tpl);
        return { ...pd, day: post.day, postType: post.postType, caption: post.caption, approved: false, scheduledDate: d.toISOString().split("T")[0], templateName: tpl, themeName: thm, useWhatsApp: isWhatsAppCTA(post.postType), isReel: post.isReel, reelScript: post.reelScript };
      });
      setMonthlyDrafts(drafts);
      // Also set the posts array to drafts so the grid preview shows all 30
      setPosts(drafts.map(d => ({ id: d.id, mainText: d.mainText, subtitle: d.subtitle, extraText: d.extraText })));
    }
  }, [groupsLoading, groups]);

  function generateMonthlyDrafts() {
    if (groupsLoading) { toast({ title: "Loading class data…", description: "Please wait a moment and try again.", variant: "destructive" }); return; }
    const today = new Date();
    const posts = generateMonthlyPlan(groups, 10, "KLOVERS10", "en", selectedCampaign, studentCount);
    const recentTemplates: TemplateName[] = [];
    const drafts: MonthlyDraftPost[] = posts.map((post, i) => {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const pd = monthlyPostToPostData(post);
      let { templateName: tpl, themeName: thm } = POST_TYPE_AFFINITY[post.postType];
      // Enforce ≤2 consecutive same template
      if (recentTemplates.length >= 2 &&
          recentTemplates[recentTemplates.length - 1] === tpl &&
          recentTemplates[recentTemplates.length - 2] === tpl) {
        const others = BALANCE_CYCLE.filter(t => t !== tpl);
        tpl = others[i % others.length];
        thm = BALANCE_THEME[tpl];
      }
      recentTemplates.push(tpl);
      return { ...pd, day: post.day, postType: post.postType, caption: post.caption, approved: false, scheduledDate: d.toISOString().split("T")[0], templateName: tpl, themeName: thm, useWhatsApp: isWhatsAppCTA(post.postType), isReel: post.isReel, reelScript: post.reelScript };
    });
    setMonthlyDrafts(drafts);
    const campaignName = CAMPAIGN_CONFIGS.find(c => c.id === selectedCampaign)?.name ?? "Balanced";
    toast({ title: "30 posts generated!", description: `${campaignName} campaign — download ZIP when ready.` });
  }

  async function handleBulkDownload() {
    if (!monthlyDrafts.length) return;
    setBulkDownloading(true);
    try {
      // Pre-load Unsplash photos per template (cached by template name)
      const photoCache = new Map<string, HTMLImageElement | null>();
      const uniqueTemplates = [...new Set(monthlyDrafts.map(d => d.templateName))];
      await Promise.all(uniqueTemplates.map(async (tpl) => {
        const img = await loadUnsplashImage(tpl, 1080, 1080);
        photoCache.set(tpl, img);
      }));

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const formatKeys: FormatKey[] = ["instagram", "story", "facebook"];
      for (const fk of formatKeys) {
        const fmt = FORMATS[fk];
        const folder = zip.folder(fk)!;
        for (const post of monthlyDrafts) {
          const c = document.createElement("canvas"); c.width = fmt.w; c.height = fmt.h;
          const photo = photoCache.get(post.templateName) || null;
          renderPost(c, { id: post.id, mainText: post.mainText, subtitle: post.subtitle, extraText: post.extraText }, post.templateName, post.themeName, fk, photo, undefined, post.useWhatsApp);
          const blob = await new Promise<Blob>(res => c.toBlob(b => res(b!), "image/png"));
          folder.file(`${post.scheduledDate}-day${String(post.day).padStart(2, "0")}-${post.postType.replace(/_/g, "-")}-${fk}.png`, blob);
        }
      }
      const captionBlocks = monthlyDrafts.map(generatePublishingCopy).join("\n\n");
      zip.file("captions.txt", captionBlocks);

      // Reel scripts + covers
      const reelDrafts = monthlyDrafts.filter(d => d.isReel && d.reelScript);
      if (reelDrafts.length > 0) {
        const reelScripts = reelDrafts.map(generateReelPublishingCopy).join("\n\n");
        zip.file("reels-scripts.txt", reelScripts);
        const reelFolder = zip.folder("reel-covers")!;
        for (const post of reelDrafts) {
          if (!post.reelScript) continue;
          const c = document.createElement("canvas");
          renderReelCover(c, post.reelScript);
          const blob = await new Promise<Blob>(res => c.toBlob(b => res(b!), "image/png"));
          reelFolder.file(`${post.scheduledDate}-day${String(post.day).padStart(2, "0")}-reel-cover.png`, blob);
        }
      }

      const reelCount = reelDrafts.length;
      const staticCount = monthlyDrafts.length - reelCount;
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(content);
      a.download = `klovers-30posts-${new Date().toISOString().slice(0, 7)}.zip`; a.click();
      toast({ title: "ZIP downloaded!", description: `${staticCount} posts + ${reelCount} reels × ${formatKeys.length} formats + scripts ready.` });
    } catch (err: any) {
      toast({ title: "Download error", description: err.message, variant: "destructive" });
    } finally { setBulkDownloading(false); }
  }

  async function downloadSinglePost(post: MonthlyDraftPost) {
    const photo = await loadUnsplashImage(post.templateName, 1080, 1080);
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
    renderPost(c, { id: post.id, mainText: post.mainText, subtitle: post.subtitle, extraText: post.extraText }, post.templateName, post.themeName, "instagram", photo, undefined, post.useWhatsApp);
    const a = document.createElement("a"); a.href = c.toDataURL("image/png");
    a.download = `${post.scheduledDate}-day${String(post.day).padStart(2, "0")}-${post.postType.replace(/_/g, "-")}.png`; a.click();
  }

  // ─── Reel Maker ─────────────────────────────────────────────────────
  function openReelMaker(draft: MonthlyDraftPost) {
    setReelDraft(draft);
    setReelStockVideos([]);
    setReelPickedVideoId(null);
    setReelProgress(0);
    const query = draft.reelScript?.bgQuery || `korean ${draft.postType.replace(/_/g, " ")}`;
    void fetchStockVideos(draft.postType, query);
  }

  async function fetchStockVideos(postType: MonthlyPostType, query: string) {
    setReelSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-video-search", {
        body: { postType, query, limit: 6 },
      });
      if (error) throw error;
      const results: StockVideoResult[] = (data as { results?: StockVideoResult[] })?.results || [];
      if (results.length === 0) {
        toast({ title: "No videos found", description: `Try a different search term. Query: "${query}"`, variant: "destructive" });
      }
      setReelStockVideos(results);
      if (results.length > 0) setReelPickedVideoId(results[0].id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to search stock videos";
      toast({ title: "Stock search failed", description: msg, variant: "destructive" });
    } finally {
      setReelSearching(false);
    }
  }

  async function handleComposeReel() {
    if (!reelDraft || !reelPickedVideoId) return;
    const picked = reelStockVideos.find((v) => v.id === reelPickedVideoId);
    if (!picked) return;
    const rs = reelDraft.reelScript;

    // Build three branded slides: slide 1 = hook/title, slide 2 = main content,
    // slide 3 = CTA. If reelScript exists use its text, else fall back to the
    // static post content so non-reel types (ads, empty_slots) still work.
    const slides: [ReelSlideContent, ReelSlideContent, ReelSlideContent] = rs
      ? [
          { mainText: reelDraft.mainText, subtitle: rs.slide1, extraText: reelDraft.extraText },
          { mainText: reelDraft.mainText, subtitle: rs.slide2, extraText: reelDraft.extraText },
          { mainText: reelDraft.mainText, subtitle: rs.slide3, extraText: reelDraft.extraText },
        ]
      : [
          { mainText: reelDraft.mainText, subtitle: reelDraft.subtitle, extraText: reelDraft.extraText },
          { mainText: reelDraft.mainText, subtitle: reelDraft.subtitle, extraText: reelDraft.extraText },
          { mainText: reelDraft.mainText, subtitle: reelDraft.subtitle, extraText: reelDraft.extraText },
        ];

    setReelComposing(true);
    setReelProgress(0);
    try {
      const blob = await composeReel({
        videoUrl: picked.url,
        slides,
        template: reelDraft.templateName,
        theme: reelDraft.themeName,
        useWhatsApp: reelDraft.useWhatsApp,
        totalDuration: 9,
        onProgress: (p) => setReelProgress(p),
      });
      const filename = `${reelDraft.scheduledDate}-day${String(reelDraft.day).padStart(2, "0")}-${reelDraft.postType.replace(/_/g, "-")}-reel.webm`;
      downloadBlob(blob, filename);
      toast({ title: "Reel ready!", description: `${filename} — upload manually to Instagram/TikTok.` });
      setReelDraft(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reel compose failed";
      toast({ title: "Reel error", description: msg, variant: "destructive" });
    } finally {
      setReelComposing(false);
      setReelProgress(0);
    }
  }

  function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const newPosts: PostData[] = lines.map(line => {
        const parts = line.split(",").map(s => s.trim());
        return { id: uid(), mainText: parts[0] || "", subtitle: parts[1] || "", extraText: parts[2] || "" };
      });
      if (newPosts.length) {
        setPosts(prev => [...prev, ...newPosts]);
        toast({ title: "Imported!", description: `${newPosts.length} posts added.` });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {/* Editor + Controls */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={activeIndex === 0} onClick={() => setActiveIndex(activeIndex - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">{activeIndex + 1} / {posts.length}</span>
              <Button size="sm" variant="ghost" disabled={activeIndex >= posts.length - 1} onClick={() => setActiveIndex(activeIndex + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="rounded-xl border shadow-md max-w-full"
              style={{ maxHeight: 560 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {FORMATS[format].w}×{FORMATS[format].h} — {FORMATS[format].label}
          </p>

          <div className="flex justify-center gap-2 flex-wrap">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            {posts.length > 1 && (
              <Button variant="outline" onClick={handleDownloadAll}>
                <DownloadCloud className="h-4 w-4 mr-2" /> Download All ({posts.length})
              </Button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-5 overflow-y-auto max-h-[80vh] pr-1">
          {/* Template */}
          <div className="space-y-3">
            <AllTemplateCards
              post={activePost}
              theme={theme}
              format={format}
              active={template}
              onSelect={setTemplate}
              bgImage={bgImage}
            />
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Other Templates</h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_META.filter(t => !t.isKlovers).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTemplate(t.key)}
                    className={`text-left p-2.5 rounded-lg border text-sm transition-colors ${
                      template === t.key
                        ? "border-primary bg-accent"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="font-medium text-foreground block text-xs">{t.label}</span>
                    <span className="text-muted-foreground text-[10px]">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color Theme</h3>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(THEME_COLORS) as [ColorTheme, typeof THEME_COLORS[ColorTheme]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                    theme === key ? "border-primary bg-accent" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: val.dot }} />
                  <span className="text-[10px] text-foreground">{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo / Background Image */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Photo Background</h3>
            {bgImage ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-border aspect-square w-full max-w-[200px] mx-auto shadow-md">
                  <img
                    src={bgImage.src}
                    alt="Background photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1">
                    <span className="text-[10px] text-yellow-300 font-medium">Photo background active</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1"
                    onClick={handleUnsplashLoad}
                    disabled={unsplashLoading}
                  >
                    {unsplashLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Shuffle
                  </Button>
                  <label className="flex-1 flex items-center justify-center gap-1 border border-border rounded-md py-1.5 cursor-pointer hover:border-muted-foreground/40 transition-colors text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                  </label>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setBgImage(null)}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={handleUnsplashLoad}
                  disabled={unsplashLoading}
                >
                  {unsplashLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {unsplashLoading ? "Loading photo..." : "Use Unsplash Photo"}
                </Button>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Or upload your own photo</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                </label>
              </div>
            )}
          </div>

          {/* Text Fields */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main Text</h3>
              <Select value={mainFontStyle} onValueChange={setMainFontStyle}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={activePost.mainText}
              onChange={e => updatePost("mainText", e.target.value)}
              className="text-sm min-h-[80px]"
              placeholder="Main heading text"
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtitle</h3>
            <Input
              value={activePost.subtitle}
              onChange={e => updatePost("subtitle", e.target.value)}
              className="text-sm"
              placeholder="🚀 Korean 1 — Starting Friday 6:00 PM"
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Extra Text</h3>
            <Input
              value={activePost.extraText}
              onChange={e => updatePost("extraText", e.target.value)}
              className="text-sm"
              placeholder="#hashtags or call-to-action"
            />
          </div>

          {/* Format */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Format</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMATS) as [FormatKey, FormatOption][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    format === key ? "border-primary bg-accent" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-xs font-medium text-foreground block">{val.label}</span>
                  <span className="text-[10px] text-muted-foreground">{val.w}×{val.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post Management */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts ({posts.length})</h3>
              <Button size="sm" variant="outline" onClick={addPost}>
                <Plus className="h-3 w-3 mr-1" /> Add Post
              </Button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {posts.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                    i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
                  }`}
                  onClick={() => setActiveIndex(i)}
                >
                  <span className="flex-1 truncate">{p.mainText || `Post ${i + 1}`}</span>
                  {posts.length > 1 && (
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); removePost(i); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Upload */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bulk Upload</h3>
            <label className="flex flex-col items-center gap-1 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-muted-foreground/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Upload CSV or TXT</span>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleBulkUpload} />
            </label>
            <p className="text-[10px] text-muted-foreground mt-1">Format: main text, subtitle, extra (one post per line)</p>
          </div>
        </div>
      </div>

      {/* Platform Grid Previews — always visible */}
      <div>
        <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" /> Platform Grid Preview
            <Badge variant="outline" className="text-[10px]">{posts.length} posts</Badge>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grid Style</span>
            <Select value={gridPattern} onValueChange={v => setGridPattern(v as GridPattern)}>
              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRID_PATTERN_META.map(p => (
                  <SelectItem key={p.key} value={p.key}>
                    <span className="text-xs">{p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <PlatformGridPreviews
          posts={posts}
          template={template}
          theme={theme}
          bgImage={bgImage}
          postTemplates={
            gridPattern !== "custom"
              ? getGridSlots(gridPattern, posts.length)
              : monthlyDrafts.length > 0
                ? monthlyDrafts.map(d => ({ template: d.templateName, theme: d.themeName }))
                : posts.map((_, i) => ({
                    template: PREMIUM_POSTS[i % PREMIUM_POSTS.length].style,
                    theme: BALANCE_THEME[PREMIUM_POSTS[i % PREMIUM_POSTS.length].style],
                  }))
          }
        />
      </div>

      {/* ── Monthly 30-Post Generator ── */}
      <div className="border-t pt-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Campaign
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Pick a goal, generate 30 posts</p>
        </div>

        {/* Campaign Direction Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CAMPAIGN_CONFIGS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCampaign(c.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selectedCampaign === c.id
                  ? "ring-2 ring-primary border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <span className="text-lg block">{c.icon}</span>
              <p className="text-xs font-semibold text-foreground mt-1">{c.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{c.description}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={generateMonthlyDrafts} disabled={groupsLoading}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {groupsLoading ? "Loading…" : "Generate 30 Posts"}
            </Button>
            {monthlyDrafts.length > 0 && (
              <>
                <Button variant="outline" onClick={handleBulkDownload} disabled={bulkDownloading}>
                  {bulkDownloading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <DownloadCloud className="h-4 w-4 mr-1.5" />}
                  {bulkDownloading ? "Zipping…" : `Download All ${monthlyDrafts.length} (ZIP)`}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMonthlyDrafts([])} className="text-xs text-muted-foreground">
                  Clear
                </Button>
              </>
            )}
          </div>

        {/* Empty state */}
        {monthlyDrafts.length === 0 && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center space-y-2">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">No posts generated yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Pick your template &amp; theme above, then click "Generate 30 Posts". Download the ZIP and upload manually to Instagram, Facebook, etc.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 30-post grid */}
        {monthlyDrafts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {monthlyDrafts.map(draft => (
              <Card key={draft.id} className={`rounded-2xl transition-all ${draft.approved ? "ring-2 ring-green-400/60 border-green-300" : ""}`}>
                <CardContent className="p-3 space-y-3">
                  <div className="w-full overflow-hidden rounded-xl bg-muted flex justify-center">
                    <PostPreview
                      post={{ id: draft.id, mainText: draft.mainText, subtitle: draft.subtitle, extraText: draft.extraText }}
                      template={draft.templateName}
                      theme={draft.themeName}
                      size={270}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-bold">Day {draft.day}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{draft.postType.replace(/_/g, " ")}</Badge>
                      {draft.isReel && <Badge className="text-[10px] bg-red-500 text-white border-0">🎬 Reel</Badge>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{draft.scheduledDate}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{draft.caption}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => { setEditingDraft(draft); setEditDraftText({ mainText: draft.mainText, subtitle: draft.subtitle, extraText: draft.extraText }); }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadSinglePost(draft)}>
                      <DownloadCloud className="h-3 w-3 mr-1" /> PNG
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openReelMaker(draft)}>
                      <Film className="h-3 w-3 mr-1" /> Reel
                    </Button>
                    <button
                      onClick={() => setMonthlyDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, approved: !d.approved } : d))}
                      className={`ml-auto h-7 w-7 rounded-full flex items-center justify-center transition-colors ${draft.approved ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                      title={draft.approved ? "Approved" : "Mark approved"}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit dialog */}
        {editingDraft && (
          <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit — Day {editingDraft.day} ({editingDraft.postType.replace(/_/g, " ")})</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="flex justify-center">
                  <PostPreview
                    post={{ id: editingDraft.id, mainText: editDraftText.mainText, subtitle: editDraftText.subtitle, extraText: editDraftText.extraText }}
                    template={editingDraft.templateName} theme={editingDraft.themeName} size={240}
                  />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Main Text", key: "mainText" as const, rows: 2 },
                    { label: "Subtitle", key: "subtitle" as const, rows: 3 },
                    { label: "Hashtags / Extra", key: "extraText" as const, rows: 1 },
                  ].map(({ label, key, rows }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-semibold">{label}</label>
                      <textarea
                        rows={rows}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        value={editDraftText[key]}
                        onChange={e => setEditDraftText(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingDraft(null)}>Cancel</Button>
                <Button onClick={() => {
                  setMonthlyDrafts(prev => prev.map(d => d.id === editingDraft.id ? { ...d, ...editDraftText } : d));
                  setEditingDraft(null);
                  toast({ title: "Post updated" });
                }}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Reel Maker dialog */}
        {reelDraft && (
          <Dialog open={!!reelDraft} onOpenChange={(open) => { if (!open && !reelComposing) setReelDraft(null); }}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-red-500" />
                  Reel Maker — Day {reelDraft.day} ({reelDraft.postType.replace(/_/g, " ")})
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="text-xs text-muted-foreground">
                  Stock search query:{" "}
                  <code className="px-1 py-0.5 bg-muted rounded">
                    {reelDraft.reelScript?.bgQuery || `korean ${reelDraft.postType.replace(/_/g, " ")}`}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 ml-2 text-xs"
                    disabled={reelSearching || reelComposing}
                    onClick={() => {
                      const q = reelDraft.reelScript?.bgQuery || `korean ${reelDraft.postType.replace(/_/g, " ")}`;
                      void fetchStockVideos(reelDraft.postType, q);
                    }}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${reelSearching ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {reelSearching && (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Searching Pexels for Korea-themed clips…
                  </div>
                )}

                {!reelSearching && reelStockVideos.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No stock videos found. Try Refresh or pick a different post type.
                  </div>
                )}

                {!reelSearching && reelStockVideos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pick a background clip ({reelStockVideos.length} results)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {reelStockVideos.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          disabled={reelComposing}
                          onClick={() => setReelPickedVideoId(v.id)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            reelPickedVideoId === v.id
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent hover:border-muted-foreground/30"
                          }`}
                        >
                          <img
                            src={v.preview}
                            alt="stock clip preview"
                            className="w-full aspect-[9/16] object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {v.duration}s
                          </span>
                          {reelPickedVideoId === v.id && (
                            <span className="absolute bottom-1.5 left-1.5 bg-primary text-primary-foreground rounded-full p-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {reelComposing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Composing reel — {Math.round(reelProgress * 100)}%
                    </div>
                    <Progress value={reelProgress * 100} />
                    <p className="text-[10px] text-muted-foreground">
                      Keep this tab focused. Output will auto-download when ready.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReelDraft(null)} disabled={reelComposing}>
                  Close
                </Button>
                <Button
                  onClick={handleComposeReel}
                  disabled={!reelPickedVideoId || reelComposing || reelSearching}
                >
                  {reelComposing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Composing…
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-1.5" />
                      Generate Reel (9s)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
