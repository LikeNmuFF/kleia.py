/**
 * Production-safe error handler.
 * In development (or when DEBUG=true), returns detailed error.
 * In production, logs detailed error server-side but returns generic message to client.
 */

const isDebug = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true'

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
  console.error(`[${endpoint}]`, error)
  return getSafeErrorMessage(error, fallback)
}
