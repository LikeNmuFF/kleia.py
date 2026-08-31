import { describe, expect, it } from 'vitest'
import {
  FEEDBACK_TYPES,
  normalizeFeedbackInput,
  type FeedbackInput,
} from './validation'

const baseInput: FeedbackInput = {
  type: 'app_feedback',
  rating: '5',
  title: 'Love the practice flow',
  message: 'The CTF and daily cipher loop keeps me coming back.',
  pageUrl: '/ctf',
  allowPublic: true,
}

describe('normalizeFeedbackInput', () => {
  it('accepts app feedback with a one to five star rating', () => {
    expect(FEEDBACK_TYPES).toContain('app_feedback')

    expect(normalizeFeedbackInput(baseInput)).toEqual({
      type: 'app_feedback',
      rating: 5,
      title: 'Love the practice flow',
      message: 'The CTF and daily cipher loop keeps me coming back.',
      pageUrl: '/ctf',
      allowPublic: true,
    })
  })

  it('rejects app feedback without a valid rating', () => {
    expect(normalizeFeedbackInput({ ...baseInput, rating: '6' })).toEqual({
      error: 'Choose a star rating from 1 to 5.',
    })
  })

  it('accepts bug, error, and feature reports without public landing display', () => {
    for (const type of ['bug_report', 'error_report', 'feature_suggestion'] as const) {
      const result = normalizeFeedbackInput({
        ...baseInput,
        type,
        rating: '',
        allowPublic: true,
      })

      expect(result).toMatchObject({
        type,
        rating: null,
        allowPublic: false,
      })
    }
  })

  it('requires useful title and message text', () => {
    expect(normalizeFeedbackInput({ ...baseInput, title: 'no' })).toEqual({
      error: 'Add a short title with at least 3 characters.',
    })
    expect(normalizeFeedbackInput({ ...baseInput, message: 'too short' })).toEqual({
      error: 'Add details with at least 10 characters.',
    })
  })
})
