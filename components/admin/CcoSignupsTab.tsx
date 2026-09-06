'use client'

import { useEffect, useState } from 'react'
import { Download, Search, Trash2, UsersRound } from 'lucide-react'
import { deleteCcoRegistration, getCcoRegistrations } from '@/app/actions/admin'
import { buildCcoSignupsExportHtml } from '@/lib/admin/cco-export'

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

  async function deleteRegistration(id: string) {
    if (!window.confirm('Delete this CCO sign-up permanently? This cannot be undone.')) return

    setError(null)
    const result = await deleteCcoRegistration(id)
    if ('error' in result && result.error) {
      setError(result.error)
      return
    }

    setRegistrations((current) => current.filter((row) => row.id !== id))
    await refresh()
  }

  const filtered = registrations.filter((row) => {
    const haystack = `${row.full_name} ${row.email} ${row.course ?? ''} ${row.year_level ?? ''} ${row.set_name}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  function exportRegistrationsPdf() {
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      setError('Could not open the PDF export window. Please allow pop-ups and try again.')
      return
    }

    const generatedAt = new Date().toLocaleString()
    reportWindow.document.write(buildCcoSignupsExportHtml({
      counts,
      generatedAt,
      registrations: filtered,
      search,
    }))
    reportWindow.document.close()
    reportWindow.addEventListener('load', () => {
      reportWindow.print()
    }, { once: true })
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--card-bg)' }} />)}</div>
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Total Registered', counts.total],
          ['Auto-approved', counts.approved],
          ['Showing', filtered.length],
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
          onClick={exportRegistrationsPdf}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-white/5"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
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
                <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.email}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{row.course || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{row.year_level || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{row.set_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteRegistration(row.id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                        title="Delete CCO sign-up"
                        aria-label={`Delete ${row.full_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
