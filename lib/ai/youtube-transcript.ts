import 'server-only'

import { createHash } from 'crypto'
import { YoutubeTranscript } from 'youtube-transcript'

export interface VideoTranscript {
  text: string
  hash: string
}

export async function getYouTubeTranscript(videoId: string): Promise<VideoTranscript> {
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
  const text = items
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) {
    throw new Error('No transcript is available for this video')
  }

  return {
    text,
    hash: createHash('sha256').update(text).digest('hex'),
  }
}
