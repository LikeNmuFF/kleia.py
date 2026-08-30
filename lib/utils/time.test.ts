import { afterEach, describe, expect, it, vi } from 'vitest'
import { getStatusInfo } from './time'

describe('getStatusInfo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not treat stale online status as currently online', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-30T12:00:00.000Z'))

    const staleLastSeen = new Date('2026-08-30T11:50:00.000Z').toISOString()

    expect(getStatusInfo('online', staleLastSeen)).toEqual({
      text: '10m ago',
      color: 'bg-gray-500',
      isOnline: false,
    })
  })

  it('keeps fresh online status online as a database fallback', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-30T12:00:00.000Z'))

    const freshLastSeen = new Date('2026-08-30T11:59:20.000Z').toISOString()

    expect(getStatusInfo('online', freshLastSeen)).toEqual({
      text: 'Online',
      color: 'bg-emerald-400',
      isOnline: true,
    })
  })
})
