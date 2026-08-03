'use client'

import { BADGES, type BadgeDef } from '@/lib/utils/gamification'

interface BadgeShowcaseProps {
  earnedBadgeIds: string[]
}

export default function BadgeShowcase({ earnedBadgeIds }: BadgeShowcaseProps) {
  const earnedSet = new Set(earnedBadgeIds)

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        Badges ({earnedBadgeIds.length}/{BADGES.length})
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {BADGES.map((badge) => {
          const earned = earnedSet.has(badge.id)
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${earned ? '' : 'opacity-30 grayscale'}`}
              style={{
                backgroundColor: earned ? 'var(--card-bg)' : 'transparent',
                border: earned ? '1px solid var(--border-color)' : '1px solid transparent',
              }}
              title={`${badge.name}: ${badge.description}`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
