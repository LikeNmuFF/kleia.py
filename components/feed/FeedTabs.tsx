import Link from 'next/link'

export default function FeedTabs({ active }: { active: 'all' | 'saved' }) {
  const tabs = [
    { id: 'all' as const, label: 'All Posts', href: '/feed' },
    { id: 'saved' as const, label: 'Saved', href: '/feed/saved' },
  ]

  return (
    <div className="mb-4 flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          style={{
            backgroundColor: active === tab.id ? 'var(--card-bg)' : 'transparent',
            color: active === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
            borderColor: active === tab.id ? 'var(--border-color)' : 'transparent',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
