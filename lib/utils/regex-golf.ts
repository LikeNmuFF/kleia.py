const MAX_REGEX_LENGTH = 200
const REGEX_TIMEOUT_MS = 100
const DANGEROUS_PATTERNS = /\(\?.*?\)|\(\?\=|\(\?!|\(\?\<|\(\?<=|\(\?<!|\\A|\\Z|\{[0-9]{3,}\}|\\\w\+\+|\\\w\*\*/

export function validateRegex(
  pattern: string,
  matchStrings: string[],
  rejectStrings: string[]
): { valid: boolean; error?: string; matchesAll: boolean; rejectsAll: boolean } {
  if (pattern.length > MAX_REGEX_LENGTH) {
    return { valid: false, error: `Pattern too long (max ${MAX_REGEX_LENGTH} chars)`, matchesAll: false, rejectsAll: false }
  }

  if (DANGEROUS_PATTERNS.test(pattern)) {
    return { valid: false, error: 'Pattern contains disallowed constructs', matchesAll: false, rejectsAll: false }
  }

  try {
    const regex = new RegExp(pattern)

    let matchesAll = true
    let rejectsAll = true

    for (const s of matchStrings) {
      const start = Date.now()
      const result = regex.test(s)
      if (Date.now() - start > REGEX_TIMEOUT_MS) {
        return { valid: false, error: 'Pattern too slow (timeout)', matchesAll: false, rejectsAll: false }
      }
      if (!result) matchesAll = false
    }

    for (const s of rejectStrings) {
      const start = Date.now()
      const result = regex.test(s)
      if (Date.now() - start > REGEX_TIMEOUT_MS) {
        return { valid: false, error: 'Pattern too slow (timeout)', matchesAll: false, rejectsAll: false }
      }
      if (result) rejectsAll = false
    }

    return { valid: true, matchesAll, rejectsAll }
  } catch (e) {
    return { valid: false, error: (e as Error).message, matchesAll: false, rejectsAll: false }
  }
}
