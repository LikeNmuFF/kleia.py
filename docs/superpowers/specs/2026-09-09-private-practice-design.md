# Private Learning & Testing Ground

Approved in conversation on 2026-09-09. Admins create private rooms, invite registered users, remind them to test, revoke access, manage challenges and attachments, review attempts and feedback, and publish a separate global copy. Invited users may read room challenges, download attachments, submit flags, and leave feedback. Invitations grant room access immediately; no acceptance screen is required. There are no join links or self-enrollment.

## Isolation and access

Use `/practice` for the room list and `/practice/[id]` for a room. Link from Learn and Challenges navigation. Admins see all rooms; other users see only their invitations. Every server operation and file download checks current membership. Database row-level security independently enforces reads; mutations use narrow checked database functions or server-only service access after authorization. Membership revocation removes access on the next request. Already downloaded files cannot be recalled.

Keep practice challenges, flags, attempts and feedback in separate tables from global CTF. No practice action writes global submissions, XP, team scores, badges, or first blood. Never return a flag or flag hash to a tester. No executable challenge hosting is added: challenges consist of descriptions, flags, hints, explanations, optional existing lesson links and downloadable files.

## Data contract

- `practice_rooms`: id UUID, title, description, created_by, created_at.
- `practice_room_members`: room_id, user_id composite primary key, invited_by, invited_at, last_reminded_at nullable.
- `practice_challenges`: id, room_id, title, description, category (web/crypto/forensics/osint/misc), difficulty (easy/medium/hard), points positive integer, hint nullable, explanation nullable, flag_hash, upload_id nullable, learn_topic_slug nullable, learn_lesson_slug nullable, is_active default true, created_by, created_at.
- `practice_attempts`: id, challenge_id, user_id, is_correct, created_at. Never persist submitted flag text.
- `practice_feedback`: challenge_id/user_id composite key, message (1–2000 characters), updated_at.
- `practice_publications`: practice_challenge_id unique, ctf_challenge_id unique, upload_id nullable snapshot, published_by, published_at.
- Extend existing `ctf_challenge_uploads` with nullable `scope_room_id`. Room uploads cannot be attached through global/season challenge creation. Private file routes stream authenticated Cloudinary downloads with no-store and attachment headers.

## Database functions

Use `practice_can_access(p_room_id uuid)` for current authenticated user membership/admin checks; no caller-supplied user identity. Admin means profiles.role='admin'.

`practice_invite(p_room_id uuid,p_user_id uuid,p_remind boolean default false)` checks admin, inserts invitation plus notification atomically, or sends reminder to an existing member with a five-minute cooldown. A reminder never grants access. Notification types are `practice_invite` and `practice_reminder`. Do not send real invitations during verification.

`practice_submit(p_challenge_id uuid,p_flag text)` returns JSON `{correct:boolean,alreadySolved:boolean}`. Checks membership, active challenge and flag length 1–500; locks the member row to order submissions against revocation; enforces at most 30 attempts/hour and 5/minute per user/challenge in the database; compares uppercase/trimmed SHA-256 using existing pgcrypto; inserts private attempt only. Already-solved requests do not add attempts.

`practice_publish(p_challenge_id uuid)` returns the existing or new global UUID, checks admin, serializes on the practice challenge row, inserts approved active season-null global challenge with flag hash and learning link, records publication in the same transaction. Existing global solves start empty; practice history remains private. Repeated clicks return the same publication and do not duplicate challenges. Global copies are snapshots: subsequent practice edits do not update them. If the copy is deleted, clear publication via cascade so republishing is possible.

## Files and publication

Reuse `/api/ctf/uploads` with room_id and admin-only room authorization. Retain existing 25 MB and filename restrictions. Practice creation validates upload ownership, room scope and attachable status; prevent one file being attached to multiple practice challenges. Global `file_url` is `/api/practice/files/[uploadId]`. That route permits current room membership OR a recorded published global copy that is still approved, active and publicly visible under existing season rules. Publication linkage is admin-controlled; arbitrary global file_url values must never grant access. Cloudinary identifiers stay server-side. Changing the practice attachment preserves the published file snapshot.

## Experience

Admins create rooms on the list page. In a room they invite users through a searchable registered-user picker, see membership controls, and add/edit challenges. Each challenge shows instructions, optional lesson link, hint and explanation disclosures, attachment, solve status, flag form and feedback form. Admins additionally see private attempt/feedback history and publish status with a link to the global copy. Show pending/success/error states for every mutation. Never show private room metadata to unauthorized users; return not found.

## Verification and delivery

Behavioral tests cover denied anonymous/uninvited/revoked access, admin permissions, room upload scope, blocked private-file bypass, practice-only scoring, reminder cooldown, publication idempotence and preservation of private history. Verify RLS/RPC behavior using rollback-only SQL fixtures; never send notifications to real users. Existing unrelated repository test/type failures are documented separately. No push, production migration or actual user invitations occur as part of implementation.
