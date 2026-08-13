const MAX_REGEX_LENGTH = 200
const REGEX_TIMEOUT_MS = 100
const DANGEROUS_PATTERNS = [
  /\(\?.*?\)/,           // lookahead/lookbehind groups
  /\(\?\=|\(\?!|\(\?\<|\(\?<=|\(\?<!/, // specific lookahead/lookbehind
  /\\A|\\Z/,             // anchors
  /\{[0-9]{3,}\}/,       // excessive quantifiers {100+}
  /\\\w\+\+|\\\w\*\*/,   // nested quantifiers on escapes
  /\([^)]*\)[+*]{2}/,    // group followed by quantifier (a+)+
  /\([^)]*\|[^)]*\)[+*]+/, // alternation inside group with quantifier (a|b)* or (a|b)+
  /[+*]\?/,              // lazy quantifiers (can still cause backtracking)
]

// Only allow safe regex characters
const SAFE_REGEX_CHARS = /^[a-zA-Z0-9\\^$.[\]{}()|*+?!,;:=<>_%\-:\/\s#@\uff00-\uffef\u0100-\u017f]+$/

// Validates pattern safety before compilation. Returns error or null.
function sanitizePattern(pattern: string): string | null {
  if (pattern.length > MAX_REGEX_LENGTH) return `Pattern too long (max ${MAX_REGEX_LENGTH} chars)`
  if (DANGEROUS_PATTERNS.some(re => re.test(pattern))) return 'Pattern contains disallowed constructs'
  if (!SAFE_REGEX_CHARS.test(pattern)) return 'Pattern contains invalid characters'
  return null
}

// Compiles a pre-validated pattern. Only call after sanitizePattern returns null.
function compileValidated(pattern: string): RegExp {
  return new RegExp(pattern)
}

export function validateRegex(
  pattern: string,
  matchStrings: string[],
  rejectStrings: string[]
): { valid: boolean; error?: string; matchesAll: boolean; rejectsAll: boolean } {
  const sanitizeError = sanitizePattern(pattern)
  if (sanitizeError) {
    return { valid: false, error: sanitizeError, matchesAll: false, rejectsAll: false }
  }

  try {
    const regex = compileValidated(pattern)

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
