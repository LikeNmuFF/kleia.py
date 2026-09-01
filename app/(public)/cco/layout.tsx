import Link from 'next/link'

export default function CcoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight font-logo" style={{ color: 'var(--text-primary)' }}>
            kleia
          </Link>
          <span className="ml-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
            CCO sign-up
          </span>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
