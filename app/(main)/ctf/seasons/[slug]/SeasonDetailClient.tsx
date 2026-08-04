'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { joinSeason } from '@/app/actions/seasons'

interface Season {
  id: string
  name: string
  slug: string
  description: string | null
  theme: string | null
  start_date: string
  end_date: string
  is_active: boolean
}

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
  bonus_points: number
  solved: boolean
}

interface LeaderboardEntry {
  user_id: string
  total_points: number
  challenges_solved: number
  joined_at: string
  username: string
  avatar_url: string | null
}

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Easy' },
  medium: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', label: 'Medium' },
  hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Hard' },
}

const CATEGORIES: Record<string, string> = {
  web: '🌐',
  crypto: '🔐',
  forensics: '🔍',
  misc: '📌',
}

export default function SeasonDetailClient({
  season,
  challenges,
  leaderboard,
  isParticipant,
  userId,
}: {
  season: Season
  challenges: Challenge[]
  leaderboard: LeaderboardEntry[]
  isParticipant: boolean
  userId?: string
}) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isSeasonActive = () => {
    const today = new Date().toISOString().split('T')[0]
    return season.is_active && season.start_date <= today && season.end_date >= today
  }

  const handleJoin = async () => {
    if (!userId) {
      router.push('/login')
      return
    }

    setJoining(true)
    setJoinError(null)

    const result = await joinSeason(season.id)

    if (result.error) {
      setJoinError(result.error)
      setJoining(false)
    } else {
      router.refresh()
    }
  }

  const totalPoints = challenges.reduce((sum, c) => sum + c.points + c.bonus_points, 0)
  const solvedPoints = challenges.filter(c => c.solved).reduce((sum, c) => sum + c.points + c.bonus_points, 0)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/ctf/seasons"
          className="text-sm mb-4 inline-block hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Back to Seasons
        </Link>

        <div
          className="rounded-xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              {season.theme && (
                <span className="text-sm font-medium px-2 py-1 rounded-full mb-2 inline-block"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--text-primary)' }}>
                  {season.theme}
                </span>
              )}
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {season.name}
              </h1>
            </div>
            {isSeasonActive() && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                Active
              </span>
            )}
          </div>

          {season.description && (
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              {season.description}
            </p>
          )}

          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>📅 {formatDate(season.start_date)} — {formatDate(season.end_date)}</span>
            <span>🎯 {challenges.length} challenges</span>
            <span>🏆 {totalPoints} total points</span>
          </div>
        </div>
      </div>

      {/* Join Section */}
      {!isParticipant && isSeasonActive() && userId && (
        <div
          className="mb-8 rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <div>
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Join this season
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Compete in challenges and climb the leaderboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            {joinError && (
              <span className="text-sm" style={{ color: '#ef4444' }}>{joinError}</span>
            )}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {joining ? 'Joining...' : 'Join Season'}
            </button>
          </div>
        </div>
      )}

      {isParticipant && (
        <div
          className="mb-8 rounded-xl p-4"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              You&apos;re participating in this season
            </span>
          </div>
        </div>
      )}

      {/* Progress */}
      {isParticipant && (
        <div
          className="mb-8 rounded-xl p-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Your Progress
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {solvedPoints} / {totalPoints} points
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${totalPoints > 0 ? (solvedPoints / totalPoints) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
              }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Challenges */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Challenges
          </h2>

          {challenges.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No Challenges Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Challenges will be added to this season soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {challenges.map((challenge) => {
                const diff = DIFFICULTY_STYLES[challenge.difficulty]
                const cat = CATEGORIES[challenge.category] || '📌'

                return (
                  <Link
                    key={challenge.id}
                    href={`/ctf/${challenge.id}`}
                    className="block rounded-xl p-4 transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: challenge.solved ? 'rgba(34,197,94,0.04)' : 'var(--card-bg)',
                      border: challenge.solved
                        ? '1px solid rgba(34,197,94,0.45)'
                        : '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {challenge.title}
                            </h3>
                            {challenge.solved && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                ✓ Solved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded"
                              style={{ color: diff.color, backgroundColor: diff.bg }}
                            >
                              {diff.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {challenge.points}
                          {challenge.bonus_points > 0 && (
                            <span className="text-xs ml-1" style={{ color: '#22c55e' }}>
                              +{challenge.bonus_points}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Pts
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Leaderboard
          </h2>

          {leaderboard.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                No Participants
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Be the first to join!
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              {leaderboard.slice(0, 10).map((entry, i) => {
                const isMe = userId === entry.user_id
                return (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-3 px-4 py-3 border-t"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: isMe ? 'rgba(139, 92, 246, 0.08)' : undefined,
                    }}
                  >
                    <div className="w-6 text-center">
                      {i === 0 ? (
                        <span>🥇</span>
                      ) : i === 1 ? (
                        <span>🥈</span>
                      ) : i === 2 ? (
                        <span>🥉</span>
                      ) : (
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block" style={{ color: 'var(--text-primary)' }}>
                        {entry.username || 'Unknown'}
                        {isMe && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                            you
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {entry.total_points}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
