# Kleia — AI Agent Build Guide (Feature Rollout)

This file is written for an AI coding agent (Codex, OpenCode, etc.) building new features
into the existing `kleia.py` repository. Follow phases **in order**. Do not start a phase
until the previous phase is tested and confirmed working. Do not push directly to `main`.

## Repo context

- Repo: https://github.com/LikeNmuFF/kleia.py
- Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres + Auth + Realtime),
  Cloudinary (uploads), Framer Motion, Vercel (deploy)
- Live site: https://www.kleia.site
- Existing features: Feed, Real-time Chat, Learn (Python/Linux lessons + XP), CTF Challenges
  (seasonal, skill tree, community submissions), Regex Golf, Daily Cipher, Streaks/Leaderboard

## Ground rules for every phase

1. **Branch per feature.** Never commit directly to `main`. Use `feature/<name>`, e.g.
   `feature/skill-analytics-dashboard`.
2. **Test before push, every time.**
   - Run `npm run build` locally — must complete with zero errors before any push.
   - Run `npm run lint` — fix all lint errors, do not suppress with `eslint-disable` unless
     justified in a code comment.
   - Manually exercise the new feature in `npm run dev` (auth as a normal user AND, where
     relevant, as an admin) before opening a PR.
   - For any new Supabase table/migration, apply it to a **local or staging** Supabase
     project first — never run untested migrations against production.
3. **Small commits, one concern each.** A migration, a new API route, and a new UI component
   should be separate commits with clear messages.
4. **PR before merge.** Open a pull request even if working solo — it creates a review point
   and a rollback point. Summarize what was tested in the PR description.
5. **Never commit secrets.** No API keys, Supabase service-role keys, or `.env` values in
   code, commit messages, or comments. Confirm `.env*` stays in `.gitignore`.
6. **Roll back fast.** If a deployed feature breaks something in production, revert the merge
   commit immediately rather than trying to hotfix live.

## Security checklist (apply to every phase, not just once)

- [ ] Every new Supabase table has **Row Level Security (RLS) enabled** — no table ships
      without RLS policies restricting read/write to the appropriate user/role.
- [ ] Admin-only actions (approving CTF submissions, creating webinars, managing classrooms)
      are checked **server-side** (API route or Supabase policy), never trusted from client-side
      role state alone.
- [ ] All user input (post content, chat messages, CTF submissions, webinar registration data)
      is validated and sanitized server-side before storage — never trust client validation alone.
- [ ] Any endpoint calling an external AI API (Groq/Mistral/Gemini) sits behind **rate limiting**
      per user, to prevent abuse and cost overrun on a free tier.
- [ ] AI prompts that include user-submitted text (chat messages, submitted challenges, quiz
      answers) must be treated as **untrusted input** — strip or escape content that looks like
      an attempt to override system instructions (basic prompt-injection hygiene). Never let an
      AI response trigger a privileged action (e.g., "AI approves this CTF challenge") without a
      human admin confirming.
- [ ] API keys for AI providers live only in server-side environment variables, never exposed
      to the client bundle (no `NEXT_PUBLIC_` prefix on secret keys).
- [ ] File uploads (Cloudinary) validate file type and size server-side, not just in the UI.
- [ ] Certificate PDFs (webinar feature) are generated server-side or verified against a
      registration/attendance record — never trust a client-supplied "completed" flag.
- [ ] Run `npm audit` before each phase's PR and address high/critical vulnerabilities.

---

## Phase 1 — Unified Skill Analytics Dashboard (core thesis feature)

**Goal:** aggregate a student's performance across Learn, CTF, Regex Golf, and Daily Cipher
into one profile view.

1. Design and migrate a `skill_snapshots` (or similar) table/view that aggregates existing
   activity tables (quiz results, CTF solves, Regex Golf attempts, Cipher streaks) per user.
   Test the query against real seed data before building UI on top of it.
2. Build a read-only API route that returns a user's aggregated skill profile.
3. Build the dashboard UI (profile page addition) showing strengths/weaknesses by category.
4. **Test:** create 2-3 test accounts with varied activity history; confirm the dashboard
   reflects their actual performance accurately before moving on.
5. Push only after manual verification against seeded test data.

## Phase 2 — AI-generated recommendations and summaries

**Goal:** turn the raw dashboard from Phase 1 into personalized, explained guidance.

1. Choose and configure an AI provider (Groq, Mistral, or Gemini free tier) — server-side only.
2. Build a server-side function that takes a user's skill snapshot (from Phase 1) and generates:
   - A short natural-language summary of strengths/weaknesses
   - A specific next-step recommendation
3. Cache AI responses (don't regenerate on every page load — regenerate on a schedule or when
   the underlying data meaningfully changes) to control API usage on a free tier.
4. **Test:** verify output quality against the same 2-3 test accounts from Phase 1. Confirm
   the AI never fabricates activity the user didn't actually do — cross-check generated text
   against the real data it was given.
5. Apply the security checklist items on rate limiting and prompt-injection hygiene before push.

## Phase 3 — Community + skill-building bridge

**Goal:** connect the analytics core to social features.

1. Peer Tutoring / Study Group Matching — match users using Phase 1 skill data (strong-in-X
   matched with weak-in-X). Build matching logic, then a simple UI to browse/request matches.
2. Achievement badges — define a badge schema covering all features (not CTF-only), award
   logic, and profile display.
3. Classroom/Cohort Mode — faculty accounts can create a cohort, assign existing content, and
   view aggregated (not just individual) skill data for their cohort only (respect RLS).
4. **Test each sub-feature independently** before combining; confirm cohort data visibility
   is correctly scoped (a faculty account must never see students outside their own cohort).

## Phase 4 — AI-assisted supporting features

1. AI hint assistant for CTF/Learn — progressive hints, never full answers. Test that it
   cannot be prompted into revealing a flag/answer directly (adversarial testing required).
2. AI-assisted content generation — quiz questions from webinar topics, webinar summaries.
   Human review required before publishing AI-generated content live.
3. AI-assisted admin review — first-pass flagging of duplicate/broken community CTF
   submissions. This assists the admin queue; it does not auto-approve or auto-reject.
4. **Test:** run adversarial prompts against the hint assistant specifically before shipping —
   this is the highest-risk AI feature for misuse.

## Phase 5 — Institutional features

1. Capstone/Project Collaboration Board — post/browse project ideas, request to join a team.
2. Mentor/Faculty Verification Layer — verified accounts can endorse a student's achievement.
3. **Free Webinars & Certifications**:
   - Admin/faculty creates a webinar (topic, schedule, live link, capacity).
   - Students register via their existing account.
   - Attendance tracked server-side during the live session (timestamped join, optional
     minimum-duration check) — never accept a client-reported "I attended" flag alone.
   - On completion, generate a certificate PDF server-side (reuse the jsPDF approach from
     PractiClock) and store a record linking user → webinar → certificate.
   - Optionally feed completion into the Phase 1 skill snapshot.
4. Notifications/reminders — streak risk, new content, chat mentions, upcoming webinars.
5. **Test:** run a full webinar end-to-end with a test account (register → simulate
   attendance → confirm certificate generates correctly and only for attendees who met the
   threshold) before this goes live.

---

## Definition of done (every phase)

- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no unresolved errors
- [ ] Manually tested as both a normal user and (if relevant) an admin/faculty account
- [ ] New tables have RLS enabled and tested (try accessing another user's data and confirm
      it's denied)
- [ ] No secrets committed; `npm audit` reviewed
- [ ] PR opened with a summary of what was tested, merged only after review
