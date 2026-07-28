'use server'

import { createClient } from '@/lib/supabase/server'

export interface StreakResult {
  current_streak: number
  longest_streak: number
  last_active_date: string | null
}

export async function checkAndUpdateStreak(): Promise<StreakResult | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const today = new Date().toISOString().split('T')[0]
  const lastActive = profile.last_active_date

  // Same day — no update needed
  if (lastActive === today) {
    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_active_date: profile.last_active_date,
    }
  }

  let newStreak = profile.current_streak
  let newLongest = profile.longest_streak

  if (!lastActive) {
    // First ever visit
    newStreak = 1
  } else {
    const lastDate = new Date(lastActive)
    const todayDate = new Date(today)
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 1) {
      // Consecutive day — increment
      newStreak = profile.current_streak + 1
    } else if (diffDays > 1) {
      // Streak broken — reset to 1
      newStreak = 1
    }
  }

  newLongest = Math.max(newLongest, newStreak)

  const { data: updated } = await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
    })
    .eq('id', user.id)
    .select('current_streak, longest_streak, last_active_date')
    .single()

  return updated ?? {
    current_streak: newStreak,
    longest_streak: newLongest,
    last_active_date: today,
  }
}

export async function getStreak(): Promise<StreakResult | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Check if streak needs updating
  const today = new Date().toISOString().split('T')[0]
  if (profile.last_active_date !== today) {
    return checkAndUpdateStreak()
  }

  return {
    current_streak: profile.current_streak,
    longest_streak: profile.longest_streak,
    last_active_date: profile.last_active_date,
  }
}
