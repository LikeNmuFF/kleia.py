'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addProgress(subject: string, hours: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  if (typeof hours !== 'number' || isNaN(hours) || hours <= 0 || hours > 24) {
    return { error: 'Hours must be a positive number (max 24)' }
  }

  if (!subject.trim()) {
    return { error: 'Subject cannot be empty' }
  }

  const { error } = await supabase.from('progress_tracking').insert({
    user_id: user.id,
    subject: subject.trim(),
    hours_studied: hours,
  })

  if (error) return { error: error.message }
  revalidatePath('/study')
  return { success: true }
}

export async function addPlaylist(title: string, url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  if (!title.trim()) {
    return { error: 'Title cannot be empty' }
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'https:') {
    return { error: 'Only https URLs are allowed' }
  }

  if (url.length > 2000) {
    return { error: 'URL too long' }
  }

  const { error } = await supabase.from('playlists').insert({
    user_id: user.id,
    title: title.trim(),
    url,
    type: 'link',
  })

  if (error) return { error: error.message }
  revalidatePath('/study')
  return { success: true }
}

export async function saveNote(noteId: string | null, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  if (!title.trim()) {
    return { error: 'Title cannot be empty' }
  }

  if (noteId) {
    const { error } = await supabase
      .from('shared_notes')
      .update({ title: title.trim(), content })
      .eq('id', noteId)
      .eq('author_id', user.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('shared_notes').insert({
      author_id: user.id,
      title: title.trim(),
      content,
    })

    if (error) return { error: error.message }
  }

  revalidatePath('/study')
  return { success: true }
}
