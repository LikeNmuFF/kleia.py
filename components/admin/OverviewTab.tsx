'use client'

import { useEffect, useState } from 'react'
import { Users, MessageSquare, FileText, Flame, Trophy, TrendingUp, Activity, Database, Cloud, AlertTriangle } from 'lucide-react'
import { getAdminAnalytics, getDatabaseUsage, getCloudinaryUsage, getDashboardStats } from '@/app/actions/admin'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[Math.min(i, units.length - 1)]}`
}

function colorClass(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

function textColor(percent: number): string {
  if (percent >= 90) return 'text-red-400'
  if (percent >= 70) return 'text-yellow-400'
  return 'text-emerald-400'
}

function UsageBar({ label, used, limit, percent }: { label: string; used: number; limit: number; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className={`text-xs font-medium ${textColor(percent)}`}>{percent.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
          <div
            className={`h-full rounded-full transition-all ${colorClass(percent)}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>
    </div>
  )
}

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

  const [dashData, setDashData] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null)
  const [dbData, setDbData] = useState<Awaited<ReturnType<typeof getDatabaseUsage>> | null>(null)
  const [cloudData, setCloudData] = useState<Awaited<ReturnType<typeof getCloudinaryUsage>> | null>(null)

  useEffect(() => {
    getAdminAnalytics().then(d => { setData(d); setLoading(false) })
  }, [])

  useEffect(() => {
    getDashboardStats().then(setDashData)
    getDatabaseUsage().then(setDbData)
    getCloudinaryUsage().then(setCloudData)
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

      {/* System Health */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Database Usage */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-4 h-4 text-emerald-400" />
            Database
          </h3>
          {dbData && !dbData.error ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatBytes(dbData.totalBytes)} / {formatBytes(dbData.freeTierBytes)}</span>
                <span className={`text-sm font-medium ${textColor(dbData.percentUsed)}`}>{dbData.percentUsed.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
                <div
                  className={`h-full rounded-full transition-all ${colorClass(dbData.percentUsed)}`}
                  style={{ width: `${Math.min(dbData.percentUsed, 100)}%` }}
                />
              </div>
              {dbData.largestTables.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Largest Tables</p>
                  <div className="space-y-1">
                    {dbData.largestTables.map((t: { table_name: string; size_bytes: number }) => (
                      <div key={t.table_name} className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-primary)' }} className="font-mono">{t.table_name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{formatBytes(t.size_bytes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-red-400">{dbData?.error || 'Loading...'}</p>
          )}
        </div>

        {/* Cloudinary Usage */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Cloud className="w-4 h-4 text-cyan-400" />
            Cloudinary
          </h3>
          {cloudData?.error ? (
            <p className="text-sm text-red-400">{cloudData.error}</p>
          ) : cloudData && cloudData.storage ? (
            <div className="space-y-4">
              <UsageBar label="Storage" used={cloudData.storage.used} limit={cloudData.storage.limit} percent={cloudData.storage.percentUsed} />
              <UsageBar label="Bandwidth" used={cloudData.bandwidth.used} limit={cloudData.bandwidth.limit} percent={cloudData.bandwidth.percentUsed} />
              <UsageBar label="Transformations" used={cloudData.transformations.used} limit={cloudData.transformations.limit} percent={cloudData.transformations.percentUsed} />
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          )}
        </div>
      </div>

      {/* Recent Errors */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Recent Errors
        </h3>
        {!dashData || dashData.recentErrors.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No errors logged</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left pb-2 pr-4">Endpoint</th>
                  <th className="text-left pb-2 pr-4">Error</th>
                  <th className="text-left pb-2 pr-4">Duration</th>
                  <th className="text-left pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {dashData.recentErrors.map((e: { id: string; endpoint: string; error_message: string | null; duration_ms: number; created_at: string }) => (
                  <tr key={e.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{e.endpoint}</td>
                    <td className="py-2 pr-4 text-red-400">{e.error_message || 'Unknown'}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--text-secondary)' }}>{e.duration_ms}ms</td>
                    <td className="py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(e.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requests by Endpoint */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Activity className="w-4 h-4 text-violet-400" />
          Requests by Endpoint (last 24h)
        </h3>
        {!dashData || dashData.endpointStats.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No requests in the last 24 hours</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left pb-2 pr-4">Endpoint</th>
                  <th className="text-left pb-2 pr-4">Count</th>
                  <th className="text-left pb-2">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {dashData.endpointStats.map((s: { endpoint: string; request_count: number; avg_duration_ms: number }) => (
                  <tr key={s.endpoint} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{s.endpoint}</td>
                    <td className="py-2 pr-4" style={{ color: 'var(--text-secondary)' }}>{s.request_count}</td>
                    <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{s.avg_duration_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
