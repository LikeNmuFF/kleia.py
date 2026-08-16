# Forensics 3 Challenge Batch — Design Doc

Date: 2026-08-16
Status: Approved

## Goal

Add 10 new forensics challenges to the Kleia CTF platform covering tools that are **not yet
represented** in the existing forensics set (F1–F10 in `seed-forensics.js` and the batch-2
forensics in `seed-30-new-challenges.ts`): XOR'd pcap (Wireshark, non-grepable), steghide,
zsteg, jsteg, bit-plane (StegSolve-style), whitespace stego, appended ZIP (binwalk), WAV LSB, and
PNG tEXt metadata.

**Hard requirement:** every artifact is *solved first* — a verification script actually runs the
real tools and asserts the exact expected flag — before anything is uploaded or seeded. Only
challenges that fully pass are deployed.

## Points Scale

Difficulty → points, matching the platform's wider 100–600 range:

| Difficulty | Points |
|------------|--------|
| easy       | 100–150 |
| medium     | 200–300 |
| hard       | 400–600 |

## Approach

Separate generate → solve → seed pipeline, mirroring the existing `gen-forensics.py` +
`seed-forensics.js` pattern:

1. **`scripts/gen-forensics3.py`** — generates artifacts into `scripts/forensics-artifacts/`
   using Python + PIL, plus `subprocess` for `steghide` and `jsteg`. Deterministic and idempotent.
2. **`scripts/solve-forensics3.py`** — actually solves every artifact with the real tools
   (`steghide`, `zsteg`, `binwalk`, custom Python parsers), asserts each extracted value equals
   the expected flag, and writes `scripts/forensics-artifacts/verified.json` only if all 10 pass.
   Exits non-zero on any failure.
3. **`scripts/seed-forensics3.js`** — refuses to run unless `verified.json` exists (gates on the
   full solve pass), uploads each verified file to Cloudinary (`folder=kleia/ctf/forensics`, raw
   upload, same signed-request code as `seed-forensics.js`), and inserts into `ctf_challenges`
   with `file_url`, `flag_hash`, hint, description, difficulty, points, `status='approved'`.

No new migration needed — `file_url` already exists (migration `011_ctf_challenge_files.sql`).

## The 10 Challenges

All single-layer, each with one distinct flag. New flags added to `flags.env` as
`FLAG_FORENSICS_3_*`.

| # | Title | Technique | Tool | Diff | Points | Verify approach |
|---|-------|-----------|------|------|--------|-----------------|
| 1 | Stream XOR | pcap, TCP payload XOR'd with a single-byte key | Wireshark + custom | medium | 250 | Parse pcap → XOR payload → flag (grep finds nothing) |
| 2 | Steg Image | steghide embed in BMP, passphrase in hint | `steghide extract -sf -p` | easy | 125 | Same command |
| 3 | Steg Audio | steghide embed in WAV, passphrase in hint | steghide | medium | 275 | Same command |
| 4 | Zsteg PNG | LSB across RGB planes | `zsteg -a` | easy | 100 | `zsteg -a` |
| 5 | Jsteg JPEG | DCT-coefficient LSB (jsteg format) | `jsteg` (gen) / `zsteg` (solve) | hard | 500 | `zsteg -a` |
| 6 | Bit Plane | flag visible in a single bit-plane (StegSolve-style) | StegSolve / PIL | medium | 300 | Extract bit plane → reconstruct text |
| 7 | Whitespace | flag in trailing space/tab per line | custom script | medium | 225 | Parse trailing whitespace |
| 8 | Appended ZIP | ZIP appended after PNG, `binwalk` it | binwalk / unzip | easy | 150 | binwalk extract → unzip |
| 9 | WAV LSB | flag in LSBs of audio samples | custom script | medium | 250 | LSB extraction from samples |
| 10 | PNG tEXt | flag in tEXt chunk | exiftool / strings | easy | 110 | Read tEXt chunk |

### Tool feasibility notes

- **steghide** supports JPEG, BMP, WAV, AU (NOT PNG) — so challenge 2 uses a BMP, challenge 3
  uses a WAV.
- **jsteg** is a Go binary (`github.com/lukechampine/jsteg`) used only at *generation* time to
  embed; players solve with `zsteg -a`, which decodes the jsteg format. No Java required.
- **StegSolve-style** challenge is generated with PIL (flag painted into a chosen bit-plane);
  solvable either with StegSolve's bit-plane viewer or a short PIL script. Verify uses the PIL
  route.
- All other artifacts are pure Python + PIL and installed tools.

## Verification Flow (the "test it first" gate)

1. `gen-forensics3.py` runs clean (all 10 artifacts written).
2. `solve-forensics3.py` solves all 10 with the real tools and asserts flags; writes
   `verified.json` listing `{filename, flag_key, sha256}` for each.
3. `seed-forensics3.js` checks `verified.json` exists (else exits with
   `"Artifacts not verified — run solve-forensics3.py first"`).
4. Seed uploads to Cloudinary and inserts DB rows; prints per-challenge success.

## Descriptions & Hints

Each challenge description names the artifact and tool. Hints:

| # | Hint |
|---|------|
| 1 | Follow TCP Stream in Wireshark; the payload is XOR'd with a single byte. Try common keys. |
| 2 | `steghide extract -sf image.bmp -p <pass>` (passphrase in hint) |
| 3 | `steghide extract -sf audio.wav -p <pass>` |
| 4 | `zsteg -a image.png` |
| 5 | `zsteg -a image.jpg` — jsteg hides data in DCT coefficients |
| 6 | Open in StegSolve, walk bit-planes 0–7 per channel, one plane shows the flag |
| 7 | Each line's trailing spaces/tabs are bits — decode space=0, tab=1 |
| 8 | `binwalk file.png` then extract the appended ZIP |
| 9 | Extract LSB of each 16-bit sample, group into bytes |
| 10 | `exiftool image.png` or read the tEXt chunk |

## Error Handling

- Solve script exits non-zero on any mismatch/failure; partial `verified.json` is never written.
- Seeder deletes existing rows by `title` match (not category-wide) to avoid nuking other
  forensics challenges; prints a warning if a title already exists and skips.
- Cloudinary upload failure → log and skip that challenge, continue others (same as existing
  seeder).

## Testing

- Manual: run `gen-forensics3.py`, then `solve-forensics3.py`, confirm all 10 PASS.
- Seeder dry-run flag `--dry-run` prints what would be inserted without touching Cloudinary/Supabase.
- Existing `seed-forensics.js` challenges are untouched.