/**
 * Production-safe error handler.
 * In development (or when DEBUG=true), returns detailed error.
 * In production, logs detailed error server-side but returns generic message to client.
 */

const isDebug = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true'
const CONTROL_CHARS = /[\r\n\t\b\f\v\0]/g

export function getSafeErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isDebug) {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) return String((error as any).message)
    return fallback
  }
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
