'use client'

import ChatNavLink from '@/components/chat/ChatNavLink'
import NavLink from './NavLink'
import ChallengesDropdown from './ChallengesDropdown'
import { PRIMARY_NAV } from './navItems'

export default function DesktopNav() {
  return (
    <div className="hidden lg:flex items-center gap-0.5 lg:gap-1 flex-1 justify-center min-w-0">
      {PRIMARY_NAV.map((item) =>
        item.label === 'Chat' ? (
          <ChatNavLink key={item.href} />
        ) : (
          <NavLink key={item.href} item={item} />
        )
      )}
      <ChallengesDropdown />
    </div>
  )
}
