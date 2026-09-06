// lib/gamification/xp.ts
const XP_PER_LEVEL = 1000;
const STREAK_BONUS_PER_DAY = 10;
const STREAK_BONUS_CAP = 100;

const SOLVE_XP: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
  insane: 500,
};

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function calculateXpForSolve(difficulty: string): number {
  return SOLVE_XP[difficulty] ?? 50;
}

export function calculateStreakBonus(streakDays: number): number {
  return Math.min(streakDays * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP);
}
