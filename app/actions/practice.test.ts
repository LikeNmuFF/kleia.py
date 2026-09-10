import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), service: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: mocks.service }))
vi.mock('@/lib/utils/ctf', async () => import('../../lib/utils/ctf'))
vi.mock('@/lib/practice/access', async () => import('../../lib/practice/access'))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))
import { createPracticeRoom, invitePracticeMember, revokePracticeMember, submitPracticeFlag, publishPracticeChallenge, getPracticeRoom, savePracticeFeedback } from './practice'

const id = '00000000-0000-4000-8000-000000000001'
const userId = '00000000-0000-4000-8000-000000000002'
let signedIn: boolean
let role: string
let access: boolean
const selected: string[] = []
const mutations: string[] = []
beforeEach(() => {
  vi.clearAllMocks(); selected.length = 0; mutations.length = 0
  signedIn = true; role = 'user'; access = true
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === 'practice_can_access' ? access : name === 'practice_submit' ? { correct: true, alreadySolved: false } : id, error: null }))
  const client = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: userId } : null }, error: null }) },
    rpc: mocks.rpc,
    from: (table: string) => {
      const result = () => ({ data: table === 'profiles' ? { role } : table === 'practice_rooms' ? (access ? { id, title: 'Room', description: '', created_at: '' } : null) : table === 'practice_challenges' ? { id, room_id: id } : [], error: null })
      const query = {
        select: (columns: string) => { selected.push(columns); return query }, eq: () => query, in: () => query,
        order: () => query, limit: () => query,
        insert: () => { mutations.push(table); return query }, upsert: () => { mutations.push(table); return query },
        delete: () => { mutations.push(table); return query },
        single: async () => result(), maybeSingle: async () => result(),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
      }
      return query
    },
  }
  mocks.createClient.mockResolvedValue(client)
  mocks.service.mockReturnValue(client)
})

it('denies anonymous submissions before invoking an RPC', async () => {
  signedIn = false
  expect(await submitPracticeFlag(id, 'flag')).toHaveProperty('error')
  expect(mocks.rpc).not.toHaveBeenCalled()
})
it('does not let invited users create rooms, invite, revoke or publish', async () => {
  expect(await createPracticeRoom({ title: 'Room', description: '' })).toHaveProperty('error')
  expect(await invitePracticeMember(id, userId)).toHaveProperty('error')
  expect(await revokePracticeMember(id, userId)).toHaveProperty('error')
  expect(await publishPracticeChallenge(id)).toHaveProperty('error')
  expect(mocks.service).not.toHaveBeenCalled()
  expect(mutations).toEqual([])
})
it('submits only through the private scoring RPC without global writes', async () => {
  expect(await submitPracticeFlag(id, 'flag{test}')).toEqual({ success: true, correct: true, alreadySolved: false })
  expect(mocks.rpc).toHaveBeenCalledWith('practice_submit', { p_challenge_id: id, p_flag: 'flag{test}' })
  expect(mutations).toEqual([])
})
it('returns unavailable rooms for revoked or uninvited users', async () => {
  access = false
  expect(await getPracticeRoom(id)).toBeNull()
  expect(selected.some(columns => columns.includes('flag_hash'))).toBe(false)
})
it('rejects feedback when room access has been revoked', async () => {
  access = false
  expect(await savePracticeFeedback(id, 'Please improve the hint')).toHaveProperty('error')
  expect(mutations).toEqual([])
})
it('never selects flag hashes when reading the tester room', async () => {
  await getPracticeRoom(id)
  expect(selected).not.toContain('*')
  expect(selected.some(columns => columns.includes('flag_hash'))).toBe(false)
})
it('validates oversized flags without database work', async () => {
  expect(await submitPracticeFlag(id, 'x'.repeat(501))).toHaveProperty('error')
  expect(mocks.rpc).not.toHaveBeenCalled()
})
