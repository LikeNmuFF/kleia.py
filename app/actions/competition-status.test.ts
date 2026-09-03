import { describe, expect, it } from 'vitest'
import {
  getEffectiveSeasonStatus,
  getNextSeasonBoundaryDelay,
  isSeasonRegistrationOpen,
} from './competition-status'

const season = {
  status: 'upcoming',
  start_date: '2026-09-03T04:00:00.000Z',
  end_date: '2026-09-03T06:00:00.000Z',
}

describe('season schedule', () => {
  it('becomes live at the exact scheduled start and ends at the exact scheduled end', () => {
    expect(getEffectiveSeasonStatus(season, new Date('2026-09-03T03:59:59.999Z'))).toBe('upcoming')
    expect(getEffectiveSeasonStatus(season, new Date('2026-09-03T04:00:00.000Z'))).toBe('live')
    expect(getEffectiveSeasonStatus(season, new Date('2026-09-03T06:00:00.000Z'))).toBe('ended')
  })

  it('keeps explicit pause and end overrides authoritative', () => {
    expect(getEffectiveSeasonStatus({ ...season, status: 'paused' }, new Date('2026-09-03T05:00:00.000Z'))).toBe('paused')
    expect(getEffectiveSeasonStatus({ ...season, status: 'ended' }, new Date('2026-09-03T03:00:00.000Z'))).toBe('ended')
  })

  it('allows registration only while an active season is upcoming', () => {
    expect(isSeasonRegistrationOpen({ ...season, is_active: true }, new Date('2026-09-03T03:59:59.999Z'))).toBe(true)
    expect(isSeasonRegistrationOpen({ ...season, is_active: true }, new Date('2026-09-03T04:00:00.000Z'))).toBe(false)
    expect(isSeasonRegistrationOpen({ ...season, is_active: false }, new Date('2026-09-03T03:00:00.000Z'))).toBe(false)
  })

  it('schedules the next refresh at the start or end boundary', () => {
    expect(getNextSeasonBoundaryDelay(season, new Date('2026-09-03T03:59:58.500Z'))).toBe(1500)
    expect(getNextSeasonBoundaryDelay(season, new Date('2026-09-03T05:59:59.000Z'))).toBe(1000)
    expect(getNextSeasonBoundaryDelay(season, new Date('2026-09-03T06:00:00.000Z'))).toBeNull()
  })
})
