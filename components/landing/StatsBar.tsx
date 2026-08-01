'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface CounterProps {
  value: number
  suffix?: string
}

function Counter({ value, suffix = '' }: CounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let rafId = 0
    const duration = 1200
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [inView, value])

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold">
      <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
        {display.toLocaleString()}
        {suffix}
      </span>
    </div>
  )
}

interface StatsBarProps {
  memberCount: number
  postCount: number
  challengeCount: number
  onlineCount: number
  loading: boolean
}

export default function StatsBar({ memberCount, postCount, challengeCount, onlineCount, loading }: StatsBarProps) {
  if (loading) {
    return (
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  const stats = [
    { label: 'Members', value: memberCount },
    { label: 'Posts', value: postCount },
    { label: 'CTF Challenges', value: challengeCount },
    { label: 'Online now', value: onlineCount },
  ]

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
          >
            <Counter value={stat.value} />
            <div className="mt-2 text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
