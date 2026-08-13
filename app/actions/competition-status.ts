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
  const today = new Date().toISOString().split('T')[0]
  const stored = season.status ?? 'upcoming'
  if (stored === 'paused') return 'paused'
  if (stored === 'ended') return 'ended'
  if (stored === 'live') {
    return season.end_date < today ? 'ended' : 'live'
  }
  if (season.start_date <= today) {
    return season.end_date < today ? 'ended' : 'live'
  }
  return 'upcoming'
}
