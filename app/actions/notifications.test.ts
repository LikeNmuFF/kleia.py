import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))

import { getUnreadNotificationCount, markNotificationRead, notifyUser } from './notifications'

function queryResult(result: { data?: unknown; count?: number | null; error?: unknown }) {
  const query = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), update: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.is.mockResolvedValue(result)
  query.update.mockReturnValue(query)
  return query
}

describe('notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the authenticated user unread count', async () => {
    const query = queryResult({ count: 3, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue(query),
    })

    await expect(getUnreadNotificationCount()).resolves.toBe(3)
    expect(query.eq).toHaveBeenCalledWith('recipient_id', 'user-1')
    expect(query.is).toHaveBeenCalledWith('read_at', null)
  })

  it('marks only the authenticated user notification as read', async () => {
    const query = queryResult({ error: null })
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue(query),
    })

    await expect(markNotificationRead('notification-1')).resolves.toEqual({ success: true })
    expect(query.update).toHaveBeenCalledWith({ read_at: expect.any(String) })
    expect(query.eq).toHaveBeenCalledWith('recipient_id', 'user-1')
    expect(query.eq).toHaveBeenCalledWith('id', 'notification-1')
  })

  it('suppresses self-notifications', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      rpc: vi.fn(),
    })
    await expect(notifyUser({ recipientId: 'user-1', actorId: 'user-1', type: 'post_like', title: 'Like', message: 'x', href: '/feed' })).resolves.toEqual({ skipped: true })
  })
})
