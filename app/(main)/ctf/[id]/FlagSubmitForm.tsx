'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitFlag } from '@/app/actions/ctf'

export default function FlagSubmitForm({
  challengeId,
  alreadySolved,
}: {
  challengeId: string
  alreadySolved?: boolean
}) {
  const router = useRouter()
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(false)

  if (alreadySolved) {
    return (
      <div
        className="flex items-center gap-2 p-4 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          color: '#22c55e',
          border: '1px solid rgba(34, 197, 94, 0.25)',
        }}
      >
        <span>✅</span>
        Challenge solved — nice work!
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flag.trim() || loading) return

    setLoading(true)
    setMessage(null)

    const result = await submitFlag(challengeId, flag)

    if (result.success && result.isCorrect !== undefined) {
      setMessage({
        text: result.message || 'Submitted!',
        type: result.isCorrect ? 'success' : 'error',
      })
      if (result.isCorrect) {
        setFlag('')
        router.refresh()
      }
    } else {
      setMessage({ text: (result as { error: string }).error || 'Something went wrong', type: 'error' })
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Submit Flag
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          placeholder="Enter the flag (e.g. flag{...})"
          className="flex-1 px-3 py-2.5 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !flag.trim()}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50"
        >
          {loading ? '...' : 'Submit'}
        </button>
      </div>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success'
              ? 'rgba(34, 197, 94, 0.1)'
              : message.type === 'error'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
            color: message.type === 'success'
              ? '#22c55e'
              : message.type === 'error'
                ? '#ef4444'
                : '#3b82f6',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
          }}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}
