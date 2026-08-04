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
  if (user) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()
    userTeamId = membership?.team_id || null
  }

  return {
    teams: (teams || []).map(team => ({
      ...team,
      member_count: team.team_members?.[0]?.count ?? 0,
    })),
    userTeamId,
    userId: user?.id || null,
  }
}

export default async function TeamsPage() {
  const { teams, userTeamId, userId } = await getTeamsData()

  return <TeamsClient teams={teams} userTeamId={userTeamId} userId={userId} />
}