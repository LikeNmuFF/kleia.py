'use client'

import { useState } from 'react'

interface SkillNodeData {
  id: string
  name: string
  description: string | null
  category: string
  difficulty: string
  icon: string
  x_pos: number
  y_pos: number
  parent_id: string | null
  required_solves: number
  created_at: string
}

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string }> = {
  easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  medium: { color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function SkillNode({
  node,
  isUnlocked,
}: {
  node: SkillNodeData
  isUnlocked: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const diff = DIFFICULTY_STYLES[node.difficulty] || DIFFICULTY_STYLES.easy

  return (
    <div
      className="relative rounded-xl p-3 cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: isUnlocked ? 'rgba(34,197,94,0.04)' : 'var(--card-bg)',
        border: isUnlocked
          ? '1px solid rgba(34,197,94,0.45)'
          : '1px solid var(--border-color)',
        opacity: isUnlocked ? 1 : 0.5,
        filter: isUnlocked ? 'none' : 'grayscale(0.5)',
        boxShadow: isUnlocked ? '0 0 12px rgba(34,197,94,0.15)' : 'none',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{node.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {node.name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: diff.color, backgroundColor: diff.bg }}
            >
              {node.difficulty.charAt(0).toUpperCase() + node.difficulty.slice(1)}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {node.required_solves} solves
            </span>
          </div>
        </div>
      </div>

      {expanded && node.description && (
        <div
          className="mt-2 text-xs leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {node.description}
        </div>
      )}
    </div>
  )
}