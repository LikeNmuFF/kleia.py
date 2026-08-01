'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { rsvpEvent, deleteEvent, updateEvent } from '@/app/actions/events'

interface Attendee {
  status: string
  user_id: string
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export default function EventDetailClient({
  event,
  creator,
  attendees,
  currentUserId,
  userRsvp: initialRsvp,
}: {
  event: any
  creator: { id: string; username: string; avatar_url: string | null } | null
  attendees: Attendee[]
  currentUserId: string | null
  userRsvp: string | null
}) {
  const router = useRouter()
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(initialRsvp)
  const [loadingRsvp, setLoadingRsvp] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(event.title)
  const [editDescription, setEditDescription] = useState(event.description || '')
  const [editLocation, setEditLocation] = useState(event.location || '')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const isOwnEvent = currentUserId === event.creator_id

  const going = attendees.filter(a => a.status === 'going')
  const maybe = attendees.filter(a => a.status === 'maybe')

  const handleRSVP = async (status: string) => {
    setLoadingRsvp(true)
    const result = await rsvpEvent(event.id, status)
    if (result.success) {
      setRsvpStatus(status === 'not_going' ? null : status)
      router.refresh()
    }
    setLoadingRsvp(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setDeleting(true)
    const result = await deleteEvent(event.id)
    if (result.success) router.push('/events')
    setDeleting(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    const result = await updateEvent(event.id, {
      title: editTitle,
      description: editDescription,
      location: editLocation,
    })
    if (result.error) {
      setEditError(result.error)
      setEditLoading(false)
      return
    }
    setEditing(false)
    router.refresh()
    setEditLoading(false)
  }

  const startDate = new Date(event.start_time)
  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Events
      </Link>

      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {event.title}
              </h1>
              {isOwnEvent && (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  Your event
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Created by {creator?.username || 'Unknown'}
            </p>
          </div>
          {isOwnEvent && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setEditing(!editing)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-red-400 disabled:opacity-50"
                style={{ border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleEdit} className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className="input-field w-full resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Location</label>
                <input value={editLocation} onChange={e => setEditLocation(e.target.value)} className="input-field w-full" />
              </div>
              {editError && <p className="text-sm text-red-400">{editError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={editLoading} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50">
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Event details */}
        <div className="flex flex-wrap gap-6 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6 p-4 rounded-xl whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            {event.description}
          </div>
        )}

        {/* RSVP buttons */}
        {currentUserId && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => handleRSVP('going')}
              disabled={loadingRsvp}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: rsvpStatus === 'going' ? '#059669' : 'var(--input-bg)',
                color: rsvpStatus === 'going' ? '#fff' : 'var(--text-secondary)',
                border: rsvpStatus === 'going' ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {rsvpStatus === 'going' ? '✓ Going' : 'Going'}
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              disabled={loadingRsvp}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: rsvpStatus === 'maybe' ? '#d97706' : 'var(--input-bg)',
                color: rsvpStatus === 'maybe' ? '#fff' : 'var(--text-secondary)',
                border: rsvpStatus === 'maybe' ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {rsvpStatus === 'maybe' ? '✓ Maybe' : 'Maybe'}
            </button>
            {rsvpStatus && (
              <button
                onClick={() => handleRSVP('not_going')}
                disabled={loadingRsvp}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                Not Going
              </button>
            )}
          </div>
        )}
      </div>

      {/* Attendees */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Attendees ({attendees.length})
        </h2>

        {going.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Going ({going.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {going.map(a => (
                <Link
                  key={a.user_id}
                  href={`/profile/${a.profiles.username}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {a.profiles.avatar_url ? (
                      <Avatar src={a.profiles.avatar_url} size={32} />
                    ) : (
                      a.profiles.username?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {a.profiles.username}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {maybe.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Maybe ({maybe.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {maybe.map(a => (
                <Link
                  key={a.user_id}
                  href={`/profile/${a.profiles.username}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {a.profiles.avatar_url ? (
                      <Avatar src={a.profiles.avatar_url} size={32} />
                    ) : (
                      a.profiles.username?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {a.profiles.username}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {attendees.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-muted)' }}>No RSVPs yet. Be the first to respond!</p>
          </div>
        )}
      </div>
    </div>
  )
}
