import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { emptyReactionCounts, emptyUserReactionState, type FeedPost, type FeedProfile } from './types'
import { POST_REACTIONS, type FeedSubject, type ReactionType } from './constants'

type BasePost = Omit<FeedPost, 'subjects' | 'reaction_counts' | 'user_reactions' | 'saved_by_user'>

function buildPostMap(posts: BasePost[]): Map<string, FeedPost> {
  return new Map(posts.map((post) => [
    post.id,
    {
      ...post,
      subjects: [],
      reaction_counts: emptyReactionCounts(),
      user_reactions: emptyUserReactionState(),
      saved_by_user: false,
    },
  ]))
}

async function hydratePosts(posts: BasePost[], userId?: string | null): Promise<FeedPost[]> {
  if (posts.length === 0) return []

  const supabase = await createClient()
  const postIds = posts.map((post) => post.id)
  const postMap = buildPostMap(posts)

  const [tagsResult, reactionsResult, savedResult] = await Promise.all([
    supabase.from('post_subject_tags').select('post_id, subject').in('post_id', postIds),
    supabase.from('post_reactions').select('post_id, user_id, reaction_type').in('post_id', postIds),
    userId
      ? supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [] }),
  ])

  for (const tag of tagsResult.data ?? []) {
    const post = postMap.get(tag.post_id)
    if (post && !post.subjects.includes(tag.subject as FeedSubject)) {
      post.subjects.push(tag.subject as FeedSubject)
    }
  }

  for (const reaction of reactionsResult.data ?? []) {
    const post = postMap.get(reaction.post_id)
    const type = reaction.reaction_type as ReactionType
    if (post && POST_REACTIONS.includes(type)) {
      post.reaction_counts[type] += 1
      if (userId && reaction.user_id === userId) {
        post.user_reactions[type] = true
      }
    }
  }

  for (const saved of savedResult.data ?? []) {
    const post = postMap.get(saved.post_id)
    if (post) post.saved_by_user = true
  }

  return posts.map((post) => postMap.get(post.id)!).filter(Boolean)
}

export async function getFeedPosts(userId?: string | null): Promise<FeedPost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('id, content, type, author_id, created_at, is_pinned, likes_count, comments_count, link_preview')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return hydratePosts((data ?? []) as BasePost[], userId)
}

export async function getSavedFeedPosts(userId: string): Promise<FeedPost[]> {
  const supabase = await createClient()
  const { data: saved } = await supabase
    .from('saved_posts')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const savedPostIds = (saved ?? []).map((row) => row.post_id)
  if (savedPostIds.length === 0) return []

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, type, author_id, created_at, is_pinned, likes_count, comments_count, link_preview')
    .in('id', savedPostIds)

  const byId = new Map(((posts ?? []) as BasePost[]).map((post) => [post.id, post]))
  const ordered = savedPostIds.map((id) => byId.get(id)).filter(Boolean) as BasePost[]
  return hydratePosts(ordered, userId)
}

export async function getAuthorProfiles(posts: FeedPost[]): Promise<Record<string, FeedProfile>> {
  if (posts.length === 0) return {}

  const supabase = await createClient()
  const authorIds = Array.from(new Set(posts.map((post) => post.author_id)))
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', authorIds)

  const map: Record<string, FeedProfile> = {}
  for (const profile of data ?? []) {
    map[profile.id] = {
      username: profile.username,
      avatar_url: profile.avatar_url,
      role: profile.role,
    }
  }
  return map
}
