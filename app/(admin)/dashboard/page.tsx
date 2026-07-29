'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getDatabaseUsage, getCloudinaryUsage } from '@/app/actions/admin'

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

export default function AdminDashboard() {
  const { data: dashData } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => getDashboardStats(),
    staleTime: 60 * 1000,
  })

  const { data: dbData } = useQuery({
    queryKey: ['admin', 'database'],
    queryFn: () => getDatabaseUsage(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  const { data: cloudData } = useQuery({
    queryKey: ['admin', 'cloudinary'],
    queryFn: () => getCloudinaryUsage(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  const isLoading = !dashData

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Loading stats...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          System overview and metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Users" value={dashData!.totalUsers} />
        <SummaryCard title="Posts" value={dashData!.totalPosts} />
        <SummaryCard title="Messages" value={dashData!.totalMessages} />
        <SummaryCard title="CTF Submissions" value={dashData!.totalCtfSubmissions} />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Database Usage */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Database
          </h2>
          {dbData && !dbData.error && (
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
          )}
          {dbData?.error && (
            <p className="text-sm text-red-400">{dbData.error}</p>
          )}
          {!dbData && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Unable to fetch database stats</p>
          )}
        </div>

        {/* Cloudinary Usage */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Cloudinary
          </h2>
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
      <div className="mb-8 rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Recent Errors
        </h2>
        {dashData!.recentErrors.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No errors logged</p>
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
                {dashData!.recentErrors.map((e: { id: string; endpoint: string; error_message: string | null; duration_ms: number; created_at: string }) => (
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
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Requests by Endpoint (last 24h)
        </h2>
        {dashData!.endpointStats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No requests in the last 24 hours</p>
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
                {dashData!.endpointStats.map((s: { endpoint: string; request_count: number; avg_duration_ms: number }) => (
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

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value.toLocaleString()}
      </p>
    </div>
  )
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
