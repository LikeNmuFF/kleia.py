import { NextRequest, NextResponse } from 'next/server'
import { resolveAndCheckHost, hasCredentials } from '@/lib/ssrf-guard'
import { logSecurityEvent } from '@/lib/security-log'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'

const MAX_URL_LENGTH = 2048
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_REDIRECTS = 2

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  if (url.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 })
  }

  const decodedUrl = url.replace(/&amp;/g, '&')

  let parsed: URL
  try {
    parsed = new URL(decodedUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const clientIp =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    null

  // Rate limit: 10 requests per minute per IP
  const ipForRateLimit = clientIp || 'unknown'
  const { allowed, retryAfter } = checkNamedRateLimit('image-proxy', ipForRateLimit, {
    windowMs: 60 * 1000,
    maxRequests: 10,
  })
  if (!allowed && retryAfter) {
    return rateLimitResponse(retryAfter)
  }

  if (parsed.protocol !== 'https:') {
    void logSecurityEvent({
      eventType: 'proxy_invalid_protocol',
      severity: 'low',
      sourceIp: clientIp,
      details: { url: decodedUrl.slice(0, 200) },
    })
    return NextResponse.json({ error: 'Only HTTPS allowed' }, { status: 400 })
  }

  if (hasCredentials(parsed)) {
    void logSecurityEvent({
      eventType: 'proxy_credentials',
      severity: 'medium',
      sourceIp: clientIp,
      details: { url: decodedUrl.slice(0, 200) },
    })
    return NextResponse.json({ error: 'URLs with credentials not allowed' }, { status: 400 })
  }

  if (!(await resolveAndCheckHost(parsed.hostname))) {
    void logSecurityEvent({
      eventType: 'ssrf_attempt',
      severity: 'high',
      sourceIp: clientIp,
      details: { hostname: parsed.hostname, url: decodedUrl.slice(0, 200) },
    })
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let currentUrl = decodedUrl
    let response: Response | null = null

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      // Derive Referer from the target origin so CDNs that check it (Facebook, etc.) don't reject us
      const refererOrigin = new URL(currentUrl).origin

      response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': `${refererOrigin}/`,
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'manual',
      })

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) break

        let nextUrl: URL
        try {
          nextUrl = new URL(location, currentUrl)
        } catch {
          break
        }

        if (nextUrl.protocol !== 'https:') break
        if (hasCredentials(nextUrl)) break
        if (!(await resolveAndCheckHost(nextUrl.hostname))) break

        currentUrl = nextUrl.href
        continue
      }

      break
    }

    clearTimeout(timeout)

    if (!response || !response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 400 })
    }

    const body = await response.arrayBuffer()

    if (body.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
