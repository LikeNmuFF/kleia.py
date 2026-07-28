'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createEvent(data: {
  title: string
  description?: string
  start_time: string
  location?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const { error } = await supabase.from('events').insert({
    creator_id: user.id,
    title: data.title,
    description: data.description,
    start_time: new Date(data.start_time).toISOString(),
    location: data.location,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}

export async function rsvpEvent(eventId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase.from('event_attendees').upsert({
    event_id: eventId,
    user_id: user.id,
    status,
  })

  if (error) return { error: error.message }
  return { success: true }
}
