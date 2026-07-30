import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventDetailClient from './EventDetailClient'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: creator } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', event.creator_id)
    .single()

  const { data: rawAttendees } = await supabase
    .from('event_attendees')
    .select(`
      status,
      user_id,
      profiles!inner(id, username, avatar_url)
    `)
    .eq('event_id', id)
    .order('status', { ascending: true })
    .order('created_at', { ascending: true })

  const attendees = (rawAttendees || []).map((a: any) => ({
    status: a.status as string,
    user_id: a.user_id as string,
    profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
  }))

  let userRsvp: string | null = null
  if (user) {
    const { data: rsvp } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (rsvp) userRsvp = rsvp.status
  }

  return (
    <EventDetailClient
      event={event}
      creator={creator}
      attendees={attendees}
      currentUserId={user?.id || null}
      userRsvp={userRsvp}
    />
  )
}
