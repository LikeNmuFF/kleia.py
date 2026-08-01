'use client'

import { motion } from 'framer-motion'

const PETAL_COUNT = 24

interface PetalProps {
  index: number
}

function ConfettiPetal({ index }: PetalProps) {
  const left = Math.random() * 100
  const delay = Math.random() * 0.8
  const duration = 2.5 + Math.random() * 1.5
  const rotate = Math.random() * 360
  const scale = 0.4 + Math.random() * 0.6
  const drift = (Math.random() - 0.5) * 120

  const colors = ['#a855f7', '#c084fc', '#9333ea', '#d8b4fe', '#7c3aed', '#e9d5ff']
  const color = colors[Math.floor(Math.random() * colors.length)]

  return (
    <motion.div
      className="fixed pointer-events-none z-[9998]"
      style={{ left: `${left}%`, top: '-2%' }}
      initial={{ y: -10, opacity: 0, rotate, scale }}
      animate={{
        y: '105vh',
        opacity: [0, 1, 1, 0.8, 0],
        rotate: rotate + 360 + Math.random() * 360,
        x: [0, drift * 0.5, drift, drift * 0.3],
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <svg viewBox="0 0 16 20" width="14" height="18" fill="none">
        <path
          d="M8 2 C4 2 1 6 2 11 C3 14 6 16 8 19 C10 16 13 14 14 11 C15 6 12 2 8 2Z"
          fill={color}
          opacity="0.85"
        />
        <path
          d="M8 2 C5 4 3 8 4 12 C5 14 7 16 8 18"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.4"
          fill="none"
        />
      </svg>
    </motion.div>
  )
}

export default function TulipConfetti({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {Array.from({ length: PETAL_COUNT }).map((_, i) => (
        <ConfettiPetal key={i} index={i} />
      ))}
      {/* Auto-cleanup after animation finishes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 4.5 }}
        onAnimationComplete={() => onComplete?.()}
      />
    </div>
  )
}
