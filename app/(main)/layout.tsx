import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'
import PresenceTracker from '@/components/PresenceTracker'
import ThemeToggle from '@/components/ThemeToggle'
import SpecialUserLayout from '@/components/special/SpecialUserLayout'
import ChatUnreadProvider from '@/components/chat/ChatUnreadProvider'
import ChatNavLink, { ChatMobileNavLink } from '@/components/chat/ChatNavLink'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight font-logo" style={{ color: 'var(--text-primary)' }}>
              kleia
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              Beta
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/feed"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Feed
            </Link>
            <ChatNavLink />
            <Link
              href="/events"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Events
            </Link>
            <Link
              href="/members"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Members
            </Link>
            <Link
              href="/learn"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Learn
            </Link>
            <Link
              href="/cipher"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cipher
            </Link>
            <Link
              href="/ctf"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              CTF
              <span className="ml-1 px-1 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                Beta
              </span>
            </Link>
            <Link
              href="/leaderboard"
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Leaderboard
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="hidden sm:inline">{user?.email?.split('@')[0]}</span>
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className="md:hidden border-t px-4 py-2 flex justify-around"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <Link href="/feed" className="flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs">Feed</span>
          </Link>
          <ChatMobileNavLink />
          <Link href="/events" className="flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Events</span>
          </Link>
          <Link href="/learn" className="flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/cipher" className="flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-xs">Cipher</span>
          </Link>
          <Link href="/ctf" className="flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v4c0 2.21 1.79 4 4 4h4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21v-4c0-2.21-1.79-4-4-4h-4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h4c2.21 0 4-1.79 4-4v-4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 3h-4c-2.21 0-4 1.79-4 4v4" />
            </svg>
            <span className="text-xs">CTF</span>
            <span className="px-1 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider -mt-1" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              Beta
            </span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">Leaderboard</span>
          </Link>
        </div>
      </nav>

      {/* Presence Tracker (real-time online status) */}
      <PresenceTracker />

      <ChatUnreadProvider userId={user?.id || null}>
        {/* Main Content */}
        <SpecialUserLayout>
          <main>{children}</main>
        </SpecialUserLayout>
      </ChatUnreadProvider>

      {/* Footer */}
      <footer className="border-t py-6 mt-12" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>&copy; {new Date().getFullYear()} Kleia</span>
          <a href="/security" className="hover:text-violet-400 transition-colors">Security</a>
          <a href="/privacy" className="hover:text-violet-400 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-violet-400 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  )
}
