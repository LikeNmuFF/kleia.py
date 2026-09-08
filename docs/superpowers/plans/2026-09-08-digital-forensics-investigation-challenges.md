# Digital Forensics Investigation Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, independently solve-test, package, and optionally seed ten offline digital-forensics investigation challenges with downloadable ZIP evidence and `KLEIA{...}` flags.

**Architecture:** A deterministic ZIP utility packages declarative fictional evidence into static public downloads. Challenge definitions contain public metadata and flag hashes, while separate solver functions derive answers solely from extracted ZIP entries; a validator joins those components and blocks the idempotent Supabase seed path unless every archive, security, and solve check passes.

**Tech Stack:** Node.js ESM, built-in `node:crypto`, `node:zlib`, `node:fs`, existing `yauzl` ZIP reader, Vitest, Supabase JavaScript client.

**Spec:** `docs/superpowers/specs/2026-09-08-digital-forensics-investigation-challenges-design.md`

## Global Constraints

- Use the existing `forensics` category and existing static-file download behavior.
- Create exactly ten challenges with exactly four easy, four medium, and two hard entries.
- All cases and identities are fictional and require no internet access or contact with people.
- No challenge may require packet-capture analysis, memory forensics, disk-image mounting, proprietary tools, or executing untrusted binaries.
- Every ZIP must contain `CASE_NOTES.txt`, remain below 2 MB, and keep the full set below 10 MB.
- ZIP evidence must contain no `KLEIA{` marker, plaintext flag, answer key, executable, macro, symlink, active content, unsafe path, or filename spoiler.
- Timestamps must include explicit offsets or state a shared time zone; prompts must define exact answer normalization.
- Seed records use stable UUIDs, hashed flags, static file URLs, approved/active practice status, and insert-only behavior.
- Seeding requires explicit `--apply`; missing credentials or conflicting existing records must fail without overwriting data.
- Preserve existing uncommitted OSINT evidence and `next-env.d.ts` changes.

## File Structure

- Create `scripts/lib/deterministic-zip.mjs`: dependency-free deterministic ZIP writer plus safe `yauzl` reader wrapper.
- Create `scripts/lib/deterministic-zip.test.mjs`: archive determinism, extraction, and unsafe-entry tests.
- Create `scripts/data/forensics-challenges.json`: public challenge metadata, stable IDs, static URLs, evidence manifests, and flag hashes.
- Create `scripts/build-forensics-challenges.mjs`: fictional source evidence and deterministic archive builder.
- Create `scripts/forensics-solvers.mjs`: one independent solver per case, operating only on extracted ZIP entries.
- Create `scripts/validate-forensics-challenges.mjs`: metadata, archive, leakage, determinism, and solver validation API/CLI.
- Create `scripts/validate-forensics-challenges.test.mjs`: end-to-end validation and controlled failure tests.
- Create `scripts/seed-forensics-challenges.mjs`: dry-run-first, validation-gated Supabase seed command.
- Create `scripts/seed-forensics-challenges.test.mjs`: row mapping and validation-before-write tests.
- Create `public/ctf/forensics/forensics-01-last-download.zip` through `forensics-10-staged-archive.zip`: downloadable case evidence.
- Create `docs/ctf/forensics-verification.md`: flag-free human solve-path and verification report.
- Modify `package.json`: add build, validation, and seed commands for the challenge set.

---

### Task 1: Deterministic and Safe ZIP Support

**Files:**
- Create: `scripts/lib/deterministic-zip.mjs`
- Create: `scripts/lib/deterministic-zip.test.mjs`

**Interfaces:**
- Consumes: `Array<{ name: string, data: string | Buffer }>` archive entries.
- Produces: `createDeterministicZip(entries): Buffer`, `readZipEntries(input): Promise<Map<string, Buffer>>`, and `assertSafeEntryName(name): void`.

- [ ] **Step 1: Write failing ZIP utility tests**

Test that two builds are byte-identical, extracted UTF-8 and binary payloads match inputs, names are sorted, fixed metadata is used, and `../answer.txt`, `/absolute.txt`, `C:\\answer.txt`, empty names, and backslash paths are rejected.

```js
import { describe, expect, test } from 'vitest'
import { createDeterministicZip, readZipEntries } from './deterministic-zip.mjs'

test('creates byte-identical readable archives', async () => {
  const entries = [{ name: 'notes/a.txt', data: 'alpha' }, { name: 'blob.bin', data: Buffer.from([0, 1, 2]) }]
  const first = createDeterministicZip(entries)
  expect(createDeterministicZip(entries)).toEqual(first)
  const extracted = await readZipEntries(first)
  expect(extracted.get('notes/a.txt')?.toString('utf8')).toBe('alpha')
  expect([...extracted.get('blob.bin') ?? []]).toEqual([0, 1, 2])
})

test.each(['../answer.txt', '/absolute.txt', 'C:\\answer.txt', '', 'dir\\file.txt'])(
  'rejects unsafe entry %s',
  name => expect(() => createDeterministicZip([{ name, data: 'x' }])).toThrow(/unsafe/i),
)
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run scripts/lib/deterministic-zip.test.mjs`

Expected: FAIL because `deterministic-zip.mjs` does not exist.

- [ ] **Step 3: Implement the deterministic ZIP writer and reader**

Write ZIP32 local headers, central-directory records, and EOCD records with sorted names, DOS timestamp `2026-01-01 00:00:00`, UTF-8 flag, deflate compression, and a local CRC-32 table. Reject duplicate or unsafe names before encoding. Wrap `yauzl.fromBuffer` with `lazyEntries: true`, reject encrypted entries and directories/symlinks, enforce a 2 MB uncompressed-entry ceiling, and return a `Map` after every stream closes.

```js
export function assertSafeEntryName(name) {
  if (!name || name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name)) throw new Error(`Unsafe ZIP entry: ${name}`)
  const parts = name.split('/')
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error(`Unsafe ZIP entry: ${name}`)
}

const FIXED_DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1
const FIXED_DOS_TIME = 0
const UTF8_FLAG = 0x0800
const DEFLATE_METHOD = 8
```

Encode all numeric ZIP fields with `Buffer.writeUInt16LE`/`writeUInt32LE`. Local records use signature `0x04034b50`; central records use `0x02014b50`; EOCD uses `0x06054b50`. Calculate CRC-32 over uncompressed bytes, compress with `deflateRawSync({ level: 9 })`, track each local-header offset, and set external attributes to a regular read-only file mode. Reject ZIP64-sized inputs instead of emitting ZIP64 records.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `npx vitest run scripts/lib/deterministic-zip.test.mjs`

Expected: PASS with both archive and unsafe-name cases green.

- [ ] **Step 5: Commit ZIP support**

```powershell
git add -f -- scripts/lib/deterministic-zip.mjs scripts/lib/deterministic-zip.test.mjs
git commit -m "test: add deterministic forensic zip support"
```

---

### Task 2: Easy Case Definitions and Archives

**Files:**
- Create: `scripts/data/forensics-challenges.json`
- Create: `scripts/build-forensics-challenges.mjs`
- Create: `public/ctf/forensics/forensics-01-last-download.zip`
- Create: `public/ctf/forensics/forensics-02-camera-card.zip`
- Create: `public/ctf/forensics/forensics-03-integrity-check.zip`
- Create: `public/ctf/forensics/forensics-04-mail-trail.zip`
- Test: `scripts/validate-forensics-challenges.test.mjs`

**Interfaces:**
- Consumes: `createDeterministicZip(entries)` from Task 1.
- Produces: `challengeDefinitions`, `buildArchives({ outputDir }): Promise<Map<string, Buffer>>`, and four static ZIPs referenced by `/ctf/forensics/<filename>`.

- [ ] **Step 1: Write failing easy-archive assertions**

Add a test that calls `buildArchives` in a temporary directory and asserts four easy definitions, required public fields, `CASE_NOTES.txt`, exact expected evidence filenames, and no literal `KLEIA{` bytes.

```js
const easy = challengeDefinitions.filter(item => item.difficulty === 'easy')
expect(easy).toHaveLength(4)
expect(easy.map(item => item.file_url)).toEqual([
  '/ctf/forensics/forensics-01-last-download.zip',
  '/ctf/forensics/forensics-02-camera-card.zip',
  '/ctf/forensics/forensics-03-integrity-check.zip',
  '/ctf/forensics/forensics-04-mail-trail.zip',
])
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run scripts/validate-forensics-challenges.test.mjs -t "easy archives"`

Expected: FAIL because definitions and builder do not exist.

- [ ] **Step 3: Define the four easy challenges**

Use UUIDs `f0715100-0908-4f10-8c10-000000000001`, `f0715100-0908-4f10-8c10-000000000002`, `f0715100-0908-4f10-8c10-000000000003`, and `f0715100-0908-4f10-8c10-000000000004`. Set points to 75, 75, 100, and 100. Each record includes `title`, `difficulty`, `points`, `hint`, `description`, `file_url`, `flag_hash`, and an `archive` manifest listing expected entries. Descriptions explicitly request one normalized lowercase answer inside the documented Kleia flag wrapper.

- [ ] **Step 4: Build the four easy evidence sets**

Implement these independent cases:

```js
const easyCases = {
  'forensics-01-last-download.zip': ['CASE_NOTES.txt', 'browser/downloads.csv', 'browser/history.csv'],
  'forensics-02-camera-card.zip': ['CASE_NOTES.txt', 'inventory/camera_assignments.csv', 'photos/boardwalk.jpg', 'photos/metadata.json'],
  'forensics-03-integrity-check.zip': ['CASE_NOTES.txt', 'manifest/approved_sha256.txt', 'documents/briefing.txt', 'documents/roster.csv', 'documents/schedule.txt'],
  'forensics-04-mail-trail.zip': ['CASE_NOTES.txt', 'mail/suspicious-message.eml', 'network/internal_hosts.csv'],
}
```

Use a small valid JPEG fixture generated from fixed bytes for the photo and a separate metadata export so Windows users are not required to install EXIF tooling. Ensure distractors require correlation but leave one exact answer.

- [ ] **Step 5: Run tests, generate public ZIPs, and confirm GREEN**

Run: `npx vitest run scripts/validate-forensics-challenges.test.mjs -t "easy archives"`

Run: `node scripts/build-forensics-challenges.mjs`

Expected: PASS and four ZIP files written below `public/ctf/forensics/`.

- [ ] **Step 6: Commit easy cases**

```powershell
git add -f -- scripts/data/forensics-challenges.json scripts/build-forensics-challenges.mjs scripts/validate-forensics-challenges.test.mjs public/ctf/forensics/forensics-01-last-download.zip public/ctf/forensics/forensics-02-camera-card.zip public/ctf/forensics/forensics-03-integrity-check.zip public/ctf/forensics/forensics-04-mail-trail.zip
git commit -m "feat: add easy forensic investigation archives"
```

---

### Task 3: Medium and Hard Case Archives

**Files:**
- Modify: `scripts/data/forensics-challenges.json`
- Modify: `scripts/build-forensics-challenges.mjs`
- Modify: `scripts/validate-forensics-challenges.test.mjs`
- Create: `public/ctf/forensics/forensics-05-usb-after-hours.zip`
- Create: `public/ctf/forensics/forensics-06-recycle-record.zip`
- Create: `public/ctf/forensics/forensics-07-beacon-in-the-logs.zip`
- Create: `public/ctf/forensics/forensics-08-altered-timeline.zip`
- Create: `public/ctf/forensics/forensics-09-exfil-window.zip`
- Create: `public/ctf/forensics/forensics-10-staged-archive.zip`

**Interfaces:**
- Consumes: Task 2 definitions and `buildArchives`.
- Produces: complete ten-record definition list and all ten deterministic downloadable archives.

- [ ] **Step 1: Extend tests for distribution and complete manifests**

Assert ten unique IDs/titles/URLs, distribution `{ easy: 4, medium: 4, hard: 2 }`, point ranges, file-size limits, total-size limit, required case notes, and byte-identical rebuilds.

```js
expect(Object.fromEntries(['easy', 'medium', 'hard'].map(level => [level, challengeDefinitions.filter(c => c.difficulty === level).length]))).toEqual({ easy: 4, medium: 4, hard: 2 })
expect(new Set(challengeDefinitions.map(c => c.id)).size).toBe(10)
expect(totalArchiveBytes).toBeLessThan(10 * 1024 * 1024)
```

- [ ] **Step 2: Run the distribution test and confirm RED**

Run: `npx vitest run scripts/validate-forensics-challenges.test.mjs -t "complete challenge set"`

Expected: FAIL because only four cases exist.

- [ ] **Step 3: Add four medium definitions and evidence**

Use UUIDs `f0715100-0908-4f10-8c10-000000000005`, `f0715100-0908-4f10-8c10-000000000006`, `f0715100-0908-4f10-8c10-000000000007`, and `f0715100-0908-4f10-8c10-000000000008`, with points 150, 175, 175, and 200, and these manifests:

```js
const mediumCases = {
  'forensics-05-usb-after-hours.zip': ['CASE_NOTES.txt', 'events/device_events.csv', 'events/sessions.csv', 'inventory/usb_devices.csv'],
  'forensics-06-recycle-record.zip': ['CASE_NOTES.txt', '$Recycle.Bin/$I7Q2K9.txt', '$Recycle.Bin/$R7Q2K9.txt', 'filesystem/user_map.csv'],
  'forensics-07-beacon-in-the-logs.zip': ['CASE_NOTES.txt', 'network/dns.csv', 'network/proxy.csv', 'network/assets.csv'],
  'forensics-08-altered-timeline.zip': ['CASE_NOTES.txt', 'timeline/access.json', 'timeline/cameras.csv', 'timeline/dispatch.log'],
}
```

Represent the recycle metadata as a documented, safe text analogue rather than a raw filesystem image. Every timestamp uses ISO 8601 with an explicit offset.

- [ ] **Step 4: Add two hard definitions and evidence**

Use UUIDs `f0715100-0908-4f10-8c10-000000000009` and `f0715100-0908-4f10-8c10-000000000010`, with points 250 and 300. Case 9 contains authentication, file access, process, and USB CSV logs. Case 10 contains `CASE_NOTES.txt`, `custody/manifest.sha256`, and `evidence/staging.zip`; the nested ZIP contains harmless text/CSV artifacts and one renamed record discoverable through its content and manifest relationship.

- [ ] **Step 5: Run tests, build all ZIPs, and confirm GREEN**

Run: `npx vitest run scripts/validate-forensics-challenges.test.mjs`

Run: `node scripts/build-forensics-challenges.mjs`

Run: `npx vitest run scripts/validate-forensics-challenges.test.mjs -t "byte-identical"`

Expected: PASS; ten ZIPs exist, each below 2 MB, combined below 10 MB, and a rebuild changes no bytes.

- [ ] **Step 6: Commit the complete archive set**

```powershell
git add -f -- scripts/data/forensics-challenges.json scripts/build-forensics-challenges.mjs scripts/validate-forensics-challenges.test.mjs public/ctf/forensics
git commit -m "feat: add complete forensic investigation archive set"
```

---

### Task 4: Independent Player-Path Solvers and Security Validation

**Files:**
- Create: `scripts/forensics-solvers.mjs`
- Create: `scripts/validate-forensics-challenges.mjs`
- Modify: `scripts/validate-forensics-challenges.test.mjs`
- Modify: `scripts/data/forensics-challenges.json`

**Interfaces:**
- Consumes: `readZipEntries`, built ZIP buffers, and challenge definitions.
- Produces: `solveChallenge(challenge, zipEntries): Promise<string>` and `validateChallengeSet({ definitions, archiveDir, rebuild }): Promise<ValidationReport>` where the report contains per-case title, difficulty, archive bytes, derived-answer hash match, and checks without plaintext answers.

- [ ] **Step 1: Write failing end-to-end solver tests**

Assert every solver returns a nonempty normalized fragment, `sha256('KLEIA{' + answer + '}')` equals its definition hash, all ten derived answers are unique, and public output never includes derived answers or flags.

```js
for (const challenge of challengeDefinitions) {
  const entries = await readZipEntries(await readFile(join(publicDir, basename(challenge.file_url))))
  const answer = await solveChallenge(challenge, entries)
  expect(answer).toMatch(/^[a-z0-9_.-]+$/)
  expect(createHash('sha256').update(`KLEIA{${answer}}`).digest('hex')).toBe(challenge.flag_hash)
}
```

- [ ] **Step 2: Run solver tests and confirm RED**

Run: `npx vitest run scripts/validate-forensics-challenges.test.mjs -t "solves all ten"`

Expected: FAIL because solvers and final hashes do not exist.

- [ ] **Step 3: Implement ten evidence-only solvers**

Dispatch by stable challenge ID. Parse CSV with a small quoted-field parser, JSON with `JSON.parse`, EML headers with unfolded continuation lines, and timestamps with `Date.parse`. For hashing, calculate SHA-256 directly from entry buffers. For nested evidence, call `readZipEntries` on `evidence/staging.zip`. Each solver must select a single answer or throw `Expected exactly one candidate for <title>`.

- [ ] **Step 4: Store only solver-derived hashes in definitions**

Run a local one-shot hash derivation that prints only hashes paired with stable IDs, then place the 64-character lowercase hashes in `forensics-challenges.json`. Do not write plaintext flags or answers to files or command output.

- [ ] **Step 5: Implement complete archive and leakage validation**

Validate UUID/title/URL uniqueness, exact difficulty counts, point ranges, SHA-256 format, `/ctf/forensics/*.zip` paths, manifest equality, archive sizes, case notes, allowed extensions, safe paths, absence of `KLEIA{` (case-insensitive), absence of challenge hash bytes, no symlink attributes, nested-ZIP recursion, solver matches, and deterministic rebuild matches.

```js
const ALLOWED_EXTENSIONS = new Set(['.txt', '.csv', '.json', '.eml', '.log', '.html', '.jpg', '.png', '.zip', '.sha256'])
const FORBIDDEN_EXTENSIONS = new Set(['.exe', '.dll', '.bat', '.cmd', '.ps1', '.js', '.vbs', '.scr', '.com', '.msi', '.docm', '.xlsm'])
```

- [ ] **Step 6: Add controlled negative tests**

Build in-memory cases with a leaked flag marker, traversal name, executable extension, missing case notes, duplicate ID, wrong difficulty distribution, mismatched flag hash, oversized entry, unexpected entry, and nondeterministic rebuild. Assert each fails with a precise message and ensure a seed callback spy has zero calls after validation failure.

- [ ] **Step 7: Run solver/security tests and confirm GREEN**

Run: `npx vitest run scripts/lib/deterministic-zip.test.mjs scripts/validate-forensics-challenges.test.mjs`

Run: `node scripts/validate-forensics-challenges.mjs`

Expected: tests PASS and CLI reports ten validated challenges without printing answers or flags.

- [ ] **Step 8: Commit solvers and validation**

```powershell
git add -f -- scripts/forensics-solvers.mjs scripts/validate-forensics-challenges.mjs scripts/validate-forensics-challenges.test.mjs scripts/data/forensics-challenges.json
git commit -m "test: verify forensic challenges are safe and solvable"
```

---

### Task 5: Validation-Gated Idempotent Seeding

**Files:**
- Create: `scripts/seed-forensics-challenges.mjs`
- Create: `scripts/seed-forensics-challenges.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `validateChallengeSet`, challenge definitions, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: `challengeRow(challenge, adminId)`, `seedChallenges({ db, definitions }): Promise<void>`, and CLI commands `ctf:forensics:build`, `ctf:forensics:validate`, and `ctf:forensics:seed`.

- [ ] **Step 1: Write failing seed tests**

Test row mapping, dry-run behavior, validation-before-client-creation, administrator lookup, insert-only upsert, read-back verification, and conflict rejection. Use a fake chainable database client; no network calls occur in tests.

```js
expect(challengeRow(challenge, 'admin-id')).toMatchObject({
  category: 'forensics',
  status: 'approved',
  is_active: true,
  season_id: null,
  created_by: 'admin-id',
  file_url: challenge.file_url,
  flag_hash: challenge.flag_hash,
})
```

- [ ] **Step 2: Run seed tests and confirm RED**

Run: `npx vitest run scripts/seed-forensics-challenges.test.mjs`

Expected: FAIL because the seed module does not exist.

- [ ] **Step 3: Implement row mapping and dry-run CLI**

Map public descriptions directly, set author to `Kleia Forensics Lab`, hint cost to 10, and omit plaintext flags. Always call `validateChallengeSet` first. Without `--apply`, print `Validated 10 forensic challenges; no database writes performed.` and return before reading environment variables.

- [ ] **Step 4: Implement insert-only database application**

With `--apply`, require both environment variables, resolve the `kleia` admin, query all stable IDs first, reject any existing row whose immutable seed fields differ, upsert with `{ onConflict: 'id', ignoreDuplicates: true }`, then read all ten rows back and compare ID, category, difficulty, points, flag hash, file URL, status, and activation state.

- [ ] **Step 5: Add package commands**

```json
{
  "ctf:forensics:build": "node scripts/build-forensics-challenges.mjs",
  "ctf:forensics:validate": "node scripts/validate-forensics-challenges.mjs",
  "ctf:forensics:seed": "node scripts/seed-forensics-challenges.mjs"
}
```

- [ ] **Step 6: Run seed tests and dry-run validation**

Run: `npx vitest run scripts/seed-forensics-challenges.test.mjs`

Run: `npm run ctf:forensics:seed`

Expected: tests PASS; dry run validates all ten and explicitly reports no writes.

- [ ] **Step 7: Commit seed integration**

```powershell
git add -f -- scripts/seed-forensics-challenges.mjs scripts/seed-forensics-challenges.test.mjs package.json
git commit -m "feat: add validated forensic challenge seeding"
```

---

### Task 6: Human Verification Report and Final Release Gate

**Files:**
- Create: `docs/ctf/forensics-verification.md`
- Verify: all files from Tasks 1 through 5.

**Interfaces:**
- Consumes: validator report and final archives.
- Produces: flag-free human validation record and, when credentials are present, ten verified database records.

- [ ] **Step 1: Write the flag-free human verification report**

For each case record the archive filename, difficulty, ordinary tools (`File Explorer`, text editor, browser, or `certutil -hashfile`), numbered investigation actions, one-answer rationale, archive size, and automated solver result. Do not include answer fragments, flags, or hashes.

- [ ] **Step 2: Perform clean deterministic rebuild verification**

Run: `npm run ctf:forensics:build`

Run: `git diff --exit-code -- public/ctf/forensics`

Expected: no diff, proving generated archives are byte-identical.

- [ ] **Step 3: Run focused and project verification**

Run: `npx vitest run scripts/lib/deterministic-zip.test.mjs scripts/validate-forensics-challenges.test.mjs scripts/seed-forensics-challenges.test.mjs`

Run: `npm test`

Run: `npm run lint`

Run: `npm run build`

Expected: all commands exit zero. If an unrelated pre-existing failure occurs, record its exact command and output separately; do not describe the forensics release gate as passing until relevant tests and validation pass.

- [ ] **Step 4: Inspect every downloadable artifact**

Run the validator CLI and list archive metadata without extracting into the repository:

```powershell
npm run ctf:forensics:validate
Get-ChildItem -LiteralPath public\ctf\forensics\*.zip | Select-Object Name, Length
```

Expected: exactly ten ZIPs, validator success, each below 2 MB, total below 10 MB.

- [ ] **Step 5: Seed only when configured**

Check for environment variable presence without printing values. If both variables exist, run:

```powershell
npm run ctf:forensics:seed -- --apply
```

Expected: ten active approved records verified after insert. If credentials are absent, do not seed and report local readiness accurately.

- [ ] **Step 6: Commit the verification report and any final metadata adjustment**

```powershell
git add -f -- docs/ctf/forensics-verification.md scripts/data/forensics-challenges.json public/ctf/forensics
git commit -m "docs: record forensic challenge verification"
```

- [ ] **Step 7: Review working-tree scope**

Run: `git status --short`

Run: `git diff --stat HEAD~5..HEAD`

Expected: the feature commits contain only planned forensics files, package scripts, and documentation; the pre-existing OSINT evidence and `next-env.d.ts` remain unmodified by this work.
