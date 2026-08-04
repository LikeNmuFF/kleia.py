'use client'

import { useState } from 'react'
import Link from 'next/link'
import TeamCard from '@/components/teams/TeamCard'
import CreateTeamModal from '@/components/teams/CreateTeamModal'

interface Team {
  id: string
  name: string
  description: string | null
  total_xp: number
  total_solves: number
  created_at: string
  member_count: number
}

export default function TeamsClient({
  teams,
  userTeamId,
  userId,
}: {
  teams: Team[]
  userTeamId: string | null
  userId: string | null
}) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Teams
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Join or create a team to compete together
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userTeamId ? (
            <Link
              href={`/teams/${userTeamId}`}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              My Team
            </Link>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              Create Team
            </button>
          )}
          <Link
            href="/teams/leaderboard"
            className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
          >
            Leaderboard
          </Link>
        </div>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              isUserTeam={team.id === userTeamId}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No teams yet
          </h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Create the first team and invite your friends!
          </p>
          {!userTeamId && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              Create Team
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          userId={userId}
        />
      )}
    </div>
  )
}