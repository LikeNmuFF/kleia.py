import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

function getClientIp(request: NextRequest): string {
  // On Vercel, x-vercel-forwarded-for is appended by the platform and cannot be spoofed
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  // Fallback to x-real-ip (set by reverse proxies)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.split(',')[0].trim()

  return 'unknown'
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

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
