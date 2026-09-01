'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, Search, UsersRound, XCircle } from 'lucide-react'
import { getCcoRegistrations, updateCcoRegistrationStatus } from '@/app/actions/admin'

interface CcoRegistration {
  id: string
  full_name: string
  email: string
  course: string | null
  year_level: string | null
  set_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const statusIcons = {
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
}

const statusColors = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
}

export default function CcoSignupsTab() {
  const [registrations, setRegistrations] = useState<CcoRegistration[]>([])
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const result = await getCcoRegistrations()
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setRegistrations((result.registrations ?? []) as CcoRegistration[])
      setCounts(result.counts ?? { total: 0, pending: 0, approved: 0, rejected: 0 })
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function changeStatus(id: string, status: CcoRegistration['status']) {
    setError(null)
    const result = await updateCcoRegistrationStatus(id, status)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }
    setRegistrations((current) => current.map((row) => row.id === id ? { ...row, status } : row))
    await refresh()
  }

  const filtered = registrations.filter((row) => {
    const haystack = `${row.full_name} ${row.email} ${row.course ?? ''} ${row.year_level ?? ''} ${row.set_name}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />)}</div>
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Total', counts.total],
          ['Pending', counts.pending],
          ['Approved', counts.approved],
          ['Rejected', counts.rejected],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search CCO sign-ups..."
            className="input-field pl-10"
          />
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-white/5"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
          <UsersRound className="mx-auto mb-3 h-8 w-8" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No CCO sign-ups found</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Registrations from /cco will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Student</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Course</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Year</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Set</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Submitted</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const StatusIcon = statusIcons[row.status]
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.email}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{row.course || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{row.year_level || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{row.set_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" style={{ color: statusColors[row.status] }} />
                        <select
                          value={row.status}
                          onChange={(event) => changeStatus(row.id, event.target.value as CcoRegistration['status'])}
                          className="rounded-lg border px-2 py-1 capitalize outline-none"
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
