import { describe, expect, it } from 'vitest'
import { canUploadGlobalChallengeFile, canUploadSeasonChallengeFile, uploadScopeMatchesChallenge } from './scope'

describe('challenge upload scope', () => {
  it('allows admins and contributors to upload global files', () => {
    expect(canUploadGlobalChallengeFile('admin')).toBe(true)
    expect(canUploadGlobalChallengeFile('contributor')).toBe(true)
    expect(canUploadGlobalChallengeFile('user')).toBe(false)
  })

  it('requires contributor invitation for season-scoped uploads', () => {
    expect(canUploadSeasonChallengeFile({ role: 'admin', invited: false })).toBe(true)
    expect(canUploadSeasonChallengeFile({ role: 'contributor', invited: true })).toBe(true)
    expect(canUploadSeasonChallengeFile({ role: 'contributor', invited: false })).toBe(false)
  })

  it('requires upload and challenge scope to match', () => {
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: null, challengeSeasonId: null })).toBe(true)
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: 's1', challengeSeasonId: 's1' })).toBe(true)
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: null, challengeSeasonId: 's1' })).toBe(false)
  })
})
