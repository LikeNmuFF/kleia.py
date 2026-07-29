'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleLike, togglePin } from '@/app/actions/posts'
import CommentSection from './CommentSection'

interface Profile {
  username: string
  avatar_url: string | null
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
  }
  currentUserId?: string
  initialLiked?: boolean
  isAdmin?: boolean
}

export default function PostCard({ post, currentUserId, initialLiked = false, isAdmin = false }: PostCardProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [pinned, setPinned] = useState(post.is_pinned)
  const isOwnPost = currentUserId === post.author_id

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', post.author_id)
        .single()

      if (data) setProfile(data)
    }

    fetchProfile()
  }, [post.author_id])

  useEffect(() => {
    const fetchCommentCount = async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', post.id)
      if (count !== null) setCommentsCount(count)
    }
    fetchCommentCount()
  }, [post.id])

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

  const handleCommentChange = useCallback((count: number) => {
    setCommentsCount(count)
  }, [])

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {profile?.username || 'Member'}
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
        {isAdmin && (
          <button
            onClick={handlePin}
            className="ml-auto p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: pinned ? '#f59e0b' : 'var(--text-muted)' }}
            title={pinned ? 'Unpin post' : 'Pin post'}
          >
            <svg className="w-4 h-4" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5l-8 8-1.5 4L6 16.5l4-1.5 8-8M15 4.5l3 3" />
            </svg>
          </button>
        )}
      </div>

      <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>

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
