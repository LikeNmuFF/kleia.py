'use client'

import { motion } from 'framer-motion'

function TulipSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 55" className={className} fill="none">
      <path d="M20 22 C14 16 6 8 10 2 C14 -1 18 3 20 10 C22 3 26 -1 30 2 C34 8 26 16 20 22Z" fill="#a855f7" opacity="0.85" />
      <path d="M20 22 C15 17 9 10 12 4 C15 1 18 5 20 12" fill="#c084fc" opacity="0.5" />
      <path d="M20 22 C25 17 31 10 28 4 C25 1 22 5 20 12" fill="#9333ea" opacity="0.4" />
      <rect x="18.5" y="22" width="3" height="18" rx="1.5" fill="#16a34a" opacity="0.8" />
      <path d="M20 30 C15 28 10 30 8 34 C10 32 15 31 20 33" fill="#22c55e" opacity="0.6" />
      <path d="M20 36 C25 34 30 36 32 40 C30 38 25 37 20 39" fill="#22c55e" opacity="0.6" />
    </svg>
  )
}

function FloatingPetal({ delay, left }: { delay: number; left: number }) {
  const duration = 6 + Math.random() * 4
  const size = 8 + Math.random() * 6

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${left}%`, top: '-5%' }}
      initial={{ y: -10, opacity: 0, rotate: 0 }}
      animate={{
        y: '120%',
        opacity: [0, 0.5, 0.5, 0],
        rotate: 360 + Math.random() * 200,
        x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 50],
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

export default function SpecialProfileBanner() {
  return (
    <motion.div
      className="relative mb-6 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(88,28,135,0.15), rgba(126,34,206,0.08), rgba(168,85,247,0.12))',
        border: '1px solid rgba(168,85,247,0.15)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <FloatingPetal key={i} delay={i * 1.2} left={8 + i * 18} />
        ))}
      </div>

      <div className="relative z-10 flex items-center gap-4 px-6 py-5">
        <motion.div
          animate={{ y: [0, -4, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <TulipSVG className="w-12 h-16" />
        </motion.div>

        <div>
          <h2 className="text-lg font-bold" style={{ color: '#a855f7' }}>
            You found a rare profile
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This member brings grace and brilliance to our community
          </p>
        </div>

        <motion.div
          className="ml-auto flex gap-1"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
