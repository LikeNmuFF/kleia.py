export type SeasonStatus = 'upcoming' | 'live' | 'paused' | 'ended'

export function getSeasonHintCost(priorUnlocks: number): number {
  return (Math.max(0, Math.floor(priorUnlocks)) + 1) * 25
}

export function canRevealSeasonChallenges(status: SeasonStatus, isParticipant: boolean): boolean {
  return status === 'live' && isParticipant
}

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
export function getEffectiveSeasonStatus(
  season: Pick<SeasonRow, 'status' | 'start_date' | 'end_date'>,
  currentTime: Date = new Date()
): SeasonStatus {
  const now = currentTime.toISOString()
  const stored = season.status ?? 'upcoming'
  if (stored === 'paused') return 'paused'
  if (stored === 'ended') return 'ended'
  if (stored === 'live') {
    return season.end_date <= now ? 'ended' : 'live'
  }
  if (season.start_date <= now) {
    return season.end_date <= now ? 'ended' : 'live'
  }
  return 'upcoming'
}

export function isSeasonRegistrationOpen(
  season: Pick<SeasonRow, 'status' | 'start_date' | 'end_date' | 'is_active'>,
  currentTime: Date = new Date()
): boolean {
  return season.is_active && getEffectiveSeasonStatus(season, currentTime) === 'upcoming'
}

/** Milliseconds until the schedule can next change without a database update. */
export function getNextSeasonBoundaryDelay(
  season: Pick<SeasonRow, 'status' | 'start_date' | 'end_date'>,
  currentTime: Date = new Date()
): number | null {
  const status = getEffectiveSeasonStatus(season, currentTime)
  const boundary = status === 'upcoming'
    ? new Date(season.start_date).getTime()
    : status === 'live'
      ? new Date(season.end_date).getTime()
      : Number.NaN

  if (!Number.isFinite(boundary)) return null
  return Math.max(0, boundary - currentTime.getTime())
}
