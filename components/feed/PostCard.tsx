'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleLike, togglePin, updatePost, deletePost } from '@/app/actions/posts'
import CommentSection from './CommentSection'
import LinkPreviewCard from './LinkPreviewCard'
import Avatar from '@/components/Avatar'
import TulipBadge from '@/components/special/TulipBadge'

interface Profile {
  username: string
  avatar_url: string | null
  role?: string
}

interface LinkPreviewData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

interface PostCardProps {
  post: {
    id: string
    content: string
    type: string
    author_id: string
    created_at: string
    is_pinned: boolean
    likes_count: number
    comments_count: number
    link_preview?: LinkPreviewData | null
  }
  currentUserId?: string
  initialLiked?: boolean
  isAdmin?: boolean
  initialProfile?: Profile | null
}

export default function PostCard({ post, currentUserId, initialLiked = false, isAdmin = false, initialProfile = null }: PostCardProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [pinned, setPinned] = useState(post.is_pinned)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const isOwnPost = currentUserId === post.author_id

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length)
    }
  }, [editing])

  const handleLike = async () => {
    const prevLiked = liked
    const prevCount = likesCount
    setLiked(!prevLiked)
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)

    const result = await toggleLike(post.id)
    if (result.error) {
      setLiked(prevLiked)
      setLikesCount(prevCount)
    } else {
      setLiked(result.liked ?? !prevLiked)
      setLikesCount(result.likesCount ?? prevCount)
    }
  }

  const handlePin = async () => {
    const prev = pinned
    setPinned(!prev)
    const result = await togglePin(post.id)
    if (result.error) setPinned(prev)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === post.content) {
      setEditing(false)
      setEditContent(post.content)
      return
    }

    setSaving(true)
    const result = await updatePost(post.id, editContent)
    setSaving(false)

    if (result.error) {
      setEditContent(post.content)
    }
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(post.content)
    setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deletePost(post.id)
    if (result.error) {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancelEdit()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit()
  }

  const handleCommentChange = useCallback((count: number) => {
    setCommentsCount(count)
  }, [])

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
              <Avatar src={profile.avatar_url} size={40} />
          ) : (
            <span className="text-white font-semibold text-sm">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {profile?.username || 'Member'}
            {profile?.role === 'special' && <TulipBadge className="ml-1.5 -mt-0.5" />}
            {isOwnPost && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                You
              </span>
            )}
            {pinned && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Pinned
              </span>
            )}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Admin pin + Owner edit/delete */}
        <div className="ml-auto flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={handlePin}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: pinned ? '#f59e0b' : 'var(--text-muted)' }}
              title={pinned ? 'Unpin post' : 'Pin post'}
            >
              <svg className="w-4 h-4" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5l-8 8-1.5 4L6 16.5l4-1.5 8-8M15 4.5l3 3" />
              </svg>
            </button>
          )}
          {isOwnPost && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
                title="Edit post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
                title="Delete post"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Post content or edit mode */}
      {editing ? (
        <div>
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field resize-none w-full min-h-[80px]"
            rows={3}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editContent.trim()}
              className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
              Esc to cancel · Ctrl+Enter to save
            </span>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>
      )}

      {post.link_preview && !editing && (
        <LinkPreviewCard preview={post.link_preview} />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: '#ef444440', backgroundColor: '#ef444410' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Delete this post?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Like + Comment buttons */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: liked ? '#ef4444' : 'var(--text-muted)' }}
        >
          {liked ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          )}
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: showComments ? '#8b5cf6' : 'var(--text-muted)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span>{commentsCount}</span>
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <CommentSection postId={post.id} currentUserId={currentUserId} onCountChange={handleCommentChange} />
      )}
    </div>
  )
}
