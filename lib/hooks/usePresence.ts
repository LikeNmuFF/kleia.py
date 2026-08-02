'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { retrackPresence, useTrackPresence } from '@/lib/hooks/useOnlineUsers'

export function usePresence(userId: string | undefined) {
  // Live presence on the shared channel (site-wide online status)
  useTrackPresence(userId)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Single DB write: set online on mount
    supabase
      .from('profiles')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', userId)

    // Single DB write: set offline on unload
    const handleUnload = () => {
      navigator.sendBeacon(
        '/api/presence',
        JSON.stringify({ userId, status: 'offline' })
      )
    }
    window.addEventListener('beforeunload', handleUnload)

    // Tab visibility — re-publish presence when the tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        retrackPresence(userId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      // Single DB write: set offline on unmount
      supabase
        .from('profiles')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('id', userId)

      window.removeEventListener('beforeunload', handleUnload)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userId])
}
