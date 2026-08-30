import { resetPassword } from './actions'
import Link from 'next/link'

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string; email?: string }
}) {
  if (searchParams.sent) {
    return (
      <div className="backdrop-blur-sm rounded-2xl p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Check Your Email
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            We sent a password reset link to{' '}
            <span className="font-medium text-violet-400">{searchParams.email}</span>
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Didn&apos;t receive the email? Check your spam folder, or{' '}
            <Link
              href="/forgot-password"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              try again
            </Link>
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-sm rounded-2xl p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Reset Password
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {searchParams.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {searchParams.error}
        </div>
      )}

      <form action={resetPassword} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="Enter your email"
            className="input-field"
          />
        </div>

        <button type="submit" className="btn-primary">
          Send Reset Link
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
