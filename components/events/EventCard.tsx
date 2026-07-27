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
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
          {event.description && (
            <p className="text-gray-400 mb-3 leading-relaxed">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RSVP Buttons */}
      <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
        <button
          onClick={() => handleRSVP('going')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            rsvpStatus === 'going'
              ? 'bg-emerald-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          Going
        </button>
        <button
          onClick={() => handleRSVP('maybe')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            rsvpStatus === 'maybe'
              ? 'bg-amber-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          Maybe
        </button>
      </div>
    </div>
  )
}
