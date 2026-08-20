'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logEvent'
import { validateRegex } from '@/lib/utils/regex-golf'

export async function getActivePuzzles() {
  const supabase = await createClient()

  const { data: puzzles } = await supabase
    .from('regex_golf_puzzles')
    .select('id, title, description, match_strings, reject_strings, difficulty, min_length, xp_reward, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return puzzles || []
}

export async function submitRegex(puzzleId: string, regex: string, timeSeconds: number) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!regex.trim()) {
    return { error: 'Regex cannot be empty' }
  }

  const { data: puzzle } = await supabase
    .from('regex_golf_puzzles')
    .select('id, match_strings, reject_strings, min_length, xp_reward')
    .eq('id', puzzleId)
    .eq('is_active', true)
    .single()

  if (!puzzle) {
    return { error: 'Puzzle not found' }
  }

  const { data: existingSolve } = await supabase
    .from('regex_golf_solves')
    .select('id')
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzleId)
    .maybeSingle()

  if (existingSolve) {
    return { error: 'Already solved this puzzle' }
  }

  const result = validateRegex(regex, puzzle.match_strings, puzzle.reject_strings)

  if (!result.valid) {
    return { error: `Invalid regex: ${result.error}` }
  }

  if (!result.matchesAll) {
    return { error: 'Regex does not match all required strings' }
  }

  if (!result.rejectsAll) {
    return { error: 'Regex does not reject all forbidden strings' }
  }

  const { data: solutionLength } = await supabase.rpc('get_puzzle_solution_length', {
    p_puzzle_id: puzzleId,
  })

  const regexLength = regex.length

  if (puzzle.min_length && regexLength > puzzle.min_length) {
    return { error: `Regex too long. Reference solution is ${puzzle.min_length} chars, yours is ${regexLength}.` }
  }

  if ((solutionLength ?? Number.MAX_SAFE_INTEGER) < regexLength) {
    return { error: `Regex must be shorter than or equal to the reference solution (${solutionLength} chars).` }
  }

  const { error: insertError } = await supabase
    .from('regex_golf_solves')
    .insert({
      user_id: user.id,
      puzzle_id: puzzleId,
      submitted_regex: regex,
      regex_length: regexLength,
      time_seconds: timeSeconds,
    })

  if (insertError) {
    if (insertError.message?.includes('regex_golf_solves_user_id_puzzle_id_key')) {
      return { error: 'Already solved this puzzle' }
    }
    await logEvent({ endpoint: 'regex-golf.submitRegex', status: 'error', durationMs: Date.now() - start, errorMessage: insertError.message, userId: user.id })
    return { error: 'Submission failed' }
  }

  await logEvent({ endpoint: 'regex-golf.submitRegex', status: 'success', durationMs: Date.now() - start, userId: user.id })

  const { addXp } = await import('@/app/actions/gamification')
  await addXp(puzzle.xp_reward || 20, 'regex_golf')

  revalidatePath('/regex-golf')
  return { success: true, xp: puzzle.xp_reward || 20 }
}

export async function getUserSolves() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('regex_golf_solves')
    .select('puzzle_id, submitted_regex, regex_length, time_seconds, created_at')
    .eq('user_id', user.id)

  return data ?? []
}
