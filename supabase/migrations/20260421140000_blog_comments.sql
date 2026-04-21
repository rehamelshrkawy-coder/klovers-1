-- Public comments on published blog posts.
-- approved defaults to true for launch; if spam becomes an issue, flip
-- the default to false and add admin moderation UI in BlogManager.

CREATE TABLE IF NOT EXISTS public.blog_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  body        text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 2000),
  approved    boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_created
  ON public.blog_comments (post_id, created_at DESC)
  WHERE approved = true;

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_comments_select_approved" ON public.blog_comments;
CREATE POLICY "blog_comments_select_approved"
  ON public.blog_comments FOR SELECT
  USING (approved = true);

DROP POLICY IF EXISTS "blog_comments_insert_public" ON public.blog_comments;
CREATE POLICY "blog_comments_insert_public"
  ON public.blog_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blog_posts p
      WHERE p.id = post_id AND p.published = true
    )
  );

DROP POLICY IF EXISTS "blog_comments_admin_all" ON public.blog_comments;
CREATE POLICY "blog_comments_admin_all"
  ON public.blog_comments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
