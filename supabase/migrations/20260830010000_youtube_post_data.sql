alter table public.posts
  add column if not exists youtube_data jsonb default null;

create index if not exists idx_posts_youtube_data
  on public.posts using gin (youtube_data)
  where youtube_data is not null;
