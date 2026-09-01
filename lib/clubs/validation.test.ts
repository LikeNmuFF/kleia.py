import { describe, expect, it } from 'vitest'
import {
  normalizeClubRegistrationInput,
  type ClubRegistrationInput,
} from './validation'

const baseInput: ClubRegistrationInput = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.edu',
  course: 'BSIT',
  yearLevel: '2',
  set: 'Set A',
}

describe('normalizeClubRegistrationInput', () => {
  it('accepts a public CCO registration with name, email, course, year, and set', () => {
    expect(normalizeClubRegistrationInput({
      ...baseInput,
      course: 'BSIT',
      yearLevel: '2',
      set: 'set e',
    })).toEqual({
      full_name: 'Ada Lovelace',
      email: 'ada@example.edu',
      course: 'BSIT',
      year_level: '2',
      set_name: 'Set E',
    })
  })

  it('rejects missing required public fields', () => {
    expect(normalizeClubRegistrationInput({ ...baseInput, fullName: 'A' })).toEqual({
      error: 'Enter your full name.',
    })
    expect(normalizeClubRegistrationInput({ ...baseInput, email: 'not-email' })).toEqual({
      error: 'Enter a valid email address.',
    })
  })

  it('requires course and year level', () => {
    expect(normalizeClubRegistrationInput({ ...baseInput, course: '' })).toEqual({
      error: 'Enter your course.',
    })
    expect(normalizeClubRegistrationInput({ ...baseInput, yearLevel: '' })).toEqual({
      error: 'Enter your year level.',
    })
  })

  it('requires set A through set E', () => {
    expect(normalizeClubRegistrationInput({ ...baseInput, set: 'Set F' })).toEqual({
      error: 'Choose Set A, Set B, Set C, Set D, or Set E.',
    })
  })
})
