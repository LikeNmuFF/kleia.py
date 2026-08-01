'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  { key: 'all', icon: '🏴', label: 'All' },
  { key: 'web', icon: '🌐', label: 'Web' },
  { key: 'crypto', icon: '🔐', label: 'Crypto' },
  { key: 'forensics', icon: '🔍', label: 'Forensics' },
  { key: 'misc', icon: '📌', label: 'Misc' },
] as const

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Easy' },
  medium: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', label: 'Medium' },
  hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Hard' },
}

const SOLVED_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'solved', label: 'Solved' },
  { key: 'unsolved', label: 'Unsolved' },
] as const

type SolvedFilter = (typeof SOLVED_FILTERS)[number]['key']

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
  hint: string | null
  author: string | null
  created_at: string
}

export default function CTFClient({
  challenges,
  solvedIds,
  solvesById,
}: {
  challenges: Challenge[]
  solvedIds: string[]
  solvesById: Record<string, number>
}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSolvedFilter, setActiveSolvedFilter] = useState<SolvedFilter>('all')

  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds])

  const byCategory = useMemo(() => {
    if (activeCategory === 'all') return challenges
    return challenges.filter(c => c.category === activeCategory)
  }, [challenges, activeCategory])

  const filtered = useMemo(() => {
    if (activeSolvedFilter === 'all') return byCategory
    if (activeSolvedFilter === 'solved') return byCategory.filter(c => solvedSet.has(c.id))
    return byCategory.filter(c => !solvedSet.has(c.id))
  }, [byCategory, activeSolvedFilter, solvedSet])

  const stats = useMemo(() => {
    const total = challenges.length
    const totalPts = challenges.reduce((sum, c) => sum + c.points, 0)
    const solvedCount = challenges.filter(c => solvedSet.has(c.id)).length
    const totalSolves = challenges.reduce((sum, c) => sum + (solvesById[c.id] ?? 0), 0)
    return { total, totalPts, solvedCount, totalSolves }
  }, [challenges, solvedSet, solvesById])

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Capture The Flag
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Solve challenges, capture flags, climb the leaderboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ctf/leaderboard"
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
          >
            Leaderboard
          </Link>
          <Link
            href="/ctf/submit"
            className="px-4 py-2 rounded-lg font-medium text-sm border transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            + Submit Challenge
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center gap-6 px-4 py-3 rounded-xl mb-6 text-sm"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Challenges </span>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
            {stats.total}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Total Points </span>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
            {stats.totalPts}
          </span>
        </div>
        {solvedIds.length > 0 && (
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Solved </span>
            <span style={{ color: '#22c55e' }} className="font-semibold">
              {stats.solvedCount}
              <span style={{ color: 'var(--text-muted)' }}>/{stats.total}</span>
            </span>
          </div>
        )}
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Total Solves </span>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
            {stats.totalSolves}
          </span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key
          const count = cat.key === 'all'
            ? challenges.length
            : challenges.filter(c => c.category === cat.key).length
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? 'var(--accent)' : 'var(--card-bg)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Solved filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm mr-1" style={{ color: 'var(--text-muted)' }}>Status</span>
        {SOLVED_FILTERS.map(f => {
          const isActive = activeSolvedFilter === f.key
          const count = f.key === 'all'
            ? byCategory.length
            : f.key === 'solved'
              ? byCategory.filter(c => solvedSet.has(c.id)).length
              : byCategory.filter(c => !solvedSet.has(c.id)).length
          return (
            <button
              key={f.key}
              onClick={() => setActiveSolvedFilter(f.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? 'var(--accent)' : 'var(--card-bg)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {f.key === 'solved' && !isActive && <span style={{ color: '#22c55e' }}>✓</span>}
              <span>{f.label}</span>
              <span
                className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tile grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            {activeSolvedFilter === 'solved' ? '✓' : activeSolvedFilter === 'unsolved' ? '🏆' : '🏴'}
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {activeSolvedFilter === 'solved'
              ? 'No solved challenges'
              : activeSolvedFilter === 'unsolved'
                ? 'All challenges solved!'
                : activeCategory === 'all'
                  ? 'No challenges yet'
                  : 'No challenges in this category'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {activeSolvedFilter === 'solved'
              ? 'Challenges you solve will show up here.'
              : activeSolvedFilter === 'unsolved'
                ? 'Great work — check back for new challenges.'
                : activeCategory === 'all'
                  ? 'Challenges will appear here once they are created.'
                  : 'Check back later or browse other categories.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(challenge => {
            const diff = DIFFICULTY_STYLES[challenge.difficulty]
            const cat = CATEGORIES.find(c => c.key === challenge.category)
            const isSolved = solvedSet.has(challenge.id)
            const solves = solvesById[challenge.id] ?? 0

            return (
              <Link
                key={challenge.id}
                href={`/ctf/${challenge.id}`}
                className="group block rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: isSolved ? 'rgba(34,197,94,0.04)' : 'var(--card-bg)',
                  border: isSolved
                    ? '1px solid rgba(34,197,94,0.45)'
                    : '1px solid var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                {/* Top bar: category icon + difficulty + points */}
                <div className="flex items-center justify-between p-4 pb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat?.icon || '🏴'}</span>
                    <span
                      className="px-2 py-0.5 text-[11px] font-semibold rounded"
                      style={{ color: diff.color, backgroundColor: diff.bg }}
                    >
                      {diff.label}
                    </span>
                    {isSolved && (
                      <span
                        className="px-2 py-0.5 text-[11px] font-semibold rounded flex items-center gap-1"
                        style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.14)' }}
                      >
                        ✓ Solved
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {challenge.points}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Pts
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="px-4 py-3">
                  <h3
                    className="font-semibold text-base leading-snug group-hover:opacity-80 transition-opacity break-words"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {challenge.title}
                  </h3>
                </div>

                {/* Bottom bar: hint + author + solves */}
                <div
                  className="flex items-center gap-3 px-4 py-2.5 text-xs border-t"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  <span className="flex items-center gap-1">
                    <span>⛳</span>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {solves}
                    </span>
                    {solves === 1 ? 'solve' : 'solves'}
                  </span>
                  {challenge.hint && (
                    <span className="flex items-center gap-1">
                      <span>💡</span>
                      Hint
                    </span>
                  )}
                  {challenge.author && (
                    <span className="flex items-center gap-1 truncate ml-auto">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{challenge.author}</span>
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
