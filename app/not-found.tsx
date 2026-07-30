import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--accent)' }}>404</h1>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h2>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
