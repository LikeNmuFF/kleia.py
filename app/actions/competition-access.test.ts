import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: mocks.isAdmin,
}))

vi.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: vi.fn(),
}))

vi.mock('@/lib/logEvent', () => ({
  logEvent: vi.fn(),
}))

vi.mock('@/lib/utils/time', () => ({
  parseManilaLocal: vi.fn((value: string) => value),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getCompetitionAccess, getRecentSeasonSolves } from './competition'
import { isSeasonParticipant } from './seasons'

function queryResult(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.single.mockResolvedValue(result)
  query.maybeSingle.mockResolvedValue(result)
  return query
}

describe('getCompetitionAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isAdmin.mockResolvedValue(false)
  })

  it('does not mistake a failed participant lookup for a non-participant', async () => {
    const season = {
      id: 'season-1',
      name: 'Live season',
      slug: 'live-season',
      description: null,
      theme: null,
      start_date: '2026-09-05T01:00:00.000Z',
      end_date: '2099-09-05T03:00:00.000Z',
      is_active: true,
      status: 'live',
    }

    const seasonQuery = queryResult({ data: season, error: null })
    const participantQuery = queryResult({
      data: null,
      error: { message: 'temporary database failure' },
    })
    const spectatorQuery = queryResult({ data: null, error: null })

    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn((table: string) => {
        if (table === 'ctf_seasons') return seasonQuery
        if (table === 'ctf_season_participants') return participantQuery
        if (table === 'ctf_season_spectators') return spectatorQuery
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    await expect(getCompetitionAccess('season-1')).rejects.toThrow(
      'Could not verify season access'
    )
  })

  it('allows an explicitly assigned spectator to spectate even if also registered', async () => {
    const season = {
      id: 'season-1', name: 'Live season', slug: 'live-season', description: null,
      theme: null, start_date: '2026-09-05T01:00:00.000Z', end_date: '2099-09-05T03:00:00.000Z',
      is_active: true, status: 'live',
    }
    const seasonQuery = queryResult({ data: season, error: null })
    const participantQuery = queryResult({ data: { codename: 'player' }, error: null })
    const spectatorQuery = queryResult({ data: { user_id: 'user-1' }, error: null })

    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn((table: string) => {
        if (table === 'ctf_seasons') return seasonQuery
        if (table === 'ctf_season_participants') return participantQuery
        if (table === 'ctf_season_spectators') return spectatorQuery
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const access = await getCompetitionAccess('season-1', { preferSpectator: true })
    expect(access.kind).toBe('spectator')
  })
})

describe('isSeasonParticipant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not report a failed membership lookup as not joined', async () => {
    const participantQuery = queryResult({
      data: null,
      error: { message: 'temporary database failure' },
    })

    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'ctf_season_participants') return participantQuery
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    await expect(isSeasonParticipant('season-1', 'user-1')).rejects.toThrow(
      'Could not verify season registration'
    )
  })
})

describe('getRecentSeasonSolves', () => {
  it('uses the protected season solve feed instead of exposing submissions directly', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ user_id: 'user-1', codename: 'fox', challenge_id: 'challenge-1', title: 'Web 1', points: 100, created_at: '2026-09-05T01:00:00Z' }],
      error: null,
    })
    mocks.createClient.mockResolvedValue({ rpc })

    await expect(getRecentSeasonSolves('season-1')).resolves.toHaveLength(1)
    expect(rpc).toHaveBeenCalledWith('get_recent_season_solves', { p_season_id: 'season-1' })
  })
})
