import { describe, expect, it } from 'vitest'
import { validateRegex } from './regex-golf'

describe('validateRegex', () => {
  it('rejects nested quantified patterns before compiling them', () => {
    const result = validateRegex('(a+)+$', ['aaaaaaaaaaaaaaaaaaaa!'], ['bbb'])

    expect(result).toMatchObject({
      valid: false,
      error: 'Pattern contains disallowed constructs',
      matchesAll: false,
      rejectsAll: false,
    })
  })

  it('rejects nested optional quantifiers before compiling user input', () => {
    const result = validateRegex('^(a?)+$', ['aaaa'], ['bbbb'])

    expect(result).toMatchObject({
      valid: false,
      error: 'Pattern contains disallowed constructs',
      matchesAll: false,
      rejectsAll: false,
    })
  })

  it('accepts bounded linear regexes needed by regex golf puzzles', () => {
    const result = validateRegex('^#[0-9a-fA-F]{6}$', ['#a1B2c3'], ['a1B2c3', '#abcd'])

    expect(result).toMatchObject({
      valid: true,
      matchesAll: true,
      rejectsAll: true,
    })
  })

  it('rejects alternation before compiling user input', () => {
    const result = validateRegex('^(admin|administrator)+$', ['admin'], ['guest'])

    expect(result).toMatchObject({
      valid: false,
      error: 'Pattern contains disallowed constructs',
      matchesAll: false,
      rejectsAll: false,
    })
  })
})
