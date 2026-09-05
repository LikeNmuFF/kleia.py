export function canCreateGlobalChallenge(input: { role: string | null }) {
  return input.role === 'admin' || input.role === 'contributor'
}

export function canEditGlobalChallenge(input: {
  role: string | null
  ownsChallenge: boolean
}) {
  return input.role === 'admin' || (
    input.role === 'contributor' && input.ownsChallenge
  )
}

export function canCreateSeasonChallenge(input: { role: string | null; invited: boolean }) {
  return input.role === 'admin' || (input.role === 'contributor' && input.invited)
}

export function canEditSeasonChallenge(input: {
  role: string | null
  invited: boolean
  ownsChallenge: boolean
}) {
  return input.role === 'admin' || (
    input.role === 'contributor' && input.invited && input.ownsChallenge
  )
}
