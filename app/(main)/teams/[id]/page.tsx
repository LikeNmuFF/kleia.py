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
    .select(`
      id,
      name,
      description,
      total_xp,
      total_solves,
      created_at,
      creator_id,
      team_members(
        user_id,
        role,
        joined_at,
        profiles:user_id(id, username, avatar_url, total_xp)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !team) {
    notFound()
  }

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
      members: team.team_members.map((member: any) => ({
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        username: member.profiles?.username,
        avatar_url: member.profiles?.avatar_url,
        total_xp: member.profiles?.total_xp ?? 0,
      })),
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