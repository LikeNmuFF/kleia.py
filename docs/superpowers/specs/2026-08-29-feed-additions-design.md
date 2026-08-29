# Feed Additions Design

Date: 2026-08-29

## Goal

Add three feed features to Kleia:

1. Resource tagging and categorization by subject.
2. Multiple post reactions beyond likes: like, helpful, and upvote.
3. Saved posts/bookmarks with a saved-posts feed view.

The implementation should preserve the current feed behavior while adding the new controls in a compact way. Existing posts continue to render normally.

## Current Feed Shape

The feed is rendered by `app/(main)/feed/page.tsx`. It loads all rows from `posts`, sorts pinned posts first and newest posts next, batches author profiles, batches current-user likes from `post_likes`, then renders `PostCard`.

Post creation is handled by `app/actions/posts.ts`. `createPost` stores text posts in `posts`; when a link preview is present, it sets `type = 'resource'` and stores the preview JSON in `link_preview`. Posting awards 10 XP and completes the `post` daily mission.

The current `post_likes` table should stay in place during the first implementation pass to avoid destructive schema changes. The migration should backfill existing rows into `post_reactions` with `reaction_type = 'like'`. After that, the feed UI should use `post_reactions` as the source of truth for all reaction counts and current-user reaction state.

## User Experience

### Feed Composer

`CreatePost` gains a subject picker below the textarea. Users can select zero or more subjects. Subjects are controlled values, not free-text tags, to avoid moderation and duplicate-spelling problems.

Initial subjects:

- `general`
- `python`
- `linux`
- `web`
- `crypto`
- `forensics`
- `career`
- `resources`

If the post includes a link preview, `type` remains `resource`. If the user selects tags without a link, the post remains a normal text post with tags.

### Feed Cards

`PostCard` shows subject chips under the post text or above the link preview. Chips are read-only on cards.

The existing heart-like control remains visible. Two additional reaction controls appear beside it:

- Helpful
- Upvote

A user can apply multiple reaction types to the same post. For example, a post can be liked and marked helpful by the same user.

Each reaction button shows its count and selected state for the current user.

A save/bookmark button appears in the card action area. It toggles the current user's saved state and does not affect public counts unless a count is explicitly shown later.

### Saved Feed

Add a saved-posts view inside the feed area. Preferred route:

- `/feed` for all posts
- `/feed/saved` for saved posts

The main nav does not need a new top-level item. Link to saved posts from the feed header or a compact tab row.

Saved posts use the same `PostCard` rendering and action behavior. Query order should be based on `saved_posts.created_at desc`, not original post creation time, so the most recently saved items appear first.

## Data Model

### `post_subject_tags`

Stores controlled subject tags for posts.

Columns:

- `post_id uuid not null references posts(id) on delete cascade`
- `subject text not null`
- `created_at timestamptz not null default now()`

Constraints:

- Primary key: `(post_id, subject)`
- Check `subject in ('general', 'python', 'linux', 'web', 'crypto', 'forensics', 'career', 'resources')`

Indexes:

- `(subject, post_id)`
- `(post_id)`

### `post_reactions`

Stores typed reactions.

Columns:

- `post_id uuid not null references posts(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `reaction_type text not null`
- `created_at timestamptz not null default now()`

Constraints:

- Primary key: `(post_id, user_id, reaction_type)`
- Check `reaction_type in ('like', 'helpful', 'upvote')`

Indexes:

- `(post_id, reaction_type)`
- `(user_id, created_at desc)`

### `saved_posts`

Stores per-user bookmarks.

Columns:

- `user_id uuid not null references profiles(id) on delete cascade`
- `post_id uuid not null references posts(id) on delete cascade`
- `created_at timestamptz not null default now()`

Constraints:

- Primary key: `(user_id, post_id)`

Indexes:

- `(user_id, created_at desc)`
- `(post_id)`

## RLS Model

All new tables are in the exposed `public` schema, so enable RLS on each.

### `post_subject_tags`

- Select: authenticated users can read tags.
- Insert: authenticated users can add tags only to posts they authored.
- Delete: authenticated users can delete tags only from posts they authored.
- Update: no update policy; replace tags by delete/insert.

### `post_reactions`

- Select: authenticated users can read reactions.
- Insert: authenticated users can insert rows where `user_id = auth.uid()`.
- Delete: authenticated users can delete rows where `user_id = auth.uid()`.
- Update: no update policy; toggles are insert/delete.

### `saved_posts`

- Select: authenticated users can read only their own saved rows.
- Insert: authenticated users can insert rows where `user_id = auth.uid()`.
- Delete: authenticated users can delete rows where `user_id = auth.uid()`.
- Update: no update policy.

Use `TO authenticated` plus ownership predicates. Do not rely on `auth.role()`.

## Server Actions

Extend `app/actions/posts.ts` with:

- `createPost(content, linkPreview, subjects)`
- `toggleReaction(postId, reactionType)`
- `toggleSavedPost(postId)`

Add query helpers if route code becomes too large:

- `getFeedPosts({ savedOnly?: boolean })`
- `getPostInteractionState(postIds, userId)`

Validation:

- Reject unsupported subjects.
- Reject unsupported reaction types.
- Preserve existing content trimming and 5000 character limit.
- Revalidate `/feed` and `/feed/saved` when reactions, tags, or saved state change as needed.

Compatibility:

- Keep `toggleLike` as a wrapper around `toggleReaction(postId, 'like')` so existing imports do not break during the change.
- Stop using `posts.likes_count` for rendered reaction counts once typed reactions are wired.
- Keep the existing `post_likes` table untouched for now, but do not write new likes to it from the feed UI.
- The migration backfills `post_reactions` from `post_likes`, so existing likes continue to appear.

## Query Strategy

The current feed loads all posts, then batches profiles and likes. Preserve that batching style for the first pass.

For `/feed`:

1. Load posts.
2. Load author profiles.
3. Load subject tags for all post IDs.
4. Load reaction rows for all post IDs and aggregate counts in application code, or use a Postgres grouped query/RPC if available.
5. Load current user's reactions for all post IDs.
6. Load current user's saved rows for all post IDs.

For `/feed/saved`:

1. Load current user's saved post IDs ordered by `saved_posts.created_at desc`.
2. Load those posts.
3. Apply the same profile, tags, reactions, and saved-state batching.
4. Preserve saved order in the final array.

If the post count becomes large, add pagination in a follow-up. This design does not require pagination to ship the first feature set.

## Components

Add or update:

- `components/feed/SubjectPicker.tsx`
- `components/feed/SubjectChips.tsx`
- `components/feed/ReactionBar.tsx`
- `components/feed/SavePostButton.tsx`
- `components/feed/FeedTabs.tsx`
- `components/feed/CreatePost.tsx`
- `components/feed/PostCard.tsx`
- `app/(main)/feed/page.tsx`
- `app/(main)/feed/saved/page.tsx`

Keep the UI compact and consistent with the existing card layout. Avoid adding a new top-level navigation item.

## Admin and Moderation

The existing admin content tab can continue to list post text only. The first implementation does not need subject/reaction management in admin. Deleting a post cascades tags, reactions, and saves through foreign keys.

## Security and Abuse Considerations

- Controlled subject values prevent arbitrary user-generated tag spam.
- RLS protects saved posts as private per-user data.
- Reaction and save toggles use insert/delete, not update.
- All new ownership-sensitive policies use `auth.uid()` predicates.
- Link preview security remains unchanged and continues to apply only to external URLs.

## Testing and Verification

Minimum verification:

- TypeScript build with `npm run build`.
- Manual or server-action checks for:
  - creating a post with subjects
  - rendering subjects on feed cards
  - toggling each reaction independently
  - saving and unsaving a post
  - viewing `/feed/saved`
  - ensuring another user cannot read saved rows through RLS

If Supabase CLI/database access is available, run database advisors after applying the migration.

## Rollout Notes

This feature ships with a one-time backfill from `post_likes` to `post_reactions`. A later cleanup can remove old `post_likes` and `likes_count` dependencies after the typed reaction path has been stable in production.
