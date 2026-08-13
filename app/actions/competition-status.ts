export type SeasonStatus = 'upcoming' | 'live' | 'paused' | 'ended'

export interface SeasonRow {
  id: string
  name: string
  slug: string
  description: string | null
  theme: string | null
  start_date: string
  end_date: string
  is_active: boolean
  status?: string | null
}

/** Effective status: auto-starts 'upcoming' on start_date, auto-ends 'live'/'upcoming' after end_date. */
export function getEffectiveSeasonStatus(season: Pick<SeasonRow, 'status' | 'start_date' | 'end_date'>): SeasonStatus {
  const now = new Date().toISOString()
  const stored = season.status ?? 'upcoming'
  if (stored === 'paused') return 'paused'
  if (stored === 'ended') return 'ended'
  if (stored === 'live') {
    return season.end_date < now ? 'ended' : 'live'
  }
  if (season.start_date <= now) {
    return season.end_date < now ? 'ended' : 'live'
  }
  return 'upcoming'
}
