# Contributing to Kleia

First off, thank you for wanting to contribute! Kleia is a community project and we welcome contributions of all kinds — bug reports, feature ideas, documentation, design, and code.

By participating in this project, you agree to abide by the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. Be respectful, be kind, and assume good faith.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started Locally](#getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Install & Run](#install--run)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Submitting CTF Challenges](#submitting-ctf-challenges)
- [Making a Pull Request](#making-a-pull-request)
- [Commit Messages](#commit-messages)

## Ways to Contribute

- **Report bugs** — open an issue with clear reproduction steps, expected vs. actual behavior, and your browser/environment.
- **Suggest features** — open an issue describing the problem you want to solve and your proposed approach.
- **Fix bugs & build features** — check open issues, comment on one you want to take, then submit a PR.
- **Submit CTF challenges** — see [Submitting CTF Challenges](#submitting-ctf-challenges).
- **Improve docs** — fix typos, clarify setup steps, or translate the README.
- **Review PRs** — even a "looks good to me" is helpful.

## Getting Started Locally

### Prerequisites

- **Node.js 20.9+** (Node 22 recommended) — Next.js 16 requires it.
- **npm** (ships with Node).
- A **Supabase** project (free tier works).
- A **Cloudinary** account (only needed for avatar/upload features).
- **Git**.

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

Optional — only needed for the security-scan reporting script:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
```

> **Never commit real keys.** `.env*` files are gitignored. If you need to test against a real project, create your own free Supabase/Cloudinary instances.

### Database Setup

1. Create a Supabase project.
2. Open the **SQL Editor**.
3. Run the migrations in `supabase-migrations/` **in filename order**. They create all tables, Row Level Security (RLS) policies, triggers, and the auto-update functions for `likes_count` and `comments_count`.

### Install & Run

```bash
# Clone the repo
git clone https://github.com/LikeNmuFF/kleia.py.git
cd kleia.py

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) — the dev server picks up env changes from `.env.local` automatically.

## Project Structure

```
app/                      # Next.js App Router routes
  (main)/                 # Authenticated app pages (feed, chat, events, ctf, ...)
  (auth)/                 # Login, signup, password pages
  (legal)/                # Terms, privacy, security pages
  api/                    # Route handlers (server action fallbacks, etc.)
components/               # Reusable React components
lib/                      # Utilities, contexts, supabase clients
public/                   # Static assets (robots.txt, sitemap.xml, images)
supabase-migrations/      # SQL migrations, run in order
scripts/                  # Local dev scripts (mostly gitignored)
```

## Code Style

- **TypeScript** everywhere — no plain `.js` in `app/` or `components/` unless it's a build script.
- **Tailwind CSS** for styling, using the site's CSS variables (`var(--bg-primary)`, `var(--card-bg)`, `var(--text-primary)`, `var(--accent)`, ...) for theme-aware colors.
- Server components by default; add `'use client'` only when a component needs state, effects, or browser APIs.
- Keep components in `components/` and route files in `app/`. Reuse existing components instead of duplicating markup.
- Run the typecheck before pushing:

```bash
npx tsc --noEmit
```

## Submitting CTF Challenges

The CTF leaderboard and flag submissions are the heart of the project, so flags must stay secret.

- **Flag format:** `KLEIA{lowercase_text}` — the format is verified on submit.
- Seed scripts that contain plaintext flags are **gitignored** and never committed to the repo.
- To contribute a challenge, create it through the in-app **Submit Challenge** form (`/ctf/submit`) so the flag is hashed and stored server-side, and the challenge enters the approval queue.
- Never hardcode a flag in a committed file, and never post a flag in an issue, PR, or comment.

## Making a Pull Request

1. **Fork** the repository and create a branch: `git checkout -b fix/my-bug-fix`.
2. **Make your changes**, keeping them focused on one issue. Write or update tests where applicable.
3. **Run checks** before pushing:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
4. **Commit** your changes with a clear message (see below).
5. **Open a PR** against `main`. In the PR description, link the related issue and describe what you changed and why.
6. A maintainer will review. Small, well-scoped PRs are reviewed fastest.

## Commit Messages

Keep commit messages short and descriptive, prefixing the type when it helps:

```
feat: add weekly study goal reminders
fix: resolve logout on logo click
docs: update deployment instructions
chore: bump dependencies
```

## Questions?

Open a [discussion](https://github.com/LikeNmuFF/kleia.py/discussions) or reach out via the contact link on the site. Happy hacking! 🚀
