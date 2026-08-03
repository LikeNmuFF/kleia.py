'use client'

import { useEffect, useState } from 'react'
import { getDailyMissions } from '@/app/actions/gamification'

interface Mission {
  id: string
  mission_type: string
  description: string
  xp_reward: number
  completed: boolean
}

export default function DailyMissions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const data = await getDailyMissions()
      setMissions(data)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--border-color)' }} />
          <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--border-color)' }} />
          <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--border-color)' }} />
        </div>
      </div>
    )
  }

  if (missions.length === 0) return null

  const completedCount = missions.filter((m) => m.completed).length
  const totalXp = missions.reduce((sum, m) => sum + m.xp_reward, 0)
  const earnedXp = missions.filter((m) => m.completed).reduce((sum, m) => sum + m.xp_reward, 0)

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Daily Missions
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
          {earnedXp}/{totalXp} XP
        </span>
      </div>

      <div className="space-y-2">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="flex items-center gap-3 p-2 rounded-lg transition-all"
            style={{
              backgroundColor: mission.completed ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              border: mission.completed ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent',
            }}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${mission.completed ? 'bg-green-500' : ''}`}
              style={!mission.completed ? { border: '2px solid var(--border-color)' } : undefined}
            >
              {mission.completed && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${mission.completed ? 'line-through' : ''}`} style={{ color: mission.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {mission.description}
              </p>
            </div>
            <span className={`text-[10px] font-medium ${mission.completed ? 'text-green-400' : ''}`} style={!mission.completed ? { color: 'var(--text-muted)' } : undefined}>
              +{mission.xp_reward} XP
            </span>
          </div>
        ))}
      </div>

      {completedCount === missions.length && (
        <p className="text-[10px] text-center mt-2 text-green-400 font-medium">
          All missions complete!
        </p>
      )}
    </div>
  )
}
