'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { togglePin, updatePost, deletePost } from '@/app/actions/posts'
import CommentSection from './CommentSection'
import LinkPreviewCard from './LinkPreviewCard'
import YouTubeEmbed from './YouTubeEmbed'
import TranscriptViewer from './TranscriptViewer'
import ReactionBar from './ReactionBar'
import SavePostButton from './SavePostButton'
import SubjectChips from './SubjectChips'
import VideoAiAssistant from './VideoAiAssistant'
import Avatar from '@/components/Avatar'
import TulipBadge from '@/components/special/TulipBadge'
import type { FeedPost } from '@/lib/feed/types'
import { extractYouTubeVideoId } from '@/lib/ai/video-assistant'

interface Profile {
  username: string
  avatar_url: string | null
  role?: string
}

interface PostCardProps {
  post: FeedPost
  currentUserId?: string
  isAdmin?: boolean
  initialProfile?: Profile | null
}

export default function PostCard({ post, currentUserId, isAdmin = false, initialProfile = null }: PostCardProps) {
  const [profile] = useState<Profile | null>(initialProfile)
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
  const videoUrl = post.link_preview?.url ?? ''
  const youtubeVideoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length)
    }
  }, [editing])

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
          {currentUserId && <SavePostButton postId={post.id} initialSaved={post.saved_by_user} />}
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

      {!editing && <SubjectChips subjects={post.subjects} />}

      {post.youtube_data && !editing && (
        <>
          <YouTubeEmbed data={post.youtube_data} />
          <TranscriptViewer captions={post.youtube_data.videos[0]?.captions} />
        </>
      )}

      {post.link_preview && !post.youtube_data && !editing && (
        <LinkPreviewCard preview={post.link_preview} />
      )}

      {post.link_preview && !editing && currentUserId && (
        <VideoAiAssistant
          postId={post.id}
          videoUrl={post.link_preview.url}
          title={post.link_preview.title}
          enabled={Boolean(youtubeVideoId)}
        />
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

      {/* Reaction + Comment buttons */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <ReactionBar
          postId={post.id}
          initialCounts={post.reaction_counts}
          initialUserReactions={post.user_reactions}
        />

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
