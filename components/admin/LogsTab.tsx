'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Search, AlertTriangle, Shield, Info } from 'lucide-react'

interface LogEntry {
  id: string
  source: 'api' | 'security'
  timestamp: string
  label: string
  status: string
  message: string
  user_id: string | null
  client_ip: string | null
  details: Record<string, unknown> | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function StatusBadge({ status, source }: { status: string; source: string }) {
  if (source === 'security') {
    const colors: Record<string, string> = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        <Shield className="w-3 h-3" />
        {status}
      </span>
    )
  }
  const colors: Record<string, string> = {
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {status === 'error' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
      {status}
    </span>
  )
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('error')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const limit = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: statusFilter,
      source: sourceFilter,
      page: String(page),
      limit: String(limit),
    })
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/admin/logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, page, search])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, sourceFilter, search])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Status</option>
          <option value="error">Errors</option>
          <option value="success">Success</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Sources</option>
          <option value="api">API Logs</option>
          <option value="security">Security Events</option>
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints, errors..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Time</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Source</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Endpoint</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Error</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No logs found</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id
                  const isError = log.status === 'error' || log.status === 'high'
                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="cursor-pointer transition-colors hover:bg-white/5"
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: isError
                            ? log.source === 'security' ? '3px solid #f59e0b' : '3px solid #ef4444'
                            : '3px solid transparent',
                        }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }} title={new Date(log.timestamp).toLocaleString()}>
                          {timeAgo(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${log.source === 'security' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-violet-500/20 text-violet-400 border-violet-500/30'}`}>
                            {log.source === 'security' ? <Shield className="w-3 h-3" /> : null}
                            {log.source === 'security' ? 'SEC' : 'API'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{log.label}</td>
                        <td className="px-4 py-3"><StatusBadge status={log.status} source={log.source} /></td>
                        <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          {log.message || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {log.user_id ? log.user_id.slice(0, 8) + '…' : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {log.client_ip || '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-detail`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td colSpan={7} className="px-4 py-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <span>Full ID: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{log.id}</span></span>
                                <span>User: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{log.user_id || '—'}</span></span>
                                <span>IP: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{log.client_ip || '—'}</span></span>
                                <span>Time: <span style={{ color: 'var(--text-primary)' }}>{new Date(log.timestamp).toLocaleString()}</span></span>
                              </div>
                              {log.message && (
                                <div className="p-3 rounded-lg text-xs font-mono whitespace-pre-wrap break-all" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                                  {log.message}
                                </div>
                              )}
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="p-3 rounded-lg text-xs font-mono whitespace-pre-wrap break-all" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                                  {JSON.stringify(log.details, null, 2)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
