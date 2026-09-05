import Link from 'next/link'
import { getNotifications } from '@/app/actions/notifications'
import NotificationList from '@/components/notifications/NotificationList'

export default async function NotificationsPage() {
  const notifications = await getNotifications(50)
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)' }}>Activity</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
        </div>
        <Link href="/feed" className="text-sm" style={{ color: 'var(--accent)' }}>Back to feed</Link>
      </div>
      <NotificationList initialNotifications={notifications} />
    </div>
  )
}
