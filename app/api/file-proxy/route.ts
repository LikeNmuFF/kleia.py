import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

const MAX_URL_LENGTH = 2048
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_HOSTS = ['res.cloudinary.com']

function signCloudinaryUrl(url: string): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY
  if (!apiSecret || !apiKey) return url

  const parsed = new URL(url)
  const host = parsed.hostname

  // Extract public_id from path: /raw/upload/v1234/file.pdf -> file.pdf
  const pathMatch = parsed.pathname.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
  if (!pathMatch) return url

  const publicId = pathMatch[1]
  const timestamp = Math.floor(Date.now() / 1000) + 3600

  const signature = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  const params = new URLSearchParams({
    public_id: publicId,
    timestamp: timestamp.toString(),
    api_key: apiKey,
    signature,
  })

  return `https://${host}/raw/upload?${params.toString()}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  if (url.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS allowed' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname.toLowerCase())) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  // Sign the Cloudinary URL if it's a raw upload
  const fetchUrl = parsed.pathname.includes('/raw/upload/')
    ? signCloudinaryUrl(url)
    : url

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KleiaBot/1.0)',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file', status: response.status }, { status: 502 })
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    if (body.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 })
  }
}
