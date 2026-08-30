'use client'

import { useEffect, useState } from 'react'
import { getAdminCTFData } from '@/app/actions/admin'
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
  ai_review_notes: string | null
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
      const data = await getAdminCTFData()
      setChallenges((data.challenges as Challenge[]) || [])
      setTopics((data.topics as TopicLink[]) || [])
      setLessons((data.lessons as LessonLink[]) || [])
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