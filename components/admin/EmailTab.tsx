'use client'

import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { sendInviteEmails } from '@/app/actions/email'

interface SendResult {
  email: string
  ok: boolean
  error?: string
}

const DEFAULT_BODY = `[SEASON NAME] is officially launching soon.

You've been personally selected to compete in this season of Kleia — a cybersec challenge league where skill is everything.

SEASON OVERVIEW

  Season:    [Season Name]
  Starts:    [Start Date/Time, Asia/Manila]
  Ends:      [End Date/Time, Asia/Manila]
  Theme:     [Theme — e.g., "Digital Forensics & Cryptography"]

CHALLENGES INCOMING

  This season brings [N] new challenges across multiple categories:
  forensics, crypto, web exploitation, and more. Some you've never
  seen before — and a few that will test limits you didn't know
  you had.

  Whether you're here to grind the leaderboard or learn something
  new, there's a seat at the table.

WHAT YOU GET

  - XP and badges for every solve
  - Season-exclusive challenges (not available after the season ends)
  - A shot at the top of the leaderboard
  - Bragging rights

Join the fight — the clock starts soon.

Questions? Reach out anytime: me@kleia.site`

export default function EmailTab() {
  const [addresses, setAddresses] = useState('')
  const [subject, setSubject] = useState('You are invited to join Kleia')
  const [body, setBody] = useState(DEFAULT_BODY)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SendResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsed = addresses
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  async function handleSend() {
    setSending(true)
    setError(null)
    setResults(null)
    try {
      const res = await sendInviteEmails(parsed, subject, body)
      setResults(res.results)
      if (res.error) setError(res.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send emails.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Send Invite Emails</h2>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Paste one email address per line. Emails are sent from me@kleia.site via SMTP.
        </p>

        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Recipients ({parsed.length})
        </label>
        <textarea
          value={addresses}
          onChange={e => setAddresses(e.target.value)}
          rows={8}
          placeholder={'recipient1@example.com\nrecipient2@example.com'}
          className="w-full p-2 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />

        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Subject
        </label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full p-2 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />

        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Body
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={6}
          className="w-full p-2 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        />

        <button
          onClick={handleSend}
          disabled={sending || parsed.length === 0 || !subject.trim() || !body.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#22c55e', color: '#fff' }}
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending…' : 'Send Invites'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#ef444415', color: '#ef4444', border: '1px solid #ef444455' }}>
          {error}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Results — {results.filter(r => r.ok).length} sent / {results.filter(r => !r.ok).length} failed
          </h3>
          <ul className="space-y-1">
            {results.map(r => (
              <li key={r.email} className="text-sm flex items-start gap-2">
                <span style={{ color: r.ok ? '#22c55e' : '#ef4444' }}>{r.ok ? '✓' : '✗'}</span>
                <span style={{ color: r.ok ? 'var(--text-primary)' : '#ef4444' }}>{r.email}</span>
                {r.error && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {r.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
