'use client'

import { useMemo } from 'react'
import SkillNode from '@/components/ctf/SkillNode'

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

interface UserProgress {
  node_id: string
  unlocked: boolean
  unlocked_at: string
}

const CATEGORIES = [
  { key: 'web', icon: '🌐', label: 'Web', color: '#3b82f6' },
  { key: 'crypto', icon: '🔐', label: 'Crypto', color: '#8b5cf6' },
  { key: 'forensics', icon: '🔍', label: 'Forensics', color: '#10b981' },
  { key: 'misc', icon: '📌', label: 'Misc', color: '#f59e0b' },
] as const

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

export default function SkillTreeClient({
  skillTree,
  userProgress,
}: {
  skillTree: SkillNodeData[]
  userProgress: UserProgress[]
}) {
  const unlockedNodeIds = useMemo(() => {
    return new Set(userProgress.map(p => p.node_id))
  }, [userProgress])

  const nodesByCategory = useMemo(() => {
    const grouped: Record<string, SkillNodeData[]> = {
      web: [],
      crypto: [],
      forensics: [],
      misc: [],
    }

    for (const node of skillTree) {
      if (node.category in grouped) {
        grouped[node.category].push(node)
      }
    }

    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => {
        const diffA = DIFFICULTY_ORDER.indexOf(a.difficulty)
        const diffB = DIFFICULTY_ORDER.indexOf(b.difficulty)
        if (diffA !== diffB) return diffA - diffB
        return a.y_pos - b.y_pos
      })
    }

    return grouped
  }, [skillTree])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {CATEGORIES.map(category => {
        const nodes = nodesByCategory[category.key]
        return (
          <div key={category.key} className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <h2 className="text-xl font-bold" style={{ color: category.color }}>
                {category.label}
              </h2>
            </div>

            <div className="relative flex flex-col items-center">
              {nodes.map((node, idx) => (
                <div key={node.id} className="relative">
                  {idx > 0 && (
                    <div
                      className="absolute left-1/2 -top-4 w-0.5 h-4"
                      style={{ backgroundColor: 'var(--border-color)' }}
                    />
                  )}
                  <SkillNode
                    node={node}
                    isUnlocked={unlockedNodeIds.has(node.id)}
                  />
                </div>
              ))}
              {nodes.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No nodes yet
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}