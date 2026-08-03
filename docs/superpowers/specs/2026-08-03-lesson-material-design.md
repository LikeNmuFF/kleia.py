# Lesson "Learn" Tabs + Reference Material

Date: 2026-08-03

## Summary

Make the Learn feature genuinely beginner-friendly by adding readable reference material to every lesson. Each lesson gets a "Learn" tab (default) that teaches the topic in plain language, followed by the existing "Quiz" tab. CTF challenges can link to the lesson that teaches the relevant techniques, so stuck users can jump straight to a reference.

## Background

The Learn feature stores topics in `learn_topics` and lessons in `learn_lessons` (JSONB `questions`). Lessons are currently quiz-only — no reading material. The CTF challenge detail page has a hint but no link to learning resources.

## Scope

1. **Schema** (migration `026_lesson_material.sql`, local + gitignored):
   - `learn_lessons`: add `material jsonb NOT NULL DEFAULT '[]'::jsonb`
   - `ctf_challenges`: add `learn_topic_slug text`, `learn_lesson_slug text` (nullable)
2. **Material format** — structured JSON blocks, DB-driven:
   - `{ "heading": "...", "text": "..." }` — prose section
   - `{ "heading": "...", "code": "..." }` — code example block
   - `{ "heading": "...", "bullets": ["...", "..."] }` — bullet list
   - Beginner tone: plain language, one idea at a time, a real example, how it applies in CTF, and a try-it tip.
3. **UI:**
   - `app/(main)/learn/[topic]/[lesson]/page.tsx` → two-tab layout: **"Learn"** (default) + **"Quiz"**
   - New `components/learn/LessonMaterial.tsx` renders material blocks
   - `LessonQuiz` component unchanged
   - `app/(main)/ctf/[id]/page.tsx` → shows "Learn more: {lesson title}" link when `learn_topic_slug`/`learn_lesson_slug` are set
4. **Content** — beginner-friendly material for all 22 lessons:
   - Python Basics: hello-world, variables, strings, input
   - Control Flow: if-else, for-loops, while-loops, break-continue
   - Data Structures: lists, tuples, dictionaries, sets
   - Functions: define, parameters, defaults
   - Modules & Errors: import, exceptions, builtins
   - Linux Basics: navigation, searching, downloads, file-ops
   - Existing lessons updated via `UPDATE` in `026`; Linux lessons get material added to their seed in `025`.

## Out of Scope

- No XP/level/progress changes
- No new pages or navigation items
- No new dependencies (no markdown renderer)
- `LessonQuiz` logic untouched

## Implementation

1. Write `026_lesson_material.sql`: ALTERs + `UPDATE` material for all 18 existing Python lessons
2. Update `025_linux_commands.sql`: add `material` to the 4 Linux lesson seeds
3. Create `components/learn/LessonMaterial.tsx`
4. Convert `[lesson]/page.tsx` to tabs (Learn default, then Quiz)
5. Add "Learn more" link to `ctf/[id]/page.tsx` resolving lesson title
6. Validate all JSONB (no bare single quotes, valid JSON, answer consistency)
7. tsc + production build; user runs migrations in SQL editor; commit/push app code

## Deploy

Migrations run locally in Supabase SQL Editor (all migrations are gitignored). Only app code is committed to the repo.
