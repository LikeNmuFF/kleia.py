'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from '@/app/actions/notifications'

export default function NotificationBell({ userId, initialCount = 0 }: { userId: string; initialCount?: number }) {
  const [count, setCount] = useState(initialCount)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, (payload: { new: Notification }) => {
        setCount((value) => value + 1)
        setItems((value) => [payload.new as Notification, ...value].slice(0, 20))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) setItems(await getNotifications())
  }

  const openNotification = async (notification: Notification) => {
    if (!notification.read_at) {
      await markNotificationRead(notification.id)
      setCount((value) => Math.max(0, value - 1))
    }
    window.location.assign(notification.href || '/notifications')
  }

  return (
    <div className="relative">
      <button type="button" onClick={toggle} aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-[var(--hover-bg)]" style={{ color: 'var(--text-secondary)' }}>
        <Bell className="w-5 h-5" />
        {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
            <button type="button" className="text-xs" style={{ color: 'var(--accent)' }} onClick={async () => { await markAllNotificationsRead(); setCount(0); setItems((value) => value.map((item) => ({ ...item, read_at: new Date().toISOString() }))) }}>Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? <p className="p-5 text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet.</p> : items.slice(0, 8).map((item) => (
              <button key={item.id} type="button" onClick={() => openNotification(item)} className="w-full text-left px-4 py-3 border-b hover:bg-[var(--hover-bg)]" style={{ borderColor: 'var(--border-color)', backgroundColor: item.read_at ? 'transparent' : 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.message}</p>
              </button>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--accent)' }}>View all notifications</Link>
        </div>
      )}
    </div>
  )
}
