'use client'

import { useEffect, useState } from 'react'
import { Search, Trash2, MessageSquare, FileText } from 'lucide-react'
import { getAdminPosts, deletePost, getAdminComments, deleteComment } from '@/app/actions/admin'

interface Post {
  id: string
  content: string
  created_at: string
  author: { id: string; username: string; avatar_url: string | null } | { id: string; username: string; avatar_url: string | null }[] | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  author: { id: string; username: string; avatar_url: string | null } | { id: string; username: string; avatar_url: string | null }[] | null
  post: { id: string; content: string } | { id: string; content: string }[] | null
}

function resolveAuthor(author: Post['author']) {
  if (!author) return null
  return Array.isArray(author) ? author[0] ?? null : author
}

function resolvePost(post: Comment['post']) {
  if (!post) return null
  return Array.isArray(post) ? post[0] ?? null : post
}

export default function ContentTab() {
  const [tab, setTab] = useState<'posts' | 'comments'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    if (tab === 'posts') {
      getAdminPosts().then(d => { setPosts(d.posts); setLoading(false) })
    } else {
      getAdminComments().then(d => { setComments(d.comments); setLoading(false) })
    }
  }, [tab])

  const filteredPosts = posts.filter(p => {
    const author = resolveAuthor(p.author)
    return !search || p.content.toLowerCase().includes(search.toLowerCase()) || author?.username.toLowerCase().includes(search.toLowerCase())
  })

  const filteredComments = comments.filter(c => {
    const author = resolveAuthor(c.author)
    return !search || c.content.toLowerCase().includes(search.toLowerCase()) || author?.username.toLowerCase().includes(search.toLowerCase())
  })

  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    const result = await deletePost(id)
    if (!result.error) setPosts(prev => prev.filter(p => p.id !== id))
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    const result = await deleteComment(id)
    if (!result.error) setComments(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('posts')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab === 'posts' ? 'var(--card-bg)' : 'transparent',
            color: tab === 'posts' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: tab === 'posts' ? '1px solid var(--border-color)' : '1px solid transparent',
          }}
        >
          <FileText className="w-4 h-4" />
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setTab('comments')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: tab === 'comments' ? 'var(--card-bg)' : 'transparent',
            color: tab === 'comments' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: tab === 'comments' ? '1px solid var(--border-color)' : '1px solid transparent',
          }}
        >
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />)}</div>
      ) : tab === 'posts' ? (
        <div className="space-y-2">
          {filteredPosts.map(post => {
            const author = resolveAuthor(post.author)
            return (
              <div key={post.id} className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-semibold">{author?.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    @{author?.username} · {new Date(post.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>
                </div>
                <button onClick={() => handleDeletePost(post.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-red-400 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
          {filteredPosts.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No posts found</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredComments.map(comment => {
            const author = resolveAuthor(comment.author)
            const post = resolvePost(comment.post)
            return (
              <div key={comment.id} className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-semibold">{author?.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    @{author?.username} · {new Date(comment.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                  {post && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      on: {post.content}
                    </p>
                  )}
                </div>
                <button onClick={() => handleDeleteComment(comment.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-red-400 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
          {filteredComments.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No comments found</p>}
        </div>
      )}
    </div>
  )
}
