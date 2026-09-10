'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowRight, FlaskConical, ListChecks, LockKeyhole, Plus, Users } from 'lucide-react'
import { createPracticeRoom } from '@/app/actions/practice'
import type { PracticeRoom } from '@/lib/practice/types'

const plural = (count: number, singular: string, multiple = `${singular}s`) => `${count} ${count === 1 ? singular : multiple}`

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
        if (result.id) {
          setRooms((current) => [{
            id: result.id!, title, description, created_at: new Date().toISOString(),
            member_count: 0, challenge_count: 0, active_challenge_count: 0,
          }, ...current])
        }
        setOpen(false)
        setMessage('Lab created.')
      } catch {
        setMessage('Unable to create the lab. Please try again.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
              <LockKeyhole className="h-4 w-4" aria-hidden />
              {isAdmin ? 'Labs workspace' : 'Invited Labs'}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              {isAdmin ? 'Build before you publish' : 'Your Labs'}
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isAdmin
                ? 'Create invite-only labs, validate challenges with testers, and publish them when they are ready.'
                : 'Solve challenges shared directly with you. Lab activity stays separate from global CTF scoring.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border px-4 py-3 text-right" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{rooms.length}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rooms.length === 1 ? 'lab' : 'labs'}</p>
            </div>
            {isAdmin && (
              <button className="btn-primary inline-flex min-h-11 items-center gap-2 px-4" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
                <Plus className="h-4 w-4" aria-hidden />
                Create lab
              </button>
            )}
          </div>
        </div>
      </section>

      {message && <p role="status" className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border-color)', color: message === 'Lab created.' ? '#22c55e' : '#ef4444' }}>{message}</p>}

      {open && (
        <form action={submit} className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Create a lab</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Only invited accounts can find or enter this lab.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Lab title<input required maxLength={120} name="title" className="input-field mt-1.5 w-full" placeholder="Web challenge review" /></label>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Purpose<textarea required maxLength={2000} rows={3} name="description" className="input-field mt-1.5 w-full resize-y" placeholder="What should testers validate before release?" /></label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-lg px-4 text-sm font-medium" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button disabled={pending} className="btn-primary min-h-10 px-4 disabled:opacity-50">{pending ? 'Creating…' : 'Create lab'}</button>
          </div>
        </form>
      )}

      {rooms.length === 0 ? (
        <div className="rounded-2xl border px-6 py-16 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <FlaskConical className="mx-auto h-9 w-9" style={{ color: 'var(--text-muted)' }} aria-hidden />
          <h2 className="mt-4 font-semibold" style={{ color: 'var(--text-primary)' }}>No Labs available</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{isAdmin ? 'Create the first invite-only lab to begin testing.' : 'Labs are invite-only. A lab appears here after an admin invites you.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <article key={room.id} className="group flex min-h-64 flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><FlaskConical className="h-5 w-5" aria-hidden /></div>
                <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>Private lab</span>
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{room.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{room.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" aria-hidden />{plural(room.challenge_count ?? 0, 'challenge')}</span>
                {isAdmin && <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{plural(room.member_count ?? 0, 'tester')}</span>}
                {(room.active_challenge_count ?? 0) > 0 && <span>{room.active_challenge_count} active</span>}
              </div>
              <Link href={`/practice/${room.id}`} className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition group-hover:border-[var(--accent)]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                {isAdmin ? 'Manage lab' : 'Enter lab'}<ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
