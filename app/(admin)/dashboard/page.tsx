'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/app/actions/admin'

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => getDashboardStats(),
    staleTime: 60 * 1000,
  })

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

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h1>
        <p className="text-red-400">Failed to load dashboard data</p>
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
        <SummaryCard title="Users" value={data.totalUsers} />
        <SummaryCard title="Posts" value={data.totalPosts} />
        <SummaryCard title="Messages" value={data.totalMessages} />
        <SummaryCard title="CTF Submissions" value={data.totalCtfSubmissions} />
      </div>

      {/* Recent Errors */}
      <div className="mb-8 rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Recent Errors
        </h2>
        {data.recentErrors.length === 0 ? (
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
                {data.recentErrors.map((e: { id: string; endpoint: string; error_message: string | null; duration_ms: number; created_at: string }) => (
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
        {data.endpointStats.length === 0 ? (
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
                {data.endpointStats.map((s: { endpoint: string; request_count: number; avg_duration_ms: number }) => (
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
