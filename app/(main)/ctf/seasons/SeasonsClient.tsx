'use client'

import { useRouter } from 'next/navigation'
import { Users, Trophy, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/time'

interface Season {
  id: string
  name: string
  slug: string
  description: string | null
  theme: string | null
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export default function SeasonsClient({
  activeSeason,
  pastSeasons,
  userId,
}: {
  activeSeason: Season | null
  pastSeasons: Season[]
  userId?: string
}) {
  const router = useRouter()

  const isSeasonActive = (season: Season) => {
    const now = new Date().toISOString()
    return season.is_active && season.start_date <= now && season.end_date >= now
  }

  const isSeasonUpcoming = (season: Season) => {
    const now = new Date().toISOString()
    return season.is_active && season.start_date > now
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          CTF Seasons
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Join competitions, register with a codename, and compete for the top spot
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mb-8">
        <a
          href="/ctf"
          className="px-4 py-2 rounded-lg font-medium text-sm"
          style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
        >
          Challenges
        </a>
        <a
          href="/ctf/leaderboard"
          className="px-4 py-2 rounded-lg font-medium text-sm"
          style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
        >
          Leaderboard
        </a>
        <a
          href="/ctf/seasons"
          className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
        >
          Seasons
        </a>
      </div>

      {/* Active Season */}
      {activeSeason && (isSeasonActive(activeSeason) || isSeasonUpcoming(activeSeason)) ? (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isSeasonActive(activeSeason) ? 'Current Season' : 'Upcoming Season'}
          </h2>
          <div
            className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl"
            style={{
              background: isSeasonActive(activeSeason)
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2), rgba(236, 72, 153, 0.15))'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
            onClick={() => router.push(`/ctf/seasons/${activeSeason.slug}`)}
          >
            {/* Top Bar */}
            <div className="px-6 py-2.5 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-2">
                {activeSeason.theme && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)', color: '#c4b5fd' }}>
                    {activeSeason.theme}
                  </span>
                )}
              </div>
              {isSeasonActive(activeSeason) ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}>
                  Starting {formatDateTime(activeSeason.start_date)}
                </span>
              )}
            </div>

            {/* Main */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {activeSeason.name}
                  </h3>
                  {activeSeason.description && (
                    <p className="text-sm max-w-lg" style={{ color: 'var(--text-secondary)' }}>
                      {activeSeason.description}
                    </p>
                  )}
                </div>
                <Trophy className="w-8 h-8 shrink-0" style={{ color: '#eab308' }} />
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(activeSeason.start_date)} — {formatDateTime(activeSeason.end_date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No Active Season
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Check back soon for the next competition!
            </p>
          </div>
        </div>
      )}

      {/* Past Seasons */}
      {pastSeasons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Past Seasons
          </h2>
          <div className="grid gap-4">
            {pastSeasons.map((season) => (
              <div
                key={season.id}
                className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => router.push(`/ctf/seasons/${season.slug}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <Trophy className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {season.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(season.start_date)} — {formatDateTime(season.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {season.theme && (
                      <span className="text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {season.theme}
                      </span>
                    )}
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!activeSeason && pastSeasons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Seasons Coming Soon
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monthly CTF competitions will be launching soon. Stay tuned!
          </p>
        </div>
      )}
    </div>
  )
}
