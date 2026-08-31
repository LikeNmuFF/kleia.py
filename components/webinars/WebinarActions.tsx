'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelWebinarRegistration, deleteWebinar, registerForWebinar } from '@/app/actions/webinars'
import type { Webinar, WebinarRegistration } from '@/lib/webinars/types'

export default function WebinarActions({
  webinar,
  registration,
  canManage,
}: {
  webinar: Webinar
  registration: WebinarRegistration | null
  canManage: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isRegistered = registration?.status === 'registered' || registration?.status === 'completed'
  const isFull = Boolean(webinar.capacity && (webinar.registration_count || 0) >= webinar.capacity && !isRegistered)

  function run(action: () => Promise<{ error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm('Delete this webinar? This cannot be undone.')) return
    run(() => deleteWebinar(webinar.id))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {isRegistered ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => cancelWebinarRegistration(webinar.id))}
            className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            Cancel registration
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || isFull}
            onClick={() => run(() => registerForWebinar(webinar.id))}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium transition hover:bg-violet-500 disabled:opacity-50"
          >
            {isFull ? 'Full' : pending ? 'Registering...' : 'Register'}
          </button>
        )}

        {webinar.external_url && (
          <a href={webinar.external_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            Open link
          </a>
        )}

        {canManage && (
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 text-sm font-medium transition hover:bg-red-600/20 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
