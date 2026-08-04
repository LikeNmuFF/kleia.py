'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TeamCard from '@/components/teams/TeamCard'
import CreateTeamModal from '@/components/teams/CreateTeamModal'
import { acceptInvite } from '@/app/actions/teams'

interface Team {
  id: string
  name: string
  description: string | null
  total_xp: number
  total_solves: number
  created_at: string
  member_count: number
}

interface PendingInvite {
  id: string
  team_id: string
  team_name: string
  inviter_name: string
  created_at: string
}

export default function TeamsClient({
  teams,
  pendingInvites,
  userTeamId,
  userId,
}: {
  teams: Team[]
  pendingInvites: PendingInvite[]
  userTeamId: string | null
  userId: string | null
}) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [invites, setInvites] = useState(pendingInvites)
  const [accepting, setAccepting] = useState<string | null>(null)
  const router = useRouter()

  const handleAcceptInvite = async (inviteId: string) => {
    setAccepting(inviteId)
    const result = await acceptInvite(inviteId)
    if (result.success) {
      setInvites(invites.filter(i => i.id !== inviteId))
      router.refresh()
    }
    setAccepting(null)
  }

  const handleDeclineInvite = async (inviteId: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase
      .from('team_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)
    setInvites(invites.filter(i => i.id !== inviteId))
  }

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

      {invites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Pending Invites
          </h2>
          <div className="space-y-3">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {invite.team_name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Invited by {invite.inviter_name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    disabled={accepting === invite.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#22c55e', color: 'white' }}
                  >
                    {accepting === invite.id ? 'Joining...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(invite.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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