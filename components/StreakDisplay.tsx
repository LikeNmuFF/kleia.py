'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Flame } from 'lucide-react'
import { checkAndUpdateStreak, type StreakResult } from '@/app/actions/streak'
import { createClient } from '@/lib/supabase/client'

const getStreakLevel = (streak: number) => {
  if (streak >= 30) return { level: 'Legendary', color: 'from-violet-500 to-purple-500' }
  if (streak >= 14) return { level: 'Master', color: 'from-indigo-500 to-violet-500' }
  if (streak >= 7) return { level: 'Expert', color: 'from-blue-500 to-indigo-500' }
  if (streak >= 3) return { level: 'Intermediate', color: 'from-green-500 to-blue-500' }
  return { level: 'Beginner', color: 'from-amber-500 to-orange-500' }
}

export { getStreakLevel }

export default function StreakDisplay() {
  const [streakData, setStreakData] = useState<StreakResult>({
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setIsLoggedIn(true)

      // Try to get cached streak first for instant UI
      const cached = localStorage.getItem('kleia_streak')
      if (cached) {
        try {
          setStreakData(JSON.parse(cached))
        } catch {}
      }

      // Sync with database
      const result = await checkAndUpdateStreak()
      if (result) {
        setStreakData(result)
        localStorage.setItem('kleia_streak', JSON.stringify(result))
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) return null
  if (!isLoggedIn) return null

  const streakPercentage = Math.min((streakData.current_streak / 7) * 100, 100)
  const streakLevel = getStreakLevel(streakData.current_streak)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 500 }}
      className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Daily Streak</h3>
          <p className="text-gray-400 mt-1">
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
          <span className="absolute -top-2 -right-2 bg-white/10 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {streakData.current_streak}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 font-medium">Current Streak</span>
            <span className="text-2xl font-bold text-white">
              {streakData.current_streak} day{streakData.current_streak !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className={`bg-gradient-to-r ${streakLevel.color} h-2 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${streakPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0</span>
            <span>7</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{streakData.longest_streak}</div>
            <div className="text-sm text-gray-400 mt-1">Longest Streak</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{streakLevel.level}</div>
            <div className="text-sm text-gray-400 mt-1">Level</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-xl p-4 border border-violet-500/20">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-violet-400" />
            <div>
              <div className="font-medium text-white">Last Visit</div>
              <div className="text-sm text-gray-400">
                {streakData.last_active_date
                  ? new Date(streakData.last_active_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {streakData.current_streak >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="font-medium text-emerald-300">
                {streakData.current_streak} day streak! Keep going!
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
