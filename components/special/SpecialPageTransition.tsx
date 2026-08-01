'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function SpecialPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Purple wipe overlay */}
        <motion.div
          className="fixed inset-0 z-[9997] pointer-events-none"
          initial={{ scaleX: 1, originX: 0 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 1, originX: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(90deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08), transparent)',
          }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
