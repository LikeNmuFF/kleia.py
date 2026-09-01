'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Code2, UsersRound, CalendarDays, Sparkles } from 'lucide-react'

const highlights = [
  { icon: Code2, title: 'Build Projects', text: 'Team up on practical tech ideas and turn class skills into real output.' },
  { icon: UsersRound, title: 'Find Your People', text: 'Meet classmates who like coding, design, security, systems, and curious experiments.' },
  { icon: CalendarDays, title: 'Join Activities', text: 'Be part of workshops, events, challenges, and student-led sessions.' },
]

const floatingTags = ['All Students', 'Set A-E', 'Projects', 'Workshops', 'Community']

export default function CcoInvite() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden rounded-lg border px-5 py-8 sm:px-8 sm:py-10" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-12 top-8 h-40 w-40 rounded-lg border"
        style={{ borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
        animate={reduceMotion ? undefined : { rotate: [8, 14, 8], y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -left-10 bottom-10 h-24 w-32 rounded-lg border"
        style={{ borderColor: 'rgba(16,185,129,0.35)', backgroundColor: 'rgba(16,185,129,0.08)' }}
        animate={reduceMotion ? undefined : { rotate: [-10, -4, -10], y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <Sparkles className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            CCO is open for all students
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Join the crew that builds, learns, and shows up together.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            CCO is where students meet beyond the classroom. Join the community, find teammates, learn useful tools, and help make campus life more alive.
          </p>
        </motion.div>

        <motion.div
          className="relative min-h-52 rounded-lg border p-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--bg-primary) 62%, transparent)' }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="space-y-3 font-mono text-sm">
            <p style={{ color: 'var(--text-muted)' }}>&gt; cco.join()</p>
            <p style={{ color: 'var(--text-primary)' }}>community: active</p>
            <p style={{ color: 'var(--text-primary)' }}>members: builders + learners</p>
            <p style={{ color: 'var(--accent)' }}>status: accepting sign-ups</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {floatingTags.map((tag, index) => (
              <motion.span
                key={tag}
                className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                animate={reduceMotion ? undefined : { y: [0, index % 2 ? 4 : -4, 0] }}
                transition={{ duration: 2.8 + index * 0.25, repeat: Infinity, ease: 'easeInOut' }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
        {highlights.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.title}
              className="rounded-lg border p-4"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--bg-primary) 54%, transparent)' }}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.08, duration: 0.45, ease: 'easeOut' }}
            >
              <Icon className="mb-3 h-5 w-5" style={{ color: 'var(--accent)' }} />
              <h2 className="mb-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
