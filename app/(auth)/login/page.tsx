import { login, signInWithGoogle, signInWithGitHub } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-400">
          Sign in to continue your learning journey
        </p>
      </div>

      <form action={login} className="space-y-5">
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
            placeholder="Enter your password"
            className="input-field"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link
            href="/forgot-password"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary">
          Sign In
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#0a0a0f] px-4 py-2 text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 rounded-xl py-3 text-white font-medium hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>

          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 rounded-xl py-3 text-white font-medium hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
