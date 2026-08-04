'use client'

interface DifficultyStat {
  difficulty: string
  total: number
  solved: number
  points: number
  totalPoints: number
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

const DIFFICULTY_ICONS: Record<string, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
}

export default function DifficultyBreakdown({ stats }: { stats: DifficultyStat[] }) {
  return (
    <div className="space-y-4">
      {stats.map(diff => {
        const pct = diff.total > 0 ? Math.round((diff.solved / diff.total) * 100) : 0
        const color = DIFFICULTY_COLORS[diff.difficulty] || 'var(--text-muted)'
        return (
          <div key={diff.difficulty}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span>{DIFFICULTY_ICONS[diff.difficulty] || '⚪'}</span>
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                  {diff.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {diff.solved}/{diff.total}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {diff.points}/{diff.totalPoints} pts
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
