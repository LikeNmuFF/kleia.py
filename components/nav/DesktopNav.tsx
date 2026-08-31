'use client'

import { BookOpen, Swords, Users } from 'lucide-react'
import ChatNavLink from '@/components/chat/ChatNavLink'
import NavLink from './NavLink'
import ChallengesDropdown from './ChallengesDropdown'
import CommunityDropdown from './CommunityDropdown'
import { ADMIN_NAV, DESKTOP_PRIMARY_NAV } from './navItems'

export default function DesktopNav({ competitionHref, isAdmin }: { competitionHref?: string | null; isAdmin?: boolean }) {
  if (competitionHref) {
    return (
      <div className="hidden lg:flex items-center gap-0.5 lg:gap-1 flex-1 justify-center min-w-0">
        <NavLink item={{ label: 'Competition', href: competitionHref, icon: Swords, matchPrefix: true }} />
        <NavLink item={{ label: 'Learn', href: '/learn', icon: BookOpen, matchPrefix: true }} />
        <NavLink item={{ label: 'Members', href: '/members', icon: Users }} />
        {isAdmin && <NavLink item={ADMIN_NAV} />}
      </div>
    )
  }

  return (
    <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 flex-1 justify-center min-w-0">
      {DESKTOP_PRIMARY_NAV.map((item) =>
        item.label === 'Chat' ? (
          <ChatNavLink key={item.href} />
        ) : (
          <NavLink key={item.href} item={item} />
        )
      )}
      <CommunityDropdown />
      <ChallengesDropdown />
      {isAdmin && <NavLink item={ADMIN_NAV} />}
    </div>
  )
}
