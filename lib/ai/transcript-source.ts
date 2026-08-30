import { createHash } from 'crypto'
import type { CaptionSegment } from '@/lib/youtube/types'

export interface VideoTranscript {
  text: string
  hash: string
}

export function createTranscriptFromText(text: string): VideoTranscript | null {
  const normalized = text.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return null
  }

  return {
    text: normalized,
    hash: createHash('sha256').update(normalized).digest('hex'),
  }
}

export function createTranscriptFromCaptionSegments(captions?: CaptionSegment[] | null): VideoTranscript | null {
  if (!captions?.length) {
    return null
  }

  return createTranscriptFromText(captions.map((caption) => caption.text).join(' '))
}
