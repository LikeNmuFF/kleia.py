'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Refreshes the current route whenever the given season's row changes
 * (status, start_date, end_date). Lets participants/spectators see a
 * start/pause/end immediately instead of requiring a manual reload.
 */
export function useSeasonStatusRealtime(seasonId: string | undefined) {
  const router = useRouter()

  useEffect(() => {
    if (!seasonId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`season-status:${seasonId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ctf_seasons',
          filter: `id=eq.${seasonId}`,
        },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [seasonId, router])
}
