'use client'

import {
  House,
  MessageSquare,
  CalendarDays,
  Users,
  BookOpen,
  Trophy,
  Flag,
  Braces,
  KeyRound,
  GitBranch,
  Swords,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: 'beta'
  /** Treat sub-routes of href as active too */
  matchPrefix?: boolean
  /** Explicit paths (and their children) that count as active */
  matchers?: string[]
}

export const PRIMARY_NAV: NavItem[] = [
  { label: 'Feed', href: '/feed', icon: House },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Events', href: '/events', icon: CalendarDays },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Learn', href: '/learn', icon: BookOpen, matchPrefix: true },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, matchPrefix: true },
]

export const CHALLENGE_NAV: NavItem[] = [
  {
    label: 'CTF',
    href: '/ctf',
    icon: Flag,
    badge: 'beta',
    matchPrefix: true,
  },
  { label: 'Regex Golf', href: '/regex-golf', icon: Braces, matchPrefix: true },
  { label: 'Cipher', href: '/cipher', icon: KeyRound, matchPrefix: true },
  {
    label: 'Skill Tree',
    href: '/ctf/skilltree',
    icon: GitBranch,
    matchers: ['/ctf/skilltree'],
  },
]

/** Tabs pinned to the mobile bottom bar */
export const MOBILE_TABS: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  PRIMARY_NAV[2],
  PRIMARY_NAV[4],
]

/** Everything reachable from the mobile "More" sheet, grouped */
export const MOBILE_SHEET_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Community',
    items: [PRIMARY_NAV[3], PRIMARY_NAV[5]],
  },
  {
    title: 'Challenges',
    items: CHALLENGE_NAV,
  },
]

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.matchers) {
    return item.matchers.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}

export const CHALLENGE_ROUTES = CHALLENGE_NAV.flatMap((item) =>
  item.matchers ? item.matchers : [item.href]
)

export function isChallengeRouteActive(pathname: string): boolean {
  return CHALLENGE_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** True when the current page lives inside the mobile "More" sheet */
export function isMobileMoreActive(pathname: string): boolean {
  return isChallengeRouteActive(pathname) || ['/members', '/leaderboard'].some((p) =>
    pathname === p || pathname.startsWith(`${p}/`)
  )
}

export const CHALLENGE_LABEL = 'Challenges'
export const CHALLENGE_ICON: LucideIcon = Swords
