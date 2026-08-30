// app/api/youtube/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { resolveAndCheckHost, hasCredentials } from '@/lib/ssrf-guard'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { parseYouTubeUrl, getYouTubeThumbnail } from '@/lib/youtube/parse'
import type { YouTubeData, YouTubeVideo, YouTubeOEmbedResponse } from '@/lib/youtube/types'

async function fetchOEmbed(videoId: string): Promise<YouTubeOEmbedResponse | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KleiaBot/1.0 (YouTubePreview)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchCaptions(videoId: string): Promise<YouTubeVideo['captions']> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map((entry) => ({
      text: entry.text,
      start: entry.offset / 1000,
      duration: entry.duration / 1000,
    }))
  } catch {
    return []
  }
}

async function fetchPlaylistVideoIds(playlistId: string): Promise<string[]> {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`

    const parsedUrl = new URL(url)
    if (hasCredentials(parsedUrl)) return []
    if (!(await resolveAndCheckHost(parsedUrl.hostname))) return []

    const res = await fetch(url, {
      headers: { 'User-Agent': 'KleiaBot/1.0 (YouTubePreview)' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const html = await res.text()

    // Extract video IDs from ytInitialData
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s)
    if (!match) return []

    const data = JSON.parse(match[1])
    const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]
      ?.playlistVideoListRenderer?.contents

    if (!contents) return []

    const videoIds: string[] = []
    for (const item of contents) {
      const video = item.playlistVideoRenderer
      if (video?.videoId) {
        videoIds.push(video.videoId)
      }
    }

    return videoIds.slice(0, 50) // Limit to 50 videos
  } catch {
    return []
  }
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
  const { allowed, retryAfter } = checkNamedRateLimit('youtube', ip, {
    windowMs: 60 * 1000,
    maxRequests: 10,
  })
  if (!allowed && retryAfter) {
    return rateLimitResponse(retryAfter)
  }

  const parsed = parseYouTubeUrl(url)
  if (parsed.type === 'invalid') {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
  }

  try {
    const videoIds: string[] = []

    if (parsed.type === 'playlist' && parsed.playlistId) {
      const ids = await fetchPlaylistVideoIds(parsed.playlistId)
      videoIds.push(...ids)
    } else if (parsed.videoId) {
      videoIds.push(parsed.videoId)
    }

    if (videoIds.length === 0) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 })
    }

    // Fetch metadata and captions for all videos
    const videos: YouTubeVideo[] = await Promise.all(
      videoIds.map(async (videoId) => {
        const [oembed, captions] = await Promise.all([
          fetchOEmbed(videoId),
          fetchCaptions(videoId),
        ])

        return {
          id: videoId,
          title: oembed?.title || 'YouTube Video',
          thumbnail: getYouTubeThumbnail(videoId),
          captions,
        }
      })
    )

    const youtubeData: YouTubeData = {
      type: parsed.playlistId && videoIds.length > 1 ? 'playlist' : 'video',
      videos,
    }

    return NextResponse.json(youtubeData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 502 })
  }
}
