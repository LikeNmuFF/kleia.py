export interface Level {
  level: number
  name: string
  xp: number
  icon: string
}

export const XP_LEVELS: Level[] = [
  { level: 1, name: 'Novice', xp: 0, icon: '🌱' },
  { level: 2, name: 'Apprentice', xp: 50, icon: '📚' },
  { level: 3, name: 'Student', xp: 120, icon: '🎓' },
  { level: 4, name: 'Programmer', xp: 220, icon: '💻' },
  { level: 5, name: 'Coder', xp: 350, icon: '⌨️' },
  { level: 6, name: 'Developer', xp: 500, icon: '🛠️' },
  { level: 7, name: 'Pythonista', xp: 700, icon: '🐍' },
  { level: 8, name: 'Expert', xp: 950, icon: '⚡' },
  { level: 9, name: 'Master', xp: 1250, icon: '🏆' },
  { level: 10, name: 'Legend', xp: 1600, icon: '👑' },
]

export function getLevelInfo(totalXp: number) {
  let current = XP_LEVELS[0]
  let next = XP_LEVELS[1]

  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (totalXp >= XP_LEVELS[i].xp) {
      current = XP_LEVELS[i]
      next = XP_LEVELS[i + 1] ?? null
    }
  }

  if (!next) {
    return {
      level: current.level,
      name: current.name,
      icon: current.icon,
      xpIntoLevel: 0,
      xpForLevel: 0,
      progress: 1,
      nextLevel: null,
    }
  }

  const xpIntoLevel = totalXp - current.xp
  const xpForLevel = next.xp - current.xp
  const progress = Math.min(1, xpIntoLevel / xpForLevel)

  return {
    level: current.level,
    name: current.name,
    icon: current.icon,
    xpIntoLevel,
    xpForLevel,
    progress,
    nextLevel: next.name,
  }
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'ctf' | 'learn' | 'social' | 'level'
}

export const BADGES: BadgeDef[] = [
  { id: 'first_login', name: 'First Steps', description: 'Log in for the first time', icon: '👋', category: 'streak' },
  { id: 'streak_7', name: 'On Fire', description: '7-day streak', icon: '🔥', category: 'streak' },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day streak', icon: '💪', category: 'streak' },
  { id: 'streak_100', name: 'Legendary', description: '100-day streak', icon: '⚡', category: 'streak' },
  { id: 'ctf_1', name: 'Bug Hunter', description: 'Solve 1 CTF challenge', icon: '🐛', category: 'ctf' },
  { id: 'ctf_10', name: 'CTF Pro', description: 'Solve 10 CTF challenges', icon: '🏆', category: 'ctf' },
  { id: 'ctf_25', name: 'CTF Legend', description: 'Solve 25 CTF challenges', icon: '👑', category: 'ctf' },
  { id: 'skilltree_5', name: 'Skill Explorer', description: 'Unlock 5 skill tree nodes', icon: '🌳', category: 'ctf' },
  { id: 'hints_5', name: 'Help Seeker', description: 'Unlock 5 hints', icon: '💡', category: 'ctf' },
  { id: 'learn_1', name: 'Curious Mind', description: 'Complete 1 Learn lesson', icon: '🧠', category: 'learn' },
  { id: 'learn_10', name: 'Knowledge Seeker', description: 'Complete 10 lessons', icon: '📖', category: 'learn' },
  { id: 'post_1', name: 'Ice Breaker', description: 'Create your first post', icon: '💬', category: 'social' },
  { id: 'post_10', name: 'Contributor', description: 'Create 10 posts', icon: '✍️', category: 'social' },
  { id: 'review_1', name: 'Critic', description: 'Submit a challenge review', icon: '📝', category: 'ctf' },
  { id: 'writeup_1', name: 'Author', description: 'Submit a writeup', icon: '✍️', category: 'ctf' },
  { id: 'writeup_5', name: 'Prolific Writer', description: 'Submit 5 writeups', icon: '📚', category: 'ctf' },
  { id: 'level_5', name: 'Halfway There', description: 'Reach level 5', icon: '🎯', category: 'level' },
  { id: 'level_10', name: 'Maxed Out', description: 'Reach level 10', icon: '💎', category: 'level' },
]

export function getBadgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id)
}

export interface MissionDef {
  type: string
  description: string
  xpReward: number
}

const MISSION_POOL: MissionDef[] = [
  { type: 'login', description: 'Log in today', xpReward: 10 },
  { type: 'post', description: 'Write a post', xpReward: 15 },
  { type: 'ctf_solve', description: 'Solve a CTF challenge', xpReward: 20 },
  { type: 'learn', description: 'Complete a lesson', xpReward: 15 },
  { type: 'message', description: 'Send a message', xpReward: 10 },
]

function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
}

export function getDailyMissionsForDate(dateStr: string): MissionDef[] {
  const rng = seededRandom(dateStr)
  const shuffled = [...MISSION_POOL].sort(() => rng() - 0.5)
  return shuffled.slice(0, 3)
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function calculateLoginXp(streak: number): number {
  return Math.min(50, 10 + streak * 5)
}
