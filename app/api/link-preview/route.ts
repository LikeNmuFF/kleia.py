import { NextRequest, NextResponse } from 'next/server'

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

// ============================================================
// HTML entity decoder
// ============================================================
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

// ============================================================
// Hardcoded regex patterns — no dynamic RegExp construction
// Each property has patterns for:
//   1. property/name attr first, then content attr
//   2. content attr first, then property/name attr
// ============================================================

// og:title
const OG_TITLE_1 = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
const OG_TITLE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i

// og:description
const OG_DESC_1 = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
const OG_DESC_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i

// og:image
const OG_IMAGE_1 = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
const OG_IMAGE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i

// og:site_name
const OG_SITE_1 = /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i
const OG_SITE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i

// meta name="description"
const META_DESC_1 = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
const META_DESC_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i

// twitter:image
const TW_IMAGE_1 = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
const TW_IMAGE_2 = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i

// ============================================================
// Extraction helpers
// ============================================================

function extractOgTitle(html: string): string | null {
  const raw = html.match(OG_TITLE_1)?.[1] || html.match(OG_TITLE_2)?.[1]
  return raw ? decodeHtmlEntities(raw) : null
}

function extractOgDescription(html: string): string | null {
  const raw = html.match(OG_DESC_1)?.[1] || html.match(OG_DESC_2)?.[1]
  return raw ? decodeHtmlEntities(raw) : null
}

function extractOgImage(html: string): string | null {
  return html.match(OG_IMAGE_1)?.[1] || html.match(OG_IMAGE_2)?.[1] || null
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

// ============================================================
// API handler
// ============================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
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

  const hostname = parsed.hostname.toLowerCase()

  // Block numeric IP addresses (prevents IP obfuscation)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')) {
    return NextResponse.json({ error: 'IP addresses not allowed' }, { status: 400 })
  }

  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    (hostname.startsWith('172.') && (() => {
      const second = parseInt(hostname.split('.')[1] || '0', 10)
      return second >= 16 && second <= 31
    })()) ||
    hostname.startsWith('169.254.') ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost') ||
    hostname === '::1' ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fe80:')
  ) {
    return NextResponse.json({ error: 'Private URLs not allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KleiaBot/1.0 (LinkPreview)',
        'Accept': 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
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

    // Read only first 50KB to avoid huge pages
    const reader = response.body?.getReader()
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    const MAX_BYTES = 50000

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
