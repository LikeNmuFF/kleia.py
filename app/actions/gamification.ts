'use server'

import { createClient } from '@/lib/supabase/server'
import {
  BADGES,
  getDailyMissionsForDate,
  getTodayString,
  type BadgeDef,
} from '@/lib/utils/gamification'

export async function addXp(amount: number, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const newTotal = (profile.total_xp || 0) + amount

  const { error } = await supabase
    .from('profiles')
    .update({ total_xp: newTotal })
    .eq('id', user.id)

  if (error) return { error: error.message }

  await Promise.all([checkBadges(), syncTeamXp(user.id)])
  return { success: true, totalXp: newTotal }
}

export async function getBadges(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const targetId = userId || user?.id
  if (!targetId) return []

  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', targetId)

  return (data || []).map((row) => {
    const def = BADGES.find((b) => b.id === row.badge_id)
    return {
      ...def,
      earned_at: row.earned_at,
    }
  }).filter(Boolean)
}

export async function checkBadges() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { earned: [] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, total_xp')
    .eq('id', user.id)
    .single()

  if (!profile) return { earned: [] }

  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)

  const owned = new Set((existingBadges || []).map((b) => b.badge_id))
  const newBadges: string[] = []

  const [
    ctfResult, learnResult, postResult, reviewResult,
    hintResult, writeupResult, skillResult, regexResult, cipherResult,
    seasonResult, teamResult,
  ] = await Promise.all([
    supabase.from('ctf_submissions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_correct', true),
    supabase.from('learn_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('challenge_reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_hint_unlocks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gt('xp_cost', 0),
    supabase.from('writeups').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_skill_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('unlocked', true),
    supabase.from('regex_golf_solves').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('daily_cipher_solves').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('ctf_season_participants').select('season_id, user_id, total_points').eq('user_id', user.id),
    supabase.from('team_members').select('team_id').eq('user_id', user.id).maybeSingle(),
  ])

  const ctfCount = ctfResult.count
  const learnCount = learnResult.count
  const postCount = postResult.count
  const reviewCount = reviewResult.count
  const hintUnlockCount = hintResult.count
  const writeupCount = writeupResult.count
  const skillNodeCount = skillResult.count
  const regexCount = regexResult.count
  const dailyCipherCount = cipherResult.count

  const seasonParticipations = seasonResult.data || []
  const seasonCount = seasonParticipations.length

  let seasonWin = false
  if (seasonParticipations.length > 0) {
    const seasonIds = [...new Set(seasonParticipations.map(s => s.season_id))]
    const { data: allParticipants } = await supabase
      .from('ctf_season_participants')
      .select('season_id, user_id, total_points')
      .in('season_id', seasonIds)
      .order('total_points', { ascending: false })

    const bySeason = (allParticipants || []).reduce((acc: Record<string, any[]>, p) => {
      (acc[p.season_id] = acc[p.season_id] || []).push(p)
      return acc
    }, {})

    for (const sid of seasonIds) {
      const parts = bySeason[sid] || []
      const rank = parts.findIndex(p => p.user_id === user.id) + 1
      if (rank <= 3) { seasonWin = true; break }
    }
  }

  const userTeam = teamResult.data
  let teamSolves = 0
  if (userTeam) {
    const { data: team } = await supabase
      .from('teams')
      .select('total_solves')
      .eq('id', userTeam.team_id)
      .single()
    teamSolves = team?.total_solves || 0
  }

  const checks: [string, boolean][] = [
    ['streak_7', (profile.current_streak || 0) >= 7 || (profile.longest_streak || 0) >= 7],
    ['streak_30', (profile.longest_streak || 0) >= 30],
    ['streak_100', (profile.longest_streak || 0) >= 100],
    ['ctf_1', (ctfCount || 0) >= 1],
    ['ctf_10', (ctfCount || 0) >= 10],
    ['ctf_25', (ctfCount || 0) >= 25],
    ['skilltree_5', (skillNodeCount || 0) >= 5],
    ['learn_1', (learnCount || 0) >= 1],
    ['learn_10', (learnCount || 0) >= 10],
    ['post_1', (postCount || 0) >= 1],
    ['post_10', (postCount || 0) >= 10],
    ['team_create', !!userTeam],
    ['team_5', teamSolves >= 5],
    ['review_1', (reviewCount || 0) >= 1],
    ['hints_5', (hintUnlockCount || 0) >= 5],
    ['writeup_1', (writeupCount || 0) >= 1],
    ['writeup_5', (writeupCount || 0) >= 5],
    ['regex_3', (regexCount || 0) >= 3],
    ['regex_10', (regexCount || 0) >= 10],
    ['daily_cipher', (dailyCipherCount || 0) >= 5],
    ['review_10', (reviewCount || 0) >= 10],
    ['season_1', seasonCount >= 1],
    ['season_win', seasonWin],
  ]

  for (const [badgeId, condition] of checks) {
    if (condition && !owned.has(badgeId)) {
      await supabase.from('user_badges').insert({
        user_id: user.id,
        badge_id: badgeId,
      })
      newBadges.push(badgeId)
    }
  }

  const level = Math.floor((profile.total_xp || 0) >= 350 ? 5 : (profile.total_xp || 0) >= 1600 ? 10 : 0)
  if (level >= 5 && !owned.has('level_5')) {
    await supabase.from('user_badges').insert({ user_id: user.id, badge_id: 'level_5' })
    newBadges.push('level_5')
  }
  if ((profile.total_xp || 0) >= 1600 && !owned.has('level_10')) {
    await supabase.from('user_badges').insert({ user_id: user.id, badge_id: 'level_10' })
    newBadges.push('level_10')
  }

  return { earned: newBadges }
}

export async function getDailyMissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = getTodayString()

  const { data: existing } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)

  if (existing && existing.length > 0) return existing

  const missionDefs = getDailyMissionsForDate(today)
  const rows = missionDefs.map((m) => ({
    user_id: user.id,
    date: today,
    mission_type: m.type,
    description: m.description,
    xp_reward: m.xpReward,
    completed: false,
  }))

  const { data: inserted } = await supabase
    .from('daily_missions')
    .upsert(rows, { onConflict: 'user_id,date,mission_type' })
    .select()

  return inserted || rows
}

export async function completeMission(missionType: string, skipXp = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const today = getTodayString()

  const { data: mission } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .eq('mission_type', missionType)
    .eq('completed', false)
    .maybeSingle()

  if (!mission) return { success: false }

  const { error } = await supabase
    .from('daily_missions')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', mission.id)

  if (error) return { error: error.message }

  if (!skipXp) {
    await addXp(mission.xp_reward, `mission_${missionType}`)
  }
  return { success: true, xpEarned: mission.xp_reward }
}

export async function awardFirstLogin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)
    .eq('badge_id', 'first_login')
    .maybeSingle()

  if (!existing) {
    await supabase.from('user_badges').insert({
      user_id: user.id,
      badge_id: 'first_login',
    })
  }
}

async function syncTeamXp(userId: string) {
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .single()
  if (!membership) return

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', membership.team_id)

  const memberIds = teamMembers?.map(m => m.user_id) || []
  if (memberIds.length === 0) return

  const { data: profiles } = await supabase
    .from('profiles')
    .select('total_xp')
    .in('id', memberIds)

  const totalXp = profiles?.reduce((sum, p) => sum + (p.total_xp || 0), 0) || 0

  const { count: totalSolves } = await supabase
    .from('ctf_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('is_correct', true)
    .in('user_id', memberIds)

  await supabase
    .from('teams')
    .update({ total_xp: totalXp, total_solves: totalSolves || 0 })
    .eq('id', membership.team_id)
}
