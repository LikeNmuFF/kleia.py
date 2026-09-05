'use client'

import { useState } from 'react'
import { markNotificationRead, type Notification } from '@/app/actions/notifications'

export default function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [items, setItems] = useState(initialNotifications)
  const open = async (item: Notification) => {
    if (!item.read_at) {
      await markNotificationRead(item.id)
      setItems((value) => value.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry))
    }
    window.location.assign(item.href || '/notifications')
  }
  if (items.length === 0) return <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}><p style={{ color: 'var(--text-muted)' }}>You are all caught up.</p></div>
  return <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>{items.map((item) => <button key={item.id} type="button" onClick={() => open(item)} className="w-full text-left p-4 border-b last:border-b-0 hover:bg-[var(--hover-bg)]" style={{ borderColor: 'var(--border-color)', backgroundColor: item.read_at ? 'transparent' : 'color-mix(in srgb, var(--accent) 8%, transparent)' }}><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p><p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{item.message}</p><p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleString()}</p></button>)}</div>
}
