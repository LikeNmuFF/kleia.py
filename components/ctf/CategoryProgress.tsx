'use client'

interface CategoryStat {
  key: string
  icon: string
  label: string
  total: number
  solved: number
  points: number
  totalPoints: number
}

const CATEGORY_COLORS: Record<string, string> = {
  web: '#3b82f6',
  crypto: '#a855f7',
  forensics: '#f97316',
  misc: '#22c55e',
}

export default function CategoryProgress({ stats }: { stats: CategoryStat[] }) {
  return (
    <div className="space-y-4">
      {stats.map(cat => {
        const pct = cat.total > 0 ? Math.round((cat.solved / cat.total) * 100) : 0
        const color = CATEGORY_COLORS[cat.key] || 'var(--accent)'
        return (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {cat.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {cat.solved}/{cat.total}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {cat.points}/{cat.totalPoints} pts
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
