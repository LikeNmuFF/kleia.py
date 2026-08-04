'use client'

import NavLink from '@/components/nav/NavLink'
import { useChatUnread } from './ChatUnreadProvider'
import { PRIMARY_NAV } from '@/components/nav/navItems'

export default function ChatNavLink() {
  const ctx = useChatUnread()
  const count = ctx?.unreadCount || 0

  return (
    <NavLink
      item={PRIMARY_NAV[1]}
      badge={
        count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {count > 99 ? '99+' : count}
          </span>
        ) : undefined
      }
    />
  )
}
