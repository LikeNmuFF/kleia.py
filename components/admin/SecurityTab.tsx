'use client'

import { useQuery } from '@tanstack/react-query'
import { getSecurityReports } from '@/app/actions/admin'
import { Shield, AlertTriangle, Info, AlertCircle } from 'lucide-react'

function SeverityBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${color}15`, color }}>
      {count}
      <span>{label}</span>
    </div>
  )
}

export default function SecurityTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'security'],
    queryFn: () => getSecurityReports(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading security reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Latest Report */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-4 h-4 inline mr-2" />
            Latest Scan
          </h2>
          {data?.latest && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(data.latest.created_at).toLocaleString()}
            </span>
          )}
        </div>

        {!data?.latest ? (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-muted)' }}>No security reports yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Nightly scan runs at 2 AM. Trigger manually from GitHub Actions.
            </p>
          </div>
        ) : (
          <>
            {/* Severity Counts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {data.latest.critical_count > 0 && (
                <SeverityBadge count={data.latest.critical_count} label="Critical" color="#ef4444" />
              )}
              {data.latest.high_count > 0 && (
                <SeverityBadge count={data.latest.high_count} label="High" color="#f97316" />
              )}
              {data.latest.medium_count > 0 && (
                <SeverityBadge count={data.latest.medium_count} label="Medium" color="#eab308" />
              )}
              {data.latest.low_count > 0 && (
                <SeverityBadge count={data.latest.low_count} label="Low" color="#6b7280" />
              )}
              {data.latest.critical_count === 0 && data.latest.high_count === 0 &&
               data.latest.medium_count === 0 && data.latest.low_count === 0 && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> No vulnerabilities found
                </span>
              )}
            </div>

            {/* Summary Markdown */}
            <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
              {data.latest.summary_markdown.split('\n').map((line: string, i: number) => {
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-sm font-semibold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>{line.replace('### ', '')}</h3>
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{line.replace('## ', '')}</h2>
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>{line.replace('- ', '')}</li>
                }
                if (line.startsWith('**')) {
                  return <p key={i} className="text-sm font-medium mt-2" style={{ color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</p>
                }
                if (line.trim() === '') return <div key={i} className="h-2" />
                return <p key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{line}</p>
              })}
            </div>
          </>
        )}
      </div>

      {/* History */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Scan History
        </h2>

        {!data?.history || data.history.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No previous scans</p>
        ) : (
          <div className="space-y-2">
            {data.history.map((r: { id: string; critical_count: number; high_count: number; medium_count: number; low_count: number; created_at: string }) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-t text-sm" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  {r.critical_count > 0 && <span className="text-red-400 text-xs">{r.critical_count}C</span>}
                  {r.high_count > 0 && <span className="text-orange-400 text-xs">{r.high_count}H</span>}
                  {r.medium_count > 0 && <span className="text-yellow-400 text-xs">{r.medium_count}M</span>}
                  {r.low_count > 0 && <span className="text-gray-400 text-xs">{r.low_count}L</span>}
                  {r.critical_count === 0 && r.high_count === 0 && r.medium_count === 0 && r.low_count === 0 && (
                    <span className="text-emerald-400 text-xs">Clean</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
