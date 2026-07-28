import Link from 'next/link'

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  return (
    <div className="backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto mt-20" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Check Your Email
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
          We sent a confirmation link to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {searchParams.email || 'your email'}
          </strong>
        </p>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Click the link in the email to confirm your account. If you don&apos;t see it, check your spam folder.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/login"
          className="block w-full text-center px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500"
        >
          Go to Sign In
        </Link>
        <Link
          href="/signup"
          className="block w-full text-center px-6 py-3 border border-white/10 rounded-xl font-medium transition-all hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Use a different email
        </Link>
      </div>
    </div>
  )
}