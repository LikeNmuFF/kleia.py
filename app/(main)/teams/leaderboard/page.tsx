import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Team Leaderboard',
  description: 'Top teams ranked by total XP.',
}

export default async function TeamLeaderboardPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      total_xp,
      total_solves,
      team_members(count)
    `)
    .order('total_xp', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href="/teams"
          className="text-sm hover:underline mb-4 block"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Back to Teams
        </Link>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Team Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Top teams ranked by total XP
        </p>
      </div>

      {teams && teams.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <div
            className="flex items-center gap-4 px-4 py-3 text-xs font-medium uppercase tracking-wider"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}
          >
            <div className="w-10 text-center">#</div>
            <div className="flex-1">Team</div>
            <div className="w-20 text-center">Members</div>
            <div className="w-20 text-center">Solves</div>
            <div className="w-20 text-right">XP</div>
          </div>

          {teams.map((team, i) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex items-center gap-4 px-4 py-3 border-t transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="w-10 text-center">
                {i === 0 ? (
                  <span className="text-lg">🥇</span>
                ) : i === 1 ? (
                  <span className="text-lg">🥈</span>
                ) : i === 2 ? (
                  <span className="text-lg">🥉</span>
                ) : (
                  <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                )}
              </div>

              <div className="flex-1 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <span className="text-sm">👥</span>
                </div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {team.name}
                </span>
              </div>

              <div className="w-20 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                {team.team_members?.[0]?.count ?? 0}
              </div>

              <div className="w-20 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                {team.total_solves}
              </div>

              <div className="w-20 text-right">
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {team.total_xp}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <span className="text-2xl">🏆</span>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No teams yet
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create a team to appear on the leaderboard!
          </p>
        </div>
      )}
    </div>
  )
}