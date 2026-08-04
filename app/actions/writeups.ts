'use server'

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

  if (error) return { error: error.message }

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

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('writeup_votes')
      .upsert({
        user_id: user.id,
        writeup_id: writeupId,
        vote,
      }, { onConflict: 'user_id,writeup_id' })

    if (error) return { error: error.message }
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
