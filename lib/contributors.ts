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
