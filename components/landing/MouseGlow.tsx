'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

export default function MouseGlow() {
  const shouldReduceMotion = useReducedMotion()
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const smoothX = useSpring(x, { stiffness: 90, damping: 26, mass: 0.4 })
  const smoothY = useSpring(y, { stiffness: 90, damping: 26, mass: 0.4 })

  useEffect(() => {
    if (shouldReduceMotion) return

    const handlePointerMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
    }

    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [shouldReduceMotion, x, y])

  if (shouldReduceMotion) return null

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[1] hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none md:block"
      style={{
        x: smoothX,
        y: smoothY,
        background:
          'radial-gradient(circle, rgba(34, 211, 238, 0.18) 0%, rgba(139, 92, 246, 0.12) 35%, rgba(236, 72, 153, 0) 70%)',
        filter: 'blur(8px)',
      }}
    />
  )
}
