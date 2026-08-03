import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/events/EventCard'
import CreateEvent from '@/components/events/CreateEvent'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse and RSVP to community study events, workshops, and meetups. Create your own events for the Kleia community.',
}

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, start_time, location, creator_id')
    .order('start_time', { ascending: true })

  const attendeeCounts: Record<string, number> = {}
  if (events && events.length > 0) {
    const eventIds = events.map(e => e.id)
    const { data: counts } = await supabase
      .from('event_attendees')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'going')

    if (counts) {
      for (const row of counts) {
        attendeeCounts[row.event_id] = (attendeeCounts[row.event_id] || 0) + 1
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Events</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Schedule meetups and community events</p>
        </div>
        <CreateEvent />
      </div>
      <div className="space-y-4">
        {events && events.length > 0 ? (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user?.id || ''}
              attendeeCount={attendeeCounts[event.id] || 0}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No events yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Create the first event to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
