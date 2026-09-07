/**
 * Production-safe error handler.
 * Returns only the public fallback. Detailed errors belong in server-side logs.
 */

const CONTROL_CHARS = /[\r\n\t\b\f\v\0]/g

export function getSafeErrorMessage(_error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return fallback
}

export function logAndGetSafeError(endpoint: string, error: unknown, fallback?: string): string {
  // Always log detailed error server-side
  const safeEndpoint = endpoint.replace(CONTROL_CHARS, (char) => {
    if (char === '\r') return '\\r'
    if (char === '\n') return '\\n'
    if (char === '\t') return '\\t'
    if (char === '\b') return '\\b'
    if (char === '\f') return '\\f'
    if (char === '\v') return '\\v'
    return '\\0'
  })
  console.error('%s', `[${safeEndpoint}]`, error)
  return getSafeErrorMessage(error, fallback)
}
