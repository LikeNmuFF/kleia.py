'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StreakMember {
  id: string
  username: string
  avatar_url: string | null
  current_streak: number
  longest_streak: number
}

export interface LandingData {
  memberCount: number
  postCount: number
  challengeCount: number
  onlineCount: number
  topStreaks: StreakMember[]
}

export function useLandingData() {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const load = async () => {
      const [members, posts, challenges, online, streaks] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('ctf_challenges').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'online'),
        supabase
          .from('profiles')
          .select('id, username, avatar_url, current_streak, longest_streak')
          .gt('current_streak', 0)
          .order('current_streak', { ascending: false })
          .limit(8),
      ])

      if (cancelled) return

      setData({
        memberCount: members.count ?? 0,
        postCount: posts.count ?? 0,
        challengeCount: challenges.count ?? 0,
        onlineCount: online.count ?? 0,
        topStreaks: (streaks.data as StreakMember[] | null) ?? [],
      })
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading }
}
