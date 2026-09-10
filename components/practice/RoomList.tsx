'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createPracticeRoom } from '@/app/actions/practice'
import type { PracticeRoom } from '@/lib/practice/types'

export default function RoomList({ rooms: initialRooms, isAdmin }: { rooms: PracticeRoom[]; isAdmin: boolean }) {
  const [rooms, setRooms] = useState(initialRooms)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setMessage('')
    startTransition(async () => {
      try {
        const title = String(formData.get('title') || '')
        const description = String(formData.get('description') || '')
        const result = await createPracticeRoom({ title, description })
        if ('error' in result) return setMessage(result.error)
        if (result.id) setRooms((current) => [{ id: result.id!, title, description, created_at: new Date().toISOString() }, ...current])
        setOpen(false)
        setMessage('Room created.')
      } catch {
        setMessage('Unable to create the room. Please try again.')
      }
    })
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Private practice</h1><p className="mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>Invite-only rooms for testing challenges together. Access comes from an admin invitation; there are no join links or self-enrollment.</p></div>
      {isAdmin && <button className="btn-primary shrink-0" onClick={() => setOpen((v) => !v)}>Create room</button>}
    </div>
    {message && <p role="status" className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border-color)', color: message === 'Room created.' ? '#22c55e' : '#ef4444' }}>{message}</p>}
    {open && <form action={submit} className="grid gap-4 rounded-xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Room title<input required maxLength={120} name="title" className="input-field mt-1 w-full" /></label>
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Description<textarea required maxLength={1000} rows={3} name="description" className="input-field mt-1 w-full resize-y" /></label>
      <div><button disabled={pending} className="btn-primary disabled:opacity-50">{pending ? 'Creating…' : 'Create room'}</button></div>
    </form>}
    {rooms.length === 0 ? <div className="rounded-xl border px-6 py-14 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>No practice rooms available</h2><p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{isAdmin ? 'Create the first invite-only room to begin testing.' : 'Ask an admin for an invitation. Rooms never allow self-joining.'}</p></div> : <div className="grid gap-4 md:grid-cols-2">{rooms.map((room) => <Link key={room.id} href={`/practice/${room.id}`} className="rounded-xl border p-5 transition hover:-translate-y-0.5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{room.title}</h2><p className="mt-2 line-clamp-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{room.description}</p><p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(room.created_at).toLocaleDateString()}</p></Link>)}</div>}
  </div>
}
