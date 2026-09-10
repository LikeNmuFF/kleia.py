import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/app/actions/competition-status', async () => import('../../app/actions/competition-status'))
import { resolvePracticeFile } from './files'
const id = '00000000-0000-4000-8000-000000000001'
let member: boolean
let publication: boolean
let active: boolean
let seasonLinks: unknown[]
let publicQueryError: boolean
let multiplePublications: boolean
const client = {
  rpc: async () => ({ data: member, error: null }),
  from: (table: string) => {
    let rowId = id
    const data = () => table === 'ctf_challenge_uploads' ? { id, scope_room_id: id, stored_name: 'test.zip', extension: 'zip', cloudinary_public_id: 'private-object' }
      : table === 'practice_challenges' ? { id, room_id: id }
      : table === 'practice_publications' ? (publication ? { ctf_challenge_id: id } : null)
      : table === 'ctf_challenges' ? { id: rowId, status: 'approved', is_active: active && (!multiplePublications || rowId !== id), season_id: null, file_url: `/api/practice/files/${id}` }
      : null
    const query = {
      select: () => query, eq: (column: string, value: string) => { if (column === 'id') rowId = value; return query }, not: () => query, limit: () => query,
      maybeSingle: async () => table === 'practice_publications' && multiplePublications ? { data: null, error: { message: 'Multiple rows' } } : ({ data: data(), error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'practice_publications' ? (publication ? [{ ctf_challenge_id: id }, ...(multiplePublications ? [{ ctf_challenge_id: '00000000-0000-4000-8000-000000000002' }] : [])] : []) : seasonLinks, error: publicQueryError ? { message: 'Unavailable' } : null }).then(resolve),
    }
    return query
  },
}
beforeEach(() => { member = false; publication = false; active = true; seasonLinks = []; publicQueryError = false; multiplePublications = false })
it('blocks direct private file access without a room invitation', async () => {
  expect(await resolvePracticeFile(client as never, client as never, id)).toBeNull()
})
it('allows invited members and blocks their next request after revocation', async () => {
  member = true
  expect(await resolvePracticeFile(client as never, client as never, id)).toHaveProperty('stored_name', 'test.zip')
  member = false
  expect(await resolvePracticeFile(client as never, client as never, id)).toBeNull()
})
it('allows the recorded public copy attachment without room access', async () => {
  publication = true
  expect(await resolvePracticeFile(client as never, client as never, id)).toHaveProperty('stored_name', 'test.zip')
})
it('blocks public copies disabled for maintenance', async () => {
  publication = true; active = false
  expect(await resolvePracticeFile(client as never, client as never, id)).toBeNull()
})
it('blocks published copies assigned to an unreleased season', async () => {
  publication = true
  seasonLinks = [{ seasons: { status: 'live', start_date: '2020-01-01', end_date: '2099-01-01' } }]
  expect(await resolvePracticeFile(client as never, client as never, id)).toBeNull()
})
it('fails closed when public visibility cannot be verified', async () => {
  publication = true; publicQueryError = true
  expect(await resolvePracticeFile(client as never, client as never, id)).toBeNull()
})
it('keeps a shared attachment downloadable when one of its published copies remains public', async () => {
  publication = true; multiplePublications = true
  expect(await resolvePracticeFile(client as never, client as never, id)).toHaveProperty('stored_name', 'test.zip')
})
