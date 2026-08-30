import { signup } from './actions'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <div className="backdrop-blur-sm rounded-2xl p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Create Account
          </h1>
          <p className="text-sm mb-1 text-violet-400 font-medium">
            Learn Together, Grow Together
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Join your study community
          </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form action={signup} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Username
          </label>
          <input
            type="text"
            name="username"
            required
            minLength={3}
            placeholder="Choose a username"
            className="input-field"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="Create a password (min 8 characters)"
            className="input-field"
          />
        </div>

        <button type="submit" className="btn-primary">
          Sign Up
        </button>
      </form>

      <div className="mt-6 text-center">
        <p style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}