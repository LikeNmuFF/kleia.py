export interface ClubRegistrationInput {
  fullName: string
  email: string
  course: string
  yearLevel: string
  set: string
}

export interface NormalizedClubRegistrationInput {
  full_name: string
  email: string
  course: string | null
  year_level: string | null
  set_name: string
}

export type ClubRegistrationValidationResult =
  | NormalizedClubRegistrationInput
  | { error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SET_LABELS = new Map([
  ['set a', 'Set A'],
  ['set b', 'Set B'],
  ['set c', 'Set C'],
  ['set d', 'Set D'],
  ['set e', 'Set E'],
])

type OptionalTextResult = { value: string | null } | { error: string }

function normalizeOptionalText(value: string | undefined, maxLength: number, error: string): OptionalTextResult {
  const trimmed = value?.trim() || ''
  if (trimmed.length > maxLength) return { error }
  return { value: trimmed || null }
}

export function normalizeClubRegistrationInput(
  input: ClubRegistrationInput
): ClubRegistrationValidationResult {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: 'Enter your full name.' }
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  const course = normalizeOptionalText(input.course, 120, 'Keep your course under 120 characters.')
  if ('error' in course) return course
  if (!course.value) return { error: 'Enter your course.' }

  const yearLevel = normalizeOptionalText(input.yearLevel, 40, 'Keep your year level under 40 characters.')
  if ('error' in yearLevel) return yearLevel
  if (!yearLevel.value) return { error: 'Enter your year level.' }

  const setName = SET_LABELS.get(input.set.trim().toLowerCase())
  if (!setName) return { error: 'Choose Set A, Set B, Set C, Set D, or Set E.' }

  return {
    full_name: fullName,
    email,
    course: course.value,
    year_level: yearLevel.value,
    set_name: setName,
  }
}
