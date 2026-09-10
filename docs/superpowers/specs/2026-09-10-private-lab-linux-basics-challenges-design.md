# Private Lab Linux Basics Challenges Design

## Objective

Create and seed ten hands-on Linux command challenges into the existing **Training Ground** private lab. Each challenge has its own ZIP attachment containing a small filesystem puzzle, teaches one or more basic Linux commands, and resolves to one flag in the `KLEIA{...}` format.

The challenge set must be built and validated locally before any upload or database write. It must remain private-lab content: no challenge may be inserted into the global CTF, attached to a season, or published through `practice_publish`.

## Learner Experience

Each challenge presents a short mission, an individual ZIP download, a hint, and a post-solve explanation. The learner extracts the ZIP in a Linux environment and uses terminal commands to discover the flag. The archive contains a `README.txt` with the mission and suggested starting point, but it does not reveal the solution path or flag.

The challenges form a progressive sequence:

| No. | Working title | Difficulty | Commands | Filesystem puzzle |
| --- | --- | --- | --- | --- |
| 1 | Deep Navigation | Easy | `cd`, `pwd`, `ls` | Navigate a nested directory tree to a plainly named flag file. |
| 2 | Hidden File | Easy | `ls -la`, `cat` | Discover a hidden `.file` in an otherwise ordinary directory. |
| 3 | Hidden Path | Easy | `ls -la`, `cd`, `cat` | Find a hidden directory and then a hidden flag file inside it. |
| 4 | Disguised Image | Easy | `file`, `mv` | Recognize that `evidence.txt` contains PNG bytes, rename it, and open the image to read the flag. |
| 5 | Log Search | Easy | `grep` | Search several realistic text logs for the one flag-bearing line. |
| 6 | Filesystem Search | Easy | `find`, `cat` | Locate a specifically named file within a broad nested tree. |
| 7 | End of the Log | Easy | `tail` | Inspect the end of a long log to find the flag. |
| 8 | Unique Record | Medium | `sort`, `uniq` | Sort repeated records and isolate the unique flag-bearing entry. |
| 9 | Binary Clues | Medium | `file`, `strings` | Identify a binary-looking artifact and extract its printable flag string. |
| 10 | Command Pipeline | Medium | `find`, `grep`, pipes | Combine filesystem search and content filtering across multiple files to recover the final flag. |

The set uses seven easy and three medium challenges. Points increase from 50 to 150 while remaining appropriate for beginners. All challenges use the existing `misc` category because the schema has no Linux category.

## Artifact Design

Each challenge receives a separate ZIP with a stable filename such as `linux-basics-01-deep-navigation.zip`. Archives are generated into an ignored local directory under `.artifacts/linux-basics/`; plaintext flags and generated challenge payloads are never committed.

Archive requirements:

- Exactly one correct `KLEIA{...}` flag is recoverable from each archive.
- No archive contains executables, scripts, macros, symlinks, absolute paths, or `..` traversal entries.
- Every archive extracts into its own top-level challenge directory.
- Decoy files are harmless plain text or generated binary bytes and contain no additional valid flags.
- The disguised image is a valid PNG generated locally with the exact flag rendered as readable text, but is stored as `evidence.txt` inside the ZIP.
- Archives stay below 2 MB each and 10 MB in total.
- Challenge 9 uses inert binary data with embedded printable text; learners never execute it.

Flags are generated for the seed run and match `^KLEIA\{[a-z0-9_]+\}$`. The database receives only the uppercase-normalized SHA-256 hash expected by the existing flag-submission logic. Tests use injected fixture flags; production flags exist only in the generated private archives and transient seed state.

## Source Layout

The implementation force-adds the normally ignored challenge tooling:

```text
scripts/linux-basics/
  definitions.mjs
  artifacts.mjs
  validate.mjs
  seed.mjs
  linux-basics.test.mjs
```

`definitions.mjs` contains public metadata and artifact recipes but no production flags. `artifacts.mjs` builds ZIP buffers from an injected flag set. `validate.mjs` opens the built ZIPs as a learner would and validates their structure and intended solve paths. `seed.mjs` orchestrates preflight, upload, insertion, verification, and rollback. Generated output stays under `.artifacts/linux-basics/` and is excluded from Git.

The ZIP writer must produce standard archives readable by common Linux tools. The existing `sharp` dependency generates the PNG; a small pinned ZIP-writing package may be added because the repository currently has only a ZIP reader.

## Test-First Validation

Implementation follows red-green TDD. Tests are written and observed failing before generator or seed behavior is added.

The suite verifies:

1. There are exactly ten definitions with unique numbers, slugs, titles, filenames, and flags.
2. Every generated flag matches `KLEIA{...}` and every stored hash matches the existing trim-and-uppercase hashing contract.
3. Every ZIP opens, uses safe relative paths, has one top-level directory, includes `README.txt`, and meets size limits.
4. Each independent solver derives exactly the injected fixture flag from the generated archive using the evidence relevant to that challenge.
5. Challenge 4 contains valid PNG bytes under the `.txt` name and visibly renders the flag.
6. Challenge 9 contains inert binary data and exposes the flag through printable strings without executable headers.
7. Descriptions, hints, and explanations name the intended Linux learning outcome without exposing the answer.
8. Seed preflight completes all validation before the first external write.
9. The seed plan targets only `ctf_challenge_uploads` and `practice_challenges`, with `scope_room_id` set to the Training Ground room and global/season fields null.
10. Failure after an external write invokes cleanup only for upload and challenge IDs created by that seed run.

Before applying the seed, the focused suite, relevant project tests, lint, and a dry-run artifact build must all pass. The dry run reports the ten ZIP names, sizes, solve-path results, and intended private room while performing no network or database writes.

## Private-Lab Seeding Flow

The apply command requires an explicit `--apply` flag. Without it, the command is a dry run.

Apply performs these steps in order:

1. Load required Supabase service and Cloudinary server credentials.
2. Resolve exactly one `practice_rooms` row titled `Training Ground`; fail if none or multiple exist.
3. Verify the room creator exists in `profiles` with the trusted `admin` role and use that profile as `owner_id` and `created_by`.
4. Check the target room for the ten stable challenge titles. If all ten already exist, verify them and report an idempotent no-op. If only part of the set exists or any record conflicts, abort without writes.
5. Generate fresh production flags, artifact buffers, and hashes in memory.
6. Run the complete artifact and solve-path validation suite again.
7. Upload all ten archives to Cloudinary as authenticated raw resources.
8. Insert ten `ctf_challenge_uploads` rows with `scope_room_id` equal to the target room, `scope_season_id` and `challenge_id` null, and `scan_status` approved in accordance with the existing private-lab upload contract.
9. Insert the ten active `practice_challenges` rows in one batch, each referencing its unique upload row.
10. Read the records back and verify room scope, title, metadata, attachment, activation state, and flag hash.

The implementation must not insert into `ctf_challenges`, `practice_publications`, or season tables, and must not call the global publish RPC. Seeded content becomes visible only to administrators and users invited to the Training Ground lab through the existing RLS and application access paths.

## Failure Handling and Recovery

Local generation or validation failure stops before external writes. During apply, the script tracks every Cloudinary public ID, upload-row ID, and challenge-row ID created by the current run.

If upload, insertion, or read-back verification fails, cleanup runs in reverse order:

1. Delete only challenge rows created by the current run.
2. Delete only upload rows created by the current run.
3. Destroy only Cloudinary resources created by the current run.

Cleanup never targets pre-existing room content. Any cleanup failure is reported with exact resource identifiers so recovery remains possible. Plaintext flags are not printed in normal logs or error output.

## Completion Criteria

The work is complete when:

- All ten test-first challenge validations pass.
- Ten distinct ZIP attachments have been generated and independently solved by the validator.
- The dry-run seed reports zero external writes.
- The apply seed creates or verifies exactly ten challenges in the Training Ground private lab.
- A post-seed database query confirms the challenges and upload rows are room-scoped and confirms there are no associated global publication rows.
- The application can download each attachment through the existing private practice file endpoint.
- No production plaintext flag or generated archive is committed to the repository.

