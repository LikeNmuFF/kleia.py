create table if not exists public.post_subject_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  subject text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, subject),
  constraint post_subject_tags_subject_check check (
    subject in ('general', 'python', 'linux', 'web', 'crypto', 'forensics', 'career', 'resources')
  )
);

create index if not exists idx_post_subject_tags_subject_post
  on public.post_subject_tags(subject, post_id);

create index if not exists idx_post_subject_tags_post
  on public.post_subject_tags(post_id);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction_type),
  constraint post_reactions_reaction_type_check check (
    reaction_type in ('like', 'helpful', 'upvote')
  )
);

create index if not exists idx_post_reactions_post_type
  on public.post_reactions(post_id, reaction_type);

create index if not exists idx_post_reactions_user_created
  on public.post_reactions(user_id, created_at desc);

create table if not exists public.saved_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists idx_saved_posts_user_created
  on public.saved_posts(user_id, created_at desc);

create index if not exists idx_saved_posts_post
  on public.saved_posts(post_id);

insert into public.post_reactions (post_id, user_id, reaction_type, created_at)
select post_id, user_id, 'like', coalesce(created_at, now())
from public.post_likes
on conflict (post_id, user_id, reaction_type) do nothing;

alter table public.post_subject_tags enable row level security;
alter table public.post_reactions enable row level security;
alter table public.saved_posts enable row level security;

grant select, insert, delete on public.post_subject_tags to authenticated;
grant select, insert, delete on public.post_reactions to authenticated;
grant select, insert, delete on public.saved_posts to authenticated;

drop policy if exists "post tags are readable by authenticated users" on public.post_subject_tags;
create policy "post tags are readable by authenticated users"
on public.post_subject_tags for select
to authenticated
using (true);

drop policy if exists "authors can add tags to their posts" on public.post_subject_tags;
create policy "authors can add tags to their posts"
on public.post_subject_tags for insert
to authenticated
with check (
  exists (
    select 1 from public.posts
    where posts.id = post_subject_tags.post_id
      and posts.author_id = (select auth.uid())
  )
);

drop policy if exists "authors can delete tags from their posts" on public.post_subject_tags;
create policy "authors can delete tags from their posts"
on public.post_subject_tags for delete
to authenticated
using (
  exists (
    select 1 from public.posts
    where posts.id = post_subject_tags.post_id
      and posts.author_id = (select auth.uid())
  )
);

drop policy if exists "post reactions are readable by authenticated users" on public.post_reactions;
create policy "post reactions are readable by authenticated users"
on public.post_reactions for select
to authenticated
using (true);

drop policy if exists "users can add their own reactions" on public.post_reactions;
create policy "users can add their own reactions"
on public.post_reactions for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "users can delete their own reactions" on public.post_reactions;
create policy "users can delete their own reactions"
on public.post_reactions for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users can read their own saved posts" on public.saved_posts;
create policy "users can read their own saved posts"
on public.saved_posts for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users can save their own posts list" on public.saved_posts;
create policy "users can save their own posts list"
on public.saved_posts for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "users can unsave their own posts list" on public.saved_posts;
create policy "users can unsave their own posts list"
on public.saved_posts for delete
to authenticated
using (user_id = (select auth.uid()));
