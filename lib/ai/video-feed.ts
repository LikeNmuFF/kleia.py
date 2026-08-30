import type { FeedPost } from '@/lib/feed/types'
import { extractYouTubeVideoId } from './video-assistant'

export interface FeedVideoAssistantTarget {
  videoId: string
  videoUrl: string
  title: string
}

export function getFeedVideoAssistantTarget(post: Pick<FeedPost, 'youtube_data' | 'link_preview'>): FeedVideoAssistantTarget | null {
  const embeddedVideo = post.youtube_data?.videos[0]

  if (embeddedVideo?.video_id) {
    return {
      videoId: embeddedVideo.video_id,
      videoUrl: `https://www.youtube.com/watch?v=${embeddedVideo.video_id}`,
      title: embeddedVideo.title ?? post.link_preview?.title ?? 'YouTube video',
    }
  }

  const previewUrl = post.link_preview?.url
  const previewVideoId = previewUrl ? extractYouTubeVideoId(previewUrl) : null

  if (!previewUrl || !previewVideoId) {
    return null
  }

  return {
    videoId: previewVideoId,
    videoUrl: previewUrl,
    title: post.link_preview?.title ?? 'YouTube video',
  }
}
