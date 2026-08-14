'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logEvent'
import { logSecurityEvent } from '@/lib/security-log'
import { hashFlag } from '@/lib/utils/ctf'
import { checkAndUnlockNodes } from './skilltree'
import { creditSeasonSolve } from './competition'
import { getEffectiveSeasonStatus } from './competition-status'

const VALID_CATEGORIES = ['web', 'crypto', 'forensics', 'misc']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

const FLAG_WINDOW_MS = 30_000
const FLAG_MAX_WRONG_PER_WINDOW = 5
const FLAG_MAX_TOTAL_PER_HOUR = 30

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

function isValidCategory(c: string): c is (typeof VALID_CATEGORIES)[number] {
  return VALID_CATEGORIES.includes(c)
}

function isValidDifficulty(d: string): d is (typeof VALID_DIFFICULTIES)[number] {
  return VALID_DIFFICULTIES.includes(d)
}

async function syncTeamStats(userId: string) {
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

  const { count: totalSolves } = await supabase
    .from('ctf_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('is_correct', true)
    .in('user_id', memberIds)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('total_xp')
    .in('id', memberIds)

  const totalXp = profiles?.reduce((sum, p) => sum + (p.total_xp || 0), 0) || 0

  await supabase
    .from('teams')
    .update({ total_xp: totalXp, total_solves: totalSolves || 0 })
    .eq('id', membership.team_id)
}

async function resolveLearnLink(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicSlug?: string | null,
  lessonSlug?: string | null
): Promise<{ learn_topic_slug: string | null; learn_lesson_slug: string | null }> {
  const t = topicSlug?.trim()
  const l = lessonSlug?.trim()

  if (!t || !l) return { learn_topic_slug: null, learn_lesson_slug: null }

  const { data: topic } = await supabase
    .from('learn_topics')
    .select('id')
    .eq('slug', t)
    .maybeSingle()

  if (!topic) return { learn_topic_slug: null, learn_lesson_slug: null }

  const { data: lesson } = await supabase
    .from('learn_lessons')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('slug', l)
    .maybeSingle()

  if (!lesson) return { learn_topic_slug: null, learn_lesson_slug: null }

  return { learn_topic_slug: t, learn_lesson_slug: l }
}

export async function submitFlag(challengeId: string, submittedFlag: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!submittedFlag.trim()) {
    return { error: 'Flag cannot be empty' }
  }

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('id, flag_hash, season_id')
    .eq('id', challengeId)
    .eq('status', 'approved')
    .single()

  if (!challenge) {
    return { error: 'Challenge not found' }
  }

  if (challenge.season_id) {
    const { data: season } = await supabase
      .from('ctf_seasons')
      .select('status, start_date, end_date')
      .eq('id', challenge.season_id)
      .single()
    const status = getEffectiveSeasonStatus(season ?? { status: 'ended', start_date: '', end_date: '' })

    if (status === 'upcoming' || status === 'paused') {
      return { error: 'Submissions are disabled for this season right now' }
    }
    if (status === 'live') {
      const { data: part } = await supabase
        .from('ctf_season_participants')
        .select('user_id')
        .eq('season_id', challenge.season_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!part) {
        return { error: 'Only participants can solve this during the season' }
      }
    }
  } else {
    const { data: seasonLinks } = await supabase
      .from('ctf_season_challenges')
      .select('seasons:season_id (status, start_date, end_date)')
      .eq('challenge_id', challengeId)
    if (seasonLinks?.length) {
      const statuses = seasonLinks.map((link) => {
        const season = Array.isArray(link.seasons) ? link.seasons[0] : link.seasons
        return season ? getEffectiveSeasonStatus(season) : null
      })
      if (statuses.some((s) => s === 'paused' || s === 'ended')) {
        return { error: 'Submissions are disabled for this season right now' }
      }
    }
  }

  const isCorrect = hashFlag(submittedFlag.trim()) === challenge.flag_hash

  if (!isCorrect) {
    const windowStart = new Date(Date.now() - FLAG_WINDOW_MS).toISOString()
    const hourStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const [{ count: windowWrong }, { count: hourWrong }] = await Promise.all([
      supabase
        .from('ctf_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('is_correct', false)
        .gte('created_at', windowStart),
      supabase
        .from('ctf_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_correct', false)
        .gte('created_at', hourStart),
    ])

    if ((windowWrong ?? 0) >= FLAG_MAX_WRONG_PER_WINDOW) {
      await logSecurityEvent({
        eventType: 'flag_bruteforce',
        severity: (windowWrong ?? 0) >= 10 ? 'high' : 'medium',
        userId: user.id,
        challengeId,
        details: { windowWrong: windowWrong ?? 0 },
      })
      return { error: 'Too many incorrect flags. Try again in a moment.' }
    }

    if ((hourWrong ?? 0) >= FLAG_MAX_TOTAL_PER_HOUR) {
      await logSecurityEvent({
        eventType: 'flag_bruteforce_hourly',
        severity: 'high',
        userId: user.id,
        challengeId,
        details: { hourWrong: hourWrong ?? 0 },
      })
      return { error: 'Too many flags submitted. Try again later.' }
    }
  }

  const { error: insertError } = await supabase
    .from('ctf_submissions')
    .insert({
      user_id: user.id,
      challenge_id: challengeId,
      submitted_flag: submittedFlag.trim(),
      is_correct: isCorrect,
    })
    .select('id')

  if (insertError) {
    if (insertError.message?.includes('ctf_submissions_one_correct_idx')) {
      await logEvent({ endpoint: 'ctf.submitFlag', status: 'error', durationMs: Date.now() - start, errorMessage: 'Already solved', userId: user.id })
      return { error: 'Already solved this challenge' }
    }
    await logEvent({ endpoint: 'ctf.submitFlag', status: 'error', durationMs: Date.now() - start, errorMessage: insertError.message, userId: user.id })
    return { error: 'Submission failed' }
  }

  await logEvent({ endpoint: 'ctf.submitFlag', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath(`/ctf/${challengeId}`)
  revalidatePath('/ctf')
  revalidatePath('/ctf/leaderboard')

  if (isCorrect) {
    const { addXp, completeMission } = await import('./gamification')
    await Promise.all([
      addXp(15, 'ctf_solve'),
      completeMission('ctf_solve', true),
      checkAndUnlockNodes(user.id),
      creditSeasonSolve(user.id, challengeId),
    ])
  }

  return {
    success: true,
    isCorrect,
    message: isCorrect ? 'Correct flag!' : 'Incorrect flag. Try again.',
  }
}

export async function createChallenge(data: {
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  flag: string
  hint?: string
  file_url?: string
  link_url?: string
  author?: string
  learn_topic_slug?: string
  learn_lesson_slug?: string
}) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    await logEvent({ endpoint: 'ctf.createChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unauthorized', userId: (await supabase.auth.getUser()).data.user?.id })
    return { error: 'Unauthorized' }
  }

  if (!data.title.trim()) return { error: 'Title cannot be empty' }
  if (!data.description.trim()) return { error: 'Description cannot be empty' }
  if (!isValidCategory(data.category)) return { error: 'Invalid category' }
  if (!isValidDifficulty(data.difficulty)) return { error: 'Invalid difficulty' }
  if (!Number.isInteger(data.points) || data.points < 1) return { error: 'Points must be a positive integer' }
  if (!data.flag.trim()) return { error: 'Flag cannot be empty' }

  const { data: { user } } = await supabase.auth.getUser()

  const learnLink = await resolveLearnLink(
    supabase,
    data.learn_topic_slug,
    data.learn_lesson_slug
  )

  const { error } = await supabase
    .from('ctf_challenges')
    .insert({
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      difficulty: data.difficulty,
      points: data.points,
      flag_hash: hashFlag(data.flag.trim()),
      hint: data.hint?.trim() || null,
      file_url: data.file_url?.trim() || null,
      link_url: data.link_url?.trim() || null,
      author: data.author?.trim() || null,
      status: 'approved',
      created_by: user!.id,
      ...learnLink,
    })

  if (error) {
    await logEvent({ endpoint: 'ctf.createChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user?.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'ctf.createChallenge', status: 'success', durationMs: Date.now() - start, userId: user?.id })
  revalidatePath('/ctf')
  return { success: true }
}

export async function createSeasonChallenge(seasonId: string, data: {
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  flag: string
  hint?: string
  file_url?: string
  link_url?: string
  author?: string
  learn_topic_slug?: string
  learn_lesson_slug?: string
}) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    await logEvent({ endpoint: 'ctf.createSeasonChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unauthorized', userId: (await supabase.auth.getUser()).data.user?.id })
    return { error: 'Unauthorized' }
  }

  const { data: season } = await supabase
    .from('ctf_seasons')
    .select('id, slug')
    .eq('id', seasonId)
    .single()
  if (!season) return { error: 'Season not found' }

  if (!data.title.trim()) return { error: 'Title cannot be empty' }
  if (!data.description.trim()) return { error: 'Description cannot be empty' }
  if (!isValidCategory(data.category)) return { error: 'Invalid category' }
  if (!isValidDifficulty(data.difficulty)) return { error: 'Invalid difficulty' }
  if (!Number.isInteger(data.points) || data.points < 1) return { error: 'Points must be a positive integer' }
  if (!data.flag.trim()) return { error: 'Flag cannot be empty' }

  const { data: { user } } = await supabase.auth.getUser()

  const learnLink = await resolveLearnLink(
    supabase,
    data.learn_topic_slug,
    data.learn_lesson_slug
  )

  const { data: inserted, error: insertError } = await supabase
    .from('ctf_challenges')
    .insert({
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      difficulty: data.difficulty,
      points: data.points,
      flag_hash: hashFlag(data.flag.trim()),
      hint: data.hint?.trim() || null,
      file_url: data.file_url?.trim() || null,
      link_url: data.link_url?.trim() || null,
      author: data.author?.trim() || null,
      status: 'approved',
      season_id: seasonId,
      created_by: user!.id,
      ...learnLink,
    })
    .select('id')
    .single()

  if (insertError) {
    await logEvent({ endpoint: 'ctf.createSeasonChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: insertError.message, userId: user?.id })
    return { error: insertError.message }
  }

  const { error: linkError } = await supabase
    .from('ctf_season_challenges')
    .insert({ season_id: seasonId, challenge_id: inserted!.id, bonus_points: 0 })

  if (linkError) {
    await logEvent({ endpoint: 'ctf.createSeasonChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: linkError.message, userId: user?.id })
    return { error: linkError.message }
  }

  await logEvent({ endpoint: 'ctf.createSeasonChallenge', status: 'success', durationMs: Date.now() - start, userId: user?.id })
  revalidatePath(`/admin/seasons/${season.slug}`)
  revalidatePath('/ctf')
  return { success: true }
}

export async function submitChallenge(formData: FormData) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const difficulty = formData.get('difficulty') as string
  const points = parseInt(formData.get('points') as string)
  const flag = formData.get('flag') as string
  const hint = formData.get('hint') as string
  const author = formData.get('author') as string
  const link_url = formData.get('link_url') as string
  const file_url = formData.get('file_url') as string

  if (!title?.trim()) redirect('/ctf/submit?error=Title is required')
  if (!description?.trim()) redirect('/ctf/submit?error=Description is required')
  if (!isValidCategory(category)) redirect('/ctf/submit?error=Invalid category')
  if (!isValidDifficulty(difficulty)) redirect('/ctf/submit?error=Invalid difficulty')
  if (!Number.isInteger(points) || points < 1) redirect('/ctf/submit?error=Points must be a positive integer')
  if (!flag?.trim()) redirect('/ctf/submit?error=Flag is required')

  const learnLink = await resolveLearnLink(
    supabase,
    formData.get('learn_topic_slug') as string,
    formData.get('learn_lesson_slug') as string
  )

  const { error } = await supabase
    .from('ctf_challenges')
    .insert({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      points,
      flag_hash: hashFlag(flag.trim()),
      hint: hint?.trim() || null,
      file_url: file_url?.trim() || null,
      link_url: link_url?.trim() || null,
      author: author?.trim() || null,
      status: 'pending',
      created_by: user.id,
      ...learnLink,
    })

  if (error) {
    await logEvent({ endpoint: 'ctf.submitChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    redirect('/ctf/submit?error=' + encodeURIComponent(error.message))
  }

  await logEvent({ endpoint: 'ctf.submitChallenge', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/ctf')
  redirect('/ctf/submit?success=true')
}

export async function approveChallenge(id: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('ctf_challenges')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    await logEvent({ endpoint: 'ctf.approveChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'ctf.approveChallenge', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf')
  return { success: true }
}

export async function rejectChallenge(id: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('ctf_challenges')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) {
    await logEvent({ endpoint: 'ctf.rejectChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'ctf.rejectChallenge', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf')
  return { success: true }
}

export async function updateChallenge(
  id: string,
  data: {
    title?: string
    description?: string
    category?: string
    difficulty?: string
    points?: number
    flag?: string
    hint?: string
    file_url?: string
    link_url?: string
    author?: string
    status?: string
    is_active?: boolean
    learn_topic_slug?: string
    learn_lesson_slug?: string
  }
) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    const { data: { user } } = await supabase.auth.getUser()
    await logEvent({ endpoint: 'ctf.updateChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unauthorized', userId: user?.id })
    return { error: 'Unauthorized' }
  }

  const updateData: Record<string, unknown> = {}

  if (data.title !== undefined) {
    if (!data.title.trim()) return { error: 'Title cannot be empty' }
    updateData.title = data.title.trim()
  }
  if (data.description !== undefined) {
    if (!data.description.trim()) return { error: 'Description cannot be empty' }
    updateData.description = data.description.trim()
  }
  if (data.category !== undefined) {
    if (!isValidCategory(data.category)) return { error: 'Invalid category' }
    updateData.category = data.category
  }
  if (data.difficulty !== undefined) {
    if (!isValidDifficulty(data.difficulty)) return { error: 'Invalid difficulty' }
    updateData.difficulty = data.difficulty
  }
  if (data.points !== undefined) {
    if (!Number.isInteger(data.points) || data.points < 1) return { error: 'Points must be a positive integer' }
    updateData.points = data.points
  }
  if (data.flag !== undefined) {
    if (!data.flag.trim()) return { error: 'Flag cannot be empty' }
    updateData.flag_hash = hashFlag(data.flag.trim())
  }
  if (data.hint !== undefined) {
    updateData.hint = data.hint?.trim() || null
  }
  if (data.file_url !== undefined) {
    updateData.file_url = data.file_url?.trim() || null
  }
  if (data.link_url !== undefined) {
    updateData.link_url = data.link_url?.trim() || null
  }
  if (data.author !== undefined) {
    updateData.author = data.author?.trim() || null
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.is_active !== undefined) {
    updateData.is_active = data.is_active
  }
  if (data.learn_topic_slug !== undefined || data.learn_lesson_slug !== undefined) {
    const learnLink = await resolveLearnLink(
      supabase,
      data.learn_topic_slug,
      data.learn_lesson_slug
    )
    updateData.learn_topic_slug = learnLink.learn_topic_slug
    updateData.learn_lesson_slug = learnLink.learn_lesson_slug
  }

  const { error } = await supabase
    .from('ctf_challenges')
    .update(updateData)
    .eq('id', id)

  if (error) {
    const { data: { user } } = await supabase.auth.getUser()
    await logEvent({ endpoint: 'ctf.updateChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user?.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'ctf.updateChallenge', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf')
  return { success: true }
}

export async function deleteChallenge(id: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    const { data: { user } } = await supabase.auth.getUser()
    await logEvent({ endpoint: 'ctf.deleteChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unauthorized', userId: user?.id })
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('ctf_challenges')
    .delete()
    .eq('id', id)

  if (error) {
    const { data: { user } } = await supabase.auth.getUser()
    await logEvent({ endpoint: 'ctf.deleteChallenge', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user?.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'ctf.deleteChallenge', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/ctf')
  return { success: true }
}

export async function getChallenges() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('ctf_challenges')
    .select('id, title, category, difficulty, points, hint, author, created_at')
    .eq('status', 'approved')
    .order('category', { ascending: true })

  const { data: challenges } = await query

  if (!challenges) return []

  if (!user) {
    return challenges.map(c => ({ ...c, solved: false }))
  }

  const { data: submissions } = await supabase
    .from('ctf_submissions')
    .select('challenge_id')
    .eq('user_id', user.id)
    .eq('is_correct', true)

  const solvedIds = new Set(submissions?.map(s => s.challenge_id) || [])

  return challenges.map(c => ({
    ...c,
    solved: solvedIds.has(c.id),
  }))
}

export async function getChallenge(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('id, title, description, category, difficulty, points, hint, file_url, link_url, author, created_at, created_by')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!challenge) return null

  let solved = false
  if (user) {
    const { data: sub } = await supabase
      .from('ctf_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', id)
      .eq('is_correct', true)
      .maybeSingle()

    solved = !!sub
  }

  return { ...challenge, solved }
}

export async function getLeaderboard() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ctf_leaderboard')
    .select('user_id, username, avatar_url, solved_challenges, total_points')

  return data || []
}
