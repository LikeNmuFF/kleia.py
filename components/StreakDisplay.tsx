'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Flame } from 'lucide-react'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastVisitDate: string
  visitHistory: string[]
}

const STORAGE_KEY = 'kleia_streak_data'

const getStreakData = (): StreakData => {
  if (typeof window === 'undefined') {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVisitDate: '',
      visitHistory: [],
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastVisitDate: '',
        visitHistory: [],
      }
    }
  }

  return {
    currentStreak: 0,
    longestStreak: 0,
    lastVisitDate: '',
    visitHistory: [],
  }
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
    data.visitHistory = [today]
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
      data.visitHistory.push(today)
    } else if (diffDays > 1) {
      data.currentStreak = 1
      data.lastVisitDate = today
      data.visitHistory.push(today)
    }
  }

  updateStreakData(data)
  return data
}

export const getCurrentStreak = (): number => {
  const data = getStreakData()
  return data.currentStreak
}

export const getLongestStreak = (): number => {
  const data = getStreakData()
  return data.longestStreak
}

export const incrementStreak = () => {
  checkAndUpdateStreak()
}

export default function StreakDisplay() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastVisitDate: '',
    visitHistory: [],
  })

  useEffect(() => {
    const data = checkAndUpdateStreak()
    setStreakData(data)
  }, [])

  const streakPercentage = Math.min((streakData.currentStreak / 7) * 100, 100)

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: 'Legendary', color: 'from-violet-500 to-purple-500' }
    if (streak >= 14) return { level: 'Master', color: 'from-indigo-500 to-violet-500' }
    if (streak >= 7) return { level: 'Expert', color: 'from-blue-500 to-indigo-500' }
    if (streak >= 3) return { level: 'Intermediate', color: 'from-green-500 to-blue-500' }
    return { level: 'Beginner', color: 'from-amber-500 to-orange-500' }
  }

  const streakLevel = getStreakLevel(streakData.currentStreak)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 500 }}
      className="bg-gradient-to-br from-white to-secondary-50 rounded-2xl p-6 shadow-soft-lg border border-secondary-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-900">🔥 Daily Streak</h3>
          <p className="text-secondary-600 mt-1">
            Keep your learning streak alive!
          </p>
        </div>
        <div className="relative">
          <motion.div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${streakLevel.color} flex items-center justify-center shadow-lg`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame className="w-8 h-8 text-white" />
          </motion.div>
          <span className="absolute -top-2 -right-2 bg-secondary-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {streakData.currentStreak}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-secondary-100 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary-700 font-medium">Current Streak</span>
            <span className="text-2xl font-bold text-primary-600">
              {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <motion.div
              className={`bg-gradient-to-r ${streakLevel.color} h-2 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${streakPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-secondary-500 mt-2">
            <span>0</span>
            <span>7</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-accent-600">{streakData.longestStreak}</div>
            <div className="text-sm text-secondary-600 mt-1">Longest Streak</div>
          </div>
          <div className="bg-secondary-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{streakLevel.level}</div>
            <div className="text-sm text-secondary-600 mt-1">Level</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-600" />
            <div>
              <div className="font-medium text-secondary-900">Last Visit</div>
              <div className="text-sm text-secondary-600">
                {streakData.lastVisitDate
                  ? new Date(streakData.lastVisitDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {streakData.currentStreak >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-success-50 to-emerald-50 rounded-xl p-4 border border-success-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-success-600">✨</span>
              <span className="font-medium text-success-800">
                {streakData.currentStreak} day streak! Keep going! 🎉
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
