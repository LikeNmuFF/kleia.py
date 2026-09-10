# Private practice backend review

Reviewed 2026-09-09 against `docs/superpowers/specs/2026-09-09-private-practice-design.md`. Scope: migration, practice actions/access/file resolver and route, existing upload route and CTF integration. UI was still in progress and is excluded. This is a static review; the parent agent owns executable SQL and application verification.

## Finding

**P2 — Reusing a released attachment breaks all its public snapshots.** In the reviewed version, `lib/practice/files.ts:18-20` selects publications by `upload_id` with `maybeSingle()`, although `practice_publications.upload_id` is deliberately nonunique (`20260909150022_private_practice.sql:38`). Reproduction: publish challenge A with upload U; replace A's attachment with V; create challenge B in the same room with U using the owning admin; publish B. The current practice attachment uniqueness constraint allows this, both publications retain U, and the public resolver receives a multiple-row error and returns null. Both global attachment links now return 404 for nonmembers. Iterate recorded publications and authorize if any associated global copy passes all visibility checks. Do not simply select the first row, because that copy may be inactive while another is public. Reported to parent, who accepted and is implementing the fix and regression test.

## Reviewed controls

- Authenticated users cannot directly insert/update rooms, membership, challenges, attempts or publications. Feedback writes require their own user ID and current room access. Flag hashes have no authenticated column grant; server reads use explicit safe projections.
- Submission RPC checks current access and activity, locks membership against deletion, serializes per actor/challenge, and inserts only private attempts. No XP, global submission, team score or first-blood write path was found.
- Publication locks the source row, records an atomic global snapshot, and returns an existing publication on repeated calls. Foreign-key cascade from deleted global copies permits republishing. Subsequent practice field edits do not update global copies.
- Private upload creation is admin-only and room-scoped. Existing global/season upload resolution rejects room scope; the database constraint also prevents a room upload gaining a global `challenge_id`.
- File authorization requires current room membership plus a current attachment, or an actual publication record and an approved, active, publicly visible global copy. An arbitrary global `file_url` is insufficient. The route streams server-side authenticated storage fetches with no-store and attachment headers.
- Invitation and reminder RPCs require an admin, serialize on the room, implement cooldown, and create the notification transactionally. The generic notification function cannot mint practice notification types.

No additional backend blocker was identified in this scope. This does not certify live infrastructure configuration or replace the parent's SQL/route tests. The inherited upload table exposes upload metadata only to its owner/admin; Cloudinary credentials and signed download URLs are not returned by the new route.
