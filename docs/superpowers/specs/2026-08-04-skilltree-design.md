# Skill Tree Feature Design

## Overview
Implement a skill tree system for CTF challenges where users unlock nodes by solving challenges in each category. The tree is displayed as a visual grid grouped by category, with locked/unlocked states.

## Data Model
- `skill_nodes`: id, name, description, category, difficulty, icon, x_pos, y_pos, parent_id (self-referencing), required_solves
- `user_skill_progress`: user_id, node_id, unlocked, unlocked_at

## Server Actions (app/actions/skilltree.ts)
- `getSkillTree()`: returns all skill_nodes ordered by category, then difficulty.
- `getUserSkillProgress()`: returns current user's unlocked nodes.
- `checkAndUnlockNodes(userId)`: counts correct submissions per category, unlocks nodes where `required_solves <= count`. Auto-inserts into `user_skill_progress` for newly unlocked nodes.

## Pages & Components
- `app/(main)/ctf/skilltree/page.tsx`: Server component fetching skill tree + user progress, passes to SkillTreeClient.
- `app/(main)/ctf/skilltree/SkillTreeClient.tsx`: Client component with visual grid layout grouped by category (web, crypto, forensics, misc). Each category is a column/section. Nodes arranged by difficulty (easy → medium → hard). Locked nodes dimmed with opacity, unlocked nodes glow. Lines connect parent→child (CSS borders or SVG). Category headers with icons (🌐 web, 🔐 crypto, 🔍 forensics, 📌 misc).
- `components/ctf/SkillNode.tsx`: Client component displaying node icon, name, difficulty badge. Locked/unlocked visual states. Click to expand showing description and required solves. Small card layout.

## Integration
- Modify `app/actions/ctf.ts`: In `submitFlag()`, after a correct solve, call `checkAndUnlockNodes(userId)`.
- Modify `lib/utils/gamification.ts`: Add badge `{ id: 'skilltree_5', name: 'Skill Explorer', description: 'Unlock 5 skill tree nodes', icon: '🌳', category: 'ctf' }`. Update `checkBadges()` to count unlocked skill nodes.

## Visual Design
- Use existing CSS variables and Tailwind classes.
- Category columns with distinct colors (optional).
- Node cards with subtle shadow, border radius.
- Locked: opacity-50, grayscale maybe. Unlocked: border-green-500, glow effect.
- Simple connecting lines via CSS borders (vertical/horizontal) or SVG paths.

## Dependencies
- Existing server action patterns (createClient, logEvent, etc.).
- Supabase client for database queries.

## Success Criteria
- Skill tree page loads and displays nodes correctly.
- Users see unlocked nodes glow, locked nodes dimmed.
- After solving a CTF challenge, appropriate nodes unlock.
- Badge "Skill Explorer" awarded after unlocking 5 nodes.

## Out of Scope
- Animations, complex tree layouts, drag-and-drop.
- Admin interface for managing skill nodes (future work).
- Season integration (already exists).

## Commit
Will commit with message: "feat: add skill tree with auto-unlock on CTF solves"