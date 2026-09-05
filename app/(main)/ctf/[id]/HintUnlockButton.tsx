'use client'

import { useState } from 'react'
import { unlockHint } from '@/app/actions/hints'

export default function HintUnlockButton({
  challengeId,
  hintXpCost,
  hintText,
  initiallyUnlocked,
}: {
  challengeId: string
  hintXpCost: number
  hintText: string
  initiallyUnlocked: boolean
}) {
  const [hintUnlocked, setHintUnlocked] = useState(initiallyUnlocked)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUnlock = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await unlockHint(challengeId)
      setHintUnlocked(true)
      if (result.xpSpent > 0) {
        setMessage(`-${result.xpSpent} XP spent`)
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to unlock hint')
    } finally {
      setLoading(false)
    }
  }

  if (hintXpCost <= 0) {
    // Free hint, show directly
    return (
      <details className="mb-6" open>
        <summary className="text-sm cursor-pointer font-medium" style={{ color: 'var(--text-muted)' }}>
          💡 Hint (free)
        </summary>
        <p className="mt-2 text-sm p-3 rounded-lg line-clamp-3" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', overflow: 'hidden' }}>
          {hintText}
        </p>
      </details>
    )
  }

  if (hintUnlocked) {
    return (
      <div className="mb-6">
        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          💡 Hint unlocked
        </div>
        <p className="text-sm p-3 rounded-lg line-clamp-3" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', overflow: 'hidden' }}>
          {hintText}
        </p>
        {message && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleUnlock}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50"
      >
        {loading ? '...' : `Unlock Hint (${hintXpCost} XP)`}
      </button>
      {message && (
        <div className="text-xs mt-2" style={{ color: '#ef4444' }}>
          {message}
        </div>
      )}
    </div>
  )
}