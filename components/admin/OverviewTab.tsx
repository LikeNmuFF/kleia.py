'use client'

import { useEffect, useState } from 'react'
import { Users, MessageSquare, FileText, Flame, Trophy, TrendingUp, Activity } from 'lucide-react'
import { getAdminAnalytics } from '@/app/actions/admin'

interface Analytics {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalMessages: number
  postsToday: number
  newUsersThisWeek: number
  totalChallenges: number
  totalSolves: number
  recentPosts: Array<{
    id: string
    content: string
    created_at: string
    author: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null
  }>
  topStreaks: Array<{
    id: string
    username: string
    avatar_url: string | null
    current_streak: number
    longest_streak: number
  }>
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function OverviewTab() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminAnalytics().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={data.totalUsers} color="#a855f7" />
        <StatCard icon={FileText} label="Total Posts" value={data.totalPosts} color="#06b6d4" />
        <StatCard icon={MessageSquare} label="Comments" value={data.totalComments} color="#10b981" />
        <StatCard icon={Activity} label="Messages" value={data.totalMessages} color="#f59e0b" />
        <StatCard icon={TrendingUp} label="Posts Today" value={data.postsToday} color="#8b5cf6" />
        <StatCard icon={Users} label="New This Week" value={data.newUsersThisWeek} color="#ec4899" />
        <StatCard icon={Trophy} label="Active Challenges" value={data.totalChallenges} color="#f97316" />
        <StatCard icon={Flame} label="CTF Solves" value={data.totalSolves} color="#ef4444" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Streaks */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Flame className="w-4 h-4 text-orange-400" />
            Top Streaks
          </h3>
          {data.topStreaks.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active streaks</p>
          ) : (
            <div className="space-y-3">
              {data.topStreaks.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-5" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-semibold">{s.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>@{s.username}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                    <Flame className="w-3 h-3" />
                    {s.current_streak}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-4 h-4 text-cyan-400" />
            Recent Posts
          </h3>
          {data.recentPosts.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No posts yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentPosts.map(post => {
                const author = Array.isArray(post.author) ? post.author[0] ?? null : post.author
                return (
                  <div key={post.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {author?.avatar_url ? (
                        <img src={author.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-semibold">{author?.username?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        @{author?.username} · {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
