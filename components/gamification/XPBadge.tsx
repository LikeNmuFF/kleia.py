'use client'

import { getLevelInfo } from '@/lib/utils/gamification'

interface XPBadgeProps {
  totalXp: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
}

export default function XPBadge({ totalXp, size = 'md', showProgress = true }: XPBadgeProps) {
  const info = getLevelInfo(totalXp)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  }

  const barWidth = size === 'sm' ? 'w-16' : size === 'md' ? 'w-24' : 'w-32'

  return (
    <div className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <span>{info.icon}</span>
      <span style={{ color: 'var(--text-primary)' }}>Lv.{info.level}</span>
      <span style={{ color: 'var(--text-muted)' }}>{info.name}</span>
      {showProgress && info.nextLevel && (
        <div className={`${barWidth} h-1.5 rounded-full overflow-hidden ml-1`} style={{ backgroundColor: 'var(--border-color)' }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${info.progress * 100}%` }}
          />
        </div>
      )}
      {size !== 'sm' && (
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {totalXp} XP
        </span>
      )}
    </div>
  )
}
