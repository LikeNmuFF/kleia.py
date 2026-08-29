# Feed Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subject tags, typed post reactions, and saved posts to the existing Kleia feed.

**Architecture:** Add three Supabase tables for feed metadata and user interactions, then keep all feed reads batched through server-side helpers. Client components stay small: composer subject picker, post subject chips, typed reaction bar, and save toggle. Existing feed behavior remains intact, with `/feed/saved` added as a second feed view.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase SSR client, PostgreSQL RLS, Tailwind CSS, lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-29-feed-additions-design.md`

## Global Constraints

- Use controlled subject values only: `general`, `python`, `linux`, `web`, `crypto`, `forensics`, `career`, `resources`.
- Use controlled reaction values only: `like`, `helpful`, `upvote`.
- A user can apply multiple reaction types to the same post.
- Saved posts are private per user.
- Keep existing `post_likes` during this pass, backfill existing likes to `post_reactions`, and use `post_reactions` as the UI source of truth.
- Do not add a new top-level navigation item.
- Keep feed UI compact and consistent with the current card layout.
- Run Supabase changelog/docs checks before applying Supabase schema changes.
- Run `npm run build` before claiming implementation completion.

---

## File Structure

- Create `supabase-migrations/034_feed_additions.sql`: schema, indexes, backfill, grants, and RLS policies.
- Create `lib/feed/constants.ts`: controlled subjects/reactions and validation helpers.
- Create `lib/feed/types.ts`: shared feed types consumed by server helpers and components.
- Create `lib/feed/queries.ts`: server-only feed query helpers for all posts and saved posts.
- Modify `app/actions/posts.ts`: create posts with tags, typed reactions, save toggle, and compatibility wrapper for likes.
- Modify `app/(main)/feed/page.tsx`: use feed query helper and render tabs.
- Create `app/(main)/feed/saved/page.tsx`: saved posts route using the same feed card rendering.
- Create `components/feed/SubjectPicker.tsx`: compact multi-select composer control.
- Create `components/feed/SubjectChips.tsx`: read-only chips for post cards.
- Create `components/feed/ReactionBar.tsx`: like/helpful/upvote controls.
- Create `components/feed/SavePostButton.tsx`: bookmark toggle.
- Create `components/feed/FeedTabs.tsx`: `/feed` and `/feed/saved` tabs.
- Modify `components/feed/CreatePost.tsx`: pass selected subjects into `createPost`.
- Modify `components/feed/PostCard.tsx`: render chips, reaction bar, and save button.

---

### Task 1: Supabase Schema, RLS, and Backfill

**Files:**
- Create: `supabase-migrations/034_feed_additions.sql`

**Interfaces:**
- Produces tables: `post_subject_tags`, `post_reactions`, `saved_posts`.
- Produces data compatibility: existing `post_likes` copied into `post_reactions` as `reaction_type = 'like'`.

- [ ] **Step 1: Check current Supabase guidance**

Run:

```powershell
supabase --version
```

If the CLI is unavailable, record that and continue with SQL-file generation only. Before applying SQL to a database, check Supabase changelog/docs for RLS policy syntax and Data API grants.

- [ ] **Step 2: Create the migration file**

Create `supabase-migrations/034_feed_additions.sql` with this SQL:

```sql
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
```

- [ ] **Step 3: Validate SQL syntax if tooling exists**

Run one of these depending on local setup:

```powershell
supabase db reset
```

or apply manually in Supabase SQL editor. If local Supabase is unavailable, verify by reading the SQL and record that database execution was not run.

- [ ] **Step 4: Commit schema task**

```powershell
git add -f -- supabase-migrations/034_feed_additions.sql
git commit -m "feat: add feed interaction schema"
```

---

### Task 2: Shared Feed Constants and Types

**Files:**
- Create: `lib/feed/constants.ts`
- Create: `lib/feed/types.ts`

**Interfaces:**
- Produces `FEED_SUBJECTS`, `POST_REACTIONS`, `isFeedSubject`, `isPostReaction`.
- Produces `FeedPost`, `ReactionType`, `FeedSubject`, `ReactionCounts`, and `UserReactionState`.
- Consumed by actions, query helpers, and feed components.

- [ ] **Step 1: Create constants**

Add `lib/feed/constants.ts`:

```ts
export const FEED_SUBJECTS = [
  'general',
  'python',
  'linux',
  'web',
  'crypto',
  'forensics',
  'career',
  'resources',
] as const

export const POST_REACTIONS = ['like', 'helpful', 'upvote'] as const

export type FeedSubject = (typeof FEED_SUBJECTS)[number]
export type ReactionType = (typeof POST_REACTIONS)[number]

export function isFeedSubject(value: string): value is FeedSubject {
  return FEED_SUBJECTS.includes(value as FeedSubject)
}

export function isPostReaction(value: string): value is ReactionType {
  return POST_REACTIONS.includes(value as ReactionType)
}

export function normalizeSubjects(values: string[]): FeedSubject[] {
  return Array.from(new Set(values.filter(isFeedSubject)))
}
```

- [ ] **Step 2: Create feed types**

Add `lib/feed/types.ts`:

```ts
import type { FeedSubject, ReactionType } from './constants'

export interface LinkPreviewData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

export type ReactionCounts = Record<ReactionType, number>
export type UserReactionState = Record<ReactionType, boolean>

export interface FeedProfile {
  username: string
  avatar_url: string | null
  role?: string
}

export interface FeedPost {
  id: string
  content: string
  type: string
  author_id: string
  created_at: string
  is_pinned: boolean
  likes_count: number
  comments_count: number
  link_preview?: LinkPreviewData | null
  subjects: FeedSubject[]
  reaction_counts: ReactionCounts
  user_reactions: UserReactionState
  saved_by_user: boolean
}

export function emptyReactionCounts(): ReactionCounts {
  return { like: 0, helpful: 0, upvote: 0 }
}

export function emptyUserReactionState(): UserReactionState {
  return { like: false, helpful: false, upvote: false }
}
```

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds with no TypeScript errors from the new files.

- [ ] **Step 4: Commit constants/types**

```powershell
git add lib/feed/constants.ts lib/feed/types.ts
git commit -m "feat: add feed interaction types"
```

---

### Task 3: Feed Query Helpers

**Files:**
- Create: `lib/feed/queries.ts`
- Modify: `app/(main)/feed/page.tsx`
- Create: `app/(main)/feed/saved/page.tsx`

**Interfaces:**
- Consumes types from `lib/feed/types.ts`.
- Produces `getFeedPosts(): Promise<FeedPost[]>`.
- Produces `getSavedFeedPosts(userId: string): Promise<FeedPost[]>`.
- Produces `getAuthorProfiles(posts: FeedPost[]): Promise<Record<string, FeedProfile>>`.

- [ ] **Step 1: Create query helper module**

Add `lib/feed/queries.ts`:

```ts
import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { emptyReactionCounts, emptyUserReactionState, type FeedPost, type FeedProfile } from './types'
import { POST_REACTIONS, type FeedSubject, type ReactionType } from './constants'

type BasePost = Omit<FeedPost, 'subjects' | 'reaction_counts' | 'user_reactions' | 'saved_by_user'>

function buildPostMap(posts: BasePost[]): Map<string, FeedPost> {
  return new Map(posts.map((post) => [
    post.id,
    {
      ...post,
      subjects: [],
      reaction_counts: emptyReactionCounts(),
      user_reactions: emptyUserReactionState(),
      saved_by_user: false,
    },
  ]))
}

async function hydratePosts(posts: BasePost[], userId?: string | null): Promise<FeedPost[]> {
  if (posts.length === 0) return []

  const supabase = await createClient()
  const postIds = posts.map((post) => post.id)
  const postMap = buildPostMap(posts)

  const [tagsResult, reactionsResult, savedResult] = await Promise.all([
    supabase.from('post_subject_tags').select('post_id, subject').in('post_id', postIds),
    supabase.from('post_reactions').select('post_id, user_id, reaction_type').in('post_id', postIds),
    userId
      ? supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [] }),
  ])

  for (const tag of tagsResult.data ?? []) {
    const post = postMap.get(tag.post_id)
    if (post && !post.subjects.includes(tag.subject as FeedSubject)) {
      post.subjects.push(tag.subject as FeedSubject)
    }
  }

  for (const reaction of reactionsResult.data ?? []) {
    const post = postMap.get(reaction.post_id)
    const type = reaction.reaction_type as ReactionType
    if (post && POST_REACTIONS.includes(type)) {
      post.reaction_counts[type] += 1
      if (userId && reaction.user_id === userId) {
        post.user_reactions[type] = true
      }
    }
  }

  for (const saved of savedResult.data ?? []) {
    const post = postMap.get(saved.post_id)
    if (post) post.saved_by_user = true
  }

  return posts.map((post) => postMap.get(post.id)!).filter(Boolean)
}

export async function getFeedPosts(userId?: string | null): Promise<FeedPost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, content, type, author_id, created_at, is_pinned, likes_count, comments_count, link_preview')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return hydratePosts((data ?? []) as BasePost[], userId)
}

export async function getSavedFeedPosts(userId: string): Promise<FeedPost[]> {
  const supabase = await createClient()
  const { data: saved } = await supabase
    .from('saved_posts')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const savedPostIds = (saved ?? []).map((row) => row.post_id)
  if (savedPostIds.length === 0) return []

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, type, author_id, created_at, is_pinned, likes_count, comments_count, link_preview')
    .in('id', savedPostIds)

  const byId = new Map(((posts ?? []) as BasePost[]).map((post) => [post.id, post]))
  const ordered = savedPostIds.map((id) => byId.get(id)).filter(Boolean) as BasePost[]
  return hydratePosts(ordered, userId)
}

export async function getAuthorProfiles(posts: FeedPost[]): Promise<Record<string, FeedProfile>> {
  if (posts.length === 0) return {}

  const supabase = await createClient()
  const authorIds = Array.from(new Set(posts.map((post) => post.author_id)))
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', authorIds)

  const map: Record<string, FeedProfile> = {}
  for (const profile of data ?? []) {
    map[profile.id] = {
      username: profile.username,
      avatar_url: profile.avatar_url,
      role: profile.role,
    }
  }
  return map
}
```

- [ ] **Step 2: Update `/feed` page to use helper**

Replace manual post/profile/like batching in `app/(main)/feed/page.tsx` with:

```ts
import { getAuthorProfiles, getFeedPosts } from '@/lib/feed/queries'
import FeedTabs from '@/components/feed/FeedTabs'
```

Use this loading pattern inside `FeedPage`:

```ts
const [posts, profileResult, upcomingRegistration] = await Promise.all([
  getFeedPosts(user?.id),
  user
    ? supabase.from('profiles').select('id, role, username, avatar_url').eq('id', user.id).single()
    : Promise.resolve({ data: null }),
  getUpcomingRegistration(),
])

const authorMap = await getAuthorProfiles(posts)
const isAdmin = profileResult.data?.role === 'admin'
```

Render tabs before the composer:

```tsx
<FeedTabs active="all" />
<CreatePost />
```

Pass only the hydrated post:

```tsx
<PostCard
  key={post.id}
  post={post}
  currentUserId={user?.id}
  isAdmin={isAdmin}
  initialProfile={authorMap[post.author_id] || null}
/>
```

- [ ] **Step 3: Add `/feed/saved` page**

Create `app/(main)/feed/saved/page.tsx` with the same layout as `/feed`, but load posts using:

```ts
const posts = user ? await getSavedFeedPosts(user.id) : []
const authorMap = await getAuthorProfiles(posts)
```

Use:

```tsx
<FeedTabs active="saved" />
```

Do not render `CreatePost` or `DailyMissions` on the saved page. Use empty-state copy:

```tsx
<h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No saved posts yet</h3>
<p style={{ color: 'var(--text-secondary)' }}>Save posts from the feed to find them here later.</p>
```

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: compile errors are limited to components not yet updated for the new `FeedPost` fields. If the build fails because `FeedTabs` does not exist yet, continue to Task 4 before committing. If the helper module itself has type errors, fix them in this task.

- [ ] **Step 5: Commit query helper changes when build reaches the expected missing-component state or passes after Task 4**

Commit after Task 4 if needed:

```powershell
git add lib/feed/queries.ts "app/(main)/feed/page.tsx" "app/(main)/feed/saved/page.tsx"
git commit -m "feat: add feed query helpers"
```

---

### Task 4: Subject Tags in Composer and Cards

**Files:**
- Create: `components/feed/SubjectPicker.tsx`
- Create: `components/feed/SubjectChips.tsx`
- Create: `components/feed/FeedTabs.tsx`
- Modify: `components/feed/CreatePost.tsx`
- Modify: `app/actions/posts.ts`
- Modify: `components/feed/PostCard.tsx`

**Interfaces:**
- Consumes `FeedSubject`, `FEED_SUBJECTS`, and `normalizeSubjects`.
- Changes `createPost` signature to `createPost(content: string, linkPreview?: LinkPreviewData, subjects?: string[])`.
- Produces subject tags persisted in `post_subject_tags`.

- [ ] **Step 1: Add subject picker**

Create `components/feed/SubjectPicker.tsx`:

```tsx
'use client'

import { FEED_SUBJECTS, type FeedSubject } from '@/lib/feed/constants'

interface SubjectPickerProps {
  selected: FeedSubject[]
  onChange: (subjects: FeedSubject[]) => void
}

const LABELS: Record<FeedSubject, string> = {
  general: 'General',
  python: 'Python',
  linux: 'Linux',
  web: 'Web',
  crypto: 'Crypto',
  forensics: 'Forensics',
  career: 'Career',
  resources: 'Resources',
}

export default function SubjectPicker({ selected, onChange }: SubjectPickerProps) {
  const toggle = (subject: FeedSubject) => {
    onChange(
      selected.includes(subject)
        ? selected.filter((item) => item !== subject)
        : [...selected, subject]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FEED_SUBJECTS.map((subject) => {
        const active = selected.includes(subject)
        return (
          <button
            key={subject}
            type="button"
            onClick={() => toggle(subject)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors"
            style={{
              backgroundColor: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--accent-text)' : 'var(--text-muted)',
              borderColor: active ? 'transparent' : 'var(--border-color)',
            }}
          >
            {LABELS[subject]}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Add subject chips**

Create `components/feed/SubjectChips.tsx`:

```tsx
import type { FeedSubject } from '@/lib/feed/constants'

const LABELS: Record<FeedSubject, string> = {
  general: 'General',
  python: 'Python',
  linux: 'Linux',
  web: 'Web',
  crypto: 'Crypto',
  forensics: 'Forensics',
  career: 'Career',
  resources: 'Resources',
}

export default function SubjectChips({ subjects }: { subjects: FeedSubject[] }) {
  if (subjects.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {subjects.map((subject) => (
        <span
          key={subject}
          className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
          style={{
            color: 'var(--text-muted)',
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--hover-bg)',
          }}
        >
          {LABELS[subject]}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add feed tabs**

Create `components/feed/FeedTabs.tsx`:

```tsx
import Link from 'next/link'

export default function FeedTabs({ active }: { active: 'all' | 'saved' }) {
  const tabs = [
    { id: 'all' as const, label: 'All Posts', href: '/feed' },
    { id: 'saved' as const, label: 'Saved', href: '/feed/saved' },
  ]

  return (
    <div className="mb-4 flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          style={{
            backgroundColor: active === tab.id ? 'var(--card-bg)' : 'transparent',
            color: active === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
            borderColor: active === tab.id ? 'var(--border-color)' : 'transparent',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Update `CreatePost` state and submit**

In `components/feed/CreatePost.tsx`, import:

```ts
import SubjectPicker from './SubjectPicker'
import type { FeedSubject } from '@/lib/feed/constants'
```

Add state:

```ts
const [subjects, setSubjects] = useState<FeedSubject[]>([])
```

Change submit call:

```ts
const result = await createPost(content, preview ?? undefined, subjects)
```

Reset subjects after success:

```ts
setSubjects([])
```

Render picker above errors:

```tsx
<div className="mt-3">
  <SubjectPicker selected={subjects} onChange={setSubjects} />
</div>
```

- [ ] **Step 5: Update `createPost` to persist tags**

In `app/actions/posts.ts`, import:

```ts
import { normalizeSubjects } from '@/lib/feed/constants'
```

Change signature:

```ts
export async function createPost(content: string, linkPreview?: LinkPreviewData, subjects: string[] = [])
```

Change insert to return the post ID:

```ts
const { data: post, error } = await supabase
  .from('posts')
  .insert(insertData)
  .select('id')
  .single()
```

After the insert succeeds:

```ts
const normalizedSubjects = normalizeSubjects(subjects)
if (post && normalizedSubjects.length > 0) {
  const { error: tagError } = await supabase.from('post_subject_tags').insert(
    normalizedSubjects.map((subject) => ({
      post_id: post.id,
      subject,
    }))
  )

  if (tagError) {
    await logEvent({
      endpoint: 'posts.createPost.tags',
      status: 'error',
      durationMs: Date.now() - start,
      errorMessage: tagError.message,
      userId: user.id,
    })
    return { error: tagError.message }
  }
}
```

- [ ] **Step 6: Render subject chips in `PostCard`**

Import:

```ts
import SubjectChips from './SubjectChips'
import type { FeedPost } from '@/lib/feed/types'
```

Replace the inline post prop type with:

```ts
post: FeedPost
```

Render after post content and before link preview:

```tsx
{!editing && <SubjectChips subjects={post.subjects} />}
```

- [ ] **Step 7: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds or only fails because reaction/save components are not yet added. Fix subject-related errors in this task.

- [ ] **Step 8: Commit subject tag UI and action changes**

```powershell
git add components/feed/SubjectPicker.tsx components/feed/SubjectChips.tsx components/feed/FeedTabs.tsx components/feed/CreatePost.tsx components/feed/PostCard.tsx app/actions/posts.ts
git commit -m "feat: add feed subject tags"
```

---

### Task 5: Typed Reactions and Saved Posts UI

**Files:**
- Create: `components/feed/ReactionBar.tsx`
- Create: `components/feed/SavePostButton.tsx`
- Modify: `app/actions/posts.ts`
- Modify: `components/feed/PostCard.tsx`

**Interfaces:**
- Consumes `ReactionType`, `POST_REACTIONS`, `ReactionCounts`, and `UserReactionState`.
- Produces `toggleReaction(postId: string, reactionType: ReactionType | string)`.
- Produces `toggleSavedPost(postId: string)`.
- Keeps `toggleLike(postId: string)` as a wrapper for compatibility.

- [ ] **Step 1: Add reaction and save actions**

In `app/actions/posts.ts`, import:

```ts
import { isPostReaction, normalizeSubjects, type ReactionType } from '@/lib/feed/constants'
```

Add:

```ts
export async function toggleReaction(postId: string, reactionType: ReactionType | string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }
  if (!isPostReaction(reactionType)) return { error: 'Unsupported reaction' }

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .eq('reaction_type', reactionType)

    if (error) {
      await logEvent({ endpoint: 'posts.toggleReaction', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('post_reactions')
      .insert({ user_id: user.id, post_id: postId, reaction_type: reactionType })

    if (error) {
      await logEvent({ endpoint: 'posts.toggleReaction', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  }

  const { data: rows } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)

  const counts = { like: 0, helpful: 0, upvote: 0 }
  for (const row of rows ?? []) {
    if (isPostReaction(row.reaction_type)) counts[row.reaction_type] += 1
  }

  await logEvent({ endpoint: 'posts.toggleReaction', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  revalidatePath('/feed/saved')
  return { selected: !existing, counts }
}
```

Replace the current `toggleLike` body with:

```ts
export async function toggleLike(postId: string) {
  const result = await toggleReaction(postId, 'like')
  if (result.error) return result
  return { liked: result.selected, likesCount: result.counts?.like ?? 0 }
}
```

Add:

```ts
export async function toggleSavedPost(postId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existing } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) {
      await logEvent({ endpoint: 'posts.toggleSavedPost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: user.id, post_id: postId })

    if (error) {
      await logEvent({ endpoint: 'posts.toggleSavedPost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  }

  await logEvent({ endpoint: 'posts.toggleSavedPost', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  revalidatePath('/feed/saved')
  return { saved: !existing }
}
```

- [ ] **Step 2: Create reaction bar**

Create `components/feed/ReactionBar.tsx`:

```tsx
'use client'

import { ThumbsUp, Heart, BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import { toggleReaction } from '@/app/actions/posts'
import type { ReactionCounts, UserReactionState } from '@/lib/feed/types'
import type { ReactionType } from '@/lib/feed/constants'

interface ReactionBarProps {
  postId: string
  initialCounts: ReactionCounts
  initialUserReactions: UserReactionState
}

const REACTIONS: Array<{ type: ReactionType; label: string; Icon: typeof Heart; activeColor: string }> = [
  { type: 'like', label: 'Like', Icon: Heart, activeColor: '#ef4444' },
  { type: 'helpful', label: 'Helpful', Icon: BadgeCheck, activeColor: '#22c55e' },
  { type: 'upvote', label: 'Upvote', Icon: ThumbsUp, activeColor: '#38bdf8' },
]

export default function ReactionBar({ postId, initialCounts, initialUserReactions }: ReactionBarProps) {
  const [counts, setCounts] = useState(initialCounts)
  const [selected, setSelected] = useState(initialUserReactions)

  const onToggle = async (type: ReactionType) => {
    const previousCounts = counts
    const previousSelected = selected
    const nextSelected = !selected[type]

    setSelected({ ...selected, [type]: nextSelected })
    setCounts({
      ...counts,
      [type]: nextSelected ? counts[type] + 1 : Math.max(0, counts[type] - 1),
    })

    const result = await toggleReaction(postId, type)
    if (result.error || !result.counts) {
      setCounts(previousCounts)
      setSelected(previousSelected)
      return
    }

    setSelected({ ...previousSelected, [type]: result.selected ?? nextSelected })
    setCounts(result.counts)
  }

  return (
    <div className="flex items-center gap-3">
      {REACTIONS.map(({ type, label, Icon, activeColor }) => {
        const active = selected[type]
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: active ? activeColor : 'var(--text-muted)' }}
            title={label}
          >
            <Icon className="w-5 h-5" fill={active && type === 'like' ? 'currentColor' : 'none'} />
            <span>{counts[type]}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create save button**

Create `components/feed/SavePostButton.tsx`:

```tsx
'use client'

import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import { toggleSavedPost } from '@/app/actions/posts'

export default function SavePostButton({ postId, initialSaved }: { postId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)

  const onToggle = async () => {
    const previous = saved
    setSaved(!previous)
    const result = await toggleSavedPost(postId)
    if (result.error) {
      setSaved(previous)
      return
    }
    setSaved(result.saved ?? !previous)
  }

  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg transition-colors hover:bg-white/5"
      style={{ color: saved ? '#f59e0b' : 'var(--text-muted)' }}
      title={saved ? 'Remove from saved' : 'Save post'}
    >
      <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
```

- [ ] **Step 4: Replace like button block in `PostCard`**

Import:

```ts
import ReactionBar from './ReactionBar'
import SavePostButton from './SavePostButton'
```

Remove local `liked`, `likesCount`, and `handleLike` state. Keep `commentsCount`.

Render save button in the top-right action area before admin/owner controls:

```tsx
{currentUserId && <SavePostButton postId={post.id} initialSaved={post.saved_by_user} />}
```

Replace the existing like button with:

```tsx
<ReactionBar
  postId={post.id}
  initialCounts={post.reaction_counts}
  initialUserReactions={post.user_reactions}
/>
```

Keep the comment button beside the reaction bar.

- [ ] **Step 5: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds. Fix import paths, prop types, and action return types until it does.

- [ ] **Step 6: Commit reactions and saved posts UI**

```powershell
git add app/actions/posts.ts components/feed/ReactionBar.tsx components/feed/SavePostButton.tsx components/feed/PostCard.tsx
git commit -m "feat: add feed reactions and saved posts"
```

---

### Task 6: Final Verification and Cleanup

**Files:**
- Modify only files needed to resolve verification failures.

**Interfaces:**
- Consumes all previous tasks.
- Produces a buildable implementation with a clean Git status.

- [ ] **Step 1: Run full build**

Run:

```powershell
npm run build
```

Expected: exit code 0.

- [ ] **Step 2: Check Git status**

Run:

```powershell
git status --short
```

Expected: no unstaged/uncommitted files except intentionally ignored local artifacts.

- [ ] **Step 3: Manual browser verification**

Start dev server:

```powershell
npm run dev
```

Verify:

- Create a text post with `python` and `resources` selected.
- Create a link post with `web` selected.
- Confirm subject chips render on both.
- Toggle `Like`, `Helpful`, and `Upvote` independently on one post.
- Refresh `/feed` and confirm reaction states persist.
- Save a post.
- Open `/feed/saved` and confirm the saved post appears.
- Unsave it and confirm it disappears from `/feed/saved` after refresh.

- [ ] **Step 4: Commit final fixes if any**

If Step 1 or Step 3 required fixes:

```powershell
git add app/actions/posts.ts "app/(main)/feed/page.tsx" "app/(main)/feed/saved/page.tsx" lib/feed/constants.ts lib/feed/types.ts lib/feed/queries.ts components/feed/CreatePost.tsx components/feed/PostCard.tsx components/feed/SubjectPicker.tsx components/feed/SubjectChips.tsx components/feed/FeedTabs.tsx components/feed/ReactionBar.tsx components/feed/SavePostButton.tsx supabase-migrations/034_feed_additions.sql
git commit -m "fix: polish feed additions"
```

- [ ] **Step 5: Final status report**

Run:

```powershell
git log --oneline -5
git status --short
```

Report the commits created, whether `npm run build` passed, whether database SQL was applied or only written, and any manual verification that could not be completed.
