'use client'

import { useEffect, useState } from 'react'
import type { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type RealtimeChannel = ReturnType<ReturnType<typeof createClient>['channel']>

let online = new Set<string>()
let channel: RealtimeChannel | null = null
let initPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function applyState(state: Record<string, unknown>) {
  online = new Set(Object.keys(state))
  notify()
}

async function initChannel(userId?: string): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const supabase = createClient()

    let myId = userId
    if (!myId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      myId = user?.id
    }
    if (!myId) return

    const ch = supabase.channel('presence:global', {
      config: { presence: { key: myId } },
    })
    channel = ch

    ch.on('presence', { event: 'sync' }, () => {
      applyState(ch.presenceState() as Record<string, unknown>)
    }).subscribe(async (status: REALTIME_SUBSCRIBE_STATES) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          user_id: myId,
          online_at: new Date().toISOString(),
        })
      }
    })
  })()

  return initPromise
}

/**
 * Live set of online user ids, driven by a shared realtime presence channel.
 * Any component on the page reads the same set via this hook.
 */
export function useOnlineUsers(): Set<string> {
  const [state, setState] = useState<Set<string>>(() => new Set(online))

  useEffect(() => {
    const listener = () => setState(new Set(online))
    listeners.add(listener)
    setState(new Set(online))
    initChannel().catch(() => {})
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return state
}

/**
 * Ensure the current user is tracked on the shared presence channel so they
 * show up as online for everyone else (used by the site-wide tracker).
 */
export function useTrackPresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    initChannel(userId).catch(() => {})
  }, [userId])
}

/**
 * Re-publish presence, e.g. when a hidden tab becomes visible again.
 */
export function retrackPresence(userId: string | undefined) {
  if (!userId) return
  if (channel) {
    channel
      .track({ user_id: userId, online_at: new Date().toISOString() })
      .catch(() => {})
    return
  }
  initChannel(userId).catch(() => {})
}
