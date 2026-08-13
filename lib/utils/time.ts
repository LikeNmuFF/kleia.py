export function getRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never'

  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 30) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getStatusInfo(
  status: string | null,
  lastSeen: string | null
): { text: string; color: string; isOnline: boolean } {
  if (status === 'online') {
    return { text: 'Online', color: 'bg-emerald-400', isOnline: true }
  }

  if (status === 'studies') {
    return { text: 'Studying', color: 'bg-violet-400', isOnline: true }
  }

  const relative = getRelativeTime(lastSeen)
  return {
    text: relative === 'Never' ? 'Offline' : relative,
    color: 'bg-gray-500',
    isOnline: false,
  }
}

export const MANILA_TZ = 'Asia/Manila'

/** Interpret a `YYYY-MM-DDTHH:mm` string as Manila-local and return a UTC ISO timestamp. */
export function parseManilaLocal(datetimeLocal: string): string {
  return new Date(`${datetimeLocal}+08:00`).toISOString()
}

/** Format a UTC ISO timestamp as date + time in Asia/Manila. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: MANILA_TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
