import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import RoomList from './RoomList'
import PracticeRoom from './PracticeRoom'
import ChallengeEditor from './ChallengeEditor'

vi.mock('@/app/actions/practice', () => ({
  createPracticeRoom: vi.fn(), findPracticeUsers: vi.fn(), invitePracticeMember: vi.fn(),
  remindPracticeMember: vi.fn(), revokePracticeMember: vi.fn(), savePracticeChallenge: vi.fn(),
  submitPracticeFlag: vi.fn(), savePracticeFeedback: vi.fn(), publishPracticeChallenge: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

const room = { id: 'room-1', title: 'Web Review Lab', description: 'Test challenges before release.', created_at: '2026-09-09T00:00:00Z', member_count: 2, challenge_count: 3, active_challenge_count: 2 }

describe('Labs UI', () => {
  it('explains the invite-only empty state', () => {
    const html = renderToStaticMarkup(<RoomList rooms={[]} isAdmin={false} />)
    expect(html).toMatch(/invite-only/i)
    expect(html).not.toContain('Create room')
  })

  it('gives admins room creation controls', () => {
    const html = renderToStaticMarkup(<RoomList rooms={[room]} isAdmin />)
    expect(html).toContain('Create lab')
    expect(html).toContain('Web Review Lab')
    expect(html).toContain('Labs workspace')
    expect(html).toContain('3 challenges')
    expect(html).toContain('2 testers')
    expect(html).toContain('Manage lab')
    expect(html).not.toMatch(/private practice/i)
  })

  it('renders member solve, download, lesson, and feedback controls', () => {
    const html = renderToStaticMarkup(<PracticeRoom data={{
      room, isAdmin: false, userId: 'user-1', members: [], attempts: [{ id: 'solve-1', challenge_id: 'challenge-1', user_id: 'user-1', is_correct: true, created_at: room.created_at }], feedback: [], publications: [],
      challenges: [{ id: 'challenge-1', room_id: room.id, title: 'Cookie Trail', description: 'Find the flag.', category: 'web', difficulty: 'easy', points: 100, hint: 'Inspect storage.', explanation: 'The cookie was unsigned.', upload_id: 'upload-1', learn_topic_slug: 'web', learn_lesson_slug: 'cookies', is_active: true, created_at: room.created_at }],
    }} />)
    expect(html).toContain('Submit flag')
    expect(html).toContain('Send feedback')
    expect(html).toContain('/api/practice/files/upload-1')
    expect(html).toContain('/learn/web/cookies')
    expect(html).toContain('Lab points only')
    expect(html).toContain('Your progress')
    expect(html).toContain('1 of 1 complete')
  })

  it('shows admin review and global snapshot publication language', () => {
    const html = renderToStaticMarkup(<PracticeRoom data={{
      room,
      isAdmin: true,
      userId: 'admin',
      members: [{ user_id: 'user-1', display_name: 'Test User', invited_at: room.created_at, last_reminded_at: null }],
      attempts: [{ id: 'attempt-1', challenge_id: 'challenge-1', user_id: 'user-1', is_correct: false, created_at: room.created_at }],
      feedback: [{ challenge_id: 'challenge-1', user_id: 'user-1', message: 'Clarify the hint.', updated_at: room.created_at }],
      publications: [],
      challenges: [{ id: 'challenge-1', room_id: room.id, title: 'Cookie Trail', description: 'Find the flag.', category: 'web', difficulty: 'easy', points: 100, hint: null, explanation: null, upload_id: null, learn_topic_slug: null, learn_lesson_slug: null, is_active: true, created_at: room.created_at }],
    }} />)
    expect(html).toContain('Invite member')
    expect(html).toContain('Add challenge')
    expect(html).toContain('global snapshot')
    expect(html).toContain('Submit flag')
    expect(html).toContain('Incorrect')
    expect(html).toContain('Test User')
    expect(html).toContain('Clarify the hint.')
    expect(html).toContain('Lab control')
    expect(html).toContain('Tester access')
    expect(html).toContain('Challenge pipeline')
    expect(html).not.toMatch(/private practice/i)
  })

  it('groups challenge setup into clear sections', () => {
    const html = renderToStaticMarkup(<ChallengeEditor roomId={room.id} onSaved={vi.fn()} onCancel={vi.fn()} />)
    expect(html).toContain('Challenge basics')
    expect(html).toContain('Solution guide')
    expect(html).toContain('Learning path')
    expect(html).toContain('Delivery')
  })
})
