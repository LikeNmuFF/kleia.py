import { signup } from './actions'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Create Account
        </h1>
        <p className="text-gray-400">
          Join your study community
        </p>
      </div>

      <form action={signup} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            name="username"
            required
            placeholder="Choose a username"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
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
        <p className="text-gray-400">
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
