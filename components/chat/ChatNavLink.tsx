'use client'

import Link from 'next/link'
import { useChatUnread } from './ChatUnreadProvider'

export default function ChatNavLink() {
  const ctx = useChatUnread()
  const count = ctx?.unreadCount || 0

  return (
    <Link
      href="/chat"
      className="relative px-4 py-2 text-sm rounded-lg transition-all"
      style={{ color: 'var(--text-secondary)' }}
    >
      Chat
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export function ChatMobileNavLink() {
  const ctx = useChatUnread()
  const count = ctx?.unreadCount || 0

  return (
    <Link href="/chat" className="relative flex flex-col items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
      <div className="relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center px-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <span className="text-xs">Chat</span>
    </Link>
  )
}
