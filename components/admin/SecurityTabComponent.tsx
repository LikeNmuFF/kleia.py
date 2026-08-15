'use client'

import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, Radar } from 'lucide-react'
import { getSecurityReports, getSecurityEvents } from '@/app/actions/admin'

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

interface SecurityEvent {
  id: string
  event_type: string
  severity: string
  source_ip: string | null
  user_id: string | null
  challenge_id: string | null
  details: Record<string, unknown>
  created_at: string
}

function SeverityBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${color}15`, color }}>
      {count} {label}
    </div>
  )
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

const EVENT_LABELS: Record<string, string> = {
  flag_bruteforce: 'Flag brute-force',
  flag_bruteforce_hourly: 'Flag spam (hourly cap)',
  ssrf_attempt: 'SSRF attempt',
  honeypot_hit: 'Honeypot hit',
  rate_limited: 'Rate-limited',
  proxy_invalid_protocol: 'Proxy invalid protocol',
  proxy_credentials: 'Proxy credential abuse',
}

export default function SecurityTabComponent() {
  const [data, setData] = useState<SecurityData | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [topIps, setTopIps] = useState<Array<{ ip: string; count: number }>>([])
  const [topTypes, setTopTypes] = useState<Array<{ type: string; count: number }>>([])
  const [severityCounts, setSeverityCounts] = useState({ critical: 0, high: 0, medium: 0, low: 0 })
  const [ipUsers, setIpUsers] = useState<Record<string, Array<{ userId: string; username: string; lastSeen: string }>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSecurityReports(), getSecurityEvents(50)])
      .then(([reports, sec]) => {
        setData(reports)
        setEvents(sec.events)
        setTopIps(sec.topIps)
        setTopTypes(sec.topTypes)
        setSeverityCounts(sec.severityCounts)
        setIpUsers(sec.ipUsers ?? {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />
  }

  return (
    <div className="space-y-6">
      {/* Threat Feed */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Radar className="w-4 h-4 text-red-400" />
            Detected Attacks
          </h3>
          <div className="flex gap-2">
            {severityCounts.critical > 0 && <SeverityBadge count={severityCounts.critical} label="Critical" color="#ef4444" />}
            {severityCounts.high > 0 && <SeverityBadge count={severityCounts.high} label="High" color="#f97316" />}
            {severityCounts.medium > 0 && <SeverityBadge count={severityCounts.medium} label="Medium" color="#eab308" />}
            {severityCounts.low > 0 && <SeverityBadge count={severityCounts.low} label="Low" color="#22c55e" />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Top threat IPs (24h)</p>
            {topIps.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No threats detected in the last 24 hours</p>
            ) : (
              <div className="space-y-1.5">
                {topIps.map(({ ip, count }) => {
                  const players = ipUsers[ip] ?? []
                  return (
                    <div key={ip} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{ip}</span>
                        {players.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {players.map(p => (
                              <a
                                key={p.userId}
                                href={`/profile/${encodeURIComponent(p.username)}`}
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium hover:underline"
                                style={{ backgroundColor: `${SEVERITY_COLORS.high}20`, color: '#f97316' }}
                              >
                                @{p.username}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-medium shrink-0" style={{ color: count >= 10 ? '#ef4444' : 'var(--text-primary)' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Attack types (24h)</p>
            {topTypes.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No attack types recorded</p>
            ) : (
              <div className="space-y-1.5">
                {topTypes.map(({ type, count }) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{EVENT_LABELS[type] || type}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Latest events</p>
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No security events recorded yet</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-2 py-1.5 border-t text-sm" style={{ borderColor: 'var(--border-color)' }}>
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: SEVERITY_COLORS[ev.severity] || '#22c55e' }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {EVENT_LABELS[ev.event_type] || ev.event_type}
                    </span>
                    {ev.source_ip && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                        {ev.source_ip}
                      </span>
                    )}
                  </div>
                  {ev.user_id && (
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>user: {ev.user_id.slice(0, 8)}…</span>
                  )}
                  <span className="text-[10px] ml-2" style={{ color: 'var(--text-muted)' }}>
                    {new Date(ev.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
