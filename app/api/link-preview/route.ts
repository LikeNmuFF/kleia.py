import { NextRequest, NextResponse } from 'next/server'

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

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

function getMetaContent(html: string, attributeName: 'property' | 'name', value: string): string | null {
  // Escape the value for safe use in regex
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Pattern 1: <meta property="value" content="...">
  const p1 = new RegExp(`<meta[^>]*${attributeName}=["']${escaped}["'][^>]*content=["']([^"']+)["']`, 'i')
  const m1 = html.match(p1)
  if (m1) return decodeHtmlEntities(m1[1])

  // Pattern 2: <meta content="..." property="value">
  const p2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${attributeName}=["']${escaped}["']`, 'i')
  const m2 = html.match(p2)
  if (m2) return decodeHtmlEntities(m2[1])

  return null
}

function extractTitle(html: string): string | null {
  const ogTitle = getMetaContent(html, 'property', 'og:title')
  if (ogTitle) return ogTitle

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) return decodeHtmlEntities(titleMatch[1].trim())

  return null
}

function extractDescription(html: string): string | null {
  return getMetaContent(html, 'property', 'og:description')
    || getMetaContent(html, 'name', 'description')
}

function extractImage(html: string, baseUrl: string): string | null {
  const ogImage = getMetaContent(html, 'property', 'og:image')
  if (ogImage) return resolveUrl(ogImage, baseUrl)

  const twImage = getMetaContent(html, 'name', 'twitter:image')
  if (twImage) return resolveUrl(twImage, baseUrl)

  return null
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

function extractSiteName(html: string): string | null {
  return getMetaContent(html, 'property', 'og:site_name')
}

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
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
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

    return NextResponse.json(preview)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 })
  }
}
