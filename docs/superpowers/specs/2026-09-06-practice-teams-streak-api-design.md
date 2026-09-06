# Practice Teams and Streak API Design

## Objective

Add practice teams that users can create, join, manage, and display publicly. Each team has a profile image, members, a GitHub-style activity calendar, and a generated API key that lets another website display that team's streak calendar on a landing page.

## Scope

This design covers the first production slice:

- authenticated users can create practice teams;
- a team owner can upload/update the team profile image;
- team pages show members and a GitHub-style daily activity calendar;
- a team settings page manages members and API keys;
- API-key generation is blocked until the team has at least 5 accepted members;
- an external website can read public team streak data using a team API key.

This design does not include external writes to team activity. External sites can read streak data only. Activity writes can be added later after abuse controls are defined.

## User Roles and Permissions

Team roles:

- `owner`: the creator of the team. Counts as member 1.
- `member`: accepted team member.

Platform admins can manage any practice team. Team owners can manage only their own team. Members can view their team membership details, but cannot generate or revoke API keys.

## Pages

### `/teams`

Lists public practice teams with:

- team avatar;
- name;
- description excerpt;
- accepted member count;
- current streak and longest streak.

### `/teams/new`

Authenticated form for creating a practice team:

- team name;
- slug, generated from name and editable;
- description;
- optional profile image upload.

After creation, the creator becomes the `owner` and first accepted member.

### `/teams/[slug]`

Public team profile page:

- team avatar, name, description;
- accepted member count;
- current streak and longest streak;
- GitHub-style calendar grid for the last 365 days;
- recent activity summary.

Private or hidden teams can be supported later. The first slice treats teams as public because the requested API is for external landing pages.

### `/teams/[slug]/settings`

Owner/admin page with:

- edit team name, slug, description, avatar;
- view members;
- add members by username/email lookup. In this first slice, owner/admin adds create accepted memberships directly; invitation acceptance is out of scope;
- remove members;
- API key management.

API key section behavior:

- if accepted member count is below 5, show disabled state: "Add at least 5 accepted members to generate an API key."
- if count is 5 or more, allow `Generate API key`;
- show the full API key only once immediately after generation;
- after that, only show key prefix, created date, last used date, and revoke button.

## Database Design

### `practice_teams`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `description text`
- `avatar_url text`
- `owner_id uuid not null references profiles(id) on delete cascade`
- `is_public boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- unique index on `slug`
- index on `owner_id`
- index on `is_public`

### `practice_team_members`

Columns:

- `team_id uuid not null references practice_teams(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `role text not null check (role in ('owner', 'member'))`
- `status text not null check (status in ('pending', 'accepted'))`
- `invited_by uuid references profiles(id) on delete set null`
- `joined_at timestamptz`
- `created_at timestamptz not null default now()`
- primary key `(team_id, user_id)`

Indexes:

- index on `user_id`
- index on `(team_id, status)`

Rules:

- team creator is inserted as `owner` + `accepted`;
- owner row cannot be removed through normal app actions unless ownership transfer exists. Ownership transfer is out of scope for this slice.

### `practice_team_activity`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `team_id uuid not null references practice_teams(id) on delete cascade`
- `activity_date date not null`
- `source text not null default 'manual'`
- `count integer not null default 1 check (count > 0)`
- `created_by uuid references profiles(id) on delete set null`
- `created_at timestamptz not null default now()`
- unique `(team_id, activity_date, source)`

Indexes:

- index on `(team_id, activity_date desc)`

Activity aggregation:

- calendar count per day is `sum(count)` for the team/date;
- a streak day is active when the aggregated count is greater than 0.

### `practice_team_api_keys`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `team_id uuid not null references practice_teams(id) on delete cascade`
- `key_prefix text not null`
- `key_hash text not null unique`
- `created_by uuid references profiles(id) on delete set null`
- `created_at timestamptz not null default now()`
- `last_used_at timestamptz`
- `revoked_at timestamptz`

Security:

- store only a cryptographic hash of the generated key;
- return the raw key only once after generation;
- use constant-time comparison when validating candidate keys;
- key format: `kleia_team_<random-token>`.

## RLS and Server-Side Access

All new public-schema tables must enable RLS.

Policies:

- public users can select public team profile data from `practice_teams`;
- authenticated users can create teams where `owner_id = auth.uid()`;
- owners/admins can update their teams;
- members can select their own team membership rows;
- owners/admins can insert/delete team member rows;
- owners/admins can select API key metadata for their teams;
- no client-side policy exposes `key_hash`;
- API key generation/revocation uses server actions after owner/admin checks.

The public API route uses the service client on the server only, validates the API key, then returns a safe response. The service role is never exposed to clients.

## API Design

### `GET /api/public/teams/[slug]/streaks`

Auth:

```http
Authorization: Bearer kleia_team_<token>
```

Behavior:

- find team by slug;
- reject missing, revoked, or invalid API key;
- apply route-level rate limiting by IP and API key prefix;
- update `last_used_at` after successful validation;
- return only public team/streak/calendar data.

Response:

```json
{
  "team": {
    "name": "Team Name",
    "slug": "team-name",
    "avatar_url": "https://example.com/avatar.png",
    "member_count": 5
  },
  "streaks": {
    "current": 12,
    "longest": 28
  },
  "calendar": [
    { "date": "2026-09-06", "count": 3 },
    { "date": "2026-09-05", "count": 1 }
  ]
}
```

Errors:

- `401` for missing/invalid API key;
- `403` for revoked key;
- `404` for unknown team;
- `429` when route-level rate limiting is exceeded.

## Streak Calculation

Input is a list of daily counts sorted by date.

Definitions:

- `current`: consecutive active days ending today. If today has no activity, current streak can end yesterday only if product decision later allows grace periods. For this slice, no grace period.
- `longest`: longest consecutive active-day run in the available history.
- `calendar`: last 365 days, including days with zero activity if needed by the UI/API consumer.

The calculation should live in a pure utility so both the team page and public API route use identical logic.

## Image Upload

Use the existing secure upload approach as a reference:

- allow images only: PNG, JPEG, GIF, WebP;
- enforce size limit;
- verify MIME/type server-side;
- store through the existing Cloudinary-backed server upload path, with a team-avatar-specific wrapper;
- save only the resulting safe URL in `practice_teams.avatar_url`.

The current upload helper is CTF-specific, so implementation should add a small team-avatar-specific wrapper rather than reusing CTF naming.

## External Website Usage

Example:

```ts
const res = await fetch('https://kleia.example.com/api/public/teams/red-team/streaks', {
  headers: {
    Authorization: `Bearer ${process.env.KLEIA_TEAM_API_KEY}`,
  },
})
const data = await res.json()
```

The external site should call the API from its server or build pipeline, not expose the API key in browser JavaScript.

## Testing Plan

Add tests for:

- migration includes all four tables and RLS;
- team creation action inserts owner membership;
- API key generation is blocked below 5 accepted members;
- API key generation stores only hash/prefix, not raw key;
- public streak API rejects missing/invalid/revoked keys and rate-limited requests;
- streak utility calculates current and longest streak correctly;
- `/teams/[slug]` and settings page include the GitHub-style calendar/settings controls.

## Rollout Plan

1. Add migration and RLS.
2. Add pure streak utility and tests.
3. Add team server actions.
4. Add team pages and settings UI.
5. Add team avatar upload.
6. Add API key generation/revocation.
7. Add public streak API route.
8. Run full test/build/lint verification.

## Open Constraints

The first implementation will not support:

- external activity writes;
- ownership transfer;
- private teams;
- multiple API key scopes.

These are deliberately excluded to keep the first slice secure and manageable.
