import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/app/actions/competition-status', async () => import('../../actions/competition-status'))
vi.mock('@/components/ctf/ChallengeRatingBadge', () => ({ default: () => null }))
vi.mock('@/components/ctf/ChallengeReviewForm', () => ({ default: () => null }))
vi.mock('@/components/ctf/ChallengeReviews', () => ({ default: () => null }))
vi.mock('@/components/ctf/AIFairPlayBanner', () => ({ default: () => null }))
vi.mock('./[id]/FlagSubmitForm', () => ({ default: () => null }))
vi.mock('./[id]/HintUnlockButton', () => ({ default: () => null }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('Not found') } }))

import CTFClient from './CTFClient'
import ChallengePage from './[id]/page'

const challenge = {
  id: 'maintenance-challenge', title: 'Test challenge', category: 'web', difficulty: 'easy',
  points: 100, hint: null, author: null, created_at: '2026-09-09', seasonSlugs: [],
  is_active: false, season_id: null, description: 'Private challenge instructions',
}

let seasonLinks: unknown[]
beforeEach(() => {
  seasonLinks = []
  mocks.createClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: (table: string) => {
      const query = {
        select: () => query, eq: () => query,
        single: async () => ({ data: challenge, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'ctf_season_challenges' ? seasonLinks : [], error: null }).then(resolve),
      }
      return query
    },
  })
})

it('keeps disabled challenges and their existing solve status visible in the list', () => {
  const html = renderToStaticMarkup(createElement(CTFClient, {
    challenges: [challenge], solvedIds: [challenge.id], solvesById: { [challenge.id]: 3 },
    ratingsById: {}, seasonOptions: [], initialSeasonSlug: 'all',
  }))
  expect(html).toContain('Test challenge')
  expect(html).toContain('Challenge is under maintenance.')
  expect(html).toContain('Solved')
  expect(html).toContain('/ctf/maintenance-challenge')
})

it('does not show maintenance for re-enabled challenges', () => {
  const html = renderToStaticMarkup(createElement(CTFClient, {
    challenges: [{ ...challenge, is_active: true }], solvedIds: [], solvesById: {},
    ratingsById: {}, seasonOptions: [], initialSeasonSlug: 'all',
  }))
  expect(html).toContain('Test challenge')
  expect(html).not.toContain('Challenge is under maintenance.')
})

it('shows a maintenance notice instead of challenge instructions on direct access', async () => {
  const html = renderToStaticMarkup(await ChallengePage({ params: Promise.resolve({ id: challenge.id }) }))
  expect(html).toContain('Challenge is under maintenance.')
  expect(html).not.toContain(challenge.description)
  expect(html).not.toContain('<form')
})

it('preserves season visibility restrictions for disabled challenges', async () => {
  seasonLinks = [{ seasons: { status: 'live', start_date: '2020-01-01', end_date: '2099-01-01' } }]
  await expect(ChallengePage({ params: Promise.resolve({ id: challenge.id }) })).rejects.toThrow('Not found')
})
