'use client'

import { useEffect, useState } from 'react'

export default function Countdown({
  target,
  className = '',
  compact = false,
}: {
  target: string
  className?: string
  compact?: boolean
}) {
  const targetTime = new Date(target).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, targetTime - now)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={`flex items-center gap-2 font-mono ${className}`} style={{ color: 'var(--text-primary)' }}>
      {days > 0 && (
        <span className="flex items-baseline gap-1">
          <span className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>{days}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>d</span>
        </span>
      )}
      <span className="flex items-baseline gap-1">
        <span className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>{pad(hours)}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>h</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>{pad(minutes)}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>m</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>{pad(seconds)}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>s</span>
      </span>
    </div>
  )
}
