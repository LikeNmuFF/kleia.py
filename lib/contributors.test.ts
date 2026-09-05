import { describe, expect, it } from 'vitest'
import { canCreateSeasonChallenge, canEditSeasonChallenge } from './contributors'

describe('season contributor permissions', () => {
  it('allows admins to manage every season challenge', () => {
    expect(canCreateSeasonChallenge({ role: 'admin', invited: false })).toBe(true)
    expect(canEditSeasonChallenge({ role: 'admin', invited: false, ownsChallenge: false })).toBe(true)
  })

  it('allows invited contributors to create and edit only their own challenge', () => {
    expect(canCreateSeasonChallenge({ role: 'contributor', invited: true })).toBe(true)
    expect(canEditSeasonChallenge({ role: 'contributor', invited: true, ownsChallenge: true })).toBe(true)
    expect(canEditSeasonChallenge({ role: 'contributor', invited: true, ownsChallenge: false })).toBe(false)
  })

  it('rejects contributors who were not invited to the season', () => {
    expect(canCreateSeasonChallenge({ role: 'contributor', invited: false })).toBe(false)
    expect(canEditSeasonChallenge({ role: 'contributor', invited: false, ownsChallenge: true })).toBe(false)
  })
})
