'use client'

import { useEffect, useState } from 'react'
import { getAdminFeedback, updateFeedbackStatus } from '@/app/actions/admin-feedback'
import { FEEDBACK_STATUSES, type FeedbackReport } from '@/lib/feedback/admin'
import { FEEDBACK_TYPES } from '@/lib/feedback/validation'

const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, value => value.toUpperCase())
const controlStyle = { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }

export default function FeedbackTab() {
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [reports, setReports] = useState<FeedbackReport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getAdminFeedback(status, type, page).then(result => {
      if (cancelled) return
      if ('error' in result) { setError(result.error ?? 'Could not load feedback.'); return }
      if (!result.reports.length && page > 0) { setPage(page - 1); return }
      setReports(result.reports)
      setTotal(result.total)
    }).catch(() => { if (!cancelled) setError('Could not load feedback. Please try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status, type, page, revision])

  async function changeStatus(id: string, nextStatus: string) {
    setSaving(id)
    setError('')
    setNotice('')
    try {
      const result = await updateFeedbackStatus(id, nextStatus)
      if ('error' in result) setError(result.error ?? 'Could not update feedback.')
      else { setNotice('Feedback status updated.'); setRevision(value => value + 1) }
    } catch { setError('Could not update feedback. Please try again.') }
    finally { setSaving(null) }
  }

  return (
    <section className="space-y-4" aria-label="Feedback inbox">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Feedback inbox</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Review app feedback, bug reports, errors, and feature requests.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status
          <select className="block rounded-lg p-2 mt-1" style={controlStyle} value={status} disabled={!!saving} onChange={event => { setStatus(event.target.value); setPage(0) }}>
            <option value="">All statuses</option>
            {FEEDBACK_STATUSES.map(value => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Type
          <select className="block rounded-lg p-2 mt-1" style={controlStyle} value={type} disabled={!!saving} onChange={event => { setType(event.target.value); setPage(0) }}>
            <option value="">All types</option>
            {FEEDBACK_TYPES.map(value => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <button className="rounded-lg px-3 py-2 text-sm disabled:opacity-50" style={controlStyle} disabled={loading || !!saving} onClick={() => setRevision(value => value + 1)}>Refresh</button>
      </div>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {notice && <p role="status" className="text-emerald-500">{notice}</p>}
      {loading ? <p role="status">Loading feedback…</p> : (
        <>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} matching reports</p>
          {!error && reports.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No feedback matches these filters.</p>}
          {reports.map(report => (
            <article key={report.id} className="rounded-xl p-5 space-y-3" style={controlStyle}>
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label(report.type)} · {report.allow_public ? 'Public' : 'Private'}{report.rating !== null ? ` · ${report.rating}/5 stars` : ''}</p>
                  <h3 className="font-semibold break-words mt-1">{report.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{report.display_name || 'Kleia learner'} · {new Date(report.created_at).toLocaleString()}</p>
                </div>
                <label className="text-xs">Status
                  <select aria-label={`Status for ${report.title}`} value={report.status} disabled={!!saving || loading} className="block rounded-lg p-2 mt-1" style={controlStyle} onChange={event => void changeStatus(report.id, event.target.value)}>
                    {FEEDBACK_STATUSES.map(value => <option key={value} value={value}>{label(value)}</option>)}
                  </select>
                </label>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{report.message}</p>
              {report.page_url && <p className="text-xs break-all" style={{ color: 'var(--text-secondary)' }}>Page: {report.page_url}</p>}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Updated {new Date(report.updated_at).toLocaleString()}{saving === report.id ? ' · Saving…' : ''}</p>
            </article>
          ))}
          <div className="flex items-center gap-3 text-sm">
            <button style={controlStyle} className="rounded-lg px-3 py-2 disabled:opacity-50" disabled={page === 0 || !!saving} onClick={() => setPage(value => value - 1)}>Previous</button>
            <span>Page {page + 1} of {Math.max(1, Math.ceil(total / 25))}</span>
            <button style={controlStyle} className="rounded-lg px-3 py-2 disabled:opacity-50" disabled={(page + 1) * 25 >= total || !!saving} onClick={() => setPage(value => value + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  )
}
