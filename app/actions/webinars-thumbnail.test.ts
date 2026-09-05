import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
}))

vi.mock('@/lib/logEvent', () => ({
  logEvent: vi.fn(),
}))

vi.mock('@/lib/images/image-proxy-url', () => ({
  isBlockedProxyImageUrl: (value: string) => value.includes('facebook.com') || value.includes('fbcdn.net'),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createWebinar } from './webinars'

const baseWebinar = {
  title: 'Cybersecurity workshop',
  description: 'A practical workshop for learning security fundamentals.',
  provider_name: 'Kleia',
  provider_type: 'internal' as const,
  verification_mode: 'internal_attendance' as const,
  external_url: '',
  capacity: null,
  min_attendance_minutes: 30,
  starts_at: '2030-01-01T09:00',
  ends_at: '2030-01-01T10:00',
  skill_category: 'career' as const,
}

function queryResult(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.single.mockResolvedValue(result)
  query.insert.mockReturnValue(query)
  return query
}

describe('webinar thumbnail validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const profileQuery = queryResult({ data: { role: 'admin' }, error: null })
    const insertQuery = queryResult({ data: { id: 'webinar-1' }, error: null })

    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn((table: string) => {
        if (table === 'profiles') return profileQuery
        if (table === 'webinars') return insertQuery
        throw new Error(`Unexpected table: ${table}`)
      }),
    })
  })

  it('rejects a Facebook page URL instead of storing an unusable thumbnail', async () => {
    const result = await createWebinar({
      ...baseWebinar,
      thumbnail_url: 'https://www.facebook.com/share/p/example',
    })

    expect(result).toEqual({
      error: 'Use a direct HTTPS image URL or upload an image file',
    })
  })
})
