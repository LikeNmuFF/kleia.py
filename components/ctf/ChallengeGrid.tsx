'use client'

import Link from 'next/link'

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
}

const CATEGORY_COLORS: Record<string, string> = {
  web: '#3b82f6',
  crypto: '#a855f7',
  forensics: '#f97316',
  misc: '#22c55e',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

export default function ChallengeGrid({
  challenges,
  solvedIds,
}: {
  challenges: Challenge[]
  solvedIds: Set<string>
}) {
  const grouped = Object.entries(
    challenges.reduce<Record<string, Challenge[]>>((acc, c) => {
      if (!acc[c.category]) acc[c.category] = []
      acc[c.category].push(c)
      return acc
    }, {})
  )

  return (
    <div className="space-y-4">
      {grouped.map(([category, catChallenges]) => (
        <div key={category}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: CATEGORY_COLORS[category] || 'var(--text-muted)' }}>
            {category}
          </div>
          <div className="flex flex-wrap gap-2">
            {catChallenges.map((challenge) => {
              const solved = solvedIds.has(challenge.id)
              const borderColor = solved ? '#22c55e' : CATEGORY_COLORS[category] || 'var(--border-color)'
              return (
                <Link
                  key={challenge.id}
                  href={`/ctf/${challenge.id}`}
                  className="group relative flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all hover:scale-110"
                  style={{
                    backgroundColor: solved ? `${borderColor}15` : 'var(--input-bg)',
                    border: `2px solid ${borderColor}`,
                  }}
                  title={`${challenge.title} (${challenge.points} pts)`}
                >
                  <span className="text-[10px] sm:text-xs font-bold" style={{ color: solved ? '#22c55e' : 'var(--text-muted)' }}>
                    {solved ? '✓' : challenge.points}
                  </span>
                  <span
                    className="text-[8px] sm:text-[9px] mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {DIFFICULTY_COLORS[challenge.difficulty] ? '' : ''}
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-0.5"
                      style={{ backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] || 'var(--text-muted)' }}
                    />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
