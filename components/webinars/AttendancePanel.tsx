'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordWebinarAttendance, verifyExternalCompletion } from '@/app/actions/webinars'
import type { Webinar, WebinarAttendance, WebinarRegistration } from '@/lib/webinars/types'

export default function AttendancePanel({
  webinar,
  registrations,
  attendance,
}: {
  webinar: Webinar
  registrations: WebinarRegistration[]
  attendance: WebinarAttendance[]
}) {
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function totalMinutes(userId: string) {
    return attendance
      .filter((row) => row.user_id === userId)
      .reduce((sum, row) => sum + row.duration_minutes, 0)
  }

  function run(userId: string, action: () => Promise<{ error?: string }>) {
    setError(null)
    setPendingUser(userId)
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
      setPendingUser(null)
      router.refresh()
    })
  }

  if (registrations.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        No registrations yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        {registrations.map((registration) => {
          const username = registration.profiles?.username || registration.user_id.slice(0, 8)
          const minutes = totalMinutes(registration.user_id)
          const waiting = pending && pendingUser === registration.user_id

          return (
            <div key={registration.user_id} className="p-4 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{username}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {registration.status} - {minutes} recorded minutes
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {webinar.verification_mode === 'internal_attendance' && (
                    <button
                      type="button"
                      disabled={waiting}
                      onClick={() => run(registration.user_id, () => recordWebinarAttendance(webinar.id, registration.user_id, webinar.min_attendance_minutes))}
                      className="px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      Record full attendance
                    </button>
                  )}
                  {webinar.verification_mode === 'external_certificate' && (
                    <button
                      type="button"
                      disabled={waiting}
                      onClick={() => run(registration.user_id, () => verifyExternalCompletion(webinar.id, registration.user_id))}
                      className="px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      Verify external
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
