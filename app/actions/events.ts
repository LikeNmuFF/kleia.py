'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logEvent'

export async function createEvent(data: {
  title: string
  description?: string
  start_time: string
  location?: string
}) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in' }

  if (!data.title.trim()) return { error: 'Title cannot be empty' }
  if (data.title.trim().length > 200) return { error: 'Title too long (max 200 characters)' }

  const startTime = new Date(data.start_time)
  if (isNaN(startTime.getTime())) return { error: 'Invalid start time' }

  const { error } = await supabase.from('events').insert({
    creator_id: user.id,
    title: data.title.trim(),
    description: data.description?.trim(),
    start_time: startTime.toISOString(),
    location: data.location?.trim(),
  })

  if (error) {
    await logEvent({ endpoint: 'events.createEvent', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'events.createEvent', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/events')
  return { success: true }
}

export async function rsvpEvent(eventId: string, status: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not logged in' }

  if (status === 'not_going') {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id)

    if (error) {
      await logEvent({ endpoint: 'events.rsvpEvent', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  } else if (status === 'going' || status === 'maybe') {
    const { error } = await supabase.from('event_attendees').upsert({
      event_id: eventId,
      user_id: user.id,
      status,
    })

    if (error) {
      await logEvent({ endpoint: 'events.rsvpEvent', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
      return { error: error.message }
    }
  } else {
    return { error: 'Invalid status' }
  }

  await logEvent({ endpoint: 'events.rsvpEvent', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function updateEvent(
  eventId: string,
  data: {
    title?: string
    description?: string
    start_time?: string
    location?: string
  }
) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const updateData: Record<string, string> = {}
  if (data.title !== undefined) {
    if (!data.title.trim()) return { error: 'Title cannot be empty' }
    updateData.title = data.title.trim()
  }
  if (data.description !== undefined) updateData.description = data.description.trim()
  if (data.start_time !== undefined) {
    const t = new Date(data.start_time)
    if (isNaN(t.getTime())) return { error: 'Invalid start time' }
    updateData.start_time = t.toISOString()
  }
  if (data.location !== undefined) updateData.location = data.location.trim()

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('creator_id', user.id)

  if (error) {
    await logEvent({ endpoint: 'events.updateEvent', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'events.updateEvent', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('creator_id', user.id)

  if (error) {
    await logEvent({ endpoint: 'events.deleteEvent', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: error.message }
  }

  await logEvent({ endpoint: 'events.deleteEvent', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/events')
  return { success: true }
}
