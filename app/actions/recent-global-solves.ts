'use server'

import { createClient } from '@/lib/supabase/server'

export interface RecentSolve {
  user_id: string
  username: string
  avatar_url: string | null
  challenge_id: string
  title: string
  category: string
  points: number
  solved_at: string
}

export async function getRecentGlobalSolves(): Promise<RecentSolve[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_recent_global_solves')
  return (data || []) as RecentSolve[]
}