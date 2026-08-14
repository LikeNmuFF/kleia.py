import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/security-log'

// Paths that no legitimate user ever hits — only scanners and attackers probe them.
const HONEYPOT_PATHS = new Set([
  '/.env',
  '/.git/config',
  '/.git/HEAD',
  '/.well-known/security.txt',
  '/.aws/credentials',
  '/admin-login',
  '/administrator',
  '/backup.zip',
  '/backup.sql',
  '/cgi-bin',
  '/config.php',
  '/debug',
  '/info.php',
  '/phpinfo',
  '/phpmyadmin',
  '/server-status',
  '/shell',
  '/test.php',
  '/wp-admin',
  '/wp-login.php',
  '/wp-content',
  '/ws/manager',
  '/actuator',
  '/actuator/env',
  '/swagger-ui',
  '/v2/api-docs',
  '/vendor',
  '/tmp',
  '/etc/passwd',
])

function getClientIp(request: NextRequest): string {
  // On Vercel, x-vercel-forwarded-for is appended by the platform and cannot be spoofed
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  // Check x-forwarded-for (set by reverse proxies like nginx/cloudflare)
  // Only trust the FIRST entry — the last proxy appends, earlier entries may be client-spoofed
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  // Fallback to x-real-ip (set by reverse proxies)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.split(',')[0].trim()

  // CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  return 'unknown'
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Honeypot: log + absorb scanner hits
  if (HONEYPOT_PATHS.has(pathname)) {
    const ip = getClientIp(request)
    void logSecurityEvent({
      eventType: 'honeypot_hit',
      severity: 'medium',
      sourceIp: ip,
      details: { path: pathname, userAgent: request.headers.get('user-agent') },
    })
    return new NextResponse('Not Found', { status: 404 })
  }

  // Rate limit auth endpoints
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback')
  ) {
    const ip = getClientIp(request)

    const { allowed, retryAfter } = checkRateLimit(pathname, ip)
    if (!allowed && retryAfter) {
      void logSecurityEvent({
        eventType: 'rate_limited',
        severity: 'low',
        sourceIp: ip,
        details: { path: pathname, retryAfter },
      })
      return rateLimitResponse(retryAfter)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml|webmanifest)$).*)',
  ],
}
