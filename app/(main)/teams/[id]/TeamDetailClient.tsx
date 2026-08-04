'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { joinTeam, leaveTeam } from '@/app/actions/teams'
import TeamInviteModal from '@/components/teams/TeamInviteModal'

interface Member {
  user_id: string
  role: string
  joined_at: string
  username: string | null
  avatar_url: string | null
  total_xp: number
}

interface Team {
  id: string
  name: string
  description: string | null
  total_xp: number
  total_solves: number
  created_at: string
  creator_id: string
  members: Member[]
}

export default function TeamDetailClient({
  team,
  userMembership,
  teamRank,
  userId,
}: {
  team: Team
  userMembership: { role: string } | null
  teamRank: number
  userId: string | null
}) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleJoin = async () => {
    setLoading(true)
    setError(null)

    const result = await joinTeam(team.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return

    setLoading(true)
    setError(null)

    const result = await leaveTeam(team.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/teams')
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/teams"
          className="text-sm hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Back to Teams
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {team.name}
          </h1>
          {team.description && (
            <p style={{ color: 'var(--text-secondary)' }}>{team.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {userId && !userMembership && (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          )}
          {userId && userMembership && userMembership.role !== 'leader' && (
            <button
              onClick={handleLeave}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
            >
              {loading ? 'Leaving...' : 'Leave Team'}
            </button>
          )}
          {userId && userMembership && userMembership.role === 'leader' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              Invite Member
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total XP</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {team.total_xp}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Solves</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {team.total_solves}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Leaderboard Rank</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            #{teamRank}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Members ({team.members.length})
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <div
            className="flex items-center gap-4 px-4 py-3 text-xs font-medium uppercase tracking-wider"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}
          >
            <div className="flex-1">Member</div>
            <div className="w-20 text-center">Role</div>
            <div className="w-20 text-right">XP</div>
          </div>

          {team.members.map(member => (
            <div
              key={member.user_id}
              className="flex items-center gap-4 px-4 py-3 border-t"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex-1 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">
                    {member.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <Link
                  href={`/profile/${member.username}`}
                  className="font-medium hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {member.username}
                </Link>
              </div>
              <div className="w-20 text-center">
                <span
                  className="px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: member.role === 'leader' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: member.role === 'leader' ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {member.role}
                </span>
              </div>
              <div className="w-20 text-right">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {member.total_xp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInviteModal && (
        <TeamInviteModal
          teamId={team.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}