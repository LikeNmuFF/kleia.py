# Secure Contributor Challenge Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contributors and admins can attach scanned, backend-validated files to global and season CTF challenges, and players can download only approved attachments through Kleia.

**Architecture:** Files go from the browser to `POST /api/ctf/uploads`, never directly to Cloudinary. The API authenticates with Supabase, validates bytes locally, uploads an authenticated raw asset to Cloudinary with Perception Point moderation, records `pending/approved/rejected` scan state, and exposes downloads only through `GET /api/ctf/files/[id]`. Challenge actions accept an opaque `upload_id`; they verify ownership, scan status, reuse, and scope before writing `/api/ctf/files/<id>` into `ctf_challenges.file_url`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR/Auth/Postgres RLS, Cloudinary Node SDK `cloudinary@2.11.0`, `file-type@22.0.2`, `yauzl@3.4.0`, `sharp@0.35.4`, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-06-secure-contributor-challenge-uploads-design.md`

## Global Constraints

- Keep Cloudinary credentials server-only; no upload preset, API key, signature, or direct Cloudinary upload URL in client code.
- Maximum upload request size is 25 MiB, enforced by `Content-Length`, `File.size`, and final byte buffer length.
- Allow only `.zip`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.pdf`, `.txt`, `.md`, `.json`, `.csv`, `.pcap`, and `.pcapng`.
- Reject extensionless files and blocked active formats such as HTML, SVG, JavaScript, WebAssembly, shell scripts, macro Office files, executables, installers, shared libraries, JAR/APK files, and disk images.
- Validate by file bytes, not browser MIME type. Binary signatures must match extension; text files must be valid UTF-8 with no NUL bytes.
- Re-encode raster images server-side, strip metadata and trailing payloads, reject animated images, and cap images at 25 megapixels.
- Inspect ZIP central-directory entries without extracting to disk; reject encrypted files, unsafe paths, symlinks, nested archives, blocked extensions, more than 200 entries, more than 100 MiB expanded, and compression ratio over 100:1.
- Upload to Cloudinary as `resource_type=raw`, `type=authenticated`, `moderation=perception_point`, with `notification_url`.
- Fail closed if Cloudinary does not return Perception Point moderation status `pending` or `approved`; destroy the uploaded asset before responding.
- Verify Cloudinary webhooks with `X-Cld-Signature`, `X-Cld-Timestamp`, and `CLOUDINARY_API_SECRET`; reject timestamps older than five minutes.
- Browser clients get `select` RLS for owned upload rows only. Insert, update, and delete happen through server-side service-role code after application authorization.
- Downloads return `Content-Disposition: attachment`, `Content-Type: application/octet-stream`, `X-Content-Type-Options: nosniff`, and private cache headers.
- Rate-limit uploads to five attempts per user per hour and reject cross-origin browser upload requests.
- Production remains fail-closed until Cloudinary Perception Point is activated and clean/EICAR manual tests pass.

---

## File Structure

- Create `lib/ctf/uploads/types.ts`: shared upload constants, extension groups, result types, and database row interfaces.
- Create `lib/ctf/uploads/validate.ts`: pure filename, magic-byte, text, image, and ZIP validation.
- Create `lib/ctf/uploads/cloudinary.ts`: Cloudinary configuration, signed upload, moderation parsing, asset destroy, private download URL, and webhook signature helpers.
- Create `lib/ctf/uploads/scope.ts`: authorization helpers for admin/contributor upload scope and challenge attachment checks.
- Create `app/api/ctf/uploads/route.ts`: authenticated upload creation and status polling endpoints.
- Create `app/api/ctf/files/[id]/route.ts`: approved attachment download proxy.
- Create `app/api/webhooks/cloudinary/route.ts`: verified Perception Point status webhook.
- Modify `app/actions/ctf.ts`: accept `upload_id` on create/update, link approved uploads atomically, and preserve existing attachment behavior on edit.
- Modify `app/(main)/contributor/ContributorDashboard.tsx`: replace free-form file URL with upload picker/status UI.
- Modify `app/(main)/ctf/[id]/page.tsx`: keep download link pointed at stored `/api/ctf/files/<id>` and remove `target="_blank"` for internal attachments.
- Create `supabase/migrations/20260906030000_ctf_challenge_uploads.sql` when the Supabase CLI is unavailable: table, indexes, grants, and RLS policies.
- Create tests beside their code: `lib/ctf/uploads/validate.test.ts`, `lib/ctf/uploads/cloudinary.test.ts`, `lib/ctf/uploads/scope.test.ts`, `app/api/ctf/uploads/route.test.ts`, `app/api/ctf/files/[id]/route.test.ts`, `app/api/webhooks/cloudinary/route.test.ts`, and extend `app/actions/season-challenge-visibility.test.ts`.

---

### Task 1: Install Pinned Upload Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: runtime imports `cloudinary`, `file-type`, `sharp`, and `yauzl`.

- [ ] **Step 1: Install pinned packages**

```bash
npm.cmd install cloudinary@2.11.0 file-type@22.0.2 sharp@0.35.4 yauzl@3.4.0
```

- [ ] **Step 2: Verify dependency tree**

Run:

```bash
npm.cmd ls cloudinary file-type sharp yauzl
```

Expected: all four package names appear once at the pinned versions.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add secure upload dependencies"
```

---

### Task 2: Add Upload Validation Types and Tests

**Files:**
- Create: `lib/ctf/uploads/types.ts`
- Create: `lib/ctf/uploads/validate.test.ts`
- Create: `lib/ctf/uploads/validate.ts`

**Interfaces:**
- Produces:
  - `MAX_UPLOAD_BYTES = 25 * 1024 * 1024`
  - `MAX_ZIP_EXPANDED_BYTES = 100 * 1024 * 1024`
  - `MAX_ZIP_ENTRIES = 200`
  - `MAX_ZIP_RATIO = 100`
  - `type UploadScope = { seasonId: string | null }`
  - `type ValidatedUpload = { buffer: Buffer; originalName: string; storedName: string; extension: AllowedUploadExtension; sizeBytes: number; sha256: string; contentKind: 'archive' | 'image' | 'document' | 'capture' }`
  - `async function validateChallengeUpload(fileName: string, input: Buffer): Promise<ValidatedUpload>`
  - `function normalizeUploadFileName(fileName: string): { originalName: string; storedName: string; extension: AllowedUploadExtension }`

- [ ] **Step 1: Write failing validation tests**

Use `Buffer.from(...)` fixtures directly for PDF, PNG header, pcap header, UTF-8 text, and small synthetic invalid files. For ZIP tests, create buffers with `yauzl`-readable fixtures committed as inline base64 strings.

```ts
import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_BYTES } from './types'
import { normalizeUploadFileName, validateChallengeUpload } from './validate'

describe('secure challenge upload validation', () => {
  it('normalizes display filenames and rejects extensionless files', () => {
    expect(normalizeUploadFileName('..\\evil\u0000name.PDF')).toMatchObject({
      originalName: 'evilname.PDF',
      storedName: 'evilname.pdf',
      extension: 'pdf',
    })
    expect(() => normalizeUploadFileName('payload')).toThrow('Unsupported file type')
  })

  it('rejects oversize buffers before parsing', async () => {
    await expect(validateChallengeUpload('big.txt', Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x61)))
      .rejects.toThrow('File exceeds 25 MB')
  })

  it('rejects extension and magic-byte disagreement', async () => {
    const pngHeader = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
    await expect(validateChallengeUpload('picture.pdf', Buffer.concat([pngHeader, Buffer.alloc(64)])))
      .rejects.toThrow('Unsupported file type')
  })

  it('rejects text with NUL bytes and invalid JSON', async () => {
    await expect(validateChallengeUpload('notes.txt', Buffer.from([0x61, 0x00, 0x62])))
      .rejects.toThrow('Unsupported file type')
    await expect(validateChallengeUpload('config.json', Buffer.from('{bad json', 'utf8')))
      .rejects.toThrow('Unsupported file type')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- lib/ctf/uploads/validate.test.ts
```

Expected: FAIL because `lib/ctf/uploads/validate.ts` and exported constants do not exist.

- [ ] **Step 3: Implement constants, extension allowlist, filename normalization, magic-byte checks, text checks, image re-encoding, and ZIP inspection**

```ts
export const ALLOWED_UPLOAD_EXTENSIONS = ['zip', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'md', 'json', 'csv', 'pcap', 'pcapng'] as const
export const BLOCKED_UPLOAD_EXTENSIONS = new Set(['html', 'htm', 'svg', 'js', 'mjs', 'cjs', 'wasm', 'sh', 'bash', 'ps1', 'bat', 'cmd', 'exe', 'dll', 'so', 'dylib', 'msi', 'jar', 'apk', 'iso', 'img', 'docm', 'xlsm', 'pptm'])
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
```

Implement `validateChallengeUpload()` so it returns a re-encoded image buffer for images and the original buffer for accepted archives/documents/captures. Throw exactly these client-safe errors: `Unsupported file type`, `File exceeds 25 MB`, and `Archive contains unsafe content`.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- lib/ctf/uploads/validate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ctf/uploads/types.ts lib/ctf/uploads/validate.ts lib/ctf/uploads/validate.test.ts
git commit -m "feat: validate ctf challenge uploads"
```

---

### Task 3: Add Upload Table Migration

**Files:**
- Create: `supabase/migrations/20260906030000_ctf_challenge_uploads.sql` when `npx.cmd supabase migration new ctf_challenge_uploads` is unavailable

**Interfaces:**
- Produces table `public.ctf_challenge_uploads` with columns from the spec.
- Produces policies:
  - owners can select their own uploads;
  - admins can select all uploads;
  - no browser insert/update/delete policy.

- [ ] **Step 1: Try the Supabase CLI migration command**

```bash
npx.cmd supabase migration new ctf_challenge_uploads
```

Expected: a new timestamped SQL file under `supabase/migrations`.

- [ ] **Step 2: If the CLI is unavailable, create `supabase/migrations/20260906030000_ctf_challenge_uploads.sql`**

Use this exact SQL body:

```sql
create table if not exists public.ctf_challenge_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid unique references public.ctf_challenges(id) on delete cascade,
  scope_season_id uuid references public.ctf_seasons(id) on delete cascade,
  cloudinary_asset_id text not null unique,
  cloudinary_public_id text not null unique,
  original_name text not null,
  stored_name text not null,
  extension text not null check (extension in ('zip','png','jpg','jpeg','gif','webp','pdf','txt','md','json','csv','pcap','pcapng')),
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  sha256 text not null,
  scan_status text not null check (scan_status in ('pending','approved','rejected')),
  scan_provider text not null default 'perception_point',
  scan_result jsonb,
  created_at timestamptz not null default now(),
  scanned_at timestamptz
);

create index if not exists idx_ctf_challenge_uploads_owner_id on public.ctf_challenge_uploads(owner_id);
create index if not exists idx_ctf_challenge_uploads_challenge_id on public.ctf_challenge_uploads(challenge_id);
create index if not exists idx_ctf_challenge_uploads_scope_season_id on public.ctf_challenge_uploads(scope_season_id);
create index if not exists idx_ctf_challenge_uploads_scan_status_created_at on public.ctf_challenge_uploads(scan_status, created_at);

alter table public.ctf_challenge_uploads enable row level security;

grant select on public.ctf_challenge_uploads to authenticated;
grant select, insert, update, delete on public.ctf_challenge_uploads to service_role;

drop policy if exists "Upload owners can view own uploads" on public.ctf_challenge_uploads;
create policy "Upload owners can view own uploads"
  on public.ctf_challenge_uploads for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Admins can view challenge uploads" on public.ctf_challenge_uploads;
create policy "Admins can view challenge uploads"
  on public.ctf_challenge_uploads for select to authenticated
  using (
    exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'admin'
    )
  );
```

- [ ] **Step 3: Review the migration for accidental public writes**

Run:

```bash
rg "for (insert|update|delete)|grant .*insert|grant .*update|grant .*delete" supabase/migrations/*ctf_challenge_uploads.sql
```

Expected: no `insert`, `update`, or `delete` policy for `authenticated`; write grants appear only for `service_role`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/*ctf_challenge_uploads.sql
git commit -m "feat: add ctf challenge upload records"
```

---

### Task 4: Add Cloudinary Boundary

**Files:**
- Create: `lib/ctf/uploads/cloudinary.test.ts`
- Create: `lib/ctf/uploads/cloudinary.ts`

**Interfaces:**
- Consumes: `ValidatedUpload` from `lib/ctf/uploads/types.ts`.
- Produces:
  - `type CloudinaryUploadResult = { assetId: string; publicId: string; moderationStatus: 'pending' | 'approved' }`
  - `async function uploadValidatedChallengeFile(upload: ValidatedUpload, ownerId: string): Promise<CloudinaryUploadResult>`
  - `async function destroyChallengeFile(publicId: string): Promise<void>`
  - `function verifyCloudinaryWebhookSignature(body: string, signature: string | null, timestamp: string | null, nowMs?: number): boolean`
  - `function getModerationStatus(input: unknown): 'pending' | 'approved' | 'rejected' | null`
  - `async function getChallengeFileDownloadUrl(publicId: string, extension: string): Promise<string>`

- [ ] **Step 1: Write failing Cloudinary tests**

Mock `cloudinary.v2.uploader.upload_stream`, `cloudinary.v2.uploader.destroy`, and `cloudinary.v2.utils.private_download_url`.

```ts
import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { getModerationStatus, verifyCloudinaryWebhookSignature } from './cloudinary'

describe('cloudinary upload boundary', () => {
  it('extracts Perception Point moderation statuses only', () => {
    expect(getModerationStatus({ moderation: [{ kind: 'perception_point', status: 'pending' }] })).toBe('pending')
    expect(getModerationStatus({ moderation: [{ kind: 'manual', status: 'approved' }] })).toBeNull()
  })

  it('verifies webhook signatures within five minutes', () => {
    process.env.CLOUDINARY_API_SECRET = 'secret'
    const body = JSON.stringify({ public_id: 'kleia-ctf-files/u/file' })
    const timestamp = '1800000000'
    const signature = createHash('sha1').update(body + timestamp + 'secret').digest('hex')
    expect(verifyCloudinaryWebhookSignature(body, signature, timestamp, 1800000100_000)).toBe(true)
    expect(verifyCloudinaryWebhookSignature(body, signature, timestamp, 1800000401_000)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- lib/ctf/uploads/cloudinary.test.ts
```

Expected: FAIL because `cloudinary.ts` does not exist.

- [ ] **Step 3: Implement Cloudinary server helper**

Configure from `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. `uploadValidatedChallengeFile()` must generate public IDs as `kleia-ctf-files/${ownerId}/${crypto.randomUUID()}`, pass `resource_type: 'raw'`, `type: 'authenticated'`, `moderation: 'perception_point'`, `notification_url: ${NEXT_PUBLIC_SITE_URL}/api/webhooks/cloudinary`, and `context: { owner_id: ownerId, original_name: upload.originalName, sha256: upload.sha256 }`.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- lib/ctf/uploads/cloudinary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ctf/uploads/cloudinary.ts lib/ctf/uploads/cloudinary.test.ts
git commit -m "feat: add cloudinary challenge upload boundary"
```

---

### Task 5: Add Upload Authorization and Attachment Scope Checks

**Files:**
- Create: `lib/ctf/uploads/scope.test.ts`
- Create: `lib/ctf/uploads/scope.ts`

**Interfaces:**
- Produces:
  - `type CallerRole = 'admin' | 'contributor' | 'user' | null`
  - `function canUploadGlobalChallengeFile(role: CallerRole): boolean`
  - `function canUploadSeasonChallengeFile(input: { role: CallerRole; invited: boolean }): boolean`
  - `function uploadScopeMatchesChallenge(input: { uploadSeasonId: string | null; challengeSeasonId: string | null }): boolean`

- [ ] **Step 1: Write failing scope tests**

```ts
import { describe, expect, it } from 'vitest'
import { canUploadGlobalChallengeFile, canUploadSeasonChallengeFile, uploadScopeMatchesChallenge } from './scope'

describe('challenge upload scope', () => {
  it('allows admins and contributors to upload global files', () => {
    expect(canUploadGlobalChallengeFile('admin')).toBe(true)
    expect(canUploadGlobalChallengeFile('contributor')).toBe(true)
    expect(canUploadGlobalChallengeFile('user')).toBe(false)
  })

  it('requires contributor invitation for season-scoped uploads', () => {
    expect(canUploadSeasonChallengeFile({ role: 'admin', invited: false })).toBe(true)
    expect(canUploadSeasonChallengeFile({ role: 'contributor', invited: true })).toBe(true)
    expect(canUploadSeasonChallengeFile({ role: 'contributor', invited: false })).toBe(false)
  })

  it('requires upload and challenge scope to match', () => {
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: null, challengeSeasonId: null })).toBe(true)
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: 's1', challengeSeasonId: 's1' })).toBe(true)
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: null, challengeSeasonId: 's1' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- lib/ctf/uploads/scope.test.ts
```

Expected: FAIL because `scope.ts` does not exist.

- [ ] **Step 3: Implement scope helpers**

Keep these helpers pure and reuse `contributor`/`admin` semantics from `lib/contributors.ts`.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- lib/ctf/uploads/scope.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ctf/uploads/scope.ts lib/ctf/uploads/scope.test.ts
git commit -m "feat: authorize challenge upload scopes"
```

---

### Task 6: Add Upload API and Status Polling

**Files:**
- Create: `app/api/ctf/uploads/route.test.ts`
- Create: `app/api/ctf/uploads/route.ts`

**Interfaces:**
- Consumes: `validateChallengeUpload()`, `uploadValidatedChallengeFile()`, `getServiceClient()`, scope helpers.
- Produces:
  - `POST /api/ctf/uploads` body `multipart/form-data` fields: `file`, optional `season_id`.
  - Success JSON: `{ id: string, status: 'pending' | 'approved', fileName: string }`.
  - `GET /api/ctf/uploads?id=<uuid>` returns `{ id, status, fileName }` for owner/admin only.

- [ ] **Step 1: Write failing route tests**

Test cases: unauthenticated returns 401, regular profile role returns 403 before Cloudinary, cross-origin `Origin` returns 403, oversize `Content-Length` returns 413, uninvited season contributor returns 403, valid upload inserts a pending record through `getServiceClient()`, and missing moderation metadata destroys the asset and returns 503.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- app/api/ctf/uploads/route.test.ts
```

Expected: FAIL because route is missing.

- [ ] **Step 3: Implement POST and GET**

Implementation requirements:

```ts
export const runtime = 'nodejs'

const sameOrigin = request.headers.get('origin') === process.env.NEXT_PUBLIC_SITE_URL
const length = Number(request.headers.get('content-length') || 0)
const rate = checkNamedRateLimit('ctf-upload', user.id, { windowMs: 60 * 60 * 1000, maxRequests: 5 })
```

Read the current user with `createClient().auth.getUser()`, fetch `profiles.role`, verify season invitation from `ctf_season_contributors` when `season_id` is present, parse exactly one `File`, validate bytes, upload to Cloudinary, and insert with `getServiceClient().from('ctf_challenge_uploads').insert(...)`. If insert fails after Cloudinary succeeds, destroy the Cloudinary asset and return `File scanning is temporarily unavailable`.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- app/api/ctf/uploads/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/ctf/uploads/route.ts app/api/ctf/uploads/route.test.ts
git commit -m "feat: add challenge upload api"
```

---

### Task 7: Add Cloudinary Moderation Webhook

**Files:**
- Create: `app/api/webhooks/cloudinary/route.test.ts`
- Create: `app/api/webhooks/cloudinary/route.ts`

**Interfaces:**
- Consumes: `verifyCloudinaryWebhookSignature()`, `getModerationStatus()`, `destroyChallengeFile()`, `getServiceClient()`.
- Produces: `POST /api/webhooks/cloudinary` that is idempotent for duplicate Cloudinary moderation callbacks.

- [ ] **Step 1: Write failing webhook tests**

Cover invalid signature `401`, stale timestamp `401`, unknown asset `200`, asset mismatch `400`, pending-to-approved update, pending-to-rejected update plus destroy, and duplicate approved/rejected callback `200` without changing terminal status.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- app/api/webhooks/cloudinary/route.test.ts
```

Expected: FAIL because route is missing.

- [ ] **Step 3: Implement webhook route**

Read `const body = await request.text()` before JSON parsing. Verify headers. Parse `asset_id`, `public_id`, `moderation_status`, and `moderation`. Update only rows where `scan_status = 'pending'`; set `scanned_at = new Date().toISOString()` and persist the sanitized Cloudinary payload into `scan_result`.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- app/api/webhooks/cloudinary/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/cloudinary/route.ts app/api/webhooks/cloudinary/route.test.ts
git commit -m "feat: handle cloudinary malware scan webhooks"
```

---

### Task 8: Link Approved Uploads in Challenge Actions

**Files:**
- Modify: `app/actions/ctf.ts`
- Modify: `app/actions/season-challenge-visibility.test.ts`

**Interfaces:**
- Consumes: `uploadScopeMatchesChallenge()`.
- Changes `createChallenge()`, `createSeasonChallenge()`, and `updateChallenge()` input types to include `upload_id?: string`.
- Server action writes `file_url: upload_id ? `/api/ctf/files/${upload_id}` : existing value`.

- [ ] **Step 1: Write failing action tests**

Add source-level assertions until the existing test harness is expanded:

```ts
it('challenge actions attach uploads by opaque upload id only', () => {
  const source = readFileSync(join(process.cwd(), 'app', 'actions', 'ctf.ts'), 'utf8')
  expect(source).toContain('upload_id?: string')
  expect(source).toContain('ctf_challenge_uploads')
  expect(source).toContain('scan_status')
  expect(source).toContain("`/api/ctf/files/${")
  expect(source).not.toContain('file_url: data.file_url?.trim() || null')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- app/actions/season-challenge-visibility.test.ts
```

Expected: FAIL because actions still trust `file_url`.

- [ ] **Step 3: Implement server-side attachment checks**

Add helper inside `app/actions/ctf.ts`:

```ts
async function resolveApprovedUploadForChallenge(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  uploadId: string | undefined,
  challengeSeasonId: string | null
): Promise<{ fileUrl: string | null; uploadId: string | null; error?: string }> {
  if (!uploadId) return { fileUrl: null, uploadId: null }
  const { data: upload } = await supabase
    .from('ctf_challenge_uploads')
    .select('id, owner_id, challenge_id, scope_season_id, scan_status')
    .eq('id', uploadId)
    .maybeSingle()
  if (!upload || upload.owner_id !== userId) return { fileUrl: null, uploadId: null, error: 'File scan rejected' }
  if (upload.scan_status !== 'approved') return { fileUrl: null, uploadId: null, error: 'File scan rejected' }
  if (upload.challenge_id) return { fileUrl: null, uploadId: null, error: 'File scan rejected' }
  if (!uploadScopeMatchesChallenge({ uploadSeasonId: upload.scope_season_id, challengeSeasonId })) return { fileUrl: null, uploadId: null, error: 'File scan rejected' }
  return { fileUrl: `/api/ctf/files/${upload.id}`, uploadId: upload.id }
}
```

After challenge insert succeeds, update `ctf_challenge_uploads.challenge_id` with the new challenge ID using a guarded update on `id`, `owner_id`, `scan_status='approved'`, and `challenge_id is null`. If the guarded update fails, return a safe error and leave the challenge without exposing an unlinked file. For edits, keep existing `file_url` when no new `upload_id` is sent.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- app/actions/season-challenge-visibility.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/ctf.ts app/actions/season-challenge-visibility.test.ts
git commit -m "feat: attach approved challenge uploads"
```

---

### Task 9: Add Secure Download Route

**Files:**
- Create: `app/api/ctf/files/[id]/route.test.ts`
- Create: `app/api/ctf/files/[id]/route.ts`
- Modify: `app/(main)/ctf/[id]/page.tsx`

**Interfaces:**
- Consumes: `getChallengeFileDownloadUrl()`, `getServiceClient()`.
- Produces: `GET /api/ctf/files/[id]` download proxy.

- [ ] **Step 1: Write failing download tests**

Test `pending`, `rejected`, unattached, inactive challenge, unapproved challenge, hidden live season challenge, valid global challenge, and valid ended season challenge. Assert response headers include `Content-Disposition: attachment`, `Content-Type: application/octet-stream`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-store`.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- app/api/ctf/files/[id]/route.test.ts
```

Expected: FAIL because route is missing.

- [ ] **Step 3: Implement route**

Use service-role reads only after route-level visibility checks. Fetch upload joined to `ctf_challenges`, require `scan_status='approved'` and `challenge_id not null`, reuse season visibility logic from `app/(main)/ctf/[id]/page.tsx`, fetch the Cloudinary signed private download URL server-side, then fetch it and stream the bytes with attachment-only headers.

- [ ] **Step 4: Update challenge page internal attachment link**

For `challenge.file_url?.startsWith('/api/ctf/files/')`, render an `<a href={challenge.file_url}>Download File</a>` without `target="_blank"`. For legacy external URLs, keep `target="_blank"` and `rel="noopener noreferrer"`.

- [ ] **Step 5: Run focused tests**

```bash
npm.cmd test -- app/api/ctf/files/[id]/route.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/ctf/files/[id]/route.ts app/api/ctf/files/[id]/route.test.ts "app/(main)/ctf/[id]/page.tsx"
git commit -m "feat: proxy approved challenge downloads"
```

---

### Task 10: Replace Contributor File URL Field With Secure Upload UI

**Files:**
- Modify: `app/(main)/contributor/ContributorDashboard.tsx`

**Interfaces:**
- Consumes: `POST /api/ctf/uploads`, `GET /api/ctf/uploads?id=<uuid>`, and `upload_id` action inputs.
- Produces component state:
  - `type UploadState = { id: string | null; status: 'idle' | 'validating' | 'pending' | 'approved' | 'rejected' | 'error'; fileName: string; message: string }`

- [ ] **Step 1: Add failing UI source assertions**

Extend `app/actions/season-challenge-visibility.test.ts`:

```ts
it('contributor dashboard uses secure upload ids instead of free-form file urls', () => {
  const source = readFileSync(join(process.cwd(), 'app', '(main)', 'contributor', 'ContributorDashboard.tsx'), 'utf8')
  expect(source).toContain('/api/ctf/uploads')
  expect(source).toContain('upload_id')
  expect(source).toContain('accept=".zip,.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.json,.csv,.pcap,.pcapng"')
  expect(source).not.toContain('name="file_url"')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- app/actions/season-challenge-visibility.test.ts
```

Expected: FAIL because the dashboard still renders `name="file_url"`.

- [ ] **Step 3: Implement upload picker and polling**

Replace `file_url` extraction with `upload_id`. When a file is selected, `fetch('/api/ctf/uploads', { method: 'POST', body })`; include `season_id` only when the workspace is not global. Poll every three seconds while status is `pending`, stop on `approved`, `rejected`, or component unmount, and disable submit when status is `validating` or `pending`.

- [ ] **Step 4: Preserve optional attachment behavior**

Allow submit when no file is selected. On edit, show the existing attached file label and allow a replacement upload; submit the new `upload_id` only after approval.

- [ ] **Step 5: Run focused tests**

```bash
npm.cmd test -- app/actions/season-challenge-visibility.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "app/(main)/contributor/ContributorDashboard.tsx" app/actions/season-challenge-visibility.test.ts
git commit -m "feat: add secure contributor upload ui"
```

---

### Task 11: Remove Direct Cloudinary Admin Upload From Shared Path

**Files:**
- Modify: `app/(main)/admin/ctf/AdminCTFClient.tsx`

**Interfaces:**
- Consumes: existing `createChallenge()` and `updateChallenge()` behavior.
- Produces: no client-side Cloudinary raw upload in admin CTF challenge creation.

- [ ] **Step 1: Add failing source assertion**

Add this to `app/actions/season-challenge-visibility.test.ts`:

```ts
it('does not expose direct Cloudinary challenge uploads in admin ctf client', () => {
  const source = readFileSync(join(process.cwd(), 'app', '(main)', 'admin', 'ctf', 'AdminCTFClient.tsx'), 'utf8')
  expect(source).not.toContain('api.cloudinary.com')
  expect(source).not.toContain('upload_preset')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm.cmd test -- app/actions/season-challenge-visibility.test.ts
```

Expected: FAIL because `AdminCTFClient.tsx` still has `CLOUDINARY_URL` and `upload_preset`.

- [ ] **Step 3: Replace admin create upload with `/api/ctf/uploads`**

Mirror the contributor upload state for admin challenge creation. Keep the existing edit field as a legacy URL field for now, because the approved spec only requires replacing the secure path for contributors and safe admin create flow.

- [ ] **Step 4: Run focused tests**

```bash
npm.cmd test -- app/actions/season-challenge-visibility.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/admin/ctf/AdminCTFClient.tsx" app/actions/season-challenge-visibility.test.ts
git commit -m "fix: route admin challenge uploads through backend"
```

---

### Task 12: Final Verification and Deployment Notes

**Files:**
- Modify: `docs/superpowers/specs/2026-09-06-secure-contributor-challenge-uploads-design.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified implementation and a short operational note in the spec.

- [ ] **Step 1: Run all focused tests**

```bash
npm.cmd test -- lib/ctf/uploads/validate.test.ts lib/ctf/uploads/cloudinary.test.ts lib/ctf/uploads/scope.test.ts app/api/ctf/uploads/route.test.ts app/api/webhooks/cloudinary/route.test.ts app/api/ctf/files/[id]/route.test.ts app/actions/season-challenge-visibility.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck/build**

```bash
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 3: Start local dev server for manual UI check**

```bash
npm.cmd run dev
```

Expected: local server starts. Check `/contributor` with a global workspace and an invited season workspace. The create button must stay disabled while a selected file is pending and enabled after approved. Check `/ctf/<challenge-id>` downloads through `/api/ctf/files/<upload-id>`.

- [ ] **Step 4: Add deployment note**

Append this exact note to the spec:

```markdown

## Implementation Verification

The application must set `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, and `NEXT_PUBLIC_SITE_URL` before upload testing. Production release is blocked until the Cloudinary Perception Point add-on is active and a clean fixture is approved while the EICAR fixture is rejected.
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-06-secure-contributor-challenge-uploads-design.md
git commit -m "docs: document secure upload verification"
```

- [ ] **Step 6: Prepare final branch push**

```bash
git status --short
git log --oneline -8
git push origin main
```

Expected: only intentional commits are pushed; unrelated deletions and generated local files remain unstaged.
