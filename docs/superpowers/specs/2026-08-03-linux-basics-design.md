# Linux Basics Learning Topic

Date: 2026-08-03

## Summary

Add a new "Linux Basics" topic to the existing Learn feature (kleia.py `/learn`), teaching essential Linux/CTF commands (ls, cd, grep, wget, unzip, etc.) via the same DB-driven lesson system.

## Background

The Learn feature (`supabase-migrations/023_learn_setup.sql`) stores topics in `learn_topics` and lessons (with JSONB question arrays) in `learn_lessons`. Content is fully DB-driven — no app code changes are required to add content. The Learn page (`app/(main)/learn/page.tsx`) currently has a Python-only header.

## Scope

- New topic: `linux-basics` — "Linux Basics" 🐧, sort_order 6 (after the 5 Python topics)
- 4 lessons (2–4 questions each, MCQ + fill-in-blank, reusing `LearnQuestion` format):
  1. **Navigation & Files** — `ls`, `cd`, `pwd`, `cat`, `touch`
  2. **Search & Inspect** — `grep`, `find`, `head`, `tail`
  3. **Download & Extract** — `wget`, `curl`, `unzip`, `tar`
  4. **File Ops** — `cp`, `mv`, `rm`, `chmod`
- Generalize Learn page header "Learn Python 🐍" → "Learn" (+ metadata title/description) since content is no longer Python-only

## Out of Scope

- Schema changes (tables already exist from 023)
- New components, app logic, or question types
- XP/level/leaderboard changes (work automatically for new lessons)

## Implementation

1. Create `supabase-migrations/025_linux_commands.sql` (local, gitignored):
   - `INSERT INTO learn_topics` for `linux-basics` (slug, title, description, icon '🐧', sort_order 6) — `ON CONFLICT (slug) DO NOTHING`
   - 4 `INSERT INTO learn_lessons ... SELECT t.id ... FROM learn_topics t WHERE t.slug = 'linux-basics' ON CONFLICT (topic_id, slug) DO NOTHING` blocks with question arrays (follow same style as 023)
2. Edit `app/(main)/learn/page.tsx`: header + metadata title/description generalized
3. Validate SQL (JSONB literals, no bare single-quotes, answers within options)
4. User runs `025` in Supabase SQL Editor; commit/push page.tsx tweak → Vercel deploys

## Deploy

Migration runs locally in SQL Editor (all migrations are gitignored). Only the page.tsx change is committed to the repo.
