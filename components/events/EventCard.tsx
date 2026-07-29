'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { rsvpEvent } from '@/app/actions/events'

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
  attendeeCount: number
}

export default function EventCard({ event, currentUserId, attendeeCount }: EventCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [loadingRsvp, setLoadingRsvp] = useState(false)
  const supabase = createClient()

  const isOwnEvent = event.creator_id === currentUserId

  useEffect(() => {
    const fetchRsvp = async () => {
      if (!currentUserId) return
      const { data } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', event.id)
        .eq('user_id', currentUserId)
        .maybeSingle()

      if (data) setRsvpStatus(data.status)
    }

    fetchRsvp()
  }, [event.id, currentUserId, supabase])

  const handleRSVP = async (status: string) => {
    setLoadingRsvp(true)
    const result = await rsvpEvent(event.id, status)
    if (result.success) setRsvpStatus(status === 'not_going' ? null : status)
    setLoadingRsvp(false)
  }

  const startDate = new Date(event.start_time)
  const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <Link href={`/events/${event.id}`} className="block card transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</h3>
            {isOwnEvent && (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                Your event
              </span>
            )}
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            {event.description || 'No description provided.'}
          </p>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{dateStr} at {timeStr}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{attendeeCount} going</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={(e) => { e.preventDefault(); handleRSVP('going') }}
          disabled={loadingRsvp}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: rsvpStatus === 'going' ? '#059669' : 'var(--input-bg)',
            color: rsvpStatus === 'going' ? '#fff' : 'var(--text-secondary)',
            border: rsvpStatus === 'going' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          Going
        </button>
        <button
          onClick={(e) => { e.preventDefault(); handleRSVP('maybe') }}
          disabled={loadingRsvp}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: rsvpStatus === 'maybe' ? '#d97706' : 'var(--input-bg)',
            color: rsvpStatus === 'maybe' ? '#fff' : 'var(--text-secondary)',
            border: rsvpStatus === 'maybe' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          Maybe
        </button>
        {rsvpStatus && (
          <button
            onClick={(e) => { e.preventDefault(); handleRSVP('not_going') }}
            disabled={loadingRsvp}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            Not Going
          </button>
        )}
      </div>
    </Link>
  )
}
