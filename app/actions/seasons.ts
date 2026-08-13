'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logEvent'
import { getEffectiveSeasonStatus } from './competition-status'

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export async function getAllSeasons() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ctf_seasons')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

export async function getActiveSeason() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // First try to find a season that is currently running (today between start and end)
  let { data } = await supabase
    .from('ctf_seasons')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .single()

  // If no running season, find the next upcoming season
  if (!data) {
    const { data: upcoming } = await supabase
      .from('ctf_seasons')
      .select('*')
      .eq('is_active', true)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(1)
      .single()

    data = upcoming
  }

  return data
}

export async function getPastSeasons() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ctf_seasons')
    .select('*')
    .or(`is_active.eq.false,end_date.lt.${today}`)
    .order('end_date', { ascending: false })
    .limit(10)

  return data || []
}

export async function joinSeason(seasonId: string, codename?: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (codename && codename.trim().length < 2) {
    return { error: 'Codename must be at least 2 characters' }
  }

  const { data: season } = await supabase
    .from('ctf_seasons')
    .select('status, start_date, end_date')
    .eq('id', seasonId)
    .single()

  if (season && getEffectiveSeasonStatus(season) !== 'upcoming') {
    return { error: 'Registration is closed for this season' }
  }

  const { error } = await supabase
    .from('ctf_season_participants')
    .insert({
      season_id: seasonId,
      user_id: user.id,
      codename: codename?.trim() || null,
    })

  if (error) {
    if (error.message?.includes('duplicate key')) {
      return { error: 'Already joined this season' }
    }
    await logEvent({ endpoint: 'seasons.joinSeason', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'seasons.joinSeason', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/ctf/seasons')
  revalidatePath(`/ctf/seasons/${seasonId}`)
  return { success: true }
}

export async function getSeasonLeaderboard(seasonId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ctf_season_participants')
    .select(`
      user_id,
      total_points,
      challenges_solved,
      joined_at,
      codename,
      profiles:user_id (username, avatar_url)
    `)
    .eq('season_id', seasonId)
    .order('total_points', { ascending: false })

  if (!data) return []

  return data.map(row => {
    const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      user_id: row.user_id,
      total_points: row.total_points,
      challenges_solved: row.challenges_solved,
      joined_at: row.joined_at,
      codename: row.codename ?? null,
      username: prof?.username ?? 'Unknown',
      avatar_url: prof?.avatar_url ?? null,
    }
  })
}

export async function getSeasonChallenges(seasonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: seasonChallenges } = await supabase
    .from('ctf_season_challenges')
    .select(`
      challenge_id,
      bonus_points,
      ctf_challenges:challenge_id (id, title, category, difficulty, points)
    `)
    .eq('season_id', seasonId)

  if (!seasonChallenges) return []

  const challenges = seasonChallenges.map(sc => {
    const raw = sc.ctf_challenges
    const ch = Array.isArray(raw) ? raw[0] : raw
    return {
      id: (ch?.id as string) ?? sc.challenge_id,
      title: (ch?.title as string) ?? 'Unknown',
      category: (ch?.category as string) ?? 'misc',
      difficulty: (ch?.difficulty as string) ?? 'easy',
      points: (ch?.points as number) ?? 0,
      bonus_points: sc.bonus_points ?? 0,
    }
  })

  if (!user) {
    return challenges.map(c => ({ ...c, solved: false }))
  }

  const challengeIds = challenges.map(c => c.id)

  const { data: submissions } = await supabase
    .from('ctf_submissions')
    .select('challenge_id')
    .eq('user_id', user.id)
    .eq('is_correct', true)
    .in('challenge_id', challengeIds)

  const solvedIds = new Set(submissions?.map(s => s.challenge_id) || [])

  return challenges.map(c => ({
    ...c,
    solved: solvedIds.has(c.id as string),
  }))
}

export async function getSeasonBySlug(slug: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ctf_seasons')
    .select('*')
    .eq('slug', slug)
    .single()

  return data
}

export async function isSeasonParticipant(seasonId: string, userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ctf_season_participants')
    .select('user_id, codename')
    .eq('season_id', seasonId)
    .eq('user_id', userId)
    .maybeSingle()

  return data ? { joined: true, codename: data.codename } : { joined: false, codename: null }
}

export async function updateSeasonCodename(seasonId: string, codename: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (codename.trim().length < 2) {
    return { error: 'Codename must be at least 2 characters' }
  }

  const { error } = await supabase
    .from('ctf_season_participants')
    .update({ codename: codename.trim() })
    .eq('season_id', seasonId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/ctf/seasons')
  return { success: true }
}

export async function getSeasonParticipantCount(seasonId: string) {
  const supabase = await createClient()

  const { count } = await supabase
    .from('ctf_season_participants')
    .select('*', { count: 'exact', head: true })
    .eq('season_id', seasonId)

  return count ?? 0
}

export async function updateSeason(seasonId: string, data: {
  name?: string
  description?: string
  theme?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
}) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized' }
  }

  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.description !== undefined) updates.description = data.description?.trim() || null
  if (data.theme !== undefined) updates.theme = data.theme?.trim() || null
  if (data.start_date !== undefined) updates.start_date = data.start_date
  if (data.end_date !== undefined) updates.end_date = data.end_date
  if (data.is_active !== undefined) updates.is_active = data.is_active

  const { error } = await supabase
    .from('ctf_seasons')
    .update(updates)
    .eq('id', seasonId)

  if (error) {
    await logEvent({ endpoint: 'seasons.updateSeason', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'seasons.updateSeason', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf/seasons')
  revalidatePath(`/ctf/seasons/${seasonId}`)
  return { success: true }
}

export async function deleteSeason(seasonId: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('ctf_seasons')
    .delete()
    .eq('id', seasonId)

  if (error) {
    await logEvent({ endpoint: 'seasons.deleteSeason', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'seasons.deleteSeason', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf/seasons')
  return { success: true }
}

export async function addChallengeToSeason(seasonId: string, challengeId: string, bonusPoints: number = 0) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ctf_season_challenges')
    .insert({ season_id: seasonId, challenge_id: challengeId, bonus_points: bonusPoints })

  if (error) {
    if (error.message?.includes('duplicate key')) return { error: 'Challenge already in this season' }
    return { error: error.message }
  }

  revalidatePath('/ctf/seasons')
  return { success: true }
}

export async function removeChallengeFromSeason(seasonId: string, challengeId: string) {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ctf_season_challenges')
    .delete()
    .eq('season_id', seasonId)
    .eq('challenge_id', challengeId)

  if (error) return { error: error.message }

  revalidatePath('/ctf/seasons')
  return { success: true }
}

export async function createSeason(data: {
  name: string
  slug: string
  description?: string
  theme?: string
  start_date: string
  end_date: string
  is_active?: boolean
}) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    const { data: { user } } = await supabase.auth.getUser()
    await logEvent({ endpoint: 'seasons.createSeason', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unauthorized', userId: user?.id })
    return { error: 'Unauthorized' }
  }

  if (!data.name.trim()) return { error: 'Name cannot be empty' }
  if (!data.slug.trim()) return { error: 'Slug cannot be empty' }
  if (!data.start_date) return { error: 'Start date is required' }
  if (!data.end_date) return { error: 'End date is required' }

  const { error } = await supabase
    .from('ctf_seasons')
    .insert({
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: data.description?.trim() || null,
      theme: data.theme?.trim() || null,
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: data.is_active ?? true,
    })

  if (error) {
    await logEvent({ endpoint: 'seasons.createSeason', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'seasons.createSeason', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf/seasons')
  return { success: true }
}
