'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastVisitDate: string
}

const STORAGE_KEY = 'kleia_streak_data'

const getStreakData = (): StreakData => {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastVisitDate: '' }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { currentStreak: 0, longestStreak: 0, lastVisitDate: '' }
    }
  }
  return { currentStreak: 0, longestStreak: 0, lastVisitDate: '' }
}

const updateStreakData = (data: StreakData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

const checkAndUpdateStreak = (): StreakData => {
  const today = new Date().toISOString().split('T')[0]
  const data = getStreakData()
  const lastVisit = data.lastVisitDate

  if (!lastVisit) {
    data.currentStreak = 1
    data.longestStreak = Math.max(data.longestStreak, 1)
    data.lastVisitDate = today
  } else {
    const lastVisitDate = new Date(lastVisit)
    const todayDate = new Date(today)
    const diffDays = Math.floor(
      (todayDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 1) {
      data.currentStreak += 1
      data.longestStreak = Math.max(data.longestStreak, data.currentStreak)
      data.lastVisitDate = today
    } else if (diffDays > 1) {
      data.currentStreak = 1
      data.lastVisitDate = today
    }
  }

  updateStreakData(data)
  return data
}

const getStreakLevel = (streak: number) => {
  if (streak >= 30) return { level: 'Legendary', color: 'from-violet-500 to-purple-500' }
  if (streak >= 14) return { level: 'Master', color: 'from-indigo-500 to-violet-500' }
  if (streak >= 7) return { level: 'Expert', color: 'from-blue-500 to-indigo-500' }
  if (streak >= 3) return { level: 'Intermediate', color: 'from-green-500 to-blue-500' }
  return { level: 'Beginner', color: 'from-amber-500 to-orange-500' }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function StreakBadge() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastVisitDate: '',
  })
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const data = checkAndUpdateStreak()
    setStreakData(data)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const streakLevel = getStreakLevel(streakData.currentStreak)

  return (
    <div className="relative" ref={tooltipRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 text-white font-medium text-sm"
      >
        <Flame className="w-4 h-4 text-amber-400" />
        <span>{streakData.currentStreak}</span>
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-secondary-900 border border-white/10 rounded-xl shadow-lg z-50 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white">Daily Streak</h4>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${streakLevel.color}`} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-secondary-400 text-sm">Current</span>
                <span className="text-white font-bold">
                  {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${streakLevel.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((streakData.currentStreak / 7) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-secondary-400 text-sm">Longest</span>
                <span className="text-white font-bold">{streakData.longestStreak} days</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-secondary-400 text-sm">Level</span>
                <span className="text-amber-400 font-bold">{streakLevel.level}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-secondary-400 text-sm">Last visit</span>
                <span className="text-secondary-300 text-sm">{formatDate(streakData.lastVisitDate)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
