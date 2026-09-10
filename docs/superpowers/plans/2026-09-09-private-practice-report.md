# Private Practice Implementation Report

## Delivered

The feature branch adds `/practice` and `/practice/[id]` as private, invitation-only learning and testing rooms. Admins can create rooms, search registered users, invite, remind and revoke testers, create and edit challenges, attach room-scoped files, review recent attempts and feedback, test challenges themselves, and publish an idempotent global snapshot to `/ctf`. Invited users can view only their rooms, solve active challenges, download authorized attachments, follow lesson links and maintain feedback. There is no self-enrollment or public join URL.

Practice attempts are stored separately and never update global submissions, XP, leaderboards, teams, badges or first-blood records. Flag hashes are excluded from authenticated table grants and application projections. Revocation is checked again for page reads, submissions, feedback and private downloads. Published downloads require a recorded publication plus an approved, active, publicly visible global copy.

## Database

The CLI-generated migration is `supabase/migrations/20260909150022_private_practice.sql`. It creates six RLS-enabled practice tables and checked RPCs for invitation/reminders, rate-limited submissions and snapshot publication. The existing upload table gains mutually exclusive room scope. The generic notification RPC cannot spoof practice invitations.

The migration was applied to a disposable in-memory PostgreSQL-compatible runtime. `supabase/tests/private_practice.sql` passed 40 assertions covering anonymous/outsider/member/admin access, flag secrecy, forged solves, 5/minute and 30/hour limits, invitation idempotence, reminder cooldown, notification spoofing, member mutation denial, publication/republishing, attachment scope and scan state, snapshot retention, global-score isolation and revocation. The transaction rolled back all fixtures and notifications. The test bootstrap documents its SHA-256 compatibility shim. No production database was changed and no real notification was sent.

## Application verification

- Focused app regression run: 10 suites and 39 tests passed. The unrelated existing `app/actions/notifications.test.ts` cannot resolve the existing `@/lib/errorHandler` import under the current test setup, so it was excluded from the green rerun and remains unchanged.
- Full repository run: 78 test files and 242 tests passed; 4 files remained nonzero for unrelated baseline issues. Two suites cannot resolve existing `@/lib/errorHandler` and `@/lib/supabase/service` aliases. Two source-text tests fail because they assert LF-only snippets against CRLF files in `chat.ts` and `posts.ts`.
- Changed-file ESLint: passed with no diagnostics.
- TypeScript: new files produced no reported error. The repository check remains nonzero because of the pre-existing `Buffer<ArrayBufferLike>` versus `BlobPart` error at `lib/practice-teams/avatar-upload.test.ts:21`.
- Independent backend review found one concrete multi-publication attachment bug. A regression test reproduced it, and the resolver now considers every recorded snapshot and grants public download if any associated global copy is currently public.

## Deployment boundary

The branch contains the code and migration but does not apply the migration to production, invite users, merge to `main`, or push. Before production rollout, apply the migration in a controlled deployment and run a real PostgreSQL multi-session test of submission versus membership revocation locks; the disposable runtime verified SQL behavior but not concurrent sessions.
