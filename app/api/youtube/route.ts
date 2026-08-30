import { NextRequest, NextResponse } from 'next/server'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { extractVideoId, extractPlaylistId } from '@/lib/youtube/parse'
import { getYouTubeTranscript } from '@/lib/youtube/transcript'

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

  const ip = getClientIp(request)
  const { allowed, retryAfter } = checkNamedRateLimit('youtube', ip, {
    windowMs: 60 * 1000,
    maxRequests: 15,
  })
  if (!allowed && retryAfter) {
    return rateLimitResponse(retryAfter)
  }

  const playlistId = extractPlaylistId(url)
  const videoId = extractVideoId(url)

  if (!playlistId && !videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
  }

  try {
    if (playlistId) {
      const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const html = await res.text()

      const titleMatch = html.match(/"title":\s*"([^"]+)"/)
      const title = titleMatch ? titleMatch[1] : null

      const videoIds: string[] = []
      const videoIdRegex = /"videoId":\s*"([a-zA-Z0-9_-]{11})"/g
      let m
      while ((m = videoIdRegex.exec(html)) !== null) {
        if (!videoIds.includes(m[1])) videoIds.push(m[1])
      }

      const videos = videoIds.slice(0, 50).map((id) => ({
        video_id: id,
        title: null,
        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      }))

      return NextResponse.json({
        type: 'playlist',
        videos,
      })
    }

    const captions = await getYouTubeTranscript(videoId!)

    return NextResponse.json({
      type: 'video',
      videos: [
        {
          video_id: videoId,
          title: null,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          captions,
        },
      ],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 502 })
  }
}
