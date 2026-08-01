'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COMPLIMENTS = [
  "Welcome back, beautiful soul",
  "The world is brighter with you in it",
  "You make every challenge look easy",
  "Your determination is inspiring",
  "Keep blooming, you're incredible",
  "Grace under pressure — that's you",
  "You light up every room you enter",
  "Your mind is as beautiful as your heart",
  "Challenges fear you",
  "You're proof that brilliance has no limits",
  "The community is better because of you",
  "Your growth is truly remarkable",
  "Never stop shining the way you do",
  "You make learning look effortless",
  "A true force of nature",
]

const PETAL_COUNT = 8

function TulipSVG({ className }: { className?: string }) {
  return <img src="/tulip.svg" alt="" className={className} style={{ objectFit: 'contain' }} />
}

function Petal({ delay }: { delay: number }) {
  const left = Math.random() * 100
  const duration = 4 + Math.random() * 3
  const rotate = Math.random() * 360
  const scale = 0.5 + Math.random() * 0.5

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${left}%`, top: '-5%' }}
      initial={{ y: -20, opacity: 0, rotate, scale }}
      animate={{
        y: '120vh',
        opacity: [0, 0.8, 0.8, 0],
        rotate: rotate + 180 + Math.random() * 180,
        x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60],
      }}
      transition={{
        duration,
        delay,
        ease: 'linear',
      }}
    >
      <img src="/tulip.svg" alt="" width="16" height="16" style={{ objectFit: 'contain' }} />
    </motion.div>
  )
}

export default function TulipLoginGreeting({ isSpecial }: { isSpecial: boolean }) {
  const [show, setShow] = useState(false)
  const [compliment, setCompliment] = useState('')

  useEffect(() => {
    if (!isSpecial) return

    const hasSeenGreeting = sessionStorage.getItem('kleia_tulip_greeting')
    if (hasSeenGreeting) return

    const idx = Math.floor(Math.random() * COMPLIMENTS.length)
    setCompliment(COMPLIMENTS[idx])
    sessionStorage.setItem('kleia_tulip_greeting', '1')

    const timer = setTimeout(() => setShow(true), 800)
    return () => clearTimeout(timer)
  }, [isSpecial])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => setShow(false), 5500)
    return () => clearTimeout(timer)
  }, [show])

  if (!isSpecial) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShow(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Falling petals */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: PETAL_COUNT }).map((_, i) => (
              <Petal key={i} delay={i * 0.3} />
            ))}
          </div>

          {/* Card */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-5 px-10 py-10 rounded-2xl max-w-md mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(88,28,135,0.95), rgba(126,34,206,0.95))',
              boxShadow: '0 0 60px rgba(168,85,247,0.3), 0 0 120px rgba(168,85,247,0.1)',
            }}
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <TulipSVG className="w-16 h-20" />
            </motion.div>

            <div className="text-center">
              <p className="text-xl font-semibold text-white mb-2">
                {compliment}
              </p>
              <p className="text-sm text-purple-200/70">
                A little tulip for you today
              </p>
            </div>

            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-300"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
