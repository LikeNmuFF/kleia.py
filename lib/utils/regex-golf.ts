export function validateRegex(
  pattern: string,
  matchStrings: string[],
  rejectStrings: string[]
): { valid: boolean; error?: string; matchesAll: boolean; rejectsAll: boolean } {
  try {
    const regex = new RegExp(pattern)
    const matchesAll = matchStrings.every(s => regex.test(s))
    const rejectsAll = rejectStrings.every(s => !regex.test(s))
    return { valid: true, matchesAll, rejectsAll }
  } catch (e) {
    return { valid: false, error: (e as Error).message, matchesAll: false, rejectsAll: false }
  }
}
