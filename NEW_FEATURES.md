# New Features Added to Kleia (August 2026)

## 1. Daily Cipher Challenge

**URL:** `/cipher`

A new cipher puzzle is generated every day using a seeded PRNG (same cipher for all users on the same day).

**How it works:**
- One of 6 cipher types is randomly selected per day: Caesar, Atbash, Base64, Hex, Reverse, Vigenère
- The plaintext is always `KLEIA{daily_cipher_YYYY-MM-DD}`
- A timer counts up while you solve
- Submit the decrypted flag to earn **25 XP**
- Each user can only solve once per day
- Ciphertext is displayed in a code block; cipher type is shown as a hint

**Tables:** `daily_ciphers`, `daily_cipher_solves`

---

## 2. Challenge Reviews & Ratings

**URL:** `/ctf/[id]` (below challenge description, only if solved)

Users can rate challenges after solving them.

**How it works:**
- Rate **difficulty** (1-5 stars) and **quality** (1-5 stars)
- Optional text review
- One review per user per challenge
- Average ratings are displayed on the challenge page
- Earning **5 XP** for submitting a review
- Badge: `review_1` — "Critic"

**Tables:** `challenge_reviews`

---

## 3. XP-Based Hints

**URL:** `/ctf/[id]` (hint section)

Hints now cost XP to unlock, creating a strategy layer.

**How it works:**
- Each challenge can have a `hint_xp_cost` (set by admin, default 0 = free)
- Click "Unlock Hint" to spend XP and reveal the hint
- Once unlocked, the hint is permanently available (tracked in `user_hint_unlocks`)
- Cannot unlock if you don't have enough XP
- Badge: `hints_5` — "Help Seeker" (unlock 5 hints)

**Tables:** `user_hint_unlocks` (added to migration 029)

---

## 4. Writeup System

**URL:** `/ctf/[id]/writeups`

Users can write and share writeups for challenges they've solved.

**How it works:**
- Only users who solved the challenge can write a writeup
- One writeup per user per challenge
- Title + content (markdown-friendly)
- Other users can **upvote/downvote** writeups
- Writeups show author, date, and vote score
- Earning **20 XP** for submitting a writeup
- Badges: `writeup_1` — "Author", `writeup_5` — "Prolific Writer"

**Tables:** `writeups`, `writeup_votes`

---

## 5. Achievement Leaderboard

**URL:** `/leaderboard/achievements`

A separate leaderboard that ranks users by overall platform engagement, not just CTF points.

**How it works:**
- `achievement_score = total_xp + (badge_count × 50)`
- Shows: rank, username, XP, badge count, CTF solved, writeups, reviews
- Accessible via "Achievements" tab on the `/leaderboard` page
- Complements the CTF leaderboard (which is purely points-based)

**VIEW:** `achievement_leaderboard`

---

## 6. Monthly CTF Seasons

**URL:** `/ctf/seasons`, `/ctf/seasons/[slug]`

Themed monthly competitions with separate leaderboards.

**How it works:**
- Admin creates a season with name, theme, date range
- Challenges are linked to seasons with optional **bonus points**
- Users join a season to participate
- Season leaderboard tracks per-season points and solves
- Past seasons are viewable
- Badge: `season_1` — "Contender" (join a season), `season_win` — "Champion" (finish top 3)

**Tables:** `ctf_seasons`, `ctf_season_challenges`, `ctf_season_participants`

---

## 7. Skill Tree

**URL:** `/ctf/skilltree`

A visual progression system that unlocks as you solve challenges.

**How it works:**
- Nodes are organized by category (Web, Crypto, Forensics, Misc) and difficulty (Easy → Medium → Hard)
- Each node has a `required_solves` threshold (e.g., solve 5 web challenges to unlock the next web node)
- Nodes auto-unlock when you solve CTF challenges (checked after every correct submission)
- Unlocked nodes glow, locked nodes are dimmed
- Visual tree layout with parent→child connections
- Badge: `skilltree_5` — "Skill Explorer" (unlock 5 nodes)

**Tables:** `skill_nodes`, `user_skill_progress`

---

## 8. Regex Golf

**URL:** `/regex-golf`

A competitive regex puzzle game — match strings with the shortest regex possible.

**How it works:**
- Each puzzle has a list of strings to **match** (green) and strings to **reject** (red)
- Write a regex pattern that matches all required strings and rejects all forbidden ones
- **Live validation** shows which strings your regex matches/rejects in real-time
- Shorter regex = better (compete for shortest solution)
- Timer tracks how fast you solve
- 3 difficulty levels: easy, medium, hard
- **20 XP** per solve
- Badges: `regex_3` — "Regex Wizard", `regex_10` — "Regex Master"

**Tables:** `regex_golf_puzzles`, `regex_golf_solves`

---

## 9. Team System

**URL:** `/teams`, `/teams/[id]`, `/teams/leaderboard`

Create teams and compete together.

**How it works:**
- Create a team with a name and description (max 5 members)
- Only one team per user
- Team leaders can invite other users
- Team stats (total XP, total solves) are aggregated from all members
- Team leaderboard ranks teams by total XP
- Join/Leave teams (leaders must transfer ownership or be the last member to leave)
- Badges: `team_create` — "Team Builder", `team_5` — "Squad Leader"

**Tables:** `teams`, `team_members`, `team_invites`

---

## Navigation Updates

New links added to the main nav bar:
- **Cipher** — between Learn and CTF
- **Regex Golf** — in the CTF section
- **Teams** — in the main nav

---

## New Badges (13 total)

| Badge ID | Name | Description | Category |
|----------|------|-------------|----------|
| `daily_cipher` | Codebreaker | Solve 5 daily ciphers | ctf |
| `review_1` | Critic | Submit a challenge review | ctf |
| `review_10` | Quality Assurance | Submit 10 reviews | ctf |
| `writeup_1` | Author | Submit a writeup | ctf |
| `writeup_5` | Prolific Writer | Submit 5 writeups | ctf |
| `hints_5` | Help Seeker | Unlock 5 hints | ctf |
| `regex_3` | Regex Wizard | Solve 3 regex golf puzzles | ctf |
| `regex_10` | Regex Master | Solve 10 regex golf puzzles | ctf |
| `team_create` | Team Builder | Create a team | social |
| `team_5` | Squad Leader | Team solves 5 challenges | social |
| `season_1` | Contender | Join a season | ctf |
| `season_win` | Champion | Finish top 3 in a season | ctf |
| `skilltree_5` | Skill Explorer | Unlock 5 skill tree nodes | ctf |

---

## Database Migrations (029–033)

| Migration | Purpose |
|-----------|---------|
| `029` | Daily cipher, challenge reviews, hint XP cost, user hint unlocks |
| `030` | Writeups and writeup votes |
| `031` | Achievement leaderboard VIEW |
| `032` | Seasons and skill tree tables |
| `033` | Regex golf and team system tables |

**Total migrations:** 33 (000–033)

---

## Files Created

```
app/(main)/cipher/page.tsx              — Cipher page (server)
app/(main)/cipher/CipherClient.tsx       — Cipher UI with timer
app/(main)/ctf/stats/page.tsx           — CTF stats page (server)
app/(main)/ctf/stats/CTFStatsClient.tsx  — Stats UI with grid
app/(main)/ctf/seasons/page.tsx         — Seasons list (server)
app/(main)/ctf/seasons/SeasonsClient.tsx — Seasons UI
app/(main)/ctf/seasons/[slug]/page.tsx  — Season detail (server)
app/(main)/ctf/seasons/[slug]/SeasonDetailClient.tsx — Season detail UI
app/(main)/ctf/skilltree/page.tsx       — Skill tree (server)
app/(main)/ctf/skilltree/SkillTreeClient.tsx — Skill tree UI
app/(main)/ctf/[id]/writeups/page.tsx   — Writeups page (server)
app/(main)/ctf/[id]/writeups/WriteupsClient.tsx — Writeups UI
app/(main)/regex-golf/page.tsx          — Regex golf (server)
app/(main)/regex-golf/RegexGolfClient.tsx — Regex golf UI
app/(main)/teams/page.tsx               — Teams list (server)
app/(main)/teams/TeamsClient.tsx         — Teams UI
app/(main)/teams/[id]/page.tsx          — Team detail (server)
app/(main)/teams/[id]/TeamDetailClient.tsx — Team detail UI
app/(main)/teams/leaderboard/page.tsx   — Team leaderboard
app/(main)/leaderboard/achievements/page.tsx — Achievement leaderboard
app/(main)/leaderboard/achievements/AchievementsClient.tsx — Achievement UI
app/actions/cipher.ts                   — Cipher server actions
app/actions/reviews.ts                  — Review server actions
app/actions/hints.ts                    — Hint unlock server actions
app/actions/writeups.ts                 — Writeup server actions
app/actions/seasons.ts                  — Season server actions
app/actions/skilltree.ts                — Skill tree server actions
app/actions/regex-golf.ts               — Regex golf server actions
app/actions/teams.ts                    — Team server actions
components/ctf/ChallengeGrid.tsx         — Challenge grid (stats)
components/ctf/CategoryProgress.tsx      — Category progress bars
components/ctf/DifficultyBreakdown.tsx   — Difficulty breakdown
components/ctf/ChallengeReviewForm.tsx   — Review form
components/ctf/ChallengeReviews.tsx      — Reviews display
components/ctf/WriteupForm.tsx           — Writeup form
components/ctf/WriteupList.tsx           — Writeup list with voting
components/ctf/SkillNode.tsx             — Skill tree node
components/ctf/RegexGolfPuzzle.tsx       — Regex puzzle card
components/teams/TeamCard.tsx            — Team card
components/teams/CreateTeamModal.tsx     — Create team modal
components/teams/TeamInviteModal.tsx     — Invite modal
lib/utils/cipher.ts                     — Cipher generator
lib/utils/regex-golf.ts                 — Regex validation
```

---

## Tech Stack (unchanged)

- **Frontend:** Next.js (App Router), Tailwind CSS, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Storage:** Cloudinary (file uploads)
- **Hosting:** Vercel (free tier)
