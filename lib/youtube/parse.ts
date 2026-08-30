const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|playlist\?list=|shorts\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url.trim())
}

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim()

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]

  const vMatch = trimmed.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/)
  if (vMatch) return vMatch[1]

  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return shortsMatch[1]

  return null
}

export function extractPlaylistId(url: string): string | null {
  const match = url.trim().match(/[?&]list=([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}
