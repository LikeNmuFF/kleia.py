import { describe, expect, it } from 'vitest'
import { getFeedVideoAssistantTarget } from './video-feed'
import type { FeedPost } from '@/lib/feed/types'

function makePost(overrides: Partial<FeedPost>): FeedPost {
  return {
    id: 'post-1',
    content: 'Watch this',
    type: 'post',
    author_id: 'user-1',
    created_at: '2026-08-30T00:00:00.000Z',
    is_pinned: false,
    likes_count: 0,
    comments_count: 0,
    subjects: [],
    reaction_counts: { like: 0, helpful: 0, upvote: 0 },
    user_reactions: { like: false, helpful: false, upvote: false },
    saved_by_user: false,
    ...overrides,
  }
}

describe('getFeedVideoAssistantTarget', () => {
  it('uses youtube_data when a post has an embedded video without a link preview', () => {
    const target = getFeedVideoAssistantTarget(makePost({
      youtube_data: {
        type: 'video',
        videos: [{
          video_id: 'abc123XYZ89',
          title: 'Intro to Python',
          thumbnail: null,
        }],
      },
      link_preview: null,
    }))

    expect(target).toEqual({
      videoId: 'abc123XYZ89',
      videoUrl: 'https://www.youtube.com/watch?v=abc123XYZ89',
      title: 'Intro to Python',
    })
  })

  it('uses a YouTube link preview when youtube_data is unavailable', () => {
    const target = getFeedVideoAssistantTarget(makePost({
      youtube_data: null,
      link_preview: {
        url: 'https://youtu.be/abc123XYZ89',
        title: 'Regex basics',
        description: null,
        image: null,
        siteName: 'YouTube',
      },
    }))

    expect(target).toEqual({
      videoId: 'abc123XYZ89',
      videoUrl: 'https://youtu.be/abc123XYZ89',
      title: 'Regex basics',
    })
  })

  it('returns null for non-YouTube posts', () => {
    const target = getFeedVideoAssistantTarget(makePost({
      youtube_data: null,
      link_preview: {
        url: 'https://example.com/article',
        title: 'Article',
        description: null,
        image: null,
        siteName: 'Example',
      },
    }))

    expect(target).toBeNull()
  })
})
