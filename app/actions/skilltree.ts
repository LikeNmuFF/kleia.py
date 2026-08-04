'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSkillTree() {
  const supabase = await createClient()

  const { data: nodes, error } = await supabase
    .from('skill_nodes')
    .select('*')
    .order('category', { ascending: true })
    .order('difficulty', { ascending: true })

  if (error) {
    console.error('Error fetching skill tree:', error)
    return []
  }

  return nodes || []
}

export async function getUserSkillProgress() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: progress, error } = await supabase
    .from('user_skill_progress')
    .select('node_id, unlocked, unlocked_at')
    .eq('user_id', user.id)
    .eq('unlocked', true)

  if (error) {
    console.error('Error fetching skill progress:', error)
    return []
  }

  return progress || []
}

export async function checkAndUnlockNodes(userId: string) {
  const supabase = await createClient()

  const { count: solves, error: countError } = await supabase
    .from('ctf_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_correct', true)

  if (countError) {
    console.error('Error counting solves:', countError)
    return
  }

  const categorySolves: Record<string, number> = {
    web: 0,
    crypto: 0,
    forensics: 0,
    misc: 0,
  }

  const { data: submissions, error: subError } = await supabase
    .from('ctf_submissions')
    .select('challenge_id')
    .eq('user_id', userId)
    .eq('is_correct', true)

  if (subError || !submissions) {
    console.error('Error fetching submissions:', subError)
    return
  }

  for (const sub of submissions) {
    const { data: challenge } = await supabase
      .from('ctf_challenges')
      .select('category')
      .eq('id', sub.challenge_id)
      .single()

    if (challenge && challenge.category in categorySolves) {
      categorySolves[challenge.category]++
    }
  }

  const { data: nodes, error: nodesError } = await supabase
    .from('skill_nodes')
    .select('*')

  if (nodesError || !nodes) {
    console.error('Error fetching skill nodes:', nodesError)
    return
  }

  for (const node of nodes) {
    const solvesInCategory = categorySolves[node.category] || 0

    if (solvesInCategory >= node.required_solves) {
      const { data: existing, error: existingError } = await supabase
        .from('user_skill_progress')
        .select('node_id')
        .eq('user_id', userId)
        .eq('node_id', node.id)
        .single()

      if (!existing) {
        const { error: insertError } = await supabase
          .from('user_skill_progress')
          .insert({
            user_id: userId,
            node_id: node.id,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error unlocking node:', insertError)
        }
      }
    }
  }
}