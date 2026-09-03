'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getNextSeasonBoundaryDelay } from '@/app/actions/competition-status'

export default function SeasonBoundaryRefresh({
  season,
}: {
  season?: { status?: string | null; start_date: string; end_date: string }
}) {
  const router = useRouter()

  useEffect(() => {
    if (!season) return
    const delay = getNextSeasonBoundaryDelay(season)
    if (delay === null) return

    // Browsers cap timeouts at a signed 32-bit integer. Re-check long schedules daily.
    const timeout = window.setTimeout(
      () => router.refresh(),
      Math.min(delay + 50, 24 * 60 * 60 * 1000)
    )
    return () => window.clearTimeout(timeout)
  }, [router, season])

  return null
}
