import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'
import PresenceTracker from '@/components/PresenceTracker'
import ThemeToggle from '@/components/ThemeToggle'
import SpecialUserLayout from '@/components/special/SpecialUserLayout'
import ChatUnreadProvider from '@/components/chat/ChatUnreadProvider'
import DesktopNav from '@/components/nav/DesktopNav'
import MobileNav from '@/components/nav/MobileNav'
import TeamInviteNotification from '@/components/teams/TeamInviteNotification'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <ChatUnreadProvider userId={user?.id || null}>
      <div
        className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+64px)] lg:pb-0"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Top Navigation */}
        <nav
          className="sticky top-0 z-40 border-b backdrop-blur-xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex justify-between items-center gap-2">
            {/* Logo */}
            <Link href="/feed" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-bold tracking-tight font-logo" style={{ color: 'var(--text-primary)' }}>
                kleia
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                Beta
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <DesktopNav />

            {/* User Menu */}
            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              <TeamInviteNotification />
              <ThemeToggle />
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg transition-all hover:bg-[var(--hover-bg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="hidden xl:inline max-w-[120px] truncate">{user?.email?.split('@')[0]}</span>
                <span className="xl:hidden flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold uppercase" style={{ background: 'var(--hover-bg)', color: 'var(--text-primary)' }}>
                  {(user?.email?.split('@')[0] || '?').slice(0, 2)}
                </span>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </nav>

        {/* Presence Tracker (real-time online status) */}
        <PresenceTracker />

        {/* Main Content */}
        <SpecialUserLayout>
          <main>{children}</main>
        </SpecialUserLayout>

        {/* Footer */}
        <footer className="border-t py-6 mt-12" style={{ borderColor: 'var(--border-color)' }}>
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>&copy; {new Date().getFullYear()} Kleia</span>
            <Link href="/security" className="hover:text-violet-400 transition-colors">Security</Link>
            <Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-violet-400 transition-colors">Terms</Link>
          </div>
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </ChatUnreadProvider>
  )
}
