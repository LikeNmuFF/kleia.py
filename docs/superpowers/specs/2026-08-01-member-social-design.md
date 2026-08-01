# Member Social — Design Spec

## Overview
Add three connected member-facing features to Kleia: member profile pages (fixing a live 404), working member search, and a general activity leaderboard. All three live in the members/leaderboard domain and share the existing `profiles` data.

Status: approved by user on 2026-08-01. Cluster A of a larger feature roadmap (Cluster B = groups & group chat, Cluster C = feed power — both out of scope here).

## Scope
### In scope
1. Member profile at `/profile/[username]` (logged-in only)
2. Working member search on `/members`
3. Activity leaderboard at `/leaderboard` (general study activity, distinct from CTF leaderboard)

### Out of scope
- Group chat, study groups hub, feed tags/filtering (Clusters B/C)
- Making profiles viewable to logged-out visitors (explicitly rejected — login-only)

## Decisions
- **Visibility:** member profiles are login-only. `/profile` is already behind the auth middleware; no middleware change needed.
- **Leaderboard ranking:** combined activity score (not pure streak). Requires one new SQL view.
- **Score formula:** `activity_score = current_streak * 10 + total_hours + post_count * 5`. Rounded; adjustable before shipping.
- **Exclusions:** admins excluded (`role = 'admin'`), matching the CTF leaderboard behavior.
- **`/leaderboard` becomes** the activity board (currently it is a plain redirect to `/ctf/leaderboard`). The CTF leaderboard stays at `/ctf/leaderboard`, reachable from the CTF page tabs.
- **Feed edit/delete already exists** (commit `600a0ca`); it is not part of this spec.

## Database
New migration `018_activity_leaderboard.sql`:

```sql
CREATE OR REPLACE VIEW activity_leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  p.current_streak,
  p.longest_streak,
  COALESCE(SUM(pt.hours_studied), 0) AS total_hours,
  (SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id) AS post_count,
  (
    COALESCE(p.current_streak, 0) * 10
    + COALESCE(SUM(pt.hours_studied), 0)
    + (SELECT COUNT(*) FROM posts po WHERE po.author_id = p.id) * 5
  )::int AS activity_score
FROM profiles p
LEFT JOIN progress_tracking pt ON pt.user_id = p.id
WHERE p.role = 'user'
GROUP BY p.id;

GRANT SELECT ON activity_leaderboard TO authenticated;
```

Notes:
- View is `SECURITY INVOKER` (Postgres 15+ default), so existing RLS on `profiles`, `progress_tracking`, and `posts` applies per row. Authenticated users can read all three tables, so the view works without policy changes.
- `SUM(pt.hours_studied)` may be `decimal`; cast the score to `int` for display.
- `role` column exists on `profiles` and is `NOT NULL` (`CHECK (role IN ('user','admin'))`). `WHERE p.role = 'user'` matches the existing CTF leaderboard pattern.

## Feature 1 — Member profile `/profile/[username]`
New server page `app/(main)/profile/[username]/page.tsx`, `export const dynamic = 'force-dynamic'`:
- Look up profile by `username` (`.eq('username', username)`); if missing → `notFound()`.
- Fetch profile: `id, username, full_name, avatar_url, bio, status, last_seen, current_streak, longest_streak, created_at, role`.
- Fetch CTF stats from the `ctf_leaderboard` view filtered by `user_id` (solved_challenges, total_points). If the viewed user is admin (excluded from view), hide the CTF section.
- **Header:** avatar, display name, `@username`, live presence dot + status text (via `getStatusInfo` from `lib/utils/time`), streak flame + tier badge (same thresholds as `MemberCard`), joined date.
- **CTF stats section:** solved count + total points (only when view returns a row).
- **Message button** — client component `components/members/MessageButton.tsx`:
  - Calls `create_direct_conversation` RPC with `{ other_user_id: profile.id }`.
  - On success → `router.push('/chat?conversation=<id>')`.
  - Hidden on own profile; replaced by an "Edit profile" link to `/profile`.
- **Chat page** (`app/(main)/chat/page.tsx`): read `?conversation=` from `useSearchParams` on mount and set `selectedId` if a valid conversation. Guard against selecting a conversation the user isn't a member of.
- **`MemberCard`** wrapped in `next/link` → `/profile/{username}` so the members grid is clickable. Event attendee lists already link there.

## Feature 2 — Working member search
`app/(main)/members/page.tsx` (server component):
- Await `searchParams` (Next 16: it is a Promise).
- When `q` is non-empty, filter: `.or(\`username.ilike.%${q}%,full_name.ilike.%${q}%,bio.ilike.%${q}%\`)`.
- Keep `.order('username')`.
- Show result count + a "Clear search" link (back to `/members`) when a query is active.
- Update `components/members/SearchBar.tsx`: initialize input state from the URL `?q=` (via `useSearchParams`), so the box reflects the active query and clearing works.

## Feature 3 — Activity leaderboard `/leaderboard`
Replace the redirect page (`app/(main)/leaderboard/page.tsx`) with a server component:
- Query `activity_leaderboard`, `.order('activity_score', { ascending: false }).limit(100)`.
- Reuse the CTF leaderboard styling: 🥇🥈🥉 medals, "you" highlight for the current user.
- Each row shows avatar, username, current streak (flame), total hours, post count, activity score; rows link to `/profile/{username}`.
- Nav item "Leaderboard" continues to point at `/leaderboard`; CTF board remains at `/ctf/leaderboard`.

## UI/UX
- Follow existing patterns: CSS variables (`--card-bg`, `--text-primary`, etc.), the gradient `from-violet-600 to-cyan-600` accent, `card` class, `motion` sparingly.
- Presence dot and streak tier styles reused from `MemberCard` (`getStreakLevel` + `getStatusInfo`).

## Verification
- `npm run build` (typecheck) passes.
- Migration: run `018_activity_leaderboard.sql` in the Supabase SQL editor; confirm `activity_leaderboard` returns rows for a seeded user.
- Manual route checks (logged-in): `/members?q=<name>` filters; clicking a member opens `/profile/<username>` (no 404); Message button opens the DM in `/chat`; `/leaderboard` shows the activity board; CTF leaderboard still reachable from `/ctf`.

## Files
| File | Action |
|------|--------|
| `supabase-migrations/018_activity_leaderboard.sql` | new migration |
| `app/(main)/profile/[username]/page.tsx` | new page |
| `components/members/MessageButton.tsx` | new component |
| `app/(main)/leaderboard/page.tsx` | rewrite (redirect → activity board) |
| `app/(main)/members/page.tsx` | add `?q=` filtering |
| `components/members/MemberCard.tsx` | wrap in Link |
| `components/members/SearchBar.tsx` | init state from URL `?q=` |
| `app/(main)/chat/page.tsx` | read `?conversation=` param |
| `README.md` | add 3 feature cells to features grid (12 total) |
