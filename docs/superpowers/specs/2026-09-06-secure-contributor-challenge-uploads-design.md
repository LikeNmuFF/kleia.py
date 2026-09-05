# Secure Contributor Challenge Uploads Design

## Goal

Allow administrators and contributors to attach common CTF resource files to global or season challenges without permitting direct, unvalidated uploads or exposing unscanned assets to players.

The system cannot prove that arbitrary content is harmless through extension checks alone. It therefore combines local structural validation with Cloudinary Perception Point malware moderation and refuses to publish or download an asset until both layers accept it.

## Scope

This change covers files uploaded from the contributor challenge workspace. The backend upload and download services will also accept administrators so the same secure path can replace the existing admin uploader later, but redesigning the admin forms is outside this change.

The notification dropdown opacity correction remains a separate one-line UI fix and is not coupled to this upload architecture.

## Architecture

The browser sends one file to a same-origin `POST /api/ctf/uploads` route. The route authenticates the current user through the existing cookie-backed Supabase server client, loads the authoritative profile role, and allows only `admin` or `contributor`. No Cloudinary credential, signature, upload preset, or unsigned upload endpoint is exposed to the browser.

The route validates and normalizes the file, uploads it to Cloudinary as an authenticated raw asset with `moderation=perception_point`, and creates a database record with `scan_status='pending'`. The upload response returns an opaque database upload ID and status, never a public asset URL. The contributor form polls the status endpoint and enables challenge submission only after the record becomes `approved`.

Cloudinary sends the asynchronous moderation result to `POST /api/webhooks/cloudinary`. The webhook verifies `X-Cld-Signature`, checks that `X-Cld-Timestamp` is no more than five minutes old, matches the Cloudinary asset identity stored in the database, and changes only `pending` records to `approved` or `rejected`. Repeated callbacks are idempotent. Rejected assets are destroyed through Cloudinary's authenticated API after the rejection is recorded.

Challenge creation accepts `upload_id`, not a free-form file URL, for contributors. The server action verifies that the upload is approved, belongs to the caller, is not already attached, and has the same global or season scope before setting `file_url` to `/api/ctf/files/<upload-id>` and atomically linking the upload to the new challenge.

Players download through `GET /api/ctf/files/[id]`. The route verifies that the upload is approved and attached to an approved, active challenge visible to that player. It retrieves the authenticated Cloudinary asset server-side and responds with `Content-Disposition: attachment`, `Content-Type: application/octet-stream`, `X-Content-Type-Options: nosniff`, and a conservative private cache policy. Browsers never receive a reusable Cloudinary authenticated URL.

## Database Model

Create `public.ctf_challenge_uploads` with:

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid not null references public.profiles(id) on delete cascade`
- `challenge_id uuid unique references public.ctf_challenges(id) on delete cascade`
- `scope_season_id uuid references public.ctf_seasons(id) on delete cascade`
- `cloudinary_asset_id text not null unique`
- `cloudinary_public_id text not null unique`
- `original_name text not null`
- `stored_name text not null`
- `extension text not null`
- `size_bytes bigint not null check (size_bytes between 1 and 26214400)`
- `sha256 text not null`
- `scan_status text not null check (scan_status in ('pending','approved','rejected'))`
- `scan_provider text not null default 'perception_point'`
- `scan_result jsonb`
- `created_at timestamptz not null default now()`
- `scanned_at timestamptz`

Enable RLS. Owners may select their own upload rows. Administrators may select all rows. Browser clients receive no insert, update, or delete policy; the authenticated API route and verified webhook write through the existing server service client only after performing application authorization. No service-role key is exposed to client code.

Add indexes on `owner_id`, `challenge_id`, `scope_season_id`, and `(scan_status, created_at)`.

## File Validation

The maximum request file size is 25 MiB. Reject the request early when `Content-Length` exceeds the route limit, then enforce the same limit against the actual `File.size` and byte buffer.

Allowed top-level formats are:

- Archives: `.zip`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- Documents/data: `.pdf`, `.txt`, `.md`, `.json`, `.csv`
- Capture files: `.pcap`, `.pcapng`

Do not accept HTML, SVG, JavaScript, WebAssembly, shell scripts, Office macro formats, executables, installers, shared libraries, JAR/APK files, disk images, or extensionless files. An unsupported format receives a generic validation error and is never forwarded to Cloudinary.

Validation must not trust the browser MIME type. Detect supported binary formats from magic bytes and require the detected format to agree with the normalized extension. Plain-text formats must be valid UTF-8, contain no NUL bytes, and meet their format-specific parser checks for JSON or CSV where applicable.

Raster images are decoded and re-encoded server-side before upload, stripping metadata and trailing/polyglot data. Enforce a maximum of 25 megapixels and reject animated images for the first release; GIF files must contain exactly one frame.

ZIP archives are traversed without extracting to disk. Reject archives that are encrypted, contain more than 200 entries, contain absolute paths or `..` traversal, contain symbolic links, contain nested archives, contain a blocked extension, expand beyond 100 MiB total, or have an entry or aggregate compression ratio above 100:1. Validate each recognized binary member by magic bytes and each text member by the same text rules. Empty archives are rejected.

Filenames are normalized to Unicode NFC, reduced to a basename, stripped of control characters, limited to 100 display characters, and never used as a Cloudinary public ID. Storage IDs use an unpredictable UUID under `kleia-ctf-files/<owner-id>/`.

## Malware Scanning and Fail-Closed Behavior

Every Cloudinary upload includes:

- `resource_type=raw`
- `type=authenticated`
- `moderation=perception_point`
- a public webhook `notification_url`
- a backend-generated public ID and ownership context

The API accepts the upload only when Cloudinary's response explicitly contains a Perception Point moderation entry with status `pending` or `approved`. A response without the expected provider or status is treated as scanner misconfiguration: destroy the uploaded asset, do not create an approved database row, and return a configuration error.

If the Cloudinary Perception Point add-on is not activated for the product environment, uploads intentionally fail. There is no validation-only production fallback and no administrative bypass for attaching a pending or rejected file.

## Authorization and Abuse Controls

- Authenticate with the existing Supabase server client and `auth.getUser()`; never authorize from client claims or form fields.
- Read the caller's role from `public.profiles` on every upload request.
- Apply the existing named rate limiter with a limit of five upload attempts per user per hour.
- Require a same-origin `Origin` header for browser upload requests and reject cross-origin requests.
- Associate global uploads with `scope_season_id = null`. A season-scoped upload requires an active contributor assignment for that season; administrators remain unrestricted.
- Never accept `owner_id`, Cloudinary identifiers, scan status, or a final file URL from the browser.
- Log rejected validation, authorization, rate-limit, scanner, and webhook-signature events without logging file contents or secrets.

## Contributor Experience

Replace the contributor form's free-form `File URL` field with a file picker accepting the allowlisted extensions. Display the 25 MiB limit and permitted file groups. After selection:

1. Show local filename and size.
2. Upload to the backend and display `Validating file`.
3. Display `Scanning for malware` while status is pending.
4. Display `Ready to attach` only after approval.
5. Display a generic rejection message for invalid or malicious files.

Disable `Publish challenge` while a selected file is validating or pending. A challenge may still be published without any attachment. Editing a challenge can keep its existing attachment or upload a replacement; replacement does not detach the old file until the new file is approved and the update succeeds.

## Error Handling

Use generic client errors such as `Unsupported file type`, `File exceeds 25 MB`, `Archive contains unsafe content`, `File scan rejected`, and `File scanning is temporarily unavailable`. Detailed parser, Cloudinary, and scan results remain in structured server logs.

If Cloudinary succeeds but the database insert fails, destroy the new Cloudinary asset. If challenge linking fails, leave the approved upload owned and unattached so the contributor can retry. Pending unattached records older than 24 hours and approved unattached records older than seven days are eligible for a later cleanup job; that cleanup job is outside the initial implementation.

## Testing

Follow test-driven development with these layers:

- Unit tests for filename normalization, extension and magic-byte agreement, UTF-8/NUL validation, image limits, and ZIP traversal/encryption/entry-count/expanded-size/compression-ratio/member-type rejection.
- Route tests proving unauthenticated users, regular users, unassigned season contributors, cross-origin requests, oversized files, and rate-limited users are rejected before Cloudinary is called.
- Upload integration tests with the Cloudinary network boundary stubbed, asserting authenticated upload parameters and fail-closed behavior when moderation metadata is absent.
- Webhook tests for valid signatures, invalid signatures, stale timestamps, asset mismatches, approval, rejection, and idempotent duplicate callbacks.
- Server-action tests proving only an approved upload owned by the contributor can be attached and that an upload cannot be reused.
- Download tests proving pending/rejected/unattached files are unavailable and approved files are returned only as attachments with `nosniff`.
- Contributor UI tests for validation, pending, approved, rejected, and attachment-free publishing states.
- Production build, focused test suites, and a manual browser check of global and season contributor forms before completion.

## Deployment Requirements

Before enabling the UI in production:

1. Activate the Cloudinary Perception Point Malware Detection add-on.
2. Configure the public webhook URL as `<NEXT_PUBLIC_SITE_URL>/api/webhooks/cloudinary`.
3. Confirm `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are server-only.
4. Apply and verify the database migration and RLS policies.
5. Upload a clean test file and the standard EICAR antivirus test file. The clean file must become approved; the EICAR file must become rejected and remain unavailable through the download route.

Production remains fail-closed until the clean and rejection paths both pass.
