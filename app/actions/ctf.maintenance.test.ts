import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), rpc: vi.fn(), serviceClient: vi.fn(), revalidate: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: mocks.serviceClient }))
vi.mock('@/lib/errorHandler', () => ({ getSafeErrorMessage: () => 'Update failed' }))
vi.mock('@/lib/logEvent', () => ({ logEvent: vi.fn(), extractClientIp: () => '127.0.0.1' }))
vi.mock('@/lib/security-log', () => ({ logSecurityEvent: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/contributors', async () => import('../../lib/contributors'))
vi.mock('@/lib/ctf/uploads/scope', () => ({ uploadScopeMatchesChallenge: vi.fn() }))
vi.mock('@/lib/utils/ctf', () => ({ hashFlag: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({ checkNamedRateLimit: () => ({ allowed: true }) }))
vi.mock('./skilltree', () => ({ checkAndUnlockNodes: vi.fn() }))
vi.mock('./competition', () => ({ creditSeasonSolve: vi.fn() }))
vi.mock('./practice-teams', () => ({ creditPracticeTeamSolve: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { submitFlag, updateChallenge } from './ctf'

let active: boolean
let role: string
let updateResult: { data: unknown; error: unknown }
const writes = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  active = false
  role = 'admin'
  updateResult = { data: { id: 'challenge' }, error: null }
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Flag checker reached' } })
  mocks.serviceClient.mockReturnValue({ rpc: mocks.rpc })
  mocks.createClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
    rpc: mocks.rpc,
    from: (table: string) => {
      let updating = false
      const result = () => updating ? updateResult : {
        data: table === 'profiles' ? { role } : table === 'ctf_challenges'
          ? { id: 'challenge', is_active: active, season_id: null, created_by: 'user' } : [],
        error: null,
      }
      const query = {
        select: (_columns?: string) => query,
        eq: () => query,
        update: (data: unknown) => { updating = true; writes(data); return query },
        single: async () => result(),
        maybeSingle: async () => result(),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
      }
      return query
    },
  })
})

it('rejects disabled challenge submissions before checking the flag or writing a solve', async () => {
  expect(await submitFlag('challenge', 'flag{test}')).toEqual({ error: 'Challenge is under maintenance.' })
  expect(mocks.rpc).not.toHaveBeenCalled()
  expect(writes).not.toHaveBeenCalled()
})

it('allows flag checking again after a challenge is re-enabled', async () => {
  active = true
  await submitFlag('challenge', 'flag{test}')
  expect(mocks.rpc).toHaveBeenCalledWith('check_flag', { p_challenge_id: 'challenge', p_flag: 'flag{test}' })
})

it('does not let a contributor override admin maintenance', async () => {
  role = 'contributor'
  expect(await updateChallenge('challenge', { is_active: true })).toHaveProperty('error')
  expect(writes).not.toHaveBeenCalled()
})

it.each([false, true])('lets admins set active=%s without changing points or solves', async (is_active) => {
  expect(await updateChallenge('challenge', { is_active })).toEqual({ success: true })
  expect(writes).toHaveBeenCalledExactlyOnceWith({ is_active })
  expect(mocks.revalidate).toHaveBeenCalledWith('/ctf/challenge')
})

it('does not report success when the update affects no challenge', async () => {
  updateResult = { data: null, error: null }
  expect(await updateChallenge('challenge', { is_active: false })).toHaveProperty('error')
})
