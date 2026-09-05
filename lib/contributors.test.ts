import { describe, expect, it } from 'vitest'
import {
  canCreateGlobalChallenge,
  canCreateSeasonChallenge,
  canEditGlobalChallenge,
  canEditSeasonChallenge,
} from './contributors'

describe('global contributor permissions', () => {
  it('allows admins and contributors to create global challenges', () => {
    expect(canCreateGlobalChallenge({ role: 'admin' })).toBe(true)
    expect(canCreateGlobalChallenge({ role: 'contributor' })).toBe(true)
  })

  it('rejects regular users from creating global challenges', () => {
    expect(canCreateGlobalChallenge({ role: 'user' })).toBe(false)
    expect(canCreateGlobalChallenge({ role: null })).toBe(false)
  })

  it('allows contributors to edit only their own global challenges', () => {
    expect(canEditGlobalChallenge({ role: 'contributor', ownsChallenge: true })).toBe(true)
    expect(canEditGlobalChallenge({ role: 'contributor', ownsChallenge: false })).toBe(false)
    expect(canEditGlobalChallenge({ role: 'admin', ownsChallenge: false })).toBe(true)
  })
})

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
