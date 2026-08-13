'use client'

import Link from 'next/link'

interface Standing {
  user_id: string
  total_points: number
  challenges_solved: number
  joined_at: string
  codename: string | null
  username: string
  avatar_url: string | null
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function ResultsClient({
  season,
  leaderboard,
  userId,
}: {
  season: { name: string; slug: string; theme?: string | null; end_date: string }
  leaderboard: Standing[]
  userId?: string
}) {
  const displayName = (s: { codename: string | null; username: string }) => s.codename || s.username || 'Unknown'
  const podium = leaderboard.slice(0, 3)
  const top10 = leaderboard.slice(0, 10)
  const myRank = userId ? leaderboard.findIndex((s) => s.user_id === userId) + 1 : 0

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#c4b5fd' }}>
          {season.theme || 'Competition Results'}
        </p>
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{season.name}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Final standings</p>
      </div>

      {myRank > 0 && (
        <div className="mb-8 rounded-2xl p-4 text-center" style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            You finished <span className="font-bold font-mono">#{myRank}</span> of {leaderboard.length}
          </span>
        </div>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-3">
          {podium.map((entry, i) => (
            <div
              key={entry.user_id}
              className="rounded-2xl p-5 text-center"
              style={{
                backgroundColor: i === 0 ? 'rgba(234,179,8,0.08)' : 'var(--card-bg)',
                border: i === 0 ? '1px solid rgba(234,179,8,0.4)' : '1px solid var(--border-color)',
                transform: i === 1 ? 'translateY(4px)' : undefined,
              }}
            >
              <div className="text-4xl mb-2">{MEDALS[i]}</div>
              <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{displayName(entry)}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{entry.username}</div>
              <div className="mt-2 font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{entry.total_points}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.challenges_solved} solved</div>
            </div>
          ))}
        </div>
      )}

      {/* Top 10 */}
      {top10.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          {top10.map((entry, i) => {
            const isMe = userId === entry.user_id
            return (
              <div
                key={entry.user_id}
                className="flex items-center gap-4 px-5 py-3 border-t first:border-t-0"
                style={{ borderColor: 'var(--border-color)', backgroundColor: isMe ? 'rgba(139,92,246,0.08)' : undefined }}
              >
                <div className="w-8 text-center shrink-0">
                  <span className="font-mono font-bold" style={{ color: i < 3 ? '#eab308' : 'var(--text-muted)' }}>{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
                    {displayName(entry)}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                        you
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{entry.total_points}</span>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.challenges_solved} solved</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {top10.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No participants.</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href={`/ctf/seasons/${season.slug}`} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ← Back to season
        </Link>
      </div>
    </div>
  )
}
