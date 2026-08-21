import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 5 * 60 * 1000, maxRequests: 5 },
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  'forgot-password': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  'reset-password': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  // Proxy endpoints — prevent abuse as open proxies
  'api/link-preview': { windowMs: 60 * 1000, maxRequests: 10 },
  'api/image-proxy': { windowMs: 60 * 1000, maxRequests: 10 },
}

/**
 * General-purpose rate limiter for named actions.
 * Use this from API route handlers that don't match pathname-based lookup.
 */
export function checkNamedRateLimit(
  action: string,
  ip: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const key = `${action}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true }
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true }
}

export function checkRateLimit(
  pathname: string,
  ip: string
): { allowed: boolean; retryAfter?: number } {
  const action = Object.keys(RATE_LIMITS).find((key) => pathname.startsWith(`/${key}`))

  if (!action) {
    return { allowed: true }
  }

  const config = RATE_LIMITS[action]
  return checkNamedRateLimit(action, ip, config)
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limited': 'true',
        'X-RateLimit-Retry-After': retryAfter.toString(),
      },
    }
  )
}
