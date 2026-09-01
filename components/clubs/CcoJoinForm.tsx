'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

const initialForm = {
  fullName: '',
  email: '',
  course: '',
  yearLevel: '',
  set: '',
}

const SET_OPTIONS = ['Set A', 'Set B', 'Set C', 'Set D', 'Set E']

export default function CcoJoinForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    kind: 'idle',
    message: '',
  })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus({ kind: 'loading', message: '' })

    const response = await fetch('/api/cco/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      setStatus({ kind: 'error', message: result.error || 'Could not submit your sign-up.' })
      return
    }

    setForm(initialForm)
    setStatus({ kind: 'success', message: 'Your CCO sign-up was received.' })
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  if (status.kind === 'success') {
    return (
      <div className="border rounded-lg p-6 text-center shadow-2xl shadow-emerald-950/20" style={{ borderColor: 'rgba(52,211,153,0.35)', backgroundColor: 'var(--card-bg)' }}>
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sign-up received</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{status.message} Welcome to the community.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border rounded-lg p-5 space-y-4 shadow-2xl shadow-black/10 transition hover:-translate-y-0.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name</span>
          <input
            required
            suppressHydrationWarning
            value={form.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition focus:-translate-y-0.5 focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</span>
          <input
            required
            suppressHydrationWarning
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition focus:-translate-y-0.5 focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Course</span>
          <input
            required
            suppressHydrationWarning
            value={form.course}
            onChange={(event) => updateField('course', event.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition focus:-translate-y-0.5 focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Year</span>
          <input
            required
            suppressHydrationWarning
            value={form.yearLevel}
            onChange={(event) => updateField('yearLevel', event.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition focus:-translate-y-0.5 focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Set</span>
          <select
            required
            suppressHydrationWarning
            value={form.set}
            onChange={(event) => updateField('set', event.target.value)}
            className="w-full px-3 py-2 rounded-lg border outline-none transition focus:-translate-y-0.5 focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
          >
            <option value="">Choose set</option>
            {SET_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      {status.kind === 'error' && (
        <p className="text-sm text-red-400">{status.message}</p>
      )}

      <button
        type="submit"
        suppressHydrationWarning
        disabled={status.kind === 'loading'}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 sm:w-auto"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
      >
        {status.kind === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit
      </button>
    </form>
  )
}
