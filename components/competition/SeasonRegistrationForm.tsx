'use client'

import { useState } from 'react'
import { submitSeasonRegistration } from '@/app/actions/registrations'

export default function SeasonRegistrationForm({ seasonId, seasonName }: { seasonId: string; seasonName: string }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const result = await submitSeasonRegistration(seasonId, email, username)
    setBusy(false)
    const error = 'error' in result ? result.error : undefined
    if (error) {
      setMessage({ text: error, type: 'error' })
      return
    }
    setMessage({ text: 'Registration received. An admin will send your account details.', type: 'success' })
    setEmail('')
    setUsername('')
  }

  return (
    <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: '2px dashed rgba(139, 92, 246, 0.4)' }}>
      <div className="p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Request access to {seasonName}</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Submit your email and username. An admin will create your participant account.</p>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Email
            <input type="email" required value={email} onChange={event => setEmail(event.target.value)} className="input-field w-full mt-1" placeholder="you@example.com" />
          </label>
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Username
            <input name="username" required minLength={3} maxLength={30} value={username} onChange={event => setUsername(event.target.value)} className="input-field w-full mt-1" placeholder="your_username" />
          </label>
          <button type="submit" disabled={busy} className="px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: 'white' }}>
            {busy ? 'Submitting...' : 'Submit registration'}
          </button>
        </form>
        {message && <p className="text-sm mt-3" style={{ color: message.type === 'success' ? '#22c55e' : '#ef4444' }}>{message.text}</p>}
      </div>
    </div>
  )
}
