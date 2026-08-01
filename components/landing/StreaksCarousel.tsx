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

function FloatingPetal({ delay, left }: { delay: number; left: number }) {
  const duration = 4 + Math.random() * 2
  const size = 8 + Math.random() * 5

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${left}%`, top: '-5%' }}
      initial={{ y: -10, opacity: 0, rotate: 0 }}
      animate={{
        y: '115%',
        opacity: [0, 0.5, 0.5, 0],
        rotate: 360 + Math.random() * 180,
        x: [0, (Math.random() - 0.5) * 40],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <svg viewBox="0 0 14 18" width={size} height={size * 1.3} fill="none">
        <path
          d="M7 1.5 C4.5 1.5 2.5 4 3 7.5 C3.5 10 5.5 12 7 15 C8.5 12 10.5 10 11 7.5 C11.5 4 9.5 1.5 7 1.5Z"
          fill="#a855f7"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  )
}

function SpecialMemberCard({ member, rank }: { member: StreakMember; rank: number }) {
  const level = getStreakLevel(member.current_streak)

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', damping: 15 }}
      className="relative p-6 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(88,28,135,0.2), rgba(139,92,246,0.1), rgba(168,85,247,0.15))',
        border: '1px solid rgba(168,85,247,0.25)',
        boxShadow: '0 0 30px rgba(168,85,247,0.1)',
      }}
    >
      {/* Floating petals inside card */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[0, 1, 2].map((i) => (
          <FloatingPetal key={i} delay={i * 1.5} left={15 + i * 30} />
        ))}
      </div>

      {/* Tulip badge */}
      <motion.div
        className="absolute top-3 right-3"
        animate={{ rotate: [0, 8, -8, 0], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 20 26" width="18" height="24" fill="none">
          <path d="M10 8 C7 8 4.5 10.5 5 14 C5.5 16.5 8 18.5 10 21 C12 18.5 14.5 16.5 15 14 C15.5 10.5 13 8 10 8Z" fill="#a855f7" opacity="0.85" />
          <rect x="9.5" y="20" width="1" height="4" rx="0.5" fill="#22c55e" opacity="0.8" />
        </svg>
      </motion.div>

      <div className="relative z-10 flex items-center gap-4">
        <div className="relative">
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'conic-gradient(from 0deg, #a855f7, #c084fc, #9333ea, #d8b4fe, #a855f7)',
              padding: '2px',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-full h-full rounded-full bg-[#0d0d14] flex items-center justify-center overflow-hidden">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {member.username[0].toUpperCase()}
                </span>
              )}
            </div>
          </motion.div>
          {/* Rank badge */}
          <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-purple-400">
            {rank}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate text-white flex items-center gap-1.5">
            @{member.username}
          </p>
          <p className="text-xs text-purple-300/60 mt-0.5">A community gem</p>
          <div className="mt-1.5 flex items-center gap-2">
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
}

function RegularMemberCard({ member, rank }: { member: StreakMember; rank: number }) {
  const level = getStreakLevel(member.current_streak)

  return (
    <motion.div
      key={member.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
    >
      <span className="absolute top-4 right-4 text-2xl opacity-60">
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '🔥'}
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
}

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
              const rank = page * PER_PAGE + i + 1
              if (member.role === 'special') {
                return <SpecialMemberCard key={member.id} member={member} rank={rank} />
              }
              return <RegularMemberCard key={member.id} member={member} rank={rank} />
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
