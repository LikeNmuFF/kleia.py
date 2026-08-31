const MAX_REGEX_LENGTH = 200
const REGEX_TIMEOUT_MS = 100
const MAX_TEST_STRINGS = 20

// ── Blocklist: patterns that enable catastrophic backtracking ─────────────
// Each entry tests the raw pattern *string* before compilation.
const DANGEROUS_PATTERNS: RegExp[] = [
  // Lookahead / lookbehind groups (zero-width, expensive)
  /\(\?[=!<]/,
  // Anchors that force full-string scans
  /\\[AZ]/,
  // Excessive quantifiers {100+}
  /\{[0-9]{3,}\}/,
  // Nested quantifiers on character classes: \d+, \w*, \s+, [a-z]++ etc.
  /[\\\[][^\\\]]*[+*][+*]/,
  // Group followed by possessive/atomic quantifier: (…)++, (…)*+
  /\)[+*]\+/,  
  // Quantified group containing alternation: (a|b)+, (a|b)* — high backtrack risk
  /\([^)]*\|[^)]*\)[+*]/,
  // Quantified group containing quantified inner group: (a+)+, (a*)* etc.
  /\([^)]*[+*][^)]*\)[+*]/,
  // Nested quantifiers on any atom: a++, a*+, a+* etc.
  /[a-zA-Z0-9.)\]]\+[+*]|[a-zA-Z0-9.)\]]\*[+*]|[a-zA-Z0-9.)\]][+*]\+|[a-zA-Z0-9.)\]][+*]\*/,
  // Lazy quantifiers (still cause backtracking on failure)
  /[+*]\?/,
  // Alternation with overlapping branches: (a|ab)+
  /\([^)]*\|[^)]*\.[+*]/,
]

// Only allow safe regex characters (strips injection vectors)
const SAFE_REGEX_CHARS = /^[a-zA-Z0-9\\^$.[\]{}()|*+?!,;:=<>_%\-:\/\s#@\uff00-\uffef\u0100-\u017f]+$/

// ── Complexity heuristic ──────────────────────────────────────────────────
// Counts quantifiers and nested groups. Patterns exceeding the threshold
// are rejected even if they evade the blocklist.
function quantifyComplexity(pattern: string): number {
  let score = 0
  let depth = 0
  for (const ch of pattern) {
    if (ch === '(' && depth < 20) depth++
    else if (ch === ')' && depth > 0) depth--
    if ((ch === '+' || ch === '*') && depth > 0) {
      // Each quantifier inside a group costs exponentially with depth
      score += depth * 2
    }
  }
  return score
}

const MAX_COMPLEXITY = 30

// Validates pattern safety before compilation. Returns error or null.
function sanitizePattern(pattern: string): string | null {
  if (pattern.length > MAX_REGEX_LENGTH) return `Pattern too long (max ${MAX_REGEX_LENGTH} chars)`
  if (DANGEROUS_PATTERNS.some(re => re.test(pattern))) return 'Pattern contains disallowed constructs'
  if (!SAFE_REGEX_CHARS.test(pattern)) return 'Pattern contains invalid characters'
  if (quantifyComplexity(pattern) > MAX_COMPLEXITY) {
    return 'Pattern too complex (too many nested quantifiers)'
  }
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
    const allStrings = [
      ...matchStrings.slice(0, MAX_TEST_STRINGS),
      ...rejectStrings.slice(0, MAX_TEST_STRINGS),
    ]

    let matchesAll = true
    let rejectsAll = true

    // Pre-compute match set for O(1) lookup
    const matchSet = new Set(matchStrings.slice(0, MAX_TEST_STRINGS))
    const rejectSet = new Set(rejectStrings.slice(0, MAX_TEST_STRINGS))

    for (const s of allStrings) {
      const start = Date.now()
      const result = regex.test(s)
      if (Date.now() - start > REGEX_TIMEOUT_MS) {
        return { valid: false, error: 'Pattern too slow (timeout)', matchesAll: false, rejectsAll: false }
      }
      if (matchSet.has(s) && !result) matchesAll = false
      if (rejectSet.has(s) && result) rejectsAll = false
    }

    return { valid: true, matchesAll, rejectsAll }
  } catch (e) {
    return { valid: false, error: (e as Error).message, matchesAll: false, rejectsAll: false }
  }
}
