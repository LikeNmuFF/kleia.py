'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitWriteup(challengeId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!title.trim()) return { error: 'Title cannot be empty' }
  if (!content.trim()) return { error: 'Content cannot be empty' }

  const { data: submission } = await supabase
    .from('ctf_submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('is_correct', true)
    .maybeSingle()

  if (!submission) return { error: 'You must solve this challenge before writing a writeup' }

  const { data: existing } = await supabase
    .from('writeups')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  if (existing) return { error: 'You already have a writeup for this challenge' }

  const { error } = await supabase
    .from('writeups')
    .insert({
      user_id: user.id,
      challenge_id: challengeId,
      title: title.trim(),
      content: content.trim(),
    })

  if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }

  const { addXp } = await import('./gamification')
  await addXp(20, 'writeup')

  revalidatePath('/ctf')
  revalidatePath(`/ctf/${challengeId}`)
  revalidatePath(`/ctf/${challengeId}/writeups`)
  return { success: true }
}

export async function getWriteupsForChallenge(challengeId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('writeups')
    .select(`
      id,
      user_id,
      challenge_id,
      title,
      content,
      upvotes,
      downvotes,
      created_at,
      profiles:user_id (username)
    `)
    .eq('challenge_id', challengeId)
    .order('upvotes', { ascending: false })

  return (data || []).map((w) => ({
    ...w,
    username: (w.profiles as any)?.username || 'Anonymous',
  }))
}

export async function voteWriteup(writeupId: string, vote: 1 | -1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: writeup } = await supabase
    .from('writeups')
    .select('id')
    .eq('id', writeupId)
    .maybeSingle()

  if (!writeup) return { error: 'Writeup not found' }

  const { data: existingVote } = await supabase
    .from('writeup_votes')
    .select('vote')
    .eq('user_id', user.id)
    .eq('writeup_id', writeupId)
    .maybeSingle()

  if (existingVote && existingVote.vote === vote) {
    const { error } = await supabase
      .from('writeup_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('writeup_id', writeupId)

    if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  } else {
    const { error } = await supabase
      .from('writeup_votes')
      .upsert({
        user_id: user.id,
        writeup_id: writeupId,
        vote,
      }, { onConflict: 'user_id,writeup_id' })

    if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  }

  const { data: votes } = await supabase
    .from('writeup_votes')
    .select('vote')
    .eq('writeup_id', writeupId)

  const upvotes = (votes || []).filter((v) => v.vote === 1).length
  const downvotes = (votes || []).filter((v) => v.vote === -1).length

  await supabase
    .from('writeups')
    .update({ upvotes, downvotes })
    .eq('id', writeupId)

  revalidatePath('/ctf')
  return { success: true, upvotes, downvotes }
}

export async function getUserWriteup(challengeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('writeups')
    .select('id, title, content, created_at')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  return data
}

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff)
  return d.toISOString().split('T')[0]
}

export async function getViewCost(): Promise<{ cost: number; freeViewsRemaining: number; totalViewsThisWeek: number; userXp: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cost: 0, freeViewsRemaining: 1, totalViewsThisWeek: 0, userXp: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('writeup_view_count, writeup_view_week, total_xp')
    .eq('id', user.id)
    .single()

  if (!profile) return { cost: 0, freeViewsRemaining: 1, totalViewsThisWeek: 0, userXp: 0 }

  const currentMonday = getMonday(new Date())
  let viewCount = profile.writeup_view_count || 0

  if (profile.writeup_view_week !== currentMonday) {
    viewCount = 0
  }

  const freeViewsRemaining = Math.max(0, 1 - viewCount)
  let cost = 0

  if (freeViewsRemaining <= 0) {
    cost = Math.min(75, 25 + (viewCount - 1) * 25)
  }

  return {
    cost,
    freeViewsRemaining,
    totalViewsThisWeek: viewCount,
    userXp: profile.total_xp || 0,
  }
}

export async function viewWriteup(writeupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: writeup } = await supabase
    .from('writeups')
    .select('id')
    .eq('id', writeupId)
    .maybeSingle()

  if (!writeup) return { error: 'Writeup not found' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('writeup_view_count, writeup_view_week, total_xp')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const currentMonday = getMonday(new Date())
  let viewCount = profile.writeup_view_count || 0

  if (profile.writeup_view_week !== currentMonday) {
    viewCount = 0
  }

  const freeViewsRemaining = Math.max(0, 1 - viewCount)
  let cost = 0

  if (freeViewsRemaining <= 0) {
    cost = Math.min(75, 25 + (viewCount - 1) * 25)
  }

  if (cost > 0 && (profile.total_xp || 0) < cost) {
    return { error: `Not enough XP. Need ${cost} XP, have ${profile.total_xp || 0} XP` }
  }

  if (cost > 0) {
    const { addXp } = await import('./gamification')
    await addXp(-cost, 'writeup_view')
  }

  await supabase
    .from('profiles')
    .update({
      writeup_view_count: viewCount + 1,
      writeup_view_week: currentMonday,
    })
    .eq('id', user.id)

  return { success: true, cost }
}
