'use client'

import { useState, useEffect } from 'react'
import { getWriteupsForChallenge, voteWriteup, getViewCost, viewWriteup } from '@/app/actions/writeups'
import MarkdownContent from '@/components/MarkdownContent'

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

interface ViewCostInfo {
  cost: number
  freeViewsRemaining: number
  totalViewsThisWeek: number
  userXp: number
}

export default function WriteupList({ challengeId }: { challengeId: string }) {
  const [writeups, setWriteups] = useState<Writeup[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [viewCostInfo, setViewCostInfo] = useState<ViewCostInfo | null>(null)
  const [viewedWriteups, setViewedWriteups] = useState<Set<string>>(new Set())
  const [confirmModal, setConfirmModal] = useState<{ writeupId: string; title: string; cost: number } | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  useEffect(() => {
    getWriteupsForChallenge(challengeId).then((data) => {
      setWriteups(data)
      setLoading(false)
    })
    getViewCost().then((data) => {
      setViewCostInfo(data)
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

  const getWriteupCost = (writeupId: string): number => {
    if (viewedWriteups.has(writeupId)) return 0
    if (!viewCostInfo) return 0
    if (viewCostInfo.freeViewsRemaining > 0) return 0
    return viewCostInfo.cost
  }

  const handleViewClick = (writeup: Writeup) => {
    if (viewedWriteups.has(writeup.id)) {
      setViewedWriteups((prev) => {
        const next = new Set(prev)
        next.delete(writeup.id)
        return next
      })
      return
    }
    const cost = getWriteupCost(writeup.id)
    if (cost > 0) {
      setConfirmModal({ writeupId: writeup.id, title: writeup.title, cost })
    } else {
      setViewedWriteups((prev) => new Set(prev).add(writeup.id))
    }
  }

  const confirmView = async () => {
    if (!confirmModal) return
    setViewing(confirmModal.writeupId)
    const result = await viewWriteup(confirmModal.writeupId)
    if (result.success) {
      setViewedWriteups((prev) => new Set(prev).add(confirmModal.writeupId))
      setViewCostInfo((prev) => prev ? {
        ...prev,
        totalViewsThisWeek: prev.totalViewsThisWeek + 1,
        freeViewsRemaining: Math.max(0, prev.freeViewsRemaining - 1),
        cost: prev.freeViewsRemaining > 0 ? prev.cost : 25 + prev.totalViewsThisWeek * 25,
        userXp: prev.userXp - (result.cost || 0),
      } : null)
    } else if (result.error) {
      alert(result.error)
    }
    setViewing(null)
    setConfirmModal(null)
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Writeups ({writeups.length})
        </h3>
        {viewCostInfo && (
          <div className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
            {viewCostInfo.freeViewsRemaining > 0 ? (
              <span style={{ color: '#22c55e' }}>
                {viewCostInfo.freeViewsRemaining} free view{viewCostInfo.freeViewsRemaining !== 1 ? 's' : ''} left this week
              </span>
            ) : (
              <span>
                Next view: <span style={{ color: '#eab308' }}>{viewCostInfo.cost} XP</span>
                <span className="ml-2 opacity-60">({viewCostInfo.totalViewsThisWeek} viewed)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {writeups.map((w) => {
        const isViewed = viewedWriteups.has(w.id)
        const cost = getWriteupCost(w.id)

        return (
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

            {isViewed ? (
              <>
                <MarkdownContent content={w.content} />
                <button
                  onClick={() => handleViewClick(w)}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--input-bg)' }}
                >
                  Hide
                </button>
              </>
            ) : (
              <button
                onClick={() => handleViewClick(w)}
                disabled={viewing === w.id}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: cost === 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                  color: cost === 0 ? '#22c55e' : '#eab308',
                  border: `1px solid ${cost === 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                }}
              >
                {viewing === w.id ? 'Viewing...' : cost === 0 ? 'View Writeup (Free)' : `View Writeup (${cost} XP)`}
              </button>
            )}

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
        )
      })}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>View Writeup</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Spend <span style={{ color: '#eab308', fontWeight: 600 }}>{confirmModal.cost} XP</span> to view this writeup?
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your XP: {viewCostInfo?.userXp || 0}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmView}
                disabled={viewing === confirmModal.writeupId}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#eab308' }}
              >
                {viewing === confirmModal.writeupId ? 'Viewing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
