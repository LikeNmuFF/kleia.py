# Private Lab Linux Basics Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, validate, upload, and seed ten ZIP-based Linux command challenges exclusively into the existing Training Ground private lab.

**Architecture:** Public challenge definitions and artifact recipes live in force-added `.mjs` modules, while production flags and ZIP buffers are generated only at runtime. A pure, dependency-injected seed orchestrator enforces validation-before-write and scoped rollback; a thin CLI adapter performs authenticated Cloudinary uploads and Supabase service-role inserts only into private-lab upload and challenge tables.

**Tech Stack:** Node.js ESM, Vitest, `fflate@0.8.3`, Sharp, Cloudinary Node SDK, `@supabase/supabase-js`, SHA-256.

**Spec:** `docs/superpowers/specs/2026-09-10-private-lab-linux-basics-challenges-design.md`

## Global Constraints

- Create exactly ten challenges, each with one separate ZIP and one `KLEIA{...}` flag.
- Target exactly one `practice_rooms` row titled `Training Ground`.
- Use seven easy and three medium challenges in the existing `misc` category, with points from 50 through 150.
- Write and observe failing tests before implementing each production behavior.
- Complete all local tests and a no-write dry run before using `--apply`.
- Never insert into `ctf_challenges`, `practice_publications`, season tables, or call `practice_publish`.
- Never commit production plaintext flags, generated ZIPs, or `.artifacts/linux-basics/`.
- Keep every ZIP below 2 MB and the complete set below 10 MB.
- Archives must not contain executables, scripts, macros, symlinks, absolute paths, or traversal entries.
- Rollback may delete only resource IDs created by the current seed run.

## File Map

- Modify `package.json` and `package-lock.json`: declare pinned `fflate@0.8.3` and expose Linux-lab test, build, and seed commands.
- Modify `.gitignore`: exclude `.artifacts/linux-basics/`.
- Create `scripts/linux-basics/definitions.mjs`: immutable public metadata and exact artifact recipe identifiers; no production flags.
- Create `scripts/linux-basics/artifacts.mjs`: flag generation, hashing, ZIP construction, PNG rendering, and local dry-run output.
- Create `scripts/linux-basics/validate.mjs`: ZIP safety inspection and independent solver functions.
- Create `scripts/linux-basics/seed.mjs`: dependency-injected seed orchestration plus real Supabase and Cloudinary CLI adapters.
- Create `scripts/linux-basics/linux-basics.test.mjs`: metadata, artifact, solver, seed-order, private-scope, and rollback tests.

---

### Task 1: Challenge Definitions and Flag Policy

**Files:**
- Create: `scripts/linux-basics/definitions.mjs`
- Create: `scripts/linux-basics/linux-basics.test.mjs`

**Interfaces:**
- Produces: `LINUX_CHALLENGES: ReadonlyArray<LinuxChallengeDefinition>` and `fixtureFlags(): Record<string, string>`.
- `LinuxChallengeDefinition` fields: `number`, `slug`, `title`, `description`, `category`, `difficulty`, `points`, `hint`, `explanation`, `fileName`, `recipe`.

- [ ] **Step 1: Write the failing metadata test**

Create the test with literal expectations so it catches missing, duplicated, globally scoped, or malformed definitions:

```js
import { describe, expect, it } from 'vitest'
import { LINUX_CHALLENGES, fixtureFlags } from './definitions.mjs'

describe('private lab Linux basics definitions', () => {
  it('defines the approved ten-challenge beginner progression', () => {
    expect(LINUX_CHALLENGES.map(({ number, slug, difficulty, points }) => ({ number, slug, difficulty, points }))).toEqual([
      { number: 1, slug: 'deep-navigation', difficulty: 'easy', points: 50 },
      { number: 2, slug: 'hidden-file', difficulty: 'easy', points: 60 },
      { number: 3, slug: 'hidden-path', difficulty: 'easy', points: 70 },
      { number: 4, slug: 'disguised-image', difficulty: 'easy', points: 80 },
      { number: 5, slug: 'log-search', difficulty: 'easy', points: 90 },
      { number: 6, slug: 'filesystem-search', difficulty: 'easy', points: 100 },
      { number: 7, slug: 'end-of-log', difficulty: 'easy', points: 110 },
      { number: 8, slug: 'unique-record', difficulty: 'medium', points: 125 },
      { number: 9, slug: 'binary-clues', difficulty: 'medium', points: 140 },
      { number: 10, slug: 'command-pipeline', difficulty: 'medium', points: 150 },
    ])
    expect(new Set(LINUX_CHALLENGES.map(item => item.title)).size).toBe(10)
    expect(new Set(LINUX_CHALLENGES.map(item => item.fileName)).size).toBe(10)
    expect(LINUX_CHALLENGES.every(item => item.category === 'misc')).toBe(true)
    expect(LINUX_CHALLENGES.every(item => !('season_id' in item) && !('file_url' in item))).toBe(true)
  })

  it('provides unique fixture flags in the required format', () => {
    const flags = Object.values(fixtureFlags())
    expect(flags).toHaveLength(10)
    expect(new Set(flags).size).toBe(10)
    expect(flags.every(flag => /^KLEIA\{[a-z0-9_]+\}$/.test(flag))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm.cmd test -- scripts/linux-basics/linux-basics.test.mjs`

Expected: FAIL because `definitions.mjs` does not exist.

- [ ] **Step 3: Implement the exact public definitions**

Export ten frozen objects. Titles must be `Linux Basics 01: Deep Navigation` through `Linux Basics 10: Command Pipeline`; filenames must be `linux-basics-01-deep-navigation.zip` through `linux-basics-10-command-pipeline.zip`. Use these exact learner outcomes:

```js
const lessons = [
  ['Use cd, pwd, and ls to move through nested directories.', 'Start with pwd, then list each directory before changing into it.', 'Use pwd to confirm your location, ls to inspect it, cd <directory> to descend, and cat flag.txt at the destination.'],
  ['Use ls -la to reveal and read a hidden file.', 'A normal ls omits names beginning with a dot.', 'Run ls -la in workspace, then cat .file.'],
  ['Discover a hidden directory and a hidden file inside it.', 'Use ls -la at every level, including after entering hidden directories.', 'Enter .archive, reveal .vault, then read .flag.'],
  ['Identify a file by its contents, rename it, and inspect the image.', 'The filename extension can lie; ask the file command what the bytes contain.', 'Run file evidence.txt, rename it with mv evidence.txt evidence.png, then open the PNG.'],
  ['Search text logs efficiently with grep.', 'Search recursively for the KLEIA prefix instead of opening every log.', 'Run grep -R "KLEIA{" logs/.'],
  ['Locate a named file in a large directory tree with find.', 'Search from the current directory by filename.', 'Run find . -type f -name flag-record.txt, then cat the result.'],
  ['Inspect the newest lines at the end of a log with tail.', 'The useful event happened last.', 'Run tail session.log and inspect the final lines.'],
  ['Use sort and uniq to isolate a record that appears once.', 'uniq compares adjacent lines, so sort first.', 'Run sort events.txt | uniq -u.'],
  ['Identify inert binary data and extract printable text.', 'Use file first, then strings; do not execute the artifact.', 'Run file core.dat, then strings core.dat | grep "KLEIA{".'],
  ['Combine find, grep, and pipes across a filesystem tree.', 'Limit the search to .log files, then filter for TOKEN lines.', 'Run find . -type f -name "*.log" -print0 | xargs -0 grep -h "^TOKEN=KLEIA{".'],
]
```

Each definition uses its matching outcome, hint, and explanation. `fixtureFlags()` returns `KLEIA{linux_01_fixture}` through `KLEIA{linux_10_fixture}` keyed by slug. Freeze the array and every object.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm.cmd test -- scripts/linux-basics/linux-basics.test.mjs`

Expected: PASS for both definition tests.

- [ ] **Step 5: Commit the definition slice**

```powershell
git add -f -- scripts/linux-basics/definitions.mjs scripts/linux-basics/linux-basics.test.mjs
git commit -m "test: define private Linux lab curriculum"
```

---

### Task 2: Safe ZIP Generation for Challenges 1–5

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `scripts/linux-basics/artifacts.mjs`
- Modify: `scripts/linux-basics/linux-basics.test.mjs`

**Interfaces:**
- Consumes: `LINUX_CHALLENGES` and a complete slug-to-flag map.
- Produces: `hashFlag(flag): string`, `createProductionFlags(randomBytes?): Record<string,string>`, and `buildArtifacts(definitions, flags): Promise<Array<{ definition, buffer, sha256, flagHash }>>`.

- [ ] **Step 1: Pin the ZIP dependency and add safe artifact output configuration**

Run: `npm.cmd install --save-exact fflate@0.8.3`

Add `.artifacts/linux-basics/` to `.gitignore`. Add scripts:

```json
"test:linux-lab": "vitest run scripts/linux-basics/linux-basics.test.mjs",
"build:linux-lab": "node scripts/linux-basics/artifacts.mjs",
"seed:linux-lab": "node --env-file=.env.local scripts/linux-basics/seed.mjs"
```

- [ ] **Step 2: Write failing flag and first-five archive tests**

Append tests that call `createProductionFlags(() => Buffer.alloc(8, 0xab))`, `buildArtifacts(LINUX_CHALLENGES.slice(0, 5), fixtureFlags())`, and `unzipSync` from `fflate`. Assert literal paths:

```js
expect(Object.keys(unzipSync(artifacts[0].buffer))).toContain('deep-navigation/home/student/projects/linux/mission/flag.txt')
expect(Object.keys(unzipSync(artifacts[1].buffer))).toContain('hidden-file/workspace/.file')
expect(Object.keys(unzipSync(artifacts[2].buffer))).toContain('hidden-path/.archive/.vault/.flag')
expect(Buffer.from(unzipSync(artifacts[3].buffer)['disguised-image/evidence.txt']).subarray(0, 8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]))
expect(new TextDecoder().decode(unzipSync(artifacts[4].buffer)['log-search/logs/auth.log'])).toContain(fixtureFlags()['log-search'])
```

Also assert all generated flags match `^KLEIA\{linux_\d{2}_[a-f0-9]{16}\}$`, hashes equal `createHash('sha256').update(flag.trim().toUpperCase()).digest('hex')`, and artifacts contain one top-level directory plus `README.txt`.

- [ ] **Step 3: Run the test and verify RED**

Run: `npm.cmd run test:linux-lab`

Expected: FAIL because `artifacts.mjs` and its exports do not exist.

- [ ] **Step 4: Implement generation for challenges 1–5**

Use `zipSync(entries, { level: 9 })` from `fflate`; encode text with `strToU8`. Construct exact paths from Step 2 and include harmless decoy files. Generate challenge 4 with Sharp from an 1100×500 SVG containing a dark background, heading `Recovered terminal note`, and escaped flag text in a large monospace font, then store the PNG bytes as `disguised-image/evidence.txt`.

`hashFlag` must mirror `lib/utils/ctf.ts` exactly:

```js
export const hashFlag = flag => createHash('sha256').update(flag.trim().toUpperCase()).digest('hex')
```

When `artifacts.mjs` is run directly, build with fixture flags, write the ten eventual ZIPs only beneath `.artifacts/linux-basics/`, and print filenames and byte sizes without printing flags.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm.cmd run test:linux-lab`

Expected: PASS for metadata, flag, and challenges 1–5 generation tests.

- [ ] **Step 6: Commit the generator slice**

```powershell
git add -- package.json package-lock.json .gitignore
git add -f -- scripts/linux-basics/artifacts.mjs scripts/linux-basics/linux-basics.test.mjs
git commit -m "feat: generate first Linux lab archives"
```

---

### Task 3: Remaining Archives and Independent Validation

**Files:**
- Modify: `scripts/linux-basics/artifacts.mjs`
- Create: `scripts/linux-basics/validate.mjs`
- Modify: `scripts/linux-basics/linux-basics.test.mjs`

**Interfaces:**
- Consumes: artifact buffers from `buildArtifacts`.
- Produces: `inspectArchive(buffer)`, `solveArtifact(slug, entries)`, and `validateArtifacts(artifacts, expectedFlags): Promise<ValidationReport>` where the report contains `slug`, `fileName`, `size`, and `solved: true` only—never plaintext flags.

- [ ] **Step 1: Write failing tests for challenges 6–10**

Assert these exact evidence paths and behaviors:

```js
expect(text(entries6['filesystem-search/var/lib/training/archive/2026/flag-record.txt'])).toBe(flags['filesystem-search'] + '\n')
expect(text(entries7['end-of-log/logs/session.log']).trimEnd().split('\n').at(-1)).toContain(flags['end-of-log'])
expect(text(entries8['unique-record/records/events.txt']).split('\n').filter(line => line.includes(flags['unique-record']))).toHaveLength(1)
expect(Buffer.from(entries9['binary-clues/evidence/core.dat']).includes(Buffer.from(flags['binary-clues']))).toBe(true)
expect(text(entries10['command-pipeline/var/log/services/archive/audit.log'])).toContain(`TOKEN=${flags['command-pipeline']}`)
```

Add safety assertions for every archive: no key begins with `/`, contains `..`, ends in an executable extension, or represents a symlink; exactly one `KLEIA{` occurrence exists; each ZIP is below 2 MB; total bytes are below 10 MB.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm.cmd run test:linux-lab`

Expected: FAIL because recipes 6–10 and `validate.mjs` are missing.

- [ ] **Step 3: Implement recipes 6–10**

Create the exact files from Step 1. Challenge 7 has 250 timestamped INFO lines and places the flag only in the final line. Challenge 8 writes each harmless record twice and its flag-bearing record once in unsorted order. Challenge 9 uses random inert bytes prefixed `KLEIA_TRAINING_DATA\0`, embeds the flag between NUL-separated printable decoys, and must not begin with ELF, MZ, Mach-O, or script shebang signatures. Challenge 10 includes at least twelve `.log` decoys, non-log files containing misleading `TOKEN=` lines without valid flags, and one valid `TOKEN=<flag>` line in the stated audit log.

- [ ] **Step 4: Implement independent solvers and safety inspection**

`solveArtifact` must inspect unzipped entries rather than reuse recipe paths from the generator:

- 1: find the only basename `flag.txt`.
- 2: find a hidden regular file directly under `workspace`.
- 3: find the deepest hidden regular file.
- 4: verify PNG signature and return the expected flag from a PNG `tEXt` chunk named `TrainingFlag`; the same flag must also be rendered into pixels by the generator.
- 5: scan `.log` text for the flag regex.
- 6: find basename `flag-record.txt`.
- 7: inspect only the last ten lines.
- 8: sort lines and return the only line with frequency one that matches the flag regex.
- 9: extract printable ASCII runs of length four or greater and match the flag regex.
- 10: inspect only `.log` entries and match a line beginning `TOKEN=KLEIA{`.

`validateArtifacts` rejects zero or multiple matches, unsafe paths, missing README files, invalid ZIP/PNG data, size excesses, and mismatched expected flags.

- [ ] **Step 5: Run tests and dry-build artifacts**

Run:

```powershell
npm.cmd run test:linux-lab
npm.cmd run build:linux-lab
```

Expected: tests PASS; build lists exactly ten ZIP filenames and sizes; `.artifacts/linux-basics/` remains ignored by `git status`.

- [ ] **Step 6: Commit the complete artifact validator**

```powershell
git add -f -- scripts/linux-basics/artifacts.mjs scripts/linux-basics/validate.mjs scripts/linux-basics/linux-basics.test.mjs
git commit -m "feat: validate Linux lab challenge archives"
```

---

### Task 4: Test-First Private Seed Orchestration

**Files:**
- Create: `scripts/linux-basics/seed.mjs`
- Modify: `scripts/linux-basics/linux-basics.test.mjs`

**Interfaces:**
- Produces: `runSeed({ apply, adapters, randomBytes, logger }): Promise<{ mode: 'dry-run'|'applied'|'existing', count: 10 }>`.
- Adapter methods: `findRoomsByTitle(title)`, `findProfile(id)`, `findExistingChallenges(roomId, titles)`, `uploadArchive(item, ownerId)`, `insertUploadRows(rows)`, `insertChallengeRows(rows)`, `readBack(roomId, titles)`, `deleteChallengeRows(ids)`, `deleteUploadRows(ids)`, and `destroyArchives(publicIds)`.

- [ ] **Step 1: Write failing dry-run and private-scope tests**

Use an in-memory adapter that records operations. Assert `runSeed({ apply: false, ... })` returns `{ mode: 'dry-run', count: 10 }` with zero adapter operations. For apply, return one room `{ id: 'room-1', title: 'Training Ground', created_by: 'admin-1' }` and one profile `{ id: 'admin-1', role: 'admin' }`. Assert upload rows have:

```js
expect(uploadRows.every(row => row.scope_room_id === 'room-1')).toBe(true)
expect(uploadRows.every(row => row.scope_season_id === null && row.challenge_id === null)).toBe(true)
expect(challengeRows.every(row => row.room_id === 'room-1' && row.created_by === 'admin-1')).toBe(true)
expect(challengeRows.every(row => row.is_active && row.category === 'misc')).toBe(true)
```

The fake must throw if any unknown adapter method is accessed, preventing hidden global publication behavior.

- [ ] **Step 2: Write failing order, conflict, and rollback tests**

Assert the first external adapter operation occurs only after `validateArtifacts` succeeds. Cover zero and multiple room matches, non-admin room creator, partial existing set, and conflicting complete set as no-write errors. Inject failure after upload rows and after challenge rows; assert cleanup order is `deleteChallengeRows`, `deleteUploadRows`, `destroyArchives` and every cleanup argument is a subset of IDs created during that test run.

- [ ] **Step 3: Run tests and verify RED**

Run: `npm.cmd run test:linux-lab`

Expected: FAIL because `runSeed` is missing.

- [ ] **Step 4: Implement the minimal orchestrator**

Generate artifacts and validate them before checking `apply`. On apply, resolve the room and trusted admin, detect stable-title conflicts, upload archives, insert approved room-scoped upload rows, batch-insert active `practice_challenges`, and verify read-back. Wrap external writes in `try/catch`; record created IDs immediately and perform reverse cleanup on error. Never log flags or include them in the returned result.

Treat a complete existing set as `mode: 'existing'` only if all ten titles, metadata fields, non-null unique upload IDs, and upload room scopes match. Otherwise throw `Existing Linux lab challenge set conflicts with the approved definition.`

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm.cmd run test:linux-lab`

Expected: PASS for all definition, artifact, validation, seed-order, scope, idempotency, and rollback tests.

- [ ] **Step 6: Commit the seed core**

```powershell
git add -f -- scripts/linux-basics/seed.mjs scripts/linux-basics/linux-basics.test.mjs
git commit -m "feat: add guarded private Linux lab seeder"
```

---

### Task 5: Real Cloudinary and Supabase Adapters

**Files:**
- Modify: `scripts/linux-basics/seed.mjs`
- Modify: `scripts/linux-basics/linux-basics.test.mjs`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` only when `--apply` is present.
- Produces: a guarded CLI that calls `runSeed` with real adapters.

- [ ] **Step 1: Write a failing CLI-boundary test**

Spawn the CLI without `--apply` and with database/cloud credentials removed from the child environment. Assert exit code 0, output contains `Dry run validated 10 private Linux lab challenges`, and output does not contain `KLEIA{`. Add a module-level adapter contract test using fake Supabase/Cloudinary clients to verify table names are exactly `practice_rooms`, `profiles`, `ctf_challenge_uploads`, and `practice_challenges`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm.cmd run test:linux-lab`

Expected: FAIL because the CLI entry point and real adapter factory are missing.

- [ ] **Step 3: Implement real adapters**

Create the Supabase client with `{ auth: { autoRefreshToken: false, persistSession: false } }`. Configure Cloudinary only in apply mode. Upload each buffer as authenticated raw content under `kleia-ctf-files/<admin-id>/<random-uuid>` with owner, original filename, stored filename, and SHA-256 context. Insert upload rows with `extension: 'zip'`, exact byte size and SHA-256, `scan_status: 'approved'`, `scan_provider: 'none'`, `scan_result: { scanning: 'disabled', source: 'validated-linux-lab-seed' }`, and null `scanned_at`.

Challenge rows contain title, description, category, difficulty, points, hint, explanation, `flag_hash`, unique `upload_id`, null learning slugs, `is_active: true`, room ID, and admin creator ID. Use `cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated', invalidate: true })` for rollback.

Guard direct execution with:

```js
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error instanceof Error ? error.message : 'Linux lab seed failed')
    process.exitCode = 1
  })
}
```

- [ ] **Step 4: Run focused and project verification**

Run:

```powershell
npm.cmd run test:linux-lab
npx.cmd eslint scripts/linux-basics/*.mjs
npm run build
git diff --check
```

Expected: Linux suite PASS with zero failures, ESLint exit 0, production build exit 0, and diff check exit 0 aside from line-ending warnings.

- [ ] **Step 5: Commit the completed implementation before live seeding**

Confirm `.artifacts/linux-basics/` and all plaintext flags are absent from the staged diff, then run:

```powershell
git add -- package.json package-lock.json .gitignore
git add -f -- scripts/linux-basics/definitions.mjs scripts/linux-basics/artifacts.mjs scripts/linux-basics/validate.mjs scripts/linux-basics/seed.mjs scripts/linux-basics/linux-basics.test.mjs
git commit -m "feat: add private Linux basics lab challenges"
```

---

### Task 6: Dry Run, Private Seed, and Post-Seed Audit

**Files:**
- No repository files should change.
- Generated ignored output: `.artifacts/linux-basics/*.zip`.

**Interfaces:**
- Consumes: the committed seed CLI and server credentials from `.env.local`.
- Produces: ten verified private challenge rows and ten authenticated room-scoped upload resources.

- [ ] **Step 1: Run the mandatory no-write dry run**

Run: `npm.cmd run seed:linux-lab`

Expected: exit 0, exactly ten artifacts validated, no plaintext flags printed, and the message `Dry run validated 10 private Linux lab challenges; no external writes performed.`

- [ ] **Step 2: Confirm the live target with a read-only query**

Using the Supabase service client, select `id,title,created_by` from `practice_rooms` where title equals `Training Ground`; select `id,role` for its creator. Require exactly one room and role `admin`. Print IDs only, never keys or flags.

- [ ] **Step 3: Apply the seed**

Run: `npm.cmd run seed:linux-lab -- --apply`

Expected: exit 0 and either `Seeded 10 challenges into Training Ground` or `Verified 10 existing challenges in Training Ground`; no plaintext flags printed.

- [ ] **Step 4: Audit private scope and absence of publication**

Run one read-only service query joining the ten stable titles to their upload rows and left joining `practice_publications`. Assert literal counts:

```text
practice_challenges in Training Ground: 10
distinct non-null upload_id values: 10
uploads with matching scope_room_id: 10
uploads with non-null scope_season_id or challenge_id: 0
practice_publications for these challenges: 0
```

Also assert every challenge is active and has a 64-character lowercase hexadecimal `flag_hash`.

- [ ] **Step 5: Verify downloads through the application boundary**

With an authenticated admin browser session, open the Training Ground lab and download each of the ten `/api/practice/files/<upload-id>` links. Confirm each response is a ZIP attachment with the expected stable filename and each archive opens successfully. Do not publish any challenge.

- [ ] **Step 6: Report completion and repository state**

Run `git status --short` and confirm no generated ZIP or plaintext flag is tracked. Report the implementation commit, ten seeded challenge IDs, ten upload IDs, validation counts, and any unrelated pre-existing working-tree changes without printing secrets or flags.

