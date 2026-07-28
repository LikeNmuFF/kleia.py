'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addProgress(subject: string, hours: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase.from('progress_tracking').insert({
    user_id: user.id,
    subject,
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

  const { error } = await supabase.from('playlists').insert({
    user_id: user.id,
    title,
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

  if (noteId) {
    const { error } = await supabase
      .from('shared_notes')
      .update({ title, content })
      .eq('id', noteId)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('shared_notes').insert({
      author_id: user.id,
      title,
      content,
    })

    if (error) return { error: error.message }
  }

  revalidatePath('/study')
  return { success: true }
}
