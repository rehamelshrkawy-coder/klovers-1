-- Performance indexes for Klovers hot query paths
-- Applied: 2026-04-25
-- Impact: reduces full-table scans on the 5 most frequently queried tables

-- student_xp: queries always filter by user_id, often group/sum
CREATE INDEX IF NOT EXISTS idx_student_xp_user_id
  ON public.student_xp (user_id);

CREATE INDEX IF NOT EXISTS idx_student_xp_user_activity
  ON public.student_xp (user_id, activity_type);

-- student_lesson_progress: always filtered by user_id + chapter_completed
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id
  ON public.student_lesson_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_chapter
  ON public.student_lesson_progress (user_id, chapter_completed)
  WHERE chapter_completed = TRUE;

-- student_badges: community feed queries ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_student_badges_user_id
  ON public.student_badges (user_id);

CREATE INDEX IF NOT EXISTS idx_student_badges_created_at
  ON public.student_badges (created_at DESC);

-- student_streaks: always single-row lookup by user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_streaks_user_id
  ON public.student_streaks (user_id);

-- student_nps: upsert on user_id; ensure single row per user
CREATE TABLE IF NOT EXISTS public.student_nps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 10),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_nps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own NPS response" ON public.student_nps;
CREATE POLICY "Users manage own NPS response"
  ON public.student_nps FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_nps_user_id
  ON public.student_nps (user_id);

-- vocabulary_review_history: SRS queries filter user + next_review_date
CREATE INDEX IF NOT EXISTS idx_vocab_review_user_date
  ON public.vocabulary_review_history (user_id, next_review_date ASC);

-- enrollments: admin overview query sorts / filters by multiple columns
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id
  ON public.enrollments (user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status
  ON public.enrollments (status, created_at DESC);

-- blog_posts: sitemap + blog listing always filter published + order by date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date
  ON public.blog_posts (published, published_at DESC)
  WHERE published = TRUE;

-- admin_audit_log: admin queries filter by action + performed_at
CREATE INDEX IF NOT EXISTS idx_audit_log_action_time
  ON public.admin_audit_log (action, performed_at DESC);
