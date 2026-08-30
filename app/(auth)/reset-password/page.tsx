import { updatePassword } from './actions'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="backdrop-blur-sm rounded-2xl p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Set New Password
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Choose a strong password for your account
        </p>
      </div>

      {searchParams.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {searchParams.error}
        </div>
      )}

      <form action={updatePassword} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            New Password
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="New password (min 8 characters)"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            placeholder="Confirm your new password"
            className="input-field"
          />
        </div>

        <button type="submit" className="btn-primary">
          Update Password
        </button>
      </form>
    </div>
  )
}
