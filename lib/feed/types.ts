import type { FeedSubject, ReactionType } from './constants'
import type { YouTubeData } from '@/lib/youtube/types'

export interface LinkPreviewData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

export type ReactionCounts = Record<ReactionType, number>
export type UserReactionState = Record<ReactionType, boolean>

export interface FeedProfile {
  username: string
  avatar_url: string | null
  role?: string
}

export interface FeedPost {
  id: string
  content: string
  type: string
  author_id: string
  created_at: string
  is_pinned: boolean
  likes_count: number
  comments_count: number
  link_preview?: LinkPreviewData | null
  youtube_data?: YouTubeData | null
  subjects: FeedSubject[]
  reaction_counts: ReactionCounts
  user_reactions: UserReactionState
  saved_by_user: boolean
}

export function emptyReactionCounts(): ReactionCounts {
  return { like: 0, helpful: 0, upvote: 0 }
}

export function emptyUserReactionState(): UserReactionState {
  return { like: false, helpful: false, upvote: false }
}
