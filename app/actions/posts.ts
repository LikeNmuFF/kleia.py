'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isPostReaction, normalizeSubjects, type ReactionType } from '@/lib/feed/constants'
import { emptyReactionCounts, type ReactionCounts } from '@/lib/feed/types'
import { logEvent } from '@/lib/logEvent'
import type { YouTubeData } from '@/lib/youtube/types'

interface LinkPreviewData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

export async function createPost(content: string, linkPreview?: LinkPreviewData, subjects: string[] = [], youtubeData?: YouTubeData) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  if (!content.trim()) {
    return { error: 'Content cannot be empty' }
  }

  if (content.trim().length > 5000) {
    return { error: 'Content too long (max 5000 characters)' }
  }

  const insertData: Record<string, unknown> = {
    author_id: user.id,
    content: content.trim(),
    type: 'text',
  }

  if (youtubeData) {
    insertData.youtube_data = youtubeData
  } else if (linkPreview) {
    insertData.link_preview = linkPreview
    insertData.type = 'resource'
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    await logEvent({ endpoint: 'posts.createPost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  const normalizedSubjects = normalizeSubjects(subjects)
  if (post && normalizedSubjects.length > 0) {
    const { error: tagError } = await supabase.from('post_subject_tags').insert(
      normalizedSubjects.map((subject) => ({
        post_id: post.id,
        subject,
      }))
    )

    if (tagError) {
      const { error: cleanupError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('author_id', user.id)

      if (cleanupError) {
        await logEvent({
          endpoint: 'posts.createPost.tags.cleanup',
          status: 'error',
          durationMs: Date.now() - start,
          errorMessage: cleanupError.message,
          userId: user.id,
        })
      }

      await logEvent({
        endpoint: 'posts.createPost.tags',
        status: 'error',
        durationMs: Date.now() - start,
        errorMessage: tagError.message,
        userId: user.id,
      })
      return { error: tagError.message }
    }
  }

  await logEvent({ endpoint: 'posts.createPost', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')

  const { addXp, completeMission } = await import('./gamification')
  await addXp(10, 'post')
  await completeMission('post', true)

  return { success: true }
}

export async function toggleReaction(postId: string, reactionType: ReactionType | string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }
  if (!isPostReaction(reactionType)) return { error: 'Unsupported reaction' }

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .eq('reaction_type', reactionType)

    if (error) {
      await logEvent({ endpoint: 'posts.toggleReaction', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('post_reactions')
      .insert({ user_id: user.id, post_id: postId, reaction_type: reactionType })

    if (error) {
      await logEvent({ endpoint: 'posts.toggleReaction', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  }

  const { data: rows, error: countsError } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)

  if (countsError) {
    await logEvent({ endpoint: 'posts.toggleReaction.counts', status: 'error', durationMs: Date.now() - start, errorMessage: countsError.message, userId: user.id })
    return { error: countsError.message }
  }

  const counts: ReactionCounts = emptyReactionCounts()
  for (const row of rows ?? []) {
    if (isPostReaction(row.reaction_type)) counts[row.reaction_type] += 1
  }

  await logEvent({ endpoint: 'posts.toggleReaction', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  revalidatePath('/feed/saved')
  return { selected: !existing, counts }
}

export async function toggleLike(postId: string) {
  const result = await toggleReaction(postId, 'like')
  if (result.error) return result
  return { liked: result.selected, likesCount: result.counts?.like ?? 0 }
}

export async function toggleSavedPost(postId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existing } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) {
      await logEvent({ endpoint: 'posts.toggleSavedPost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: user.id, post_id: postId })

    if (error) {
      await logEvent({ endpoint: 'posts.toggleSavedPost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  }

  await logEvent({ endpoint: 'posts.toggleSavedPost', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  revalidatePath('/feed/saved')
  return { saved: !existing }
}

export async function getComments(postId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: comments, error } = await supabase
    .from('comments')
    .select('id, content, created_at, author_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    await logEvent({ endpoint: 'posts.getComments', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return []
  }

  if (!comments || comments.length === 0) return []

  const authorIds = Array.from(new Set(comments.map(c => c.author_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .in('id', authorIds)
  const authorMap: Record<string, { username: string; avatar_url: string | null; role?: string }> = {}
  for (const p of profiles || []) {
    authorMap[p.id] = { username: p.username, avatar_url: p.avatar_url, role: p.role }
  }

  return comments.map(c => ({
    ...c,
    author: authorMap[c.author_id] || { username: 'Unknown', avatar_url: null },
  }))
}

export async function addComment(postId: string, content: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!content.trim()) {
    return { error: 'Comment cannot be empty' }
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    author_id: user.id,
    content: content.trim(),
  })

  if (error) {
    await logEvent({ endpoint: 'posts.addComment', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'posts.addComment', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  return { success: true }
}

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export async function togglePin(postId: string) {
  const start = Date.now()
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    await logEvent({ endpoint: 'posts.togglePin', status: 'error', durationMs: Date.now() - start, errorMessage: 'Unauthorized' })
    return { error: 'Unauthorized' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('is_pinned')
    .eq('id', postId)
    .single()

  const newPinned = !post?.is_pinned

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: newPinned })
    .eq('id', postId)

  if (error) {
    await logEvent({ endpoint: 'posts.togglePin', status: 'error', durationMs: Date.now() - start, errorMessage: error.message })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'posts.togglePin', status: 'success', durationMs: Date.now() - start })
  revalidatePath('/feed')
  return { pinned: newPinned }
}

export async function deleteComment(commentId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) {
    await logEvent({ endpoint: 'posts.deleteComment', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'posts.deleteComment', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  return { success: true }
}

export async function updatePost(postId: string, content: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!content.trim()) {
    return { error: 'Content cannot be empty' }
  }

  if (content.trim().length > 5000) {
    return { error: 'Content too long (max 5000 characters)' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!post || post.author_id !== user.id) {
    return { error: 'You can only edit your own posts' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ content: content.trim() })
    .eq('id', postId)

  if (error) {
    await logEvent({ endpoint: 'posts.updatePost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'posts.updatePost', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  return { success: true }
}

export async function deletePost(postId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!post || post.author_id !== user.id) {
    return { error: 'You can only delete your own posts' }
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    await logEvent({ endpoint: 'posts.deletePost', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'posts.deletePost', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/feed')
  return { success: true }
}
