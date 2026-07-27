import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/events/EventCard'
import CreateEvent from '@/components/events/CreateEvent'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*, profiles(username)')
    .order('start_time', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
          <p className="text-gray-400">Schedule study sessions and meetups</p>
        </div>
        <CreateEvent />
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events && events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} currentUserId={user?.id || ''} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No events yet</h3>
            <p className="text-gray-400">Create your first event to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
