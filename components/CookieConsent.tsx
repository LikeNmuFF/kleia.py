'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const CONSENT_KEY = 'kleia-cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) === null)
  }, [])

  const choose = (value: 'accepted' | 'declined') => {
    window.localStorage.setItem(CONSENT_KEY, value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside role="dialog" aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-[60] rounded-2xl border p-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:max-w-lg" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cookie preferences</h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Kleia uses essential cookies to keep you signed in and protect your account. Read our <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--text-primary)]">Privacy Policy</Link> for details.
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => choose('declined')} className="min-h-9 rounded-lg border px-3 text-sm font-semibold transition-colors hover:bg-[var(--hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Decline non-essential</button>
        <button type="button" onClick={() => choose('accepted')} className="min-h-9 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Accept cookies</button>
      </div>
    </aside>
  )
}
