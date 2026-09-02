import { redirect } from 'next/navigation'

import { confirmEmail } from './actions'

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>
}) {
  const { token_hash, type, next } = await searchParams

  if (!token_hash || !type) {
    redirect('/login?error=auth_failed')
  }

  return (
    <div className="backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto mt-20" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Confirm Your Email
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
          Press the button below to finish verifying your account.
        </p>
      </div>

      <form action={confirmEmail} className="space-y-4">
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next ?? '/feed'} />
        <button type="submit" className="btn-primary">
          Verify Email
        </button>
      </form>
    </div>
  )
}
