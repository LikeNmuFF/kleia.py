'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { pingPresence } from '@/app/actions/presence'

const PING_INTERVAL_MS = 60_000

export default function PresenceHeartbeat() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const ping = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session) return
      void pingPresence()
    }

    ping()
    interval = setInterval(ping, PING_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}