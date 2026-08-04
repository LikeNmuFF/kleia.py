'use server'

import { createClient } from '@/lib/supabase/server'
import { addXp } from '@/app/actions/gamification'

export async function unlockHint(challengeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: challenge } = await supabase
    .from('ctf_challenges')
    .select('hint, hint_xp_cost')
    .eq('id', challengeId)
    .single()

  if (!challenge?.hint) throw new Error('No hint available')

  // Check if user already unlocked this hint
  const { data: existingUnlock } = await supabase
    .from('user_hint_unlocks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  if (existingUnlock) {
    // Already unlocked, just return hint
    return { hint: challenge.hint, xpSpent: 0 }
  }

  // If hint_xp_cost is zero or not set, free hint
  if (!challenge.hint_xp_cost || challenge.hint_xp_cost <= 0) {
    // Insert unlock record (free)
    await supabase.from('user_hint_unlocks').insert({
      user_id: user.id,
      challenge_id: challengeId,
      xp_cost: 0,
    })
    return { hint: challenge.hint, xpSpent: 0 }
  }

  // Check user's XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', user.id)
    .single()

  if ((profile?.total_xp ?? 0) < challenge.hint_xp_cost) {
    throw new Error(`Not enough XP. Need ${challenge.hint_xp_cost} XP.`)
  }

  // Deduct XP and record unlock
  await addXp(-challenge.hint_xp_cost, 'hint_unlock')
  await supabase.from('user_hint_unlocks').insert({
    user_id: user.id,
    challenge_id: challengeId,
    xp_cost: challenge.hint_xp_cost,
  })

  return { hint: challenge.hint, xpSpent: challenge.hint_xp_cost }
}