# Private practice database implementation

- CLI-created migration: `supabase/migrations/20260909150022_private_practice.sql` (Supabase CLI 2.95.3).
- Separate rooms, memberships, challenges, attempts, feedback, publications; RLS enabled on all six. Client table grants are revoked before safe grants are applied. Challenge column grants exclude `flag_hash`, including for wildcard queries.
- Room/challenge/member mutations use authorized server service access. Authenticated feedback is own-row only with live room access. Attempts have no client write grant.
- Checked current-user RPCs implement atomic invitation and notification, reminder cooldown, database flag comparison and rate limits, serialized/idempotent publication. Generic notification RPC rejects practice types.
- Challenge attachment trigger and publish both require approved, admin-owned, room-scoped uploads without season/global attachment. Unique practice upload binding and publication snapshot references retain the original upload. The upload table scope check additionally prevents attaching room assets to global/season records.
- Publishing writes only a new global challenge and publication mapping. It copies no attempts or scores. Deleting the global challenge cascades its publication mapping so republishing is possible.
- Definer functions use an empty search path and qualified tables/functions. Actor IDs come exclusively from `auth.uid()`; no service-key RPC impersonation. Trigger function execution is revoked from client roles.

## Verification

Read-only production metadata confirmed dependent columns, constraints, notification types and pgcrypto's `extensions` schema. No production schema/data writes or real invitations occurred. Reviewed current Supabase RLS documentation and changelog (markdown fetch unsupported; used HTML fallback).

`supabase/tests/private_practice.sql` contains rollback fixtures for anonymous/outsider/member/admin access, concealed hashes, forged attempts, flag normalization, repeated solves, both rate limits, invite idempotence, reminder cooldown/non-enrollment, generic notification spoofing, publication snapshots/idempotence, and revocation.

Docker daemon and psql were unavailable. Parent agent is running the migration and fixtures against disposable PGlite with minimal application schema, auth-role bootstrap, and a documented SHA-256 substitute for pgcrypto. Consult the integration report for executed results; this report does not claim production-equivalent execution. Concurrency locks require a real PostgreSQL multi-session validation before deployment.

No migration applied to production, no push, no commit.
