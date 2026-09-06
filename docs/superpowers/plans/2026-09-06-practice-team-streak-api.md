# Practice Teams and Streak API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public practice teams with profile images, accepted members, GitHub-style activity calendars, and a secure API key that external landing pages can use to read team streak data.

**Architecture:** Add four RLS-protected Supabase tables and server-only actions for team and key management. Keep streak calculation in a pure shared utility consumed by public team pages and the authenticated API route. Render `/teams` pages with server-loaded data and client components only for forms, uploads, member/key controls, and calendar interaction.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase SSR/service clients, Supabase SQL migrations/RLS, Cloudinary, existing `lib/rate-limit.ts`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-06-practice-teams-streak-api-design.md`

## Global Constraints

- API keys are generated only when a team has at least 5 accepted members, counting the owner.
- Store only a cryptographic key hash and non-secret prefix; show the raw key once.
- Keep the service-role client server-only; never expose `key_hash` or the service role to browsers.
- The first slice is public/read-only for external activity consumers: no external activity writes, ownership transfer, private teams, or multiple key scopes.
- Accept only PNG, JPEG, GIF, and WebP team avatars with server-side type and size validation through a team-avatar-specific Cloudinary wrapper.
- Streak semantics are identical everywhere: no grace period; current streak ends today; calendar covers the last 365 days.
- Every migration must enable RLS and include policies for public profiles, authenticated creation, owner/admin management, and member self-reads.

---

### Task 1: Add the practice-team schema and RLS

**Files:**
- Create: `supabase/migrations/20260906030000_practice_teams.sql`
- Create: `supabase/tests/practice_teams_schema.test.ts`

**Interfaces:**
- Produces tables `practice_teams`, `practice_team_members`, `practice_team_activity`, and `practice_team_api_keys` with the exact columns, constraints, indexes, and RLS behavior from the spec.
- Produces SQL predicates that later server actions can rely on for owner/admin/member checks.

- [ ] **Step 1: Write migration assertions first**

Add tests that read the migration text and assert all four table names, owner/member role and status checks, unique `(team_id, activity_date, source)`, unique `key_hash`, indexes, `enable row level security`, and policies for public team reads, owner creation, owner/admin writes, and member self-reads.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- supabase/tests/practice_teams_schema.test.ts`

Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Implement the migration**

Create UUID-backed tables with `created_at`/`updated_at` defaults, foreign keys with the specified delete behavior, indexes, an `updated_at` trigger for `practice_teams`, RLS, and policies. Add a policy-visible helper expression for public teams while keeping `practice_team_api_keys.key_hash` inaccessible to client roles. Ensure the initial owner membership is inserted by a later server action rather than a trigger.

- [ ] **Step 4: Run schema tests**

Run: `npm test -- supabase/tests/practice_teams_schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260906030000_practice_teams.sql supabase/tests/practice_teams_schema.test.ts
git commit -m "feat: add practice team schema and rls"
```

### Task 2: Implement and test shared streak calculations

**Files:**
- Create: `lib/practice-teams/streaks.ts`
- Create: `lib/practice-teams/streaks.test.ts`

**Interfaces:**
- Produces `type DailyActivity = { date: string; count: number }`.
- Produces `calculateTeamStreaks(activity: DailyActivity[], today?: string): { current: number; longest: number; calendar: DailyActivity[] }`.
- Produces `buildActivityCalendar(activity: DailyActivity[], endDate?: string, days?: number): DailyActivity[]` for the last 365 inclusive dates.

- [ ] **Step 1: Write failing unit tests**

Cover empty history, a streak ending today, a streak ending yesterday that is not current, gaps splitting the longest run, duplicate dates aggregated before calculation, and a 365-day calendar containing zero-count dates.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- lib/practice-teams/streaks.test.ts`

Expected: FAIL because the utility does not exist.

- [ ] **Step 3: Implement the pure utility**

Normalize ISO dates in UTC, aggregate positive counts per date, walk consecutive calendar dates for `longest`, count only a run ending on `today` for `current`, and generate exactly `days` rows ordered oldest-to-newest with zeroes for missing dates.

- [ ] **Step 4: Run tests**

Run: `npm test -- lib/practice-teams/streaks.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/practice-teams/streaks.ts lib/practice-teams/streaks.test.ts
git commit -m "feat: add practice team streak calculations"
```

### Task 3: Add secure team/avatar upload helpers

**Files:**
- Create: `lib/practice-teams/validation.ts`
- Create: `lib/practice-teams/avatar-upload.ts`
- Create: `lib/practice-teams/validation.test.ts`
- Create: `lib/practice-teams/avatar-upload.test.ts`
- Modify: `lib/ctf/uploads/cloudinary.ts` (reuse its established Cloudinary configuration boundary without changing CTF behavior)

**Interfaces:**
- Produces `validatePracticeTeamInput(input)` returning normalized `{ name, slug, description }` or field errors.
- Produces `uploadPracticeTeamAvatar(file: File): Promise<{ secureUrl: string; publicId: string }>`.

- [ ] **Step 1: Write failing validation/upload tests**

Test slug normalization and rejection of empty/overlong names, accepted PNG/JPEG/GIF/WebP signatures, rejection of SVG/PDF/ZIP and oversized files, and that the uploader passes a `practice-team-avatars` folder and verified MIME bytes to Cloudinary.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- lib/practice-teams/validation.test.ts lib/practice-teams/avatar-upload.test.ts`

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement helpers**

Use `file-type`/existing upload validation patterns for byte verification, enforce the configured size ceiling before upload, normalize slugs deterministically, and call the existing Cloudinary server upload path with a team-specific folder and safe resource type.

- [ ] **Step 4: Run tests**

Run: `npm test -- lib/practice-teams/validation.test.ts lib/practice-teams/avatar-upload.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/practice-teams lib/ctf/uploads/cloudinary.ts
git commit -m "feat: validate practice team data and avatars"
```

### Task 4: Add server actions for teams, members, activity, and API keys

**Files:**
- Create: `app/actions/practice-teams.ts`
- Create: `lib/practice-teams/api-keys.ts`
- Create: `lib/practice-teams/queries.ts`
- Create: `app/actions/practice-teams.test.ts`
- Create: `lib/practice-teams/api-keys.test.ts`

**Interfaces:**
- Produces `createPracticeTeam(formData): Promise<{ slug: string }>`.
- Produces `updatePracticeTeam(slug, formData)`, `addPracticeTeamMember(slug, userId)`, `removePracticeTeamMember(slug, userId)`, and `recordPracticeTeamActivity(slug, date, count)` with owner/admin authorization.
- Produces `generatePracticeTeamApiKey(slug): Promise<{ rawKey: string; keyPrefix: string }>` and `revokePracticeTeamApiKey(slug, keyId)`.
- Produces query functions `getPublicPracticeTeams`, `getPracticeTeamBySlug`, `getAcceptedMemberCount`, `getPracticeTeamActivity`, and `getPracticeTeamApiKeyMetadata`.

- [ ] **Step 1: Write failing action/key tests**

Cover owner membership creation, duplicate slug handling, non-owner rejection, member removal protection for the owner, key generation rejection below five accepted members, random raw-key generation, hash-only persistence, revoked-key handling, and admin access.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- app/actions/practice-teams.test.ts lib/practice-teams/api-keys.test.ts`

Expected: FAIL because actions and key helpers do not exist.

- [ ] **Step 3: Implement key primitives**

Generate `kleia_team_` plus cryptographically random token, derive a display prefix, hash with SHA-256, compare candidate hashes in constant time, and never return `key_hash` from query functions.

- [ ] **Step 4: Implement server actions**

Use the authenticated Supabase server client for user-scoped reads/writes, service client only where an atomic privileged operation is required, validate all form data, insert the owner as accepted membership, enforce owner/admin checks, and revalidate affected team paths.

- [ ] **Step 5: Run tests**

Run: `npm test -- app/actions/practice-teams.test.ts lib/practice-teams/api-keys.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/actions/practice-teams.ts app/actions/practice-teams.test.ts lib/practice-teams/api-keys.ts lib/practice-teams/api-keys.test.ts lib/practice-teams/queries.ts
git commit -m "feat: add practice team server actions"
```

### Task 5: Build the public team pages and GitHub-style calendar

**Files:**
- Create: `app/(main)/teams/page.tsx`
- Create: `app/(main)/teams/new/page.tsx`
- Create: `app/(main)/teams/[slug]/page.tsx`
- Create: `app/(main)/teams/[slug]/settings/page.tsx`
- Create: `components/practice-teams/PracticeTeamGrid.tsx`
- Create: `components/practice-teams/PracticeTeamForm.tsx`
- Create: `components/practice-teams/PracticeTeamCalendar.tsx`
- Create: `components/practice-teams/PracticeTeamSettings.tsx`
- Create: `components/practice-teams/PracticeTeamMembers.tsx`
- Create: `app/(main)/teams/pages.test.tsx`

**Interfaces:**
- Consumes the query/action interfaces from Tasks 2 and 4.
- `PracticeTeamCalendar` accepts `{ calendar: DailyActivity[]; current: number; longest: number }` and renders zero-to-high activity intensity without inventing client-side streak semantics.

- [ ] **Step 1: Write page/component tests**

Assert the list renders team metadata and streak summaries, the profile page includes member count and a 365-day calendar, the create form includes name/slug/description/avatar controls, and settings disables key generation under five accepted members while showing member and revoke controls for owners/admins.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- 'app/(main)/teams/pages.test.tsx'`

Expected: FAIL because routes/components do not exist.

- [ ] **Step 3: Implement server pages and client controls**

Load public data in server components, protect `/teams/new` and settings with the existing auth redirect pattern, use server actions for mutations, render avatar upload state and accessible errors, and display the calendar with keyboard-readable labels and a legend.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- 'app/(main)/teams/pages.test.tsx'`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'app/(main)/teams' components/practice-teams
git commit -m "feat: add practice team pages and activity calendar"
```

### Task 6: Add the public streak API route and rate limiting

**Files:**
- Create: `app/api/public/teams/[slug]/streaks/route.ts`
- Create: `app/api/public/teams/[slug]/streaks/route.test.ts`
- Modify: `lib/rate-limit.ts` only if a small reusable key/IP bucket is required by the existing implementation

**Interfaces:**
- Produces `GET(request, { params: Promise<{ slug: string }> }): Promise<Response>`.
- Returns the exact safe `{ team, streaks, calendar }` JSON shape from the spec.

- [ ] **Step 1: Write failing route tests**

Mock the service client and rate limiter to cover missing authorization (401), unknown team (404), invalid key (401), revoked key (403), successful response with `last_used_at` update, and key-prefix/IP rate limiting (429). Assert no response includes `key_hash`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- 'app/api/public/teams/[slug]/streaks/route.test.ts'`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement route**

Parse the bearer token, find the public team by slug, hash/validate the candidate against non-revoked keys using the server service client, rate-limit by client IP and key prefix, update `last_used_at` only after validation, load activity, calculate streaks through the shared utility, and return only the public contract.

- [ ] **Step 4: Run route tests**

Run: `npm test -- 'app/api/public/teams/[slug]/streaks/route.test.ts'`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'app/api/public/teams/[slug]/streaks/route.ts' 'app/api/public/teams/[slug]/streaks/route.test.ts' lib/rate-limit.ts
git commit -m "feat: expose practice team streak api"
```

### Task 7: Add navigation/discoverability and external integration documentation

**Files:**
- Modify: `components/nav/navItems.ts`
- Modify: `app/(main)/ctf/page.tsx` only if the existing community navigation groups teams there; otherwise keep team navigation standalone
- Create: `docs/practice-team-api.md`

**Interfaces:**
- Produces a discoverable Teams link and documents server-side external usage with environment-variable storage, response fields, error codes, and key revocation.

- [ ] **Step 1: Write navigation/documentation assertions**

Assert the nav item points to `/teams`, the API guide contains the exact endpoint/header example, warns against browser exposure, and documents the five-member prerequisite.

- [ ] **Step 2: Implement navigation and guide**

Add the route using the existing nav item shape and document a server-side `fetch` example, calendar semantics, rotation/revocation procedure, and 401/403/404/429 behavior.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- components/nav/navItems.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/nav/navItems.ts docs/practice-team-api.md
git commit -m "docs: expose practice teams and api usage"
```

### Task 8: Run the complete verification suite and review the diff

**Files:**
- Modify only files required by failing verification output.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: PASS with no existing regression failures.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint`

Expected: PASS with no new lint errors.

Run: `npm run build`

Expected: PASS and all `/teams` and public API routes compile.

- [ ] **Step 3: Inspect security-sensitive diff**

Run: `git diff --check` and `git diff --stat HEAD~8..HEAD`, then inspect that no raw API key, service-role secret, or `key_hash` is rendered or logged.

- [ ] **Step 4: Commit any verification-only fixes**

```bash
git add <specific-fixed-files>
git commit -m "fix: address practice team verification findings"
```

