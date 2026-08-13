'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Trophy, Target, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitFlag, getChallenge } from '@/app/actions/ctf'
import Countdown from '@/components/competition/Countdown'

interface Season {
  id: string
  name: string
  slug: string
  theme: string | null
  start_date: string
  end_date: string
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

export default function CompetitionClient({
  season,
  effectiveStatus,
  challenges,
  initialTotalPoints,
  initialChallengesSolved,
  userId,
  codename,
}: {
  season: Season
  effectiveStatus: 'upcoming' | 'live' | 'paused' | 'ended'
  challenges: Challenge[]
  initialTotalPoints: number
  initialChallengesSolved: number
  userId: string
  codename: string | null
}) {
  const [totalPoints, setTotalPoints] = useState(initialTotalPoints)
  const [challengesSolved, setChallengesSolved] = useState(initialChallengesSolved)
  const [solveList, setSolveList] = useState<Challenge[]>(challenges)
  const [openChallenge, setOpenChallenge] = useState<Challenge | null>(null)
  const [detail, setDetail] = useState<{ description: string; hint: string | null } | null>(null)
  const [flag, setFlag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (effectiveStatus !== 'live') return
    const supabase = createClient()
    const channel = supabase
      .channel(`participant:${season.id}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ctf_season_participants',
          filter: `season_id=eq.${season.id}and user_id=eq.${userId}`,
        },
        (payload: { new: { total_points?: number; challenges_solved?: number } }) => {
          const row = payload.new as { total_points?: number; challenges_solved?: number }
          setTotalPoints(row.total_points ?? 0)
          setChallengesSolved(row.challenges_solved ?? 0)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [season.id, userId, effectiveStatus])

  const openSolve = async (challenge: Challenge) => {
    setOpenChallenge(challenge)
    setFlag('')
    setResult(null)
    setDetail(null)
    const ch = await getChallenge(challenge.id)
    if (ch) setDetail({ description: ch.description, hint: ch.hint ?? null })
  }

  const handleSubmit = async () => {
    if (!openChallenge) return
    setSubmitting(true)
    setResult(null)
    const res = await submitFlag(openChallenge.id, flag)
    setSubmitting(false)
    if (res.error) {
      setResult({ ok: false, text: res.error })
    } else if (res.isCorrect) {
      setResult({ ok: true, text: res.message })
      setSolveList(prev => prev.map(c => (c.id === openChallenge.id ? { ...c, solved: true } : c)))
      setTotalPoints(prev => prev + openChallenge.points + openChallenge.bonus_points)
      setChallengesSolved(prev => prev + 1)
      setFlag('')
    } else {
      setResult({ ok: false, text: res.message ?? '' })
    }
  }

  if (effectiveStatus === 'upcoming') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#c4b5fd' }}>
            {season.theme || 'Competition'}
          </p>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{season.name}</h1>
          {codename && (
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Competing as <span className="font-mono font-semibold" style={{ color: '#8b5cf6' }}>{codename}</span>
            </p>
          )}
          <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>Competition starts in</p>
          <Countdown target={season.start_date} />
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/learn" className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Learn
            </Link>
            <Link href="/members" className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Members
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (effectiveStatus === 'paused') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Competition paused</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            The competition is temporarily paused. You can browse Learn and Members until it resumes.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/learn" className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Learn
            </Link>
            <Link href="/members" className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Members
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Persistent header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 88%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy className="w-5 h-5 shrink-0" style={{ color: '#eab308' }} />
            <div className="min-w-0">
              <h1 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{season.name}</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: '#22c55e' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{totalPoints}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Points</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{challengesSolved}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Solved</div>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Time left</div>
              <Countdown target={season.end_date} compact />
            </div>
            <div className="flex items-center gap-2">
              <Link href="/learn" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Learn
              </Link>
              <Link href="/members" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Members
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Challenge grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {solveList.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No challenges yet</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Challenges will appear here once the competition starts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {solveList.map((challenge) => {
              const diff = DIFFICULTY_STYLES[challenge.difficulty]
              const cat = CATEGORIES[challenge.category] || '📌'
              return (
                <button
                  key={challenge.id}
                  onClick={() => openSolve(challenge)}
                  className="text-left rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: challenge.solved ? 'rgba(34,197,94,0.05)' : 'var(--card-bg)',
                    border: challenge.solved ? '1px solid rgba(34,197,94,0.45)' : '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{cat}</span>
                    {challenge.solved ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: diff.color, backgroundColor: diff.bg }}>
                        {diff.label}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{challenge.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{challenge.category}</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {challenge.points}
                      {challenge.bonus_points > 0 && (
                        <span className="text-xs ml-1" style={{ color: '#22c55e' }}>+{challenge.bonus_points}</span>
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {/* Solve overlay */}
      {openChallenge && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{CATEGORIES[openChallenge.category] || '📌'}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ color: DIFFICULTY_STYLES[openChallenge.difficulty]?.color || '#888', backgroundColor: DIFFICULTY_STYLES[openChallenge.difficulty]?.bg || 'rgba(0,0,0,0.1)' }}
                    >
                      {DIFFICULTY_STYLES[openChallenge.difficulty]?.label || openChallenge.difficulty}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
                      {openChallenge.points}
                      {openChallenge.bonus_points > 0 ? `+${openChallenge.bonus_points}` : ''} pts
                    </span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{openChallenge.title}</h2>
                </div>
                <button onClick={() => setOpenChallenge(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-5">
                {detail ? (
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{detail.description}</p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading challenge...</p>
                )}
              </div>

              {detail?.hint && (
                <div className="mb-5 rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308' }}>
                  💡 {detail.hint}
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Flag</label>
                  <input
                    type="text"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="flag{...}"
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono border bg-transparent"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !flag.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: 'white' }}
                >
                  {submitting ? 'Checking...' : 'Submit'}
                </button>
              </div>

              {result && (
                <p className="mt-3 text-sm flex items-center gap-1.5" style={{ color: result.ok ? '#22c55e' : '#ef4444' }}>
                  {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {result.text}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
