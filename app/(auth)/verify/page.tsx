'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const email = searchParams.email || 'your email'

  const checkConfirmation = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      setConfirmed(true)
      setTimeout(() => router.push('/feed'), 1500)
    }
  }, [router])

  useEffect(() => {
    checkConfirmation()
    const interval = setInterval(checkConfirmation, 3000)
    return () => clearInterval(interval)
  }, [checkConfirmation])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') {
        setConfirmed(true)
        setTimeout(() => router.push('/feed'), 1000)
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto mt-20" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
          {confirmed ? (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {confirmed ? 'Email Verified!' : 'Check Your Email'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
          {confirmed ? (
            'Redirecting you to the feed...'
          ) : (
            <>We sent a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></>
          )}
        </p>
      </div>

      {!confirmed && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Waiting for email confirmation...
              </p>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              This page will update automatically once you click the link.
            </p>
          </div>

          <button
            onClick={() => checkConfirmation()}
            className="block w-full text-center px-6 py-3 border border-white/10 rounded-xl font-medium transition-all hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            I&apos;ve verified — refresh now
          </button>
        </div>
      )}
    </div>
  )
}
