'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

async function fetchCount() {
  const response = await fetch('/api/cco/count', { cache: 'no-store' })
  if (!response.ok) return 0
  const data = await response.json().catch(() => ({ count: 0 }))
  return typeof data.count === 'number' ? data.count : 0
}

export default function CcoLiveCount() {
  const [count, setCount] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let active = true

    fetchCount().then((nextCount) => {
      if (active) setCount(nextCount)
    })

    const supabase = createClient()
    const channel = supabase
      .channel('cco-registration-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_registrations' },
        () => {
          fetchCount().then((nextCount) => {
            if (active) setCount(nextCount)
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <motion.div
      className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <UsersRound className="h-4 w-4" style={{ color: 'var(--accent)' }} />
      <span>{count === null ? 'Counting students...' : `${count} student${count === 1 ? '' : 's'} registered`}</span>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
    </motion.div>
  )
}
