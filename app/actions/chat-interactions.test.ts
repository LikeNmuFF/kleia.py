import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  member: true,
  parent: true,
  locked: false,
  upsert: vi.fn(),
  insert: vi.fn(),
  filters: [] as Array<[string, unknown]>,
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: (table: string) => {
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => { state.filters.push([column, value]); return query },
      maybeSingle: async () => ({ data: (table === 'conversation_members' ? state.member : state.parent) ? { id: 'parent', user_id: 'user-1' } : null }),
      insert: (data: unknown) => { state.insert(data); return query },
      single: async () => ({ data: { id: 'sent-message' }, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: state.member ? 1 : 0, error: null }).then(resolve),
    }
    return query
  },
}) }))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: () => ({ from: () => ({ upsert: state.upsert }) }) }))
vi.mock('@/lib/logEvent', () => ({ logEvent: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/errorHandler', () => ({ getSafeErrorMessage: (_error: unknown, fallback: string) => fallback }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('./competition', () => ({ getCompetitionAccess: async () => ({ kind: 'participant', effectiveStatus: state.locked ? 'live' : 'ended' }) }))
vi.mock('./gamification', () => ({ completeMission: vi.fn() }))

import { sendMessage, setMessageReaction } from './chat'

beforeEach(() => {
  state.user = { id: 'user-1' }
  state.member = true
  state.parent = true
  state.locked = false
  state.filters = []
  state.insert.mockReset()
  state.upsert.mockReset().mockResolvedValue({ error: null })
})

describe('chat reply authorization', () => {
  it('does not send a reply to an inaccessible parent', async () => {
    state.parent = false
    expect(await sendMessage('conversation-1', 'Hello', 'other-message')).toHaveProperty('error')
    expect(state.insert).not.toHaveBeenCalled()
    expect(state.filters).toContainEqual(['conversation_id', 'conversation-1'])
  })
  it('saves a reply reference and trims the message', async () => {
    expect(await sendMessage('conversation-1', ' Hello ', 'parent')).toHaveProperty('success', true)
    expect(state.insert).toHaveBeenCalledWith({ conversation_id: 'conversation-1', sender_id: 'user-1', content: 'Hello', reply_to_id: 'parent' })
  })
  it('rejects empty and oversized messages', async () => {
    expect(await sendMessage('conversation-1', '  ')).toHaveProperty('error')
    expect(await sendMessage('conversation-1', 'x'.repeat(4001))).toHaveProperty('error')
    expect(state.insert).not.toHaveBeenCalled()
  })
})

describe('chat reaction authorization', () => {
  it.each(['anonymous', 'nonmember', 'locked', 'missing-message', 'invalid-emoji'])('rejects %s writes', async (scenario) => {
    if (scenario === 'anonymous') state.user = null
    if (scenario === 'nonmember') state.member = false
    if (scenario === 'locked') state.locked = true
    if (scenario === 'missing-message') state.parent = false
    const result = await setMessageReaction('conversation-1', 'message-1', scenario === 'invalid-emoji' ? 'invalid' : 'heart', true)
    expect(result).toHaveProperty('error')
    expect(state.upsert).not.toHaveBeenCalled()
  })
  it.each([true, false])('sets the authenticated user reaction to active=%s', async (active) => {
    expect(await setMessageReaction('conversation-1', 'message-1', 'heart', active)).toEqual({ success: true })
    expect(state.upsert).toHaveBeenCalledWith({ conversation_id: 'conversation-1', message_id: 'message-1', user_id: 'user-1', emoji: 'heart', active }, { onConflict: 'message_id,user_id,emoji' })
  })
})
