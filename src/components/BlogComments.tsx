import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Send, User } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

interface BlogCommentsProps {
  postId: string;
  isAr: boolean;
}

const T = {
  en: {
    heading: "Comments",
    loading: "Loading comments…",
    empty: "Be the first to comment.",
    name: "Your name",
    message: "Write a comment…",
    submit: "Post comment",
    submitting: "Posting…",
    successMsg: "Comment posted!",
    errorMsg: "Could not post comment. Please try again.",
    required: "Please enter your name and a comment.",
    tooShort: "Comment must be at least 2 characters.",
  },
  ar: {
    heading: "التعليقات",
    loading: "جارٍ تحميل التعليقات…",
    empty: "كن أول من يعلّق.",
    name: "اسمك",
    message: "اكتب تعليقًا…",
    submit: "نشر التعليق",
    submitting: "جارٍ النشر…",
    successMsg: "تم نشر التعليق!",
    errorMsg: "تعذّر نشر التعليق. حاول مجددًا.",
    required: "يرجى إدخال الاسم والتعليق.",
    tooShort: "يجب ألا يقل التعليق عن حرفين.",
  },
};

const BlogComments = ({ postId, isAr }: BlogCommentsProps) => {
  const t = isAr ? T.ar : T.en;
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, must stay empty
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (supabase as any)
      .from("blog_comments")
      .select("id, author_name, body, created_at")
      .eq("post_id", postId)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setComments((data as Comment[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (website.trim()) return; // bot caught by honeypot
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (!trimmedName || !trimmedBody) {
      toast.error(t.required);
      return;
    }
    if (trimmedBody.length < 2) {
      toast.error(t.tooShort);
      return;
    }

    setSubmitting(true);
    const { data, error } = await (supabase as any)
      .from("blog_comments")
      .insert({
        post_id: postId,
        author_name: trimmedName.slice(0, 80),
        body: trimmedBody.slice(0, 2000),
      })
      .select("id, author_name, body, created_at")
      .single();
    setSubmitting(false);

    if (error || !data) {
      toast.error(t.errorMsg);
      return;
    }
    toast.success(t.successMsg);
    setComments((prev) => [data as Comment, ...(prev ?? [])]);
    setName("");
    setBody("");
  };

  return (
    <section className="mt-14 pt-10 border-t border-border">
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-5">
        <MessageCircle className="h-5 w-5" />
        {t.heading}
        {comments && comments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
        )}
      </h2>

      <form onSubmit={onSubmit} className="space-y-3 mb-8">
        <Input
          type="text"
          placeholder={t.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          dir={isAr ? "rtl" : "ltr"}
        />
        <Textarea
          placeholder={t.message}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          required
          dir={isAr ? "rtl" : "ltr"}
        />
        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        />
        <div className={isAr ? "text-left" : "text-right"}>
          <Button type="submit" disabled={submitting}>
            <Send className={`h-4 w-4 ${isAr ? "ml-2" : "mr-2"}`} />
            {submitting ? t.submitting : t.submit}
          </Button>
        </div>
      </form>

      {comments === null ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{t.empty}</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                {c.author_name}
                <span className="ms-auto text-xs font-normal text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words" dir={isAr ? "rtl" : "ltr"}>
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default BlogComments;
