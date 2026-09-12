'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import type { RecentSolve } from '@/app/actions/recent-global-solves'

const POLL_MS = 30_000
const NEW_WINDOW_MS = 120_000

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function isFresh(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < NEW_WINDOW_MS
}

export default function RecentSolvesFeed({ solves: initialSolves }: { solves: RecentSolve[] }) {
  const [solves, setSolves] = useState<RecentSolve[]>(initialSolves)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      if (document.hidden) return
      try {
        const response = await fetch('/api/ctf/recent-solves', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && Array.isArray(data.solves)) setSolves(data.solves)
      } catch {
        // Offline or rate limited — keep showing the last snapshot.
      }
    }

    const interval = setInterval(poll, POLL_MS)
    const onVisibility = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  if (solves.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Recent Solves
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </h2>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live global solve log</span>
      </div>
      <div className="rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        {solves.map((solve, i) => (
          <div
            key={`${solve.user_id}-${solve.challenge_id}-${solve.solved_at}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-color)' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {solve.avatar_url ? (
                <Avatar src={solve.avatar_url} size={32} />
              ) : (
                <span className="text-white text-xs font-medium">
                  {solve.username?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <Link href={`/profile/${solve.username}`} className="font-medium truncate hover:underline" style={{ color: 'var(--text-primary)' }}>
              {solve.username}
            </Link>
            <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>solved</span>
            <Link href={`/ctf/${solve.challenge_id}`} prefetch={false} className="font-medium truncate hover:underline min-w-0" style={{ color: 'var(--accent)' }}>
              {solve.title}
            </Link>
            {isFresh(solve.solved_at) && (
              <span
                suppressHydrationWarning
                className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                New
              </span>
            )}
            <span className="ml-auto flex-shrink-0 text-right">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{solve.points}</span>{' '}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>pts</span>
              <span suppressHydrationWarning className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {timeAgo(solve.solved_at)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}