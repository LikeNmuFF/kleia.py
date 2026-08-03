export interface LearnQuestion {
  id: number
  type: 'mcq' | 'fill'
  prompt: string
  code?: string
  options?: string[]
  answer: string
  answer_variants?: string[]
  explanation: string
}

export interface MaterialBlock {
  heading: string
  text?: string
  code?: string
  bullets?: string[]
}

export interface LearnLesson {
  id: string
  slug: string
  title: string
  sort_order: number
  xp_reward: number
  questions: LearnQuestion[]
  material?: MaterialBlock[]
}

export interface LearnTopic {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  sort_order: number
}

export const LEVELS = [
  { level: 1, name: 'Novice', xp: 0 },
  { level: 2, name: 'Apprentice', xp: 50 },
  { level: 3, name: 'Student', xp: 120 },
  { level: 4, name: 'Programmer', xp: 220 },
  { level: 5, name: 'Coder', xp: 350 },
  { level: 6, name: 'Developer', xp: 500 },
  { level: 7, name: 'Pythonista', xp: 700 },
  { level: 8, name: 'Expert', xp: 950 },
  { level: 9, name: 'Master', xp: 1250 },
  { level: 10, name: 'Legend', xp: 1600 },
]

export function getLevelInfo(totalXp: number) {
  let current = LEVELS[0]
  let next = LEVELS[1]

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].xp) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? null
    }
  }

  if (!next) {
    return {
      level: current.level,
      name: current.name,
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
    xpIntoLevel,
    xpForLevel,
    progress,
    nextLevel: next.name,
  }
}

export function normalizeFillAnswer(value: string): string {
  return value.trim().toLowerCase()
}

export function isFillAnswerCorrect(
  submitted: string,
  question: LearnQuestion
): boolean {
  const submittedNorm = normalizeFillAnswer(submitted)

  const candidates = [
    question.answer,
    ...(question.answer_variants ?? []),
  ].map(normalizeFillAnswer)

  // Strip surrounding quotes for string answers
  const unquoted = submittedNorm.replace(/^["']|["']$/g, '')
  const quotedVariants = candidates.map((c) => c.replace(/^["']|["']$/g, ''))

  return (
    candidates.includes(submittedNorm) ||
    quotedVariants.includes(unquoted) ||
    quotedVariants.includes(submittedNorm)
  )
}
