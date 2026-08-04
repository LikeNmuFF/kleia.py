'use client'

import { useRouter } from 'next/navigation'

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isSeasonActive = (season: Season) => {
    const today = new Date().toISOString().split('T')[0]
    return season.is_active && season.start_date <= today && season.end_date >= today
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          CTF Seasons
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Join monthly competitions and compete for the top spot
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
      {activeSeason && isSeasonActive(activeSeason) ? (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Current Season
          </h2>
          <div
            className="rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
            onClick={() => router.push(`/ctf/seasons/${activeSeason.slug}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                {activeSeason.theme && (
                  <span className="text-sm font-medium px-2 py-1 rounded-full mb-2 inline-block"
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--text-primary)' }}>
                    {activeSeason.theme}
                  </span>
                )}
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeSeason.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                Active
              </span>
            </div>
            {activeSeason.description && (
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                {activeSeason.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>📅 {formatDate(activeSeason.start_date)} — {formatDate(activeSeason.end_date)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No Active Season
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Check back soon for the next monthly competition!
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
                className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => router.push(`/ctf/seasons/${season.slug}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {season.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(season.start_date)} — {formatDate(season.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {season.theme && (
                      <span className="text-xs px-2 py-1 rounded-full"
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
