'use client'

import Link from 'next/link'

interface Team {
  id: string
  name: string
  description: string | null
  total_xp: number
  total_solves: number
  created_at: string
  member_count: number
}

export default function TeamCard({
  team,
  isUserTeam,
  userId,
}: {
  team: Team
  isUserTeam: boolean
  userId: string | null
}) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="block p-4 rounded-xl transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: `1px solid ${isUserTeam ? 'var(--accent)' : 'var(--border-color)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
          >
            <span className="text-lg">👥</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {team.name}
            </h3>
            {team.description && (
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {team.description}
              </p>
            )}
          </div>
        </div>
        {isUserTeam && (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider flex-shrink-0"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent)' }}
          >
            Your Team
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Members </span>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
            {team.member_count}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>XP </span>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
            {team.total_xp}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Solves </span>
          <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
            {team.total_solves}
          </span>
        </div>
      </div>
    </Link>
  )
}