'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceState {
  user_id: string
  online_at: string
}

export function usePresence(userId: string | undefined) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Single DB write: set online on mount
    supabase
      .from('profiles')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', userId)

    // Presence channel — broadcasts via WebSocket, zero DB writes
    const channel = supabase.channel(`presence:${userId}`, {
      config: { presence: { key: userId } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {})
      .on('presence', { event: 'join' }, () => {})
      .on('presence', { event: 'leave' }, () => {})
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          } satisfies PresenceState)
        }
      })

    // Single DB write: set offline on unload
    const handleUnload = () => {
      navigator.sendBeacon(
        '/api/presence',
        JSON.stringify({ userId, status: 'offline' })
      )
    }
    window.addEventListener('beforeunload', handleUnload)

    // Tab visibility — broadcast presence only, no DB writes
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      // Single DB write: set offline on unmount
      supabase
        .from('profiles')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('id', userId)

      channel.unsubscribe()
      window.removeEventListener('beforeunload', handleUnload)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userId])
}
