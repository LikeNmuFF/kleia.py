'use client'

import { useState, useEffect, useRef } from 'react'
import { solveDailyCipher } from '@/app/actions/cipher'

interface Cipher {
  id: string
  date: string
  cipher_type: string
  ciphertext: string
  plaintext_hint: string
  difficulty: string
  xp_reward: number
}

interface TodaySolve {
  cipher_id: string
  time_seconds: number
  created_at: string
}

export default function CipherClient({
  cipher,
  todaySolve,
}: {
  cipher: Cipher | null
  todaySolve: TodaySolve | undefined
}) {
  const [answer, setAnswer] = useState('')
  const [time, setTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ xp: number } | null>(null)
  const [alreadySolved, setAlreadySolved] = useState(!!todaySolve)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (alreadySolved || success) return
    timerRef.current = setInterval(() => {
      setTime(t => t + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [alreadySolved, success])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cipher || !answer.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await solveDailyCipher(cipher.id, answer.trim(), time)
      setSuccess({ xp: result.xp })
      if (timerRef.current) clearInterval(timerRef.current)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!cipher) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No cipher available today.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Daily Cipher
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Decode the ciphertext and submit the flag to earn {cipher.xp_reward} XP.
        </p>
      </div>

      {/* Cipher Card */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        {/* Cipher Info Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {cipher.cipher_type}
          </span>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              {cipher.difficulty}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +{cipher.xp_reward} XP
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--input-bg)' }}>
          <span className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
            Time
          </span>
          <span className="text-lg font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatTime(time)}
          </span>
        </div>

        {/* Ciphertext */}
        <div className="px-5 py-5">
          <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Ciphertext
          </label>
          <pre
            className="p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all"
            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
          >
            {cipher.ciphertext}
          </pre>
        </div>

        {/* Hint */}
        <div className="px-5 pb-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Hint: Flag format is <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--input-bg)' }}>{cipher.plaintext_hint}</code>
          </p>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />

        {/* Form */}
        {alreadySolved ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              You already solved today&apos;s cipher!
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Time: {formatTime(todaySolve!.time_seconds)}
            </p>
          </div>
        ) : success ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              Correct! +{success.xp} XP earned.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Completed in {formatTime(time)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Flag
              </label>
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="KLEIA{...}"
                required
                disabled={submitting}
                className="w-full px-4 py-3 rounded-lg text-sm font-mono border outline-none transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {submitting ? 'Checking...' : 'Submit Flag'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
