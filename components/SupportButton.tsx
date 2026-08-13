'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Coffee, Copy, Check, X } from 'lucide-react'

const GCASH_NUMBER = '0926 739 0274'

export default function SupportButton({
  variant = 'footer',
}: {
  variant?: 'footer' | 'nav'
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(GCASH_NUMBER.replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === 'nav'
            ? 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] border'
            : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]'
        }
        style={
          variant === 'nav'
            ? {
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--hover-bg)',
              }
            : {
                background: 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(217,119,6,0.15))',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }
        }
      >
        <Coffee className="w-4 h-4" style={{ color: '#f59e0b' }} />
        {variant === 'nav' ? 'Support' : 'Buy me a coffee'}
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[9999] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Support Kleia"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute top-3 right-3 p-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--hover-bg)' }}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-5">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}
                  >
                    <Coffee className="w-7 h-7" style={{ color: '#f59e0b' }} />
                  </motion.div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Buy me a coffee ☕
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Building Kleia takes time and love. Every coffee keeps it going — thank you!
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <p className="text-[11px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    GCash
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      {GCASH_NUMBER}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Send any amount via GCash. It goes straight to the creator. 💜
                  </p>
                </div>
              </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
