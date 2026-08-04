'use client'

import { useState, useEffect } from 'react'
import { getWriteupsForChallenge, voteWriteup } from '@/app/actions/writeups'

interface Writeup {
  id: string
  user_id: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  created_at: string
  username: string
}

export default function WriteupList({ challengeId }: { challengeId: string }) {
  const [writeups, setWriteups] = useState<Writeup[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)

  useEffect(() => {
    getWriteupsForChallenge(challengeId).then((data) => {
      setWriteups(data)
      setLoading(false)
    })
  }, [challengeId])

  const handleVote = async (writeupId: string, vote: 1 | -1) => {
    setVoting(writeupId)
    const result = await voteWriteup(writeupId, vote)
    if (result.success) {
      setWriteups((prev) =>
        prev.map((w) =>
          w.id === writeupId
            ? { ...w, upvotes: result.upvotes, downvotes: result.downvotes }
            : w
        )
      )
    }
    setVoting(null)
  }

  if (loading) return null
  if (writeups.length === 0) {
    return (
      <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
        No writeups yet. Be the first to write one!
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Writeups ({writeups.length})
      </h3>
      {writeups.map((w) => (
        <div
          key={w.id}
          className="p-4 rounded-lg space-y-2"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {w.title}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(w.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            by {w.username}
          </div>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {w.content}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => handleVote(w.id, 1)}
              disabled={voting === w.id}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:opacity-80"
              style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            >
              ▲ {w.upvotes}
            </button>
            <button
              onClick={() => handleVote(w.id, -1)}
              disabled={voting === w.id}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:opacity-80"
              style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              ▼ {w.downvotes}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
