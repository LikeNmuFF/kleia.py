'use client'

import { useState, useEffect } from 'react'
import { submitWriteup, getUserWriteup } from '@/app/actions/writeups'

export default function WriteupForm({ challengeId }: { challengeId: string }) {
  const [existing, setExisting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    getUserWriteup(challengeId).then((w) => {
      setExisting(w)
      if (w) {
        setTitle(w.title)
        setContent(w.content)
      }
      setLoading(false)
    })
  }, [challengeId])

  if (loading) return null
  if (existing) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setMessage({ text: 'Title and content are required', type: 'error' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const result = await submitWriteup(challengeId, title, content)

    if (result.success) {
      setMessage({ text: 'Writeup submitted! +20 XP', type: 'success' })
      setExisting({ title, content })
    } else {
      setMessage({ text: (result as { error: string }).error || 'Failed to submit writeup', type: 'error' })
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg p-4 space-y-4" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Write a Writeup (+20 XP)
      </h4>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. My approach to solving this challenge"
          className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your step-by-step approach, tools used, and key insights..."
          rows={6}
          className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent resize-none"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !title.trim() || !content.trim()}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50"
      >
        {submitting ? '...' : 'Submit Writeup'}
      </button>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}
