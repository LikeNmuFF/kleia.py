'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import ChallengeGrid from '@/components/ctf/ChallengeGrid'
import CategoryProgress from '@/components/ctf/CategoryProgress'
import DifficultyBreakdown from '@/components/ctf/DifficultyBreakdown'

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
}

interface Submission {
  challenge_id: string
  created_at: string
}

const CATEGORIES = [
  { key: 'web', icon: '🌐', label: 'Web' },
  { key: 'crypto', icon: '🔐', label: 'Crypto' },
  { key: 'forensics', icon: '🔍', label: 'Forensics' },
  { key: 'misc', icon: '📌', label: 'Misc' },
] as const

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function CTFStatsClient({
  challenges,
  submissions,
  rank,
  totalPlayers,
  userPoints,
  userSolved,
}: {
  challenges: Challenge[]
  submissions: Submission[]
  rank: number | null
  totalPlayers: number
  userPoints: number
  userSolved: number
}) {
  const solvedIds = useMemo(() => new Set(submissions.map(s => s.challenge_id)), [submissions])

  const totalPoints = useMemo(() => challenges.reduce((sum, c) => sum + c.points, 0), [challenges])
  const totalChallenges = challenges.length

  const categoryStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catChallenges = challenges.filter(c => c.category === cat.key)
      const solved = catChallenges.filter(c => solvedIds.has(c.id))
      return {
        ...cat,
        total: catChallenges.length,
        solved: solved.length,
        points: solved.reduce((sum, c) => sum + c.points, 0),
        totalPoints: catChallenges.reduce((sum, c) => sum + c.points, 0),
      }
    })
  }, [challenges, solvedIds])

  const difficultyStats = useMemo(() => {
    return DIFFICULTIES.map(diff => {
      const diffChallenges = challenges.filter(c => c.difficulty === diff)
      const solved = diffChallenges.filter(c => solvedIds.has(c.id))
      return {
        difficulty: diff,
        total: diffChallenges.length,
        solved: solved.length,
        points: solved.reduce((sum, c) => sum + c.points, 0),
        totalPoints: diffChallenges.reduce((sum, c) => sum + c.points, 0),
      }
    })
  }, [challenges, solvedIds])

  const recentSolves = useMemo(() => {
    return submissions.slice(0, 10).map(sub => {
      const challenge = challenges.find(c => c.id === sub.challenge_id)
      return { ...sub, challenge }
    }).filter(s => s.challenge)
  }, [submissions, challenges])

  const progressPct = totalPoints > 0 ? Math.round((userPoints / totalPoints) * 1000) / 10 : 0

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back link */}
      <Link
        href="/ctf"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Challenges
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          My CTF Stats
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your challenge progress and solve history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Rank</div>
          <div className="text-2xl font-bold" style={{ color: rank ? 'var(--accent)' : 'var(--text-muted)' }}>
            {rank ? `#${rank}` : '—'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>of {totalPlayers}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Points</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{userPoints}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>of {totalPoints}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Solved</div>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{userSolved}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>of {totalChallenges}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Completion</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{progressPct}%</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>overall</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-4 mb-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Overall Progress
          </span>
          <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            {userPoints} / {totalPoints} pts
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, var(--accent), #06b6d4)',
            }}
          />
        </div>
      </div>

      {/* Challenge Grid */}
      <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Challenge Grid
        </h2>
        <ChallengeGrid challenges={challenges} solvedIds={solvedIds} />
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
            Solved
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--input-bg)' }} />
            Unsolved
          </div>
          <div className="flex items-center gap-2 ml-2">
            {CATEGORIES.map(cat => (
              <span key={cat.key} className="flex items-center gap-1">
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category + Difficulty side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            By Category
          </h2>
          <CategoryProgress stats={categoryStats} />
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            By Difficulty
          </h2>
          <DifficultyBreakdown stats={difficultyStats} />
        </div>
      </div>

      {/* Recent Solves */}
      {recentSolves.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Solves
          </h2>
          <div className="space-y-3">
            {recentSolves.map((solve) => {
              const cat = CATEGORIES.find(c => c.key === solve.challenge!.category)
              const diffColors: Record<string, string> = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444' }
              return (
                <Link
                  key={solve.challenge_id}
                  href={`/ctf/${solve.challenge_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--input-bg)' }}
                >
                  <span className="text-lg shrink-0">{cat?.icon || '🏴'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {solve.challenge!.title}
                    </div>
                    <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ color: diffColors[solve.challenge!.difficulty], backgroundColor: `${diffColors[solve.challenge!.difficulty]}15` }}
                      >
                        {solve.challenge!.difficulty}
                      </span>
                      <span>{solve.challenge!.points} pts</span>
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(solve.created_at)}
                  </span>
                  <span className="text-sm shrink-0" style={{ color: '#22c55e' }}>✓</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
