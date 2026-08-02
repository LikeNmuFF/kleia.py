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
}

export default function CTFAdminTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('ctf_challenges')
        .select('id, title, description, category, difficulty, points, hint, is_active, file_url, link_url, author, status, created_at')
        .order('created_at', { ascending: false })
      setChallenges((data as Challenge[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return <AdminCTFClient challenges={challenges} />
}
