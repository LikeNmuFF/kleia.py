'use client'

import { useEffect, useState } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'
import { getSecurityReports } from '@/app/actions/admin'

interface SecurityData {
  latest: {
    id: string
    summary_markdown: string
    critical_count: number
    high_count: number
    medium_count: number
    low_count: number
    created_at: string
  } | null
  history: Array<{
    id: string
    critical_count: number
    high_count: number
    medium_count: number
    low_count: number
    created_at: string
  }>
}

function SeverityBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${color}15`, color }}>
      {count} {label}
    </div>
  )
}

export default function SecurityTabComponent() {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSecurityReports().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <div className="space-y-6">
      {/* Latest Report */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-4 h-4 text-emerald-400" />
            Latest Scan
          </h3>
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
            <div className="flex flex-wrap gap-2 mb-4">
              {data.latest.critical_count > 0 && <SeverityBadge count={data.latest.critical_count} label="Critical" color="#ef4444" />}
              {data.latest.high_count > 0 && <SeverityBadge count={data.latest.high_count} label="High" color="#f97316" />}
              {data.latest.medium_count > 0 && <SeverityBadge count={data.latest.medium_count} label="Medium" color="#eab308" />}
              {data.latest.low_count > 0 && <SeverityBadge count={data.latest.low_count} label="Low" color="#6b7280" />}
              {data.latest.critical_count === 0 && data.latest.high_count === 0 && data.latest.medium_count === 0 && data.latest.low_count === 0 && (
                <span className="text-xs text-emerald-400 flex items-center gap-1"><Shield className="w-3 h-3" /> No vulnerabilities found</span>
              )}
            </div>
            <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
              {data.latest.summary_markdown.split('\n').map((line: string, i: number) => {
                if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>{line.replace('### ', '')}</h3>
                if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{line.replace('## ', '')}</h2>
                if (line.startsWith('- ')) return <li key={i} className="text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>{line.replace('- ', '')}</li>
                if (line.startsWith('**')) return <p key={i} className="text-sm font-medium mt-2" style={{ color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</p>
                if (line.trim() === '') return <div key={i} className="h-2" />
                return <p key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{line}</p>
              })}
            </div>
          </>
        )}
      </div>

      {/* History */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Scan History
        </h3>
        {!data?.history || data.history.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No previous scans</p>
        ) : (
          <div className="space-y-2">
            {data.history.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-t text-sm" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
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
