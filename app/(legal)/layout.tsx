import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight font-logo" style={{ color: 'var(--text-primary)' }}>
            kleia
          </Link>
          <div className="flex gap-3 ml-auto">
            <Link href="/security" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Security</Link>
            <Link href="/privacy" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Privacy</Link>
            <Link href="/terms" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Terms</Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>

      <footer className="border-t py-6 mt-12" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>&copy; {new Date().getFullYear()} Kleia</span>
          <Link href="/security" className="hover:text-violet-400 transition-colors">Security</Link>
          <Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-violet-400 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
