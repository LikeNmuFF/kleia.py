'use client'

import { useEffect, useState } from 'react'
import { getComments, addComment, deleteComment } from '@/app/actions/posts'

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  author: {
    username: string
    avatar_url: string | null
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

  useEffect(() => {
    const load = async () => {
      const data = await getComments(postId)
      setComments(data)
      if (onCountChange) onCountChange(data.length)
      setLoading(false)
    }
    load()
  }, [postId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    const result = await addComment(postId, newComment)
    if (result.success) {
      const data = await getComments(postId)
      setComments(data)
      if (onCountChange) onCountChange(data.length)
      setNewComment('')
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    const result = await deleteComment(commentId)
    if (result.success) {
      const updated = comments.filter(c => c.id !== commentId)
      setComments(updated)
      if (onCountChange) onCountChange(updated.length)
    }
  }

  return (
    <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border-color)' }}>
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading comments...</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                {comment.author.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {comment.author.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {comment.author.username}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}
                  </span>
                  {currentUserId === comment.author_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-red-400 hover:text-red-300 ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet</p>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50"
        >
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
