import { describe, expect, it } from 'vitest'
import { createTranscriptFromCaptionSegments } from './transcript-source'

describe('createTranscriptFromCaptionSegments', () => {
  it('builds AI transcript text from stored YouTube captions', () => {
    const transcript = createTranscriptFromCaptionSegments([
      { text: '  Hello   learners ', start: 0, duration: 1.2 },
      { text: 'today we study loops.', start: 1.2, duration: 2 },
    ])

    expect(transcript?.text).toBe('Hello learners today we study loops.')
    expect(transcript?.hash).toHaveLength(64)
  })

  it('returns null when stored captions have no usable text', () => {
    const transcript = createTranscriptFromCaptionSegments([
      { text: '   ', start: 0, duration: 1 },
    ])

    expect(transcript).toBeNull()
  })
})
