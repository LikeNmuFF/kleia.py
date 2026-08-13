'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Ellipsis, Swords, X } from 'lucide-react'
import NavLink from './NavLink'
import { useChatUnread } from '@/components/chat/ChatUnreadProvider'
import {
  isMobileMoreActive,
  isNavItemActive,
  MOBILE_SHEET_SECTIONS,
  MOBILE_TABS,
  PRIMARY_NAV,
  type NavItem,
} from './navItems'

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1 -right-2 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full leading-none ring-2 ring-[var(--bg-primary)]">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function TabLink({
  item,
  unreadCount,
  onNavigate,
}: {
  item: NavItem
  unreadCount?: number
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = isNavItemActive(pathname, item)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
    >
      <span className="relative">
        <Icon className="w-5 h-5" aria-hidden />
        {item.label === 'Chat' && <UnreadBadge count={unreadCount ?? 0} />}
      </span>
      <span className="text-[11px] font-medium leading-none">{item.label}</span>
    </Link>
  )
}

export default function MobileNav({ competitionHref }: { competitionHref?: string | null }) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const chat = useChatUnread()
  const unreadCount = chat?.unreadCount || 0
  const moreActive = isMobileMoreActive(pathname) || sheetOpen

  const tabs = competitionHref
    ? [
        { label: 'Competition', href: competitionHref, icon: Swords, matchPrefix: true },
        ...PRIMARY_NAV.filter((i) => i.href === '/learn' || i.href === '/members'),
      ]
    : MOBILE_TABS
  const sheetSections = competitionHref ? [] : MOBILE_SHEET_SECTIONS

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [sheetOpen])

  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  const closeSheet = useCallback(() => setSheetOpen(false), [])

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        aria-label="Primary"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-primary) 88%, transparent)',
          borderColor: 'var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center">
          {tabs.map((item) => (
            <TabLink key={item.href} item={item} unreadCount={item.label === 'Chat' ? unreadCount : 0} />
          ))}
          {!competitionHref && (
            <button
              type="button"
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
              onClick={() => setSheetOpen((v) => !v)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{ color: moreActive ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              <Ellipsis className="w-5 h-5" aria-hidden />
              <span className="text-[11px] font-medium leading-none">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More sheet */}
      {!competitionHref && (
      <AnimatePresence>
        {sheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeSheet}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More links"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t shadow-2xl max-h-[75vh] overflow-y-auto"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
              }}
            >
              <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b backdrop-blur-xl z-10"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 88%, transparent)', borderColor: 'var(--border-color)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  More
                </span>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Close menu"
                  className="p-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  style={{ color: 'var(--text-secondary)', background: 'var(--hover-bg)' }}
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </div>

              <div className="p-2 pb-4">
                {sheetSections.map((section) => (
                  <div key={section.title} className="mt-1">
                    <p
                      className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {section.title}
                    </p>
                    {section.items.map((item) => (
                      <NavLink key={item.href} item={item} variant="sheet" onNavigate={closeSheet} />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
      )}
    </>
  )
}
