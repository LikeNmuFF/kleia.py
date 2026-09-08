# Digital Forensics Investigation Challenges Design

## Objective

Add ten reproducible digital-forensics investigation challenges to Kleia's practice CTF. Each challenge must be solvable offline by a normal student using freely available, non-specialist tools, provide a downloadable ZIP case file, use the `KLEIA{...}` flag format, and pass automated solve-path validation before it can be seeded.

## Scope

This change adds challenge content, generated evidence archives, validation tests, and an idempotent seed command. It does not add a new CTF category, alter flag submission behavior, publish writeups, or require live external services.

The challenges use the existing `forensics` category and the existing static-file download behavior. All people, organizations, devices, domains, messages, and incidents in the evidence are fictional.

## Challenge Set

The set uses a `4 easy / 4 medium / 2 hard` progression.

| No. | Working title | Difficulty | Primary investigation skill | Evidence concept |
| --- | --- | --- | --- | --- |
| 1 | Last Download | Easy | Browser download history | Determine the downloaded filename associated with a suspicious URL from a small browser-history export. |
| 2 | Camera Card | Easy | Image metadata | Read and correlate non-sensitive EXIF-style metadata to identify the camera assigned to a fictional operator. |
| 3 | Integrity Check | Easy | File hashing | Calculate hashes for supplied documents and identify the one that differs from the signed manifest. |
| 4 | Mail Trail | Easy | Email headers | Trace a fictional message through `Received` headers and identify the originating internal host. |
| 5 | USB After Hours | Medium | System-event correlation | Correlate device insertion and user-session logs to identify the account active when removable media appeared. |
| 6 | Recycle Record | Medium | Deleted-record recovery | Recover a deleted text record from a simple, documented recycle-bin-style metadata pair. |
| 7 | Beacon in the Logs | Medium | DNS/proxy correlation | Join DNS and proxy records by timestamp and client to identify the contacted fictional domain. |
| 8 | Altered Timeline | Medium | Timestamp normalization | Normalize explicit time-zone offsets and identify the event that breaks the established sequence. |
| 9 | Exfil Window | Hard | Multi-source timeline reconstruction | Correlate authentication, file-access, removable-media, and process logs to identify a bounded incident window. |
| 10 | The Staged Archive | Hard | Layered artifact analysis | Inspect a nested archive, validate a manifest, recover a renamed artifact, and derive the final case identifier. |

Final titles and exact values may be refined during implementation, but the difficulty, primary skill, and evidence type remain as specified. No challenge requires packet-capture analysis, memory forensics, disk-image mounting, proprietary tools, internet research, or executing untrusted binaries.

## Repository Layout

Challenge source definitions and scripts live under the repository's normally ignored `scripts/` tree, consistent with the existing OSINT workflow; the specific forensics files are force-added so the validated build is reproducible. Public evidence archives live under:

```text
public/ctf/forensics/
  forensics-01-last-download.zip
  ...
  forensics-10-staged-archive.zip
```

The implementation adds:

```text
scripts/data/forensics-challenges.json
scripts/build-forensics-challenges.mjs
scripts/seed-forensics-challenges.mjs
scripts/test-forensics-challenges.mjs
```

`build-forensics-challenges.mjs` deterministically creates the ZIP evidence from source definitions. `test-forensics-challenges.mjs` treats the ZIPs as a player would: it opens the archives, parses only the supplied evidence, derives each expected flag, hashes it, and compares that hash to seed metadata. `seed-forensics-challenges.mjs` refuses to apply records unless the full validation suite succeeds.

## Evidence and ZIP Requirements

Every archive must:

- Have a stable filename and deterministic contents.
- Contain a short `CASE_NOTES.txt` describing the fictional evidence context without revealing the solution.
- Use common formats such as TXT, CSV, JSON, EML, HTML, JPG/PNG, and nested ZIP files.
- Be extractable with Windows Explorer, 7-Zip, or an equivalent standard archive tool.
- Avoid executables, macros, password protection, malformed files, polyglots, and active content.
- Exclude plaintext flags, answer keys, seed hashes, solver scripts, and hidden filename spoilers.
- Remain small enough for an ordinary browser download and repository checkout; the target is below 2 MB per ZIP and 10 MB total.

Evidence timestamps include explicit offsets or an explicit statement that all records use the same local time zone. Ambiguous locale-dependent dates are prohibited.

## Challenge Records

Each seed definition contains a stable UUID, title, description, `forensics` category, difficulty, points, hint, hint cost, static `file_url`, author, and SHA-256 flag hash. Descriptions tell players the exact answer normalization rule, including underscore, case, timestamp, hostname, or identifier formatting.

Point targets are:

- Easy: 75 to 100 points.
- Medium: 150 to 200 points.
- Hard: 250 to 300 points.

The seed script creates approved, active, non-seasonal practice challenges attributed to the Kleia administrator. It uses stable IDs and an insert-only/idempotent operation so reruns cannot overwrite a live challenge silently. After insertion, it reads all ten records back and verifies their category, status, activation state, file URL, and flag hash.

## Flag Security

Flags follow `KLEIA{lowercase_or_normalized_value}`. Plaintext flags may exist transiently in the local generation and test process but must never be written into committed evidence, public assets, test snapshots, logs, or documentation. Committed challenge metadata contains hashes only.

Automated leakage checks recursively inspect every ZIP entry, including nested ZIPs, and fail on:

- The literal `KLEIA{` marker in any evidence payload or filename.
- A plaintext expected answer stored outside the solver's transient runtime.
- Unexpected archive entries or path traversal names.
- Symlinks or executable file extensions.

## Solvability Validation

Each challenge has a deterministic solver function independent from the evidence generator. A solver must derive exactly one normalized answer using only the downloaded archive and the public prompt. Validation hashes `KLEIA{<derived-answer>}` and compares it with the challenge's stored `flag_hash`.

The automated suite verifies:

1. Exactly ten unique challenge IDs, titles, flags, and file URLs exist.
2. The difficulty distribution is exactly four easy, four medium, and two hard.
3. Every referenced ZIP exists, opens successfully, stays within size limits, and contains its required case notes.
4. Every challenge description states its answer format.
5. Every solver produces one answer and matches the stored SHA-256 hash.
6. No evidence archive leaks a flag or contains unsafe archive paths or active file types.
7. A clean rebuild produces byte-identical archives.
8. The seed command performs validation before any database write.

A concise verification report records each challenge's intended human steps, expected free tools, and automated result. It describes methods without publishing flags.

## Error Handling

Build, validation, and seed scripts stop on the first invalid challenge with the challenge number and a precise reason. Database configuration is required only for `--apply`. Without `--apply`, the seed command performs local validation and reports that no database writes occurred.

If Supabase credentials or the Kleia administrator are unavailable, seeding fails without modifying challenge data. Existing records with matching stable IDs are preserved; differing existing records cause verification failure instead of being overwritten.

## Testing and Release Gate

Implementation follows test-driven development: validation expectations and failing tests are added before generators or seed behavior. The release gate is:

```text
build deterministic archives
  -> run independent solvers
  -> run leak and archive-safety checks
  -> run relevant project tests and lint
  -> validate seed records locally
  -> seed only with explicit --apply and valid credentials
  -> read back and verify all ten database records
```

The challenges are ready for seeding only after every local check passes. Database seeding is reported separately from local readiness so a missing credential cannot be mistaken for a successful deployment.
