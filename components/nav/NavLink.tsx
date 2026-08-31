'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavItemActive, type NavItem } from './navItems'

interface NavLinkProps {
  item: NavItem
  variant?: 'desktop' | 'dropdown' | 'sheet'
  /** Custom badge content, replaces the default "Beta" pill */
  badge?: React.ReactNode
  onNavigate?: () => void
}

const activeStyle = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
}

export default function NavLink({
  item,
  variant = 'desktop',
  badge,
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname()
  const active = isNavItemActive(pathname, item)
  const Icon = item.icon

  const baseClasses =
    'flex items-center rounded-lg transition-all duration-150 font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]'

  if (variant === 'dropdown') {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`${baseClasses} gap-2.5 px-3 py-2 text-sm ${active ? '' : 'hover:bg-[var(--hover-bg)]'}`}
        style={{
          color: active ? 'var(--accent)' : 'var(--text-primary)',
          background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
        }}
      >
        <Icon className="w-4 h-4 shrink-0" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
        <span className="flex-1">{item.label}</span>
        {item.badge === 'beta' && (
          <span
            className="px-1 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Beta
          </span>
        )}
      </Link>
    )
  }

  if (variant === 'sheet') {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`${baseClasses} gap-3 px-4 py-3 text-sm w-full ${active ? '' : 'hover:bg-[var(--hover-bg)]'}`}
        style={{
          color: active ? 'var(--accent)' : 'var(--text-primary)',
          background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
        }}
      >
        <Icon className="w-5 h-5 shrink-0" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge === 'beta' && (
          <span
            className="px-1 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Beta
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} relative whitespace-nowrap px-2.5 py-2 text-sm xl:px-3 ${active ? '' : 'hover:bg-[var(--hover-bg)]'}`}
      style={{
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active
          ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
          : undefined,
      }}
    >
      {item.label}
      {badge}
      {item.badge === 'beta' && !badge && (
        <span
          className="ml-1.5 px-1 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          Beta
        </span>
      )}
    </Link>
  )
}
