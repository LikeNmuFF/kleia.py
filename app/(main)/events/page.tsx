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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <CreateEvent />
      </div>
      <div className="space-y-4">
        {events?.map((event) => (
          <EventCard key={event.id} event={event} currentUserId={user?.id || ''} />
        ))}
      </div>
    </div>
  )
}
