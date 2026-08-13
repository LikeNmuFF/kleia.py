'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSeasonLeaderboard } from '@/app/actions/seasons'
import { getRecentSeasonSolves } from '@/app/actions/competition'

interface Standing {
  user_id: string
  total_points: number
  challenges_solved: number
  joined_at: string
  codename: string | null
  username: string
  avatar_url: string | null
}

interface Solve {
  user_id: string
  codename: string | null
  challenge_id: string
  title: string
  points: number
  created_at: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function SpectateClient({
  season,
  effectiveStatus,
  standings,
  recentSolves,
  challengeCount,
}: {
  season: { id: string; name: string; slug: string; theme?: string | null }
  effectiveStatus: string
  standings: Standing[]
  recentSolves: Solve[]
  challengeCount: number
}) {
  const [rows, setRows] = useState(standings)
  const [solves, setSolves] = useState(recentSolves)

  useEffect(() => {
    const supabase = createClient()
    const reload = async () => {
      const [s, r] = await Promise.all([
        getSeasonLeaderboard(season.id),
        getRecentSeasonSolves(season.id),
      ])
      setRows(s)
      setSolves(r)
    }

    const channel = supabase
      .channel(`spectate:${season.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ctf_season_participants',
          filter: `season_id=eq.${season.id}`,
        },
        reload
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ctf_submissions',
          filter: 'is_correct=eq.true',
        },
        reload
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [season.id])

  const live = effectiveStatus === 'live'
  const displayName = (s: { codename: string | null; username: string }) => s.codename || s.username || 'Unknown'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c4b5fd' }}>
              {season.theme || 'Live Spectator Feed'}
            </p>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{season.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
              style={{
                backgroundColor: live ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                color: live ? '#22c55e' : '#eab308',
              }}
            >
              <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              {live ? 'Live' : 'Paused'}
            </span>
            <span className="px-4 py-1.5 rounded-full text-sm" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
              {challengeCount} challenges
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Standings */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Standings</h2>
            {rows.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No participants yet.</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                {rows.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-4 px-5 py-4 border-t first:border-t-0"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="w-10 text-center shrink-0">
                      {i < 3 ? (
                        <span className="text-2xl">{MEDALS[i]}</span>
                      ) : (
                        <span className="text-lg font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-lg truncate block" style={{ color: 'var(--text-primary)' }}>
                        {displayName(entry)}
                      </span>
                      {entry.codename && entry.username && (
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>@{entry.username}</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-2xl font-mono" style={{ color: 'var(--text-primary)' }}>
                        {entry.total_points}
                      </span>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.challenges_solved} solved</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity ticker */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent solves</h2>
            {solves.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No solves yet.</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                {solves.map((solve, i) => (
                  <div
                    key={`${solve.user_id}-${solve.challenge_id}-${i}`}
                    className="px-4 py-3 border-t first:border-t-0 text-sm"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {solve.codename || 'Unknown'}
                      </span>
                      <span className="font-mono font-bold shrink-0" style={{ color: '#22c55e' }}>+{solve.points}</span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      solved {solve.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
