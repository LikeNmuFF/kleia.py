# CTF ↔ Learn Bidirectional Linking

Date: 2026-08-03

## Summary

Close the feedback loop between CTF challenges and the Learn feature. Challenge authors can tag a challenge with the lesson that teaches the relevant technique (via forms, not raw SQL), and each lesson page shows the related challenges. This directly serves the "help users when stuck on a challenge" goal from the earlier material work.

## Background

- `ctf_challenges` already has `learn_topic_slug` / `learn_lesson_slug` columns (added in `026_lesson_material.sql`), and the challenge detail page (`ctf/[id]/page.tsx`) already renders a "Learn more: {lesson}" link.
- Those columns are currently only settable via raw SQL — the submit form, admin create form, and admin edit form do not expose them.
- Lesson pages do not show which challenges relate to them.
- The gamification/badge system (badges, XP, daily missions) is complete from a prior session — out of scope.

## Scope

### Feature 9 — tag challenges from all forms

1. **`components/ctf/LearnLinkPicker.tsx`** (new, client):
   - Cascading dropdowns: Topic (`learn_topics`), then Lesson (`learn_lessons` filtered by selected topic)
   - Props: `topics: { slug, title, icon }[]`, `lessons: { topic_id, slug, title }[]`, optional `defaultTopicSlug` / `defaultLessonSlug` (for editing)
   - Emits two hidden inputs `learn_topic_slug` / `learn_lesson_slug` so the parent `<form>` carries the values automatically
   - Styling follows the app: `var(--input-bg)`, `input-field` class, optional selection
2. **`app/actions/ctf.ts`**:
   - `submitChallenge(formData)`: read the two fields, validate the pair points at a real lesson, insert
   - `createChallenge(data)`: accept, validate, insert
   - `updateChallenge(id, data)`: accept, validate, update
   - Validation: look up `learn_topics` (slug → id) and `learn_lessons` (topic_id + slug); clear both to `null` if the pair is invalid
3. **`app/(main)/ctf/submit/page.tsx`**: becomes an async server component loading topics/lessons; renders the picker inside the form
4. **`app/(main)/admin/ctf/page.tsx` + `AdminCTFClient.tsx`**:
   - Admin page loads topics/lessons and passes them as props; adds the two learn columns to the challenge select
   - `AdminCTFClient`: adds fields to the `Challenge` interface, renders the picker in the create + edit forms (with defaults on edit), passes values in `handleCreate` / `handleUpdate`

### Feature 10 — related challenges on lesson pages

- `app/(main)/learn/[topic]/[lesson]/page.tsx` (server component): query `ctf_challenges` where `learn_topic_slug = topicSlug` AND `learn_lesson_slug = lessonSlug` AND `status = 'approved'`, selecting `id, title, category, difficulty, points`
- Render a "🏆 Challenges that use this" card under the tabs when matches exist, linking to `/ctf/{id}`; reuse category-icon / difficulty-color patterns from `ctf/[id]/page.tsx`

## Out of Scope

- No gamification/badge changes (already complete)
- No new pages or nav items
- No schema changes (columns exist from `026`)
- No new dependencies

## Implementation Order

1. Design doc (this file)
2. `LearnLinkPicker.tsx`
3. `app/actions/ctf.ts` validation + inserts
4. Submit page
5. Admin page + client
6. Lesson page related challenges
7. tsc + production build
8. Commit + push

## Deploy

All app code, committed and pushed to `main` (Vercel auto-deploy). No migration required. Note: existing challenges show the "Learn more" link only once tagged (via forms or SQL).
