'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTeam(name: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existingTeam } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (existingTeam) {
    return { error: 'You are already in a team' }
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      creator_id: user.id,
    })
    .select('id')
    .single()

  if (teamError) {
    if (teamError.message?.includes('teams_name_key')) {
      return { error: 'Team name already taken' }
    }
    return { error: 'Failed to create team' }
  }

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'leader',
    })

  if (memberError) {
    return { error: 'Failed to add you to team' }
  }

  revalidatePath('/teams')
  return { teamId: team.id }
}

export async function getTeams() {
  const supabase = await createClient()

  const { data: teams, error } = await supabase
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

  if (error) return []

  return teams.map(team => ({
    ...team,
    member_count: team.team_members?.[0]?.count ?? 0,
  }))
}

export async function getTeam(id: string) {
  const supabase = await createClient()

  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !team) return null

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

  return {
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
  }
}

export async function joinTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existingMembership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (existingMembership) {
    return { error: 'You are already in a team' }
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, max_members')
    .eq('id', teamId)
    .single()

  if (!team) {
    return { error: 'Team not found' }
  }

  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (memberCount && memberCount >= team.max_members) {
    return { error: 'Team is full' }
  }

  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: user.id,
      role: 'member',
    })

  if (error) {
    return { error: 'Failed to join team' }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function leaveTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'You are not in this team' }
  }

  if (membership.role === 'leader') {
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)

    if (memberCount && memberCount > 1) {
      return { error: 'Leaders must transfer ownership before leaving' }
    }
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to leave team' }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function inviteToTeam(teamId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'leader') {
    return { error: 'Only team leaders can invite' }
  }

  const { data: existingInvite } = await supabase
    .from('team_invites')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return { error: 'Invite already pending' }
  }

  const { data: targetMembership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .single()

  if (targetMembership) {
    return { error: 'User is already in a team' }
  }

  const { error } = await supabase
    .from('team_invites')
    .insert({
      team_id: teamId,
      user_id: userId,
      invited_by: user.id,
    })

  if (error) {
    return { error: 'Failed to send invite' }
  }

  return { success: true }
}

export async function acceptInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: invite } = await supabase
    .from('team_invites')
    .select('id, team_id, user_id, status')
    .eq('id', inviteId)
    .eq('user_id', user.id)
    .single()

  if (!invite) {
    return { error: 'Invite not found' }
  }

  if (invite.status !== 'pending') {
    return { error: 'Invite already processed' }
  }

  const { error: updateError } = await supabase
    .from('team_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId)

  if (updateError) {
    return { error: 'Failed to update invite' }
  }

  const { data: team } = await supabase
    .from('teams')
    .select('max_members')
    .eq('id', invite.team_id)
    .single()

  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', invite.team_id)

  if (team && memberCount && memberCount >= team.max_members) {
    await supabase
      .from('team_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)
    return { error: 'Team is full' }
  }

  const { error: insertError } = await supabase
    .from('team_members')
    .insert({
      team_id: invite.team_id,
      user_id: user.id,
      role: 'member',
    })

  if (insertError) {
    return { error: 'Failed to join team' }
  }

  revalidatePath('/teams')
  revalidatePath(`/teams/${invite.team_id}`)
  return { success: true }
}

export async function getTeamLeaderboard() {
  const supabase = await createClient()

  const { data: teams, error } = await supabase
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

  if (error) return []

  return teams.map((team, index) => ({
    rank: index + 1,
    ...team,
    member_count: team.team_members?.[0]?.count ?? 0,
  }))
}