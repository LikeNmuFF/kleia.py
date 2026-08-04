'use client'

interface ChallengeRatingBadgeProps {
  avgDifficulty: number
  avgQuality: number
  reviewCount: number
}

export default function ChallengeRatingBadge({ avgDifficulty, avgQuality, reviewCount }: ChallengeRatingBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
      <span style={{ color: '#eab308' }}>
        {'★'.repeat(Math.round(avgQuality))}{'☆'.repeat(5 - Math.round(avgQuality))}
      </span>
      <span className="font-mono">{avgQuality.toFixed(1)}</span>
      <span className="opacity-50">({reviewCount})</span>
    </div>
  )
}
