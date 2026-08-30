import { fetchTranscript } from 'youtube-transcript'
import type { CaptionSegment } from './types'

export async function getYouTubeTranscript(videoId: string): Promise<CaptionSegment[]> {
  try {
    const raw = await fetchTranscript(videoId)
    return raw.map((seg) => ({
      text: seg.text,
      start: seg.offset / 1000,
      duration: seg.duration / 1000,
    }))
  } catch {
    return []
  }
}
