'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Users } from 'lucide-react'
import NavLink from './NavLink'
import { COMMUNITY_NAV } from './navItems'
import { isNavItemActive, type NavItem } from './navItems'

export default function CommunityDropdown() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)

  const active = COMMUNITY_NAV.some((item) => isNavItemActive(pathname, item))

  const openMenu = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 150)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] xl:px-3"
        style={{
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
          background: active
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : open
              ? 'var(--hover-bg)'
              : undefined,
        }}
      >
        <Users className="w-4 h-4" aria-hidden />
        Community
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            onMouseEnter={cancelClose}
            onMouseLeave={closeMenu}
            className="absolute left-0 top-full mt-2 w-56 rounded-xl border p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl z-50"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-primary) 92%, transparent)',
              borderColor: 'var(--border-color)',
            }}
          >
            {COMMUNITY_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                variant="dropdown"
                onNavigate={() => setOpen(false)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
