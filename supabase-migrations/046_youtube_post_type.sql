-- supabase-migrations/046_youtube_post_type.sql

-- Add youtube_data JSONB column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS youtube_data jsonb DEFAULT NULL;

-- Add index for querying YouTube posts
CREATE INDEX IF NOT EXISTS idx_posts_youtube_data ON public.posts USING gin (youtube_data) WHERE youtube_data IS NOT NULL;
