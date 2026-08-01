import { NextRequest, NextResponse } from 'next/server'

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

function extractMeta(html: string, property: string): string | null {
  // Check og: tags
  const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
  if (ogMatch) return ogMatch[1]

  // Check reverse order: content before property
  const ogMatch2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'))
  if (ogMatch2) return ogMatch2[1]

  // Check name= tags (twitter:card, etc.)
  const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
  if (nameMatch) return nameMatch[1]

  const nameMatch2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'))
  if (nameMatch2) return nameMatch2[1]

  return null
}

function extractTitle(html: string): string | null {
  // Try OG title first
  const ogTitle = extractMeta(html, 'og:title')
  if (ogTitle) return ogTitle

  // Try <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) return titleMatch[1].trim()

  return null
}

function extractDescription(html: string): string | null {
  // Try OG description first
  const ogDesc = extractMeta(html, 'og:description')
  if (ogDesc) return ogDesc

  // Try meta description
  const descMatch = extractMeta(html, 'description')
  if (descMatch) return descMatch

  return null
}

function extractImage(html: string, baseUrl: string): string | null {
  // Try OG image
  const ogImage = extractMeta(html, 'og:image')
  if (ogImage) return resolveUrl(ogImage, baseUrl)

  // Try twitter:image
  const twImage = extractMeta(html, 'twitter:image')
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
  return extractMeta(html, 'og:site_name')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
  }

  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS links are allowed' }, { status: 400 })
  }

  // Block local/private IPs
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
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 })
  }
}
