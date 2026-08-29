import { NextRequest, NextResponse } from 'next/server'
import { resolveAndCheckHost, hasCredentials } from '@/lib/ssrf-guard'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

const MAX_REDIRECTS = 2

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

const OG_TITLE_1 = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
const OG_TITLE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i
const OG_DESC_1 = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
const OG_DESC_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i
const OG_IMAGE_1 = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
const OG_IMAGE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
const OG_IMAGE_SECURE_1 = /<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i
const OG_IMAGE_SECURE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i
const OG_SITE_1 = /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i
const OG_SITE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i
const META_DESC_1 = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
const META_DESC_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
const TW_IMAGE_1 = /<meta[^>]*(?:name|property)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i
const TW_IMAGE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image(?::src)?["']/i

function extractOgTitle(html: string): string | null {
  const raw = html.match(OG_TITLE_1)?.[1] || html.match(OG_TITLE_2)?.[1]
  return raw ? decodeHtmlEntities(raw) : null
}

function extractOgDescription(html: string): string | null {
  const raw = html.match(OG_DESC_1)?.[1] || html.match(OG_DESC_2)?.[1]
  return raw ? decodeHtmlEntities(raw) : null
}

function extractOgImage(html: string): string | null {
  return html.match(OG_IMAGE_1)?.[1] || html.match(OG_IMAGE_2)?.[1] || html.match(OG_IMAGE_SECURE_1)?.[1] || html.match(OG_IMAGE_SECURE_2)?.[1] || null
}

function extractOgSiteName(html: string): string | null {
  const raw = html.match(OG_SITE_1)?.[1] || html.match(OG_SITE_2)?.[1]
  return raw ? decodeHtmlEntities(raw) : null
}

function extractMetaDescription(html: string): string | null {
  const raw = html.match(META_DESC_1)?.[1] || html.match(META_DESC_2)?.[1]
  return raw ? decodeHtmlEntities(raw) : null
}

function extractTwitterImage(html: string): string | null {
  return html.match(TW_IMAGE_1)?.[1] || html.match(TW_IMAGE_2)?.[1] || null
}

function extractTitle(html: string): string | null {
  return extractOgTitle(html) || (() => {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return m ? decodeHtmlEntities(m[1].trim()) : null
  })()
}

function extractDescription(html: string): string | null {
  return extractOgDescription(html) || extractMetaDescription(html)
}

function extractImage(html: string, baseUrl: string): string | null {
  const raw = extractOgImage(html) || extractTwitterImage(html)
  if (!raw) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  try { return new URL(raw, baseUrl).href } catch { return raw }
}

function extractSiteName(html: string): string | null {
  return extractOgSiteName(html)
}

function getClientIp(request: NextRequest): string {
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()
  return 'unknown'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
  }

  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(request)
  const { allowed, retryAfter } = checkNamedRateLimit('link-preview', ip, {
    windowMs: 60 * 1000,
    maxRequests: 10,
  })
  if (!allowed && retryAfter) {
    return rateLimitResponse(retryAfter)
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS links are allowed' }, { status: 400 })
  }

  if (hasCredentials(parsed)) {
    return NextResponse.json({ error: 'URLs with credentials not allowed' }, { status: 400 })
  }

  if (!(await resolveAndCheckHost(parsed.hostname))) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let currentUrl = url
    let response: Response | null = null

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'KleiaBot/1.0 (LinkPreview)',
          'Accept': 'text/html',
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
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({
        url,
        title: parsed.hostname,
        description: null,
        image: null,
        siteName: parsed.hostname,
      })
    }

    const reader = response.body?.getReader()
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    const MAX_BYTES = 250000

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        totalBytes += value.length
        if (totalBytes >= MAX_BYTES) break
      }
      reader.cancel()
    }

    const html = new TextDecoder().decode(Buffer.concat(chunks))

    const preview: LinkPreview = {
      url,
      title: extractTitle(html),
      description: extractDescription(html),
      image: extractImage(html, url),
      siteName: extractSiteName(html),
    }

    return NextResponse.json(preview, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 })
  }
}
