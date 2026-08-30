'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Loader2, Send, Trash2, UserRound } from 'lucide-react'
import { getComments, addComment, deleteComment } from '@/app/actions/posts'
import Avatar from '@/components/Avatar'
import TulipBadge from '@/components/special/TulipBadge'

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author: {
    username: string
    avatar_url: string | null
    role?: string
  }
}

interface CommentSectionProps {
  postId: string
  currentUserId?: string
  onCountChange?: (count: number) => void
}

export default function CommentSection({ postId, currentUserId, onCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadComments = useCallback(async () => {
    setLoading(true)
    const data = await getComments(postId)
    setComments(data)
    onCountChange?.(data.length)
    setLoading(false)
  }, [postId, onCountChange])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    setError('')
    const result = await addComment(postId, newComment)
    if (result.success) {
      setNewComment('')
      await loadComments()
    } else if (result.error) {
      setError(result.error)
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)
    setError('')
    const result = await deleteComment(commentId)
    if (result.success) {
      const updated = comments.filter(c => c.id !== commentId)
      setComments(updated)
      onCountChange?.(updated.length)
    } else if (result.error) {
      setError(result.error)
    }
    setDeletingId(null)
  }

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
                {comment.author.avatar_url ? (
                  <Avatar src={comment.author.avatar_url} size={32} />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {comment.author.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {comment.author.username || 'Member'}
                      {comment.author.role === 'special' && <TulipBadge className="ml-1 -mt-0.5" />}
                    </span>
                    <span className="shrink-0 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {comment.content}
                  </p>
                </div>
                {currentUserId === comment.author_id && (
                  <div className="mt-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] opacity-70 transition hover:bg-white/5 hover:opacity-100 disabled:opacity-40"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete comment"
                    >
                      {deletingId === comment.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="rounded-xl border border-dashed px-4 py-5 text-center" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={currentUserId ? 'Write a comment...' : 'Log in to comment'}
              disabled={!currentUserId || submitting}
              rows={1}
              className="max-h-28 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:cursor-not-allowed"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={!currentUserId || !newComment.trim() || submitting}
              className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white transition hover:from-violet-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              title="Send comment"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </div>
      </form>
    </div>
  )
}
