export type CallerRole = 'admin' | 'contributor' | 'user' | null

export function canUploadGlobalChallengeFile(role: CallerRole): boolean {
  return role === 'admin' || role === 'contributor'
}

export function canUploadSeasonChallengeFile(input: { role: CallerRole; invited: boolean }): boolean {
  return input.role === 'admin' || (input.role === 'contributor' && input.invited)
}

export function canUploadPracticeRoomFile(input: { role: CallerRole; hasSeasonScope: boolean }): boolean {
  return input.role === 'admin' && !input.hasSeasonScope
}

export function uploadScopeMatchesChallenge(input: { uploadSeasonId: string | null; challengeSeasonId: string | null; uploadRoomId?: string | null }): boolean {
  return !input.uploadRoomId && input.uploadSeasonId === input.challengeSeasonId
}
