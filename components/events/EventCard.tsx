'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string | null
    start_time: string
    location: string | null
    profiles: { username: string }
  }
  currentUserId: string
}

export default function EventCard({ event, currentUserId }: EventCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const supabase = createClient()

  const handleRSVP = async (status: string) => {
    await supabase.from('event_attendees').upsert({
      event_id: event.id,
      user_id: currentUserId,
      status,
    })
    setRsvpStatus(status)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
      {event.description && (
        <p className="text-gray-600 mb-2">{event.description}</p>
      )}
      <p className="text-sm text-gray-500 mb-1">
        📅 {new Date(event.start_time).toLocaleDateString()}
      </p>
      {event.location && (
        <p className="text-sm text-gray-500 mb-4">📍 {event.location}</p>
      )}
      <div className="flex space-x-2">
        <button
          onClick={() => handleRSVP('going')}
          className={`px-3 py-1 rounded ${
            rsvpStatus === 'going'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Going
        </button>
        <button
          onClick={() => handleRSVP('maybe')}
          className={`px-3 py-1 rounded ${
            rsvpStatus === 'maybe'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Maybe
        </button>
      </div>
    </div>
  )
}
