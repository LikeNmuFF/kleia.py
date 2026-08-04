'use client'

import { useState, useRef } from 'react'
import { submitRegex } from '@/app/actions/regex-golf'
import { validateRegex } from '@/lib/utils/regex-golf'

interface Puzzle {
  id: string
  title: string
  description: string | null
  match_strings: string[]
  reject_strings: string[]
  difficulty: string
  min_length: number | null
  xp_reward: number
}

interface Solve {
  puzzle_id: string
  submitted_regex: string
  regex_length: number
  time_seconds: number
  created_at: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

export default function RegexGolfPuzzle({
  puzzle,
  solve,
  solved,
}: {
  puzzle: Puzzle
  solve: Solve | null
  solved: boolean
}) {
  const [regex, setRegex] = useState('')
  const [time, setTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ xp: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const validation = validateRegex(regex, puzzle.match_strings, puzzle.reject_strings)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTime(0)
    timerRef.current = setInterval(() => {
      setTime(t => t + 1)
    }, 1000)
  }

  const handleRegexChange = (value: string) => {
    setRegex(value)
    if (value && !timerRef.current && !solved && !success) {
      startTimer()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!regex.trim() || solved || success) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await submitRegex(puzzle.id, regex.trim(), time)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess({ xp: result.xp || 0 })
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {puzzle.title}
          </span>
          {solved && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
              Solved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-2 py-0.5 text-xs font-medium rounded"
            style={{ backgroundColor: `${DIFFICULTY_COLORS[puzzle.difficulty] || 'var(--text-muted)'}20`, color: DIFFICULTY_COLORS[puzzle.difficulty] || 'var(--text-muted)' }}
          >
            {puzzle.difficulty}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            +{puzzle.xp_reward} XP
          </span>
        </div>
      </div>

      {/* Description */}
      {puzzle.description && (
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{puzzle.description}</p>
        </div>
      )}

      {/* Timer */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--input-bg)' }}>
        <span className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
          Time
        </span>
        <span className="text-lg font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {formatTime(time)}
        </span>
      </div>

      {/* Strings */}
      <div className="px-5 py-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: '#22c55e' }}>
            Must Match
          </label>
          <div className="space-y-1">
            {puzzle.match_strings.map((s, i) => (
              <div key={i} className="px-3 py-1.5 rounded text-sm font-mono" style={{ backgroundColor: '#22c55e15', color: 'var(--text-primary)' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: '#ef4444' }}>
            Must Reject
          </label>
          <div className="space-y-1">
            {puzzle.reject_strings.map((s, i) => (
              <div key={i} className="px-3 py-1.5 rounded text-sm font-mono" style={{ backgroundColor: '#ef444415', color: 'var(--text-primary)' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />

      {/* Form */}
      {solved ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Already solved!
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            Your regex: {solve?.submitted_regex}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {solve?.regex_length} chars | {formatTime(solve?.time_seconds || 0)}
          </p>
        </div>
      ) : success ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
            Correct! +{success.xp} XP earned.
          </p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {regex} ({regex.length} chars)
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Completed in {formatTime(time)}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Your Regex
            </label>
            <input
              type="text"
              value={regex}
              onChange={e => handleRegexChange(e.target.value)}
              placeholder="Enter your regex..."
              disabled={submitting}
              className="w-full px-4 py-3 rounded-lg text-sm font-mono border outline-none transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Live validation */}
          {regex && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: validation.valid ? '#22c55e' : '#ef4444' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {validation.valid ? 'Valid regex' : `Invalid: ${validation.error}`}
                </span>
              </div>
              {validation.valid && (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: validation.matchesAll ? '#22c55e' : '#ef4444' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {validation.matchesAll ? 'Matches all required strings' : 'Missing some matches'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: validation.rejectsAll ? '#22c55e' : '#ef4444' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {validation.rejectsAll ? 'Rejects all forbidden strings' : 'Rejecting too many'}
                    </span>
                  </div>
                </>
              )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Length: {regex.length} chars
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !regex.trim() || !validation.valid || !validation.matchesAll || !validation.rejectsAll}
            className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {submitting ? 'Checking...' : 'Submit Regex'}
          </button>
        </form>
      )}
    </div>
  )
}
