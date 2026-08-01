import { NextRequest, NextResponse } from 'next/server'

const MAX_URL_LENGTH = 2048
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  if (url.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 })
  }

  // Decode HTML entities that get encoded in URLs (&amp; → &)
  const decodedUrl = url.replace(/&amp;/g, '&')

  let parsed: URL
  try {
    parsed = new URL(decodedUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS allowed' }, { status: 400 })
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
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KleiaBot/1.0)',
        'Accept': 'image/*',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Only allow image content types
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
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
