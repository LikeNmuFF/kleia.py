'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { getEffectiveSeasonStatus, getSeasonHintCost, type SeasonRow, type SeasonStatus } from './competition-status'
import { notifyUser } from './notifications'

export type { SeasonStatus, SeasonRow } from './competition-status'

export type CompetitionAccess =
  | { kind: 'participant'; userId: string; season: SeasonRow; effectiveStatus: SeasonStatus; codename: string | null }
  | { kind: 'spectator'; userId: string; season: SeasonRow; effectiveStatus: SeasonStatus }
  | { kind: 'admin'; userId: string; season: SeasonRow | null; effectiveStatus: SeasonStatus | null }
  | { kind: 'none' }

/** Effective status: auto-starts 'upcoming' on start_date, auto-ends 'live'/'upcoming' after end_date. */

/**
 * Access context for the current user.
 * Pass seasonId to evaluate a specific season; otherwise the effective-live
 * season (falling back to the nearest upcoming) is used.
 */
export async function getCompetitionAccess(
  seasonId?: string,
  options?: { preferSpectator?: boolean },
): Promise<CompetitionAccess> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { kind: 'none' }

  if (await isAdmin(supabase)) {
    const season = seasonId
      ? (await supabase.from('ctf_seasons').select('*').eq('id', seasonId).single()).data
      : null
    return {
      kind: 'admin',
      userId: user.id,
      season,
      effectiveStatus: season ? getEffectiveSeasonStatus(season) : null,
    }
  }

  let season: SeasonRow | null = null
  if (seasonId) {
    const { data } = await supabase.from('ctf_seasons').select('*').eq('id', seasonId).single()
    season = data
  } else {
    const { data: seasons } = await supabase
      .from('ctf_seasons')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true })
    const list = (seasons || []) as SeasonRow[]
    season =
      list.find(s => getEffectiveSeasonStatus(s) === 'live') ??
      list.find(s => getEffectiveSeasonStatus(s) === 'upcoming') ??
      null
  }
  if (!season) return { kind: 'none' }
  const effectiveStatus = getEffectiveSeasonStatus(season)

  const [participantResult, spectatorResult] = await Promise.all([
    supabase
      .from('ctf_season_participants')
      .select('codename')
      .eq('season_id', season.id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('ctf_season_spectators')
      .select('user_id')
      .eq('season_id', season.id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (participantResult.error || spectatorResult.error) {
    console.error('getCompetitionAccess: membership lookup failed', {
      seasonId: season.id,
      userId: user.id,
      participantError: participantResult.error?.message,
      spectatorError: spectatorResult.error?.message,
    })
    throw new Error('Could not verify season access')
  }

  const participant = participantResult.data
  const spectator = spectatorResult.data

  if (options?.preferSpectator && spectator) {
    return { kind: 'spectator', userId: user.id, season, effectiveStatus }
  }
  if (participant) {
    return {
      kind: 'participant',
      userId: user.id,
      season,
      effectiveStatus,
      codename: (participant as { codename?: string | null }).codename ?? null,
    }
  }
  if (spectator) return { kind: 'spectator', userId: user.id, season, effectiveStatus }
  return { kind: 'none' }
}

/** The upcoming season the current user has registered for (for the home/feed banner). */
export async function getUpcomingRegistration() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: seasons } = await supabase
    .from('ctf_seasons')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: true })
  if (!seasons?.length) return null

  for (const s of seasons as SeasonRow[]) {
    if (getEffectiveSeasonStatus(s) === 'upcoming') {
      const { data: part } = await supabase
        .from('ctf_season_participants')
        .select('user_id')
        .eq('season_id', s.id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (part) return s
    }
  }
  return null
}

/**
 * Credits a correct solve to every live season that includes this challenge.
 * Called from submitFlag. Uses the atomic RPC `increment_season_score` (a
 * SECURITY DEFINER function) so the increment is a single UPDATE — immune to
 * RLS update denial and lost-update races. Double-credit is impossible because
 * the partial unique index ctf_submissions_one_correct_idx blocks repeat
 * correct submissions.
 */
export async function creditSeasonSolve(userId: string, challengeId: string) {
  const supabase = await createClient()

  const { data: links } = await supabase
    .from('ctf_season_challenges')
    .select('season_id, bonus_points')
    .eq('challenge_id', challengeId)
  if (!links?.length) return

  for (const link of links) {
    const { data: season } = await supabase
      .from('ctf_seasons')
      .select('id, status, start_date, end_date')
      .eq('id', link.season_id)
      .single()
    if (!season) continue
    if (getEffectiveSeasonStatus(season) !== 'live') continue

    const { data: challenge } = await supabase
      .from('ctf_challenges')
      .select('points')
      .eq('id', challengeId)
      .single()

    const points = (challenge?.points ?? 0) + (link.bonus_points ?? 0)
    const { data: credited, error } = await supabase.rpc('increment_season_score', {
      p_season_id: season.id,
      p_user_id: userId,
      p_points: points,
    })
    if (error) {
      console.error('creditSeasonSolve: failed to credit season score', {
        seasonId: season.id,
        userId,
        challengeId,
        points,
        error: error.message,
      })
    } else if (credited === false || credited === null) {
      // Participant row missing — not registered for this season, skip silently.
    }
  }
}

export async function unlockSeasonHint(seasonId: string, challengeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('hint')
    .eq('id', challengeId)
    .eq('status', 'approved')
    .single()
  if (!challenge?.hint) return { error: 'No hint available' }

  const { data: charged, error } = await supabase.rpc('unlock_progressive_season_hint', {
    p_season_id: seasonId,
    p_challenge_id: challengeId,
    p_user_id: user.id,
  })
  if (error) return { error: getSafeErrorMessage(error, 'Could not unlock hint') }

  revalidatePath(`/ctf/seasons`)
  return { hint: challenge.hint, penalty: charged ?? 0 }
}

export async function getSeasonHintState(seasonId: string, challengeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { unlocked: false, nextCost: 25 }

  const { data: unlocks } = await supabase
    .from('ctf_season_hint_unlocks')
    .select('challenge_id')
    .eq('season_id', seasonId)
    .eq('user_id', user.id)

  const rows = unlocks ?? []
  return {
    unlocked: rows.some(row => row.challenge_id === challengeId),
    nextCost: getSeasonHintCost(rows.length),
  }
}

/** Latest correct solves in a season, joined with codename + challenge title (for the spectate ticker). */
export async function getRecentSeasonSolves(seasonId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_recent_season_solves', { p_season_id: seasonId })
  if (error) {
    console.error('getRecentSeasonSolves: feed lookup failed', { seasonId, error: error.message })
    return []
  }
  return data ?? []
}

// ---- Admin actions ----

export async function setSeasonStatus(seasonId: string, status: SeasonStatus) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ctf_seasons')
    .update({ status })
    .eq('id', seasonId)
  if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }

  revalidatePath('/admin')
  return { success: true }
}

export async function getSeasonParticipants(seasonId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ctf_season_participants')
    .select('user_id, total_points, challenges_solved, codename, profiles:user_id (username, avatar_url)')
    .eq('season_id', seasonId)
    .order('total_points', { ascending: false })

  return (data || []).map(row => {
    const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      user_id: row.user_id,
      total_points: row.total_points ?? 0,
      challenges_solved: row.challenges_solved ?? 0,
      codename: row.codename ?? null,
      username: prof?.username ?? 'Unknown',
      avatar_url: prof?.avatar_url ?? null,
    }
  })
}

export async function getSeasonSpectators(seasonId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ctf_season_spectators')
    .select('user_id, profiles:user_id (username, avatar_url)')
    .eq('season_id', seasonId)

  return (data || []).map(row => {
    const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      user_id: row.user_id,
      username: prof?.username ?? 'Unknown',
      avatar_url: prof?.avatar_url ?? null,
    }
  })
}

export async function addSeasonSpectator(seasonId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .maybeSingle()
  if (!profile) return { error: 'User not found' }

  const { error } = await supabase
    .from('ctf_season_spectators')
    .insert({ season_id: seasonId, user_id: profile.id, added_by: user.id })
  if (error) {
    if (error.message?.includes('duplicate key')) return { error: 'Already a spectator' }
    return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  }
  const { data: season } = await supabase.from('ctf_seasons').select('slug, name').eq('id', seasonId).maybeSingle()
  if (season?.slug) {
    await notifyUser({
      recipientId: profile.id,
      actorId: user.id,
      type: 'spectator_invite',
      title: 'You were invited to spectate',
      message: `You can now watch ${season.name || 'this season'} live.`,
      href: `/ctf/seasons/${season.slug}/spectate`,
      metadata: { season_id: seasonId },
      dedupeKey: `spectator:${seasonId}`,
    })
  }
  revalidatePath('/admin')
  return { success: true }
}

export async function removeSeasonSpectator(seasonId: string, userId: string) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ctf_season_spectators')
    .delete()
    .eq('season_id', seasonId)
    .eq('user_id', userId)
  if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  revalidatePath('/admin')
  return { success: true }
}

export async function adjustSeasonScore(seasonId: string, userId: string, totalPoints: number, challengesSolved: number) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ctf_season_participants')
    .update({ total_points: totalPoints, challenges_solved: challengesSolved })
    .eq('season_id', seasonId)
    .eq('user_id', userId)
  if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  revalidatePath('/admin')
  return { success: true }
}
