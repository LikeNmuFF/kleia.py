'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminCTFClient from '@/app/(main)/admin/ctf/AdminCTFClient'

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  hint: string | null
  is_active: boolean
  file_url: string | null
  link_url: string | null
  author: string | null
  status: string
  created_at: string
  learn_topic_slug: string | null
  learn_lesson_slug: string | null
  season_id: string | null
}

interface TopicLink {
  id: string
  slug: string
  title: string
  icon: string
}

interface LessonLink {
  topic_id: string
  slug: string
  title: string
}

export default function CTFAdminTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [topics, setTopics] = useState<TopicLink[]>([])
  const [lessons, setLessons] = useState<LessonLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data }, { data: t }, { data: l }] = await Promise.all([
        supabase
          .from('ctf_challenges')
          .select('id, title, description, category, difficulty, points, hint, is_active, file_url, link_url, author, status, created_at, learn_topic_slug, learn_lesson_slug, season_id')
          .order('created_at', { ascending: false }),
        supabase
          .from('learn_topics')
          .select('id, slug, title, icon')
          .order('sort_order', { ascending: true }),
        supabase
          .from('learn_lessons')
          .select('topic_id, slug, title'),
      ])
      setChallenges((data as Challenge[]) || [])
      setTopics((t as TopicLink[]) || [])
      setLessons((l as LessonLink[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <AdminCTFClient
      challenges={challenges}
      topics={topics}
      lessons={lessons}
    />
  )
}