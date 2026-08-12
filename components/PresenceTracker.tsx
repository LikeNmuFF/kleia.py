'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePresence } from '@/lib/hooks/usePresence'
import { checkAndUpdateStreak } from '@/app/actions/streak'

export default function PresenceTracker() {
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
        checkAndUpdateStreak()
      }
    })()
  }, [])

  usePresence(userId)

  return null
}
