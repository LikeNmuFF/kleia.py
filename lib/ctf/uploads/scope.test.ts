import { describe, expect, it } from 'vitest'
import { canUploadGlobalChallengeFile, canUploadPracticeRoomFile, canUploadSeasonChallengeFile, getChallengeUploadRateLimit, uploadScopeMatchesChallenge } from './scope'

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

  it('never attaches private room files to global or season challenges', () => {
    expect(uploadScopeMatchesChallenge({ uploadSeasonId: null, challengeSeasonId: null, uploadRoomId: 'private-room' })).toBe(false)
  })

  it('allows only admins to create room-scoped uploads and never mixes room and season scope', () => {
    expect(canUploadPracticeRoomFile({ role: 'admin', hasSeasonScope: false })).toBe(true)
    expect(canUploadPracticeRoomFile({ role: 'contributor', hasSeasonScope: false })).toBe(false)
    expect(canUploadPracticeRoomFile({ role: 'user', hasSeasonScope: false })).toBe(false)
    expect(canUploadPracticeRoomFile({ role: 'admin', hasSeasonScope: true })).toBe(false)
  })

  it('rate limits contributors but leaves admin uploads unlimited', () => {
    expect(getChallengeUploadRateLimit('admin')).toBeNull()
    expect(getChallengeUploadRateLimit('contributor')).toEqual({ windowMs: 60 * 60 * 1000, maxRequests: 5 })
    expect(getChallengeUploadRateLimit('user')).toBeNull()
    expect(getChallengeUploadRateLimit(null)).toBeNull()
  })
})
