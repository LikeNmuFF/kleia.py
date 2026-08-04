import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import TeamsClient from './TeamsClient'

export const metadata: Metadata = {
  title: 'Teams',
  description: 'Join or create a team to compete together on CTF challenges.',
}

async function getTeamsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      description,
      total_xp,
      total_solves,
      created_at,
      team_members(count)
    `)
    .order('total_xp', { ascending: false })

  let userTeamId = null
  let pendingInvites: Array<{
    id: string
    team_id: string
    team_name: string
    inviter_name: string
    created_at: string
  }> = []

  if (user) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()
    userTeamId = membership?.team_id || null

    const { data: invites } = await supabase
      .from('team_invites')
      .select('id, team_id, created_at, inviter_id')
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (invites && invites.length > 0) {
      const teamIds = [...new Set(invites.map(i => i.team_id))]
      const inviterIds = [...new Set(invites.map(i => i.inviter_id))]

      const [teamsResult, invitersResult] = await Promise.all([
        supabase.from('teams').select('id, name').in('id', teamIds),
        supabase.from('profiles').select('id, username').in('id', inviterIds),
      ])

      const teamMap = new Map((teamsResult.data || []).map(t => [t.id, t.name]))
      const inviterMap = new Map((invitersResult.data || []).map(p => [p.id, p.username]))

      pendingInvites = invites.map(inv => ({
        id: inv.id,
        team_id: inv.team_id,
        team_name: teamMap.get(inv.team_id) || 'Unknown',
        inviter_name: inviterMap.get(inv.inviter_id) || 'Unknown',
        created_at: inv.created_at,
      }))
    }
  }

  return {
    teams: (teams || []).map(team => ({
      ...team,
      member_count: team.team_members?.[0]?.count ?? 0,
    })),
    pendingInvites,
    userTeamId,
    userId: user?.id || null,
  }
}

export default async function TeamsPage() {
  const { teams, pendingInvites, userTeamId, userId } = await getTeamsData()

  return (
    <TeamsClient
      teams={teams}
      pendingInvites={pendingInvites}
      userTeamId={userTeamId}
      userId={userId}
    />
  )
}