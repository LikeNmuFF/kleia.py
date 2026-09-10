# Private Practice Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task-by-task with review and behavioral verification.

**Goal:** Invite-only learning/testing rooms with independent solves and admin publishing to global CTF.

**Architecture:** Separate private tables and narrowly authorized RPCs. Existing challenge upload storage gains room scope; file access verifies private membership or a genuine public publication. Next server actions expose explicitly selected safe fields.

**Tech Stack:** Next.js, React, TypeScript, Supabase Postgres, Cloudinary, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-private-practice-design.md`

## Global Constraints

- No practice action writes global submissions, XP, team scores, badges, or first blood.
- Never return a flag or flag hash to a tester.
- No push, production migration or actual user invitations occur as part of implementation.
- Preserve existing unrelated working changes and existing global/season behavior.

## Task 1: Database authorization and workflows

Files: new CLI-generated migration in `supabase/migrations`; rollback SQL verification in `supabase/tests/private_practice.sql`.
Interfaces: exact tables and RPC signatures in the spec. Public challenge fields described there; standard metadata defaults and foreign keys included.
- [ ] Write SQL assertions exercising outsider/member/admin contexts, revocation, repeated publication, and attempt isolation.
- [ ] Create migration with Supabase CLI, implement separate RLS tables, safe grants, invitation/reminder transaction, rate-limited flag RPC and publish RPC.
- [ ] Test migration on disposable/local database where available; otherwise document validation boundary and prepare rollback fixtures.
- [ ] Review grants, actor identity, file scope, notifications, locks and idempotence.

## Task 2: Application server boundaries and files

Files: `lib/practice/types.ts`, `lib/practice/access.ts`, `app/actions/practice.ts`, `app/api/practice/files/[id]/route.ts`; extend `app/api/ctf/uploads/route.ts`, `lib/ctf/uploads/scope.ts`, `app/actions/ctf.ts` and notifications type.
Interfaces: typed action contracts in `lib/practice/types.ts`. Actions `getPracticeRooms`, `getPracticeRoom`, `createPracticeRoom`, `findPracticeUsers`, `invitePracticeMember`, `remindPracticeMember`, `revokePracticeMember`, `savePracticeChallenge`, `submitPracticeFlag`, `savePracticeFeedback`, `publishPracticeChallenge`.
- [ ] Behavioral tests for server authorization, upload scope and guarded file serving must fail before implementation.
- [ ] Implement queries through authenticated RLS clients, safe projections and checked mutations; service access only after authorization.
- [ ] Extend uploads to room-only admin scope and reject room upload attachment in legacy global/season flows.
- [ ] Run new action/file tests plus existing CTF upload and maintenance tests.

## Task 3: Room experience

Files: `app/(main)/practice/page.tsx`, `app/(main)/practice/[id]/page.tsx`, `components/practice/RoomList.tsx`, `components/practice/PracticeRoom.tsx`, `components/practice/ChallengeEditor.tsx`, navigation and Learn entry point.
Consumes: typed actions from Task 2; no direct database clients in UI.
- [ ] Render tests verify invite-only empty state, admin room creation, member practice controls and unavailable-room behavior.
- [ ] Implement readable responsive UI using existing CSS variables and input-field/button styles. Expose all approved flows with pending/error states.
- [ ] Render and inspect admin and member views. Verify publish copy wording and no flag/hash exposure.

## Task 4: Integration and review

- [ ] Run focused test suite, type check and changed-file lint; distinguish baseline issues.
- [ ] Review against every spec requirement, particularly direct file/API access after revocation and global scoring isolation.
- [ ] Record verification and deployment steps in `docs/superpowers/plans/2026-09-09-private-practice-report.md`.
- [ ] Leave a reviewable feature branch; report migration/deployment state accurately.
