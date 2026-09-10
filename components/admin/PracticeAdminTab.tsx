'use client'

import { useEffect, useState } from 'react'
import { getPracticeRooms } from '@/app/actions/practice'
import RoomList from '@/components/practice/RoomList'
import type { PracticeRoom } from '@/lib/practice/types'

export default function PracticeAdminTab() {
  const [rooms, setRooms] = useState<PracticeRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPracticeRooms()
      .then((result) => {
        if (!active) return
        if (!result.isAdmin || result.error) {
          setError(result.error || 'Admin access is required.')
          return
        }
        setRooms(result.rooms)
      })
      .catch(() => {
        if (active) setError('Could not load private practice rooms.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  if (loading) return <p className="py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading private practice rooms…</p>
  if (error) return <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
  return <RoomList rooms={rooms} isAdmin />
}
