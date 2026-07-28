'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const VALID_RSVP_STATUSES = ['going', 'maybe', 'not_going']

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

  if (!data.title.trim()) {
    return { error: 'Title cannot be empty' }
  }

  if (data.title.trim().length > 200) {
    return { error: 'Title too long (max 200 characters)' }
  }

  const startTime = new Date(data.start_time)
  if (isNaN(startTime.getTime())) {
    return { error: 'Invalid start time' }
  }

  const { error } = await supabase.from('events').insert({
    creator_id: user.id,
    title: data.title.trim(),
    description: data.description?.trim(),
    start_time: startTime.toISOString(),
    location: data.location?.trim(),
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

  if (!VALID_RSVP_STATUSES.includes(status)) {
    return { error: `Invalid status. Must be one of: ${VALID_RSVP_STATUSES.join(', ')}` }
  }

  const { error } = await supabase.from('event_attendees').upsert({
    event_id: eventId,
    user_id: user.id,
    status,
  })

  if (error) return { error: error.message }
  revalidatePath('/events')
  return { success: true }
}
