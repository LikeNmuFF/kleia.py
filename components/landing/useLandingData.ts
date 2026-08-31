'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StreakMember {
  id: string
  username: string
  avatar_url: string | null
  current_streak: number
  longest_streak: number
  role?: string
}

export interface LandingData {
  memberCount: number
  postCount: number
  challengeCount: number
  onlineCount: number
  topStreaks: StreakMember[]
  feedback: LandingFeedback[]
}

export interface LandingFeedback {
  id: string
  title: string
  message: string
  rating: number
  display_name: string | null
  created_at: string
}

const ONLINE_WINDOW_MS = 3 * 60 * 1000
const POLL_INTERVAL_MS = 30_000

export function useLandingData() {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const load = async () => {
      const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString()
      const [members, posts, challenges, online, streaks, feedback] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('ctf_challenges').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('last_seen', onlineSince),
        supabase
          .from('profiles')
          .select('id, username, avatar_url, current_streak, longest_streak, role')
          .in('role', ['user', 'special'])
          .gt('current_streak', 0)
          .order('current_streak', { ascending: false })
          .limit(8),
        supabase
          .from('feedback_reports')
          .select('id, title, message, rating, display_name, created_at')
          .eq('type', 'app_feedback')
          .eq('allow_public', true)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (cancelled) return

      setData({
        memberCount: members.count ?? 0,
        postCount: posts.count ?? 0,
        challengeCount: challenges.count ?? 0,
        onlineCount: online.count ?? 0,
        topStreaks: (streaks.data as StreakMember[] | null) ?? [],
        feedback: (feedback.data as LandingFeedback[] | null) ?? [],
      })
      setLoading(false)
    }

    load()
    const poll = setInterval(load, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [])

  return { data, loading }
}
