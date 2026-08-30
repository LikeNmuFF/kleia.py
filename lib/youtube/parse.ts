// lib/youtube/parse.ts

export type YouTubeUrlType = 'video' | 'playlist' | 'shorts' | 'invalid'

export interface ParsedYouTubeUrl {
  type: YouTubeUrlType
  videoId?: string
  playlistId?: string
}

/**
 * Parse a YouTube URL and extract video/playlist IDs
 */
export function parseYouTubeUrl(url: string): ParsedYouTubeUrl {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace('www.', '')

    // youtu.be short link
    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1).split('?')[0]
      if (videoId && videoId.length === 11) {
        return { type: 'video', videoId }
      }
      return { type: 'invalid' }
    }

    // youtube.com variants
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      // Playlist URL
      const listParam = parsed.searchParams.get('list')
      if (listParam) {
        // Check if it also has a video ID
        const videoParam = parsed.searchParams.get('v')
        if (videoParam && videoParam.length === 11) {
          return { type: 'video', videoId: videoParam, playlistId: listParam }
        }
        return { type: 'playlist', playlistId: listParam }
      }

      // Standard watch URL
      const vParam = parsed.searchParams.get('v')
      if (vParam && vParam.length === 11) {
        return { type: 'video', videoId: vParam }
      }

      // Shorts URL
      const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)
      if (shortsMatch) {
        return { type: 'shorts', videoId: shortsMatch[1] }
      }

      // Embed URL
      const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embedMatch) {
        return { type: 'video', videoId: embedMatch[1] }
      }
    }

    return { type: 'invalid' }
  } catch {
    return { type: 'invalid' }
  }
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const result = parseYouTubeUrl(url)
  return result.type !== 'invalid'
}

/**
 * Get the YouTube thumbnail URL for a video ID
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

/**
 * Get the YouTube embed URL for a video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`
}
