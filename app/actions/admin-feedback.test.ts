import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), requireAdmin: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/admin', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/feedback/admin', async () => import('../../lib/feedback/admin'))
vi.mock('@/lib/feedback/validation', async () => import('../../lib/feedback/validation'))
import { getAdminFeedback, updateFeedbackStatus } from './admin-feedback'

const id = 'a7cde063-418d-48b7-aedd-4e542dd768a0'
let result: { data: unknown; error: unknown; count?: number }
const query = {
  select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), update: vi.fn(), maybeSingle: vi.fn(),
}
const from = vi.fn(() => query)
beforeEach(() => {
  vi.resetAllMocks()
  result = { data: [], error: null, count: 0 }
  from.mockReturnValue(query)
  for (const name of ['select', 'eq', 'order', 'update'] as const) query[name].mockReturnValue(query)
  query.range.mockImplementation(async () => result)
  query.maybeSingle.mockImplementation(async () => result)
  mocks.createClient.mockResolvedValue({ from })
  mocks.requireAdmin.mockResolvedValue({ id: 'admin' })
})

it('rejects reads and writes before accessing feedback when authorization fails', async () => {
  mocks.requireAdmin.mockRejectedValue(new Error('Forbidden'))
  await expect(getAdminFeedback()).rejects.toThrow('Forbidden')
  await expect(updateFeedbackStatus(id, 'fixed')).rejects.toThrow('Forbidden')
  expect(from).not.toHaveBeenCalled()
})

it('returns reports with filtered pagination', async () => {
  result = { data: [{ id, title: 'Broken challenge' }], error: null, count: 30 }
  expect(await getAdminFeedback('open', 'bug_report', 1)).toEqual({ reports: result.data, total: 30 })
  expect(query.eq).toHaveBeenCalledWith('status', 'open')
  expect(query.eq).toHaveBeenCalledWith('type', 'bug_report')
  expect(query.range).toHaveBeenCalledWith(25, 49)
})

it('reports database failures rather than an empty inbox', async () => {
  result = { data: null, error: { message: 'private database detail' } }
  expect(await getAdminFeedback()).toEqual({ error: 'Could not load feedback. Please try again.' })
})

it('rejects invalid filters and status changes without database access', async () => {
  expect(await getAdminFeedback('invalid')).toHaveProperty('error')
  expect(await getAdminFeedback('', '', -1)).toHaveProperty('error')
  expect(await updateFeedbackStatus(id, 'invalid')).toHaveProperty('error')
  expect(await updateFeedbackStatus('bad-id', 'closed')).toHaveProperty('error')
  expect(from).not.toHaveBeenCalled()
})

it('updates only the selected report status', async () => {
  result = { data: { id, status: 'fixed' }, error: null }
  expect(await updateFeedbackStatus(id, 'fixed')).toEqual({ success: true })
  expect(query.update).toHaveBeenCalledWith({ status: 'fixed' })
  expect(query.eq).toHaveBeenCalledWith('id', id)
})

it('does not claim success when a report is missing or an update fails', async () => {
  result = { data: null, error: null }
  expect(await updateFeedbackStatus(id, 'closed')).toHaveProperty('error')
  result = { data: null, error: { message: 'database error' } }
  expect(await updateFeedbackStatus(id, 'closed')).toHaveProperty('error')
})
