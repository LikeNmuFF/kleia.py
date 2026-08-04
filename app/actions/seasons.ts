'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logEvent'

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

export async function getActiveSeason() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ctf_seasons')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .single()

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

export async function joinSeason(seasonId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('ctf_season_participants')
    .insert({
      season_id: seasonId,
      user_id: user.id,
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
      profiles:user_id (username, avatar_url)
    `)
    .eq('season_id', seasonId)
    .order('total_points', { ascending: false })

  return data || []
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

  const challenges = seasonChallenges.map(sc => ({
    ...(sc.ctf_challenges as Record<string, unknown>),
    bonus_points: sc.bonus_points,
  }))

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
    .select('user_id')
    .eq('season_id', seasonId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!data
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
