'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createPost(content: string) {
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

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    content: content.trim(),
    type: 'text',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function toggleLike(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ user_id: user.id, post_id: postId })

    if (error) return { error: error.message }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single()

  revalidatePath('/feed')
  return { liked: !existing, likesCount: post?.likes_count ?? 0 }
}

export async function getComments(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, created_at, author_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (!comments || comments.length === 0) return []

  const authorIds = Array.from(new Set(comments.map(c => c.author_id)))
  const authorMap: Record<string, { username: string; avatar_url: string | null }> = {}

  for (const id of authorIds) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', id)
      .single()
    if (profile) authorMap[id] = profile
  }

  return comments.map(c => ({
    ...c,
    author: authorMap[c.author_id] || { username: 'Unknown', avatar_url: null },
  }))
}

export async function addComment(postId: string, content: string) {
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

  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { success: true }
}
