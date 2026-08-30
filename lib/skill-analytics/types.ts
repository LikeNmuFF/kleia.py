export type SkillKey = 'learn' | 'ctf' | 'regexGolf' | 'dailyCipher'

export interface SkillBreakdownItem {
  key: SkillKey
  label: string
  score: number
}

export interface LearnTopicBreakdown {
  slug: string
  title: string
  completed: number
  xp: number
}

export interface SkillCategoryBreakdown {
  learn: {
    completed: number
    xp: number
    topics: LearnTopicBreakdown[]
  }
  ctf: {
    solved: number
    points: number
    categories: Record<string, number>
    difficulties: Record<string, number>
  }
  regexGolf: {
    solved: number
    avgLength: number | null
    bestLength: number | null
    avgTimeSeconds: number | null
    difficulties: Record<string, number>
  }
  dailyCipher: {
    solved: number
    avgTimeSeconds: number | null
    currentStreak: number
    longestStreak: number
    difficulties: Record<string, number>
  }
}

export interface SkillSnapshot {
  user_id: string
  username: string | null
  avatar_url: string | null
  total_xp: number
  learn_completed_count: number
  learn_xp: number
  ctf_solved_count: number
  ctf_points: number
  regex_solved_count: number
  avg_regex_length: number | null
  best_regex_length: number | null
  regex_avg_time_seconds: number | null
  cipher_solved_count: number
  cipher_avg_time_seconds: number | null
  current_streak: number
  longest_streak: number
  last_activity_at: string | null
  category_breakdown: SkillCategoryBreakdown
  strengths: SkillBreakdownItem[]
  weaknesses: SkillBreakdownItem[]
}
