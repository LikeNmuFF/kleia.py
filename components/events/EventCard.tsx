'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { rsvpEvent } from '@/app/actions/events'

interface Profile {
  username: string
}

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string | null
    start_time: string
    location: string | null
    creator_id: string
  }
  currentUserId: string
}

export default function EventCard({ event, currentUserId }: EventCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [creator, setCreator] = useState<Profile | null>(null)
  const supabase = createClient()

  const isOwnEvent = event.creator_id === currentUserId

  useEffect(() => {
    const fetchCreator = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', event.creator_id)
        .single()

      if (data) setCreator(data)
    }

    fetchCreator()
  }, [event.creator_id, supabase])

  const handleRSVP = async (status: string) => {
    const result = await rsvpEvent(event.id, status)
    if (result.success) setRsvpStatus(status)
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-white">{event.title}</h3>
            {isOwnEvent && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Your event
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Created by {creator?.username || 'Member'}
          </p>
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
