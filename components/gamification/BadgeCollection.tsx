'use client'

import { BADGES, type BadgeDef } from '@/lib/utils/gamification'

interface BadgeCollectionProps {
  earnedBadgeIds: string[]
}

export default function BadgeCollection({ earnedBadgeIds }: BadgeCollectionProps) {
  const earnedSet = new Set(earnedBadgeIds)
  const earnedBadges = BADGES.filter(b => earnedSet.has(b.id))

  const categories = [...new Set(earnedBadges.map(b => b.category))]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Badge Collection ({earnedBadgeIds.length}/{BADGES.length})
      </h3>
      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {cat}
            </p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.filter(b => b.category === cat).map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {earnedBadges.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          No badges earned yet
        </p>
      )}
    </div>
  )
}
