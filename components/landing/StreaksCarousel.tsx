'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Flame } from 'lucide-react'
import type { StreakMember } from './useLandingData'

const getStreakLevel = (streak: number) => {
  if (streak >= 30) return { label: 'Legendary', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }
  if (streak >= 14) return { label: 'Master', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
  if (streak >= 7) return { label: 'Expert', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  if (streak >= 3) return { label: 'Intermediate', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
  return { label: 'Beginner', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
}

const PER_PAGE = 3

export default function StreaksCarousel({ members, loading }: { members: StreakMember[]; loading: boolean }) {
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()

  const pages = Math.max(Math.ceil(members.length / PER_PAGE), 1)
  const current = members.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  const next = useCallback(() => {
    setPage((p) => (p + 1) % pages)
  }, [pages])

  const prev = () => {
    setPage((p) => (p - 1 + pages) % pages)
  }

  useEffect(() => {
    if (reduceMotion || paused || loading || members.length === 0) return
    const interval = setInterval(next, 4000)
    return () => clearInterval(interval)
  }, [next, paused, reduceMotion, loading, members.length])

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Top streaks in the{' '}
          <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">community</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Keep showing up every day — this is who&apos;s leading the pack right now.
        </p>
      </motion.div>

      {loading || members.length === 0 ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div
            className="grid md:grid-cols-3 gap-5"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {current.map((member, i) => {
              const level = getStreakLevel(member.current_streak)
              return (
                <motion.div
                  key={`${member.id}-${page}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
                >
                  <span className="absolute top-4 right-4 text-2xl opacity-60">
                    {page * PER_PAGE + i + 1 <= 3 ? ['🥇', '🥈', '🥉'][page * PER_PAGE + i] : '🔥'}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {member.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-white">@{member.username}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-xs font-medium">
                          <Flame className="w-3 h-3" />
                          {member.current_streak}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${level.color}`}>
                          {level.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous"
              className="w-9 h-9 rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              ←
            </button>
            <div className="flex gap-2">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-violet-400' : 'bg-white/15 hover:bg-white/30'}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next"
              className="w-9 h-9 rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              →
            </button>
          </div>
        </>
      )}
    </section>
  )
}
