import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TeamDetailClient from './TeamDetailClient'

export const metadata: Metadata = {
  title: 'Team Details',
  description: 'View team members, stats, and leaderboard.',
}

async function getTeamData(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !team) {
    notFound()
  }

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, role, joined_at')
    .eq('team_id', id)

  const memberUserIds = members?.map(m => m.user_id) || []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_xp')
    .in('id', memberUserIds.length > 0 ? memberUserIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  let userMembership = null
  if (user) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', user.id)
      .single()
    userMembership = membership
  }

  const { count: teamRank } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .gt('total_xp', team.total_xp)

  return {
    team: {
      ...team,
      members: members?.map(member => {
        const profile = profileMap.get(member.user_id)
        return {
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          username: profile?.username ?? 'Unknown',
          avatar_url: profile?.avatar_url ?? null,
          total_xp: profile?.total_xp ?? 0,
        }
      }) || [],
    },
    userMembership,
    teamRank: (teamRank || 0) + 1,
    userId: user?.id || null,
  }
}

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const { team, userMembership, teamRank, userId } = await getTeamData(params.id)

  return (
    <TeamDetailClient
      team={team}
      userMembership={userMembership}
      teamRank={teamRank}
      userId={userId}
    />
  )
}