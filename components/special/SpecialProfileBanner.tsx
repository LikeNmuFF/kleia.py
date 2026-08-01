'use client'

import { motion } from 'framer-motion'
import TulipSVG from './TulipSVG'

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
      <TulipSVG variant="petal" size={size} opacity={0.5} />
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
          <TulipSVG variant="full" size={48} />
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
