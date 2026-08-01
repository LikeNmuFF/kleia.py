'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LINES: Array<[string, string, string]> = [
  ['$', 'nc ctf.kleia.site 1337', 'text-violet-400'],
  ['»', 'Connected to Kleia CTF — web / crypto / pwn / forensics / misc', 'text-gray-500'],
  ['»', 'Submit flag:', 'text-gray-500'],
  ['>', 'KLEIA{learn_together_grow_together}', 'text-cyan-300'],
  ['✔', 'Correct! +250 pts — you are now #7 on the leaderboard', 'text-emerald-400'],
]

export default function TerminalDemo() {
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (lineIndex >= LINES.length) {
      const timeout = setTimeout(() => {
        setLineIndex(0)
        setCharIndex(0)
      }, 4000)
      return () => clearTimeout(timeout)
    }

    const [,, lineClass] = LINES[lineIndex]
    const isFlag = lineClass === 'text-cyan-300'
    const timeout = setTimeout(
      () => {
        if (charIndex < LINES[lineIndex][1].length) {
          setCharIndex((c) => c + 1)
        } else {
          setLineIndex((l) => l + 1)
          setCharIndex(0)
        }
      },
      isFlag ? 45 : 22
    )

    return () => clearTimeout(timeout)
  }, [lineIndex, charIndex])

  const visibleLines = LINES.slice(0, lineIndex)
  const currentLine = LINES[lineIndex]

  return (
    <section className="max-w-4xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          CTF, built{' '}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">right in</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Web, crypto, pwn, forensics & misc — with a live leaderboard and your own community submissions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-xs text-gray-500 font-mono">kleia — terminal</span>
        </div>
        <div className="p-5 font-mono text-sm leading-7 min-h-[220px]">
          {visibleLines.map(([prompt, text, cls], i) => (
            <div key={i} className="whitespace-pre-wrap break-all">
              <span className="text-gray-500">{prompt}</span>{' '}
              <span className={cls}>{text}</span>
            </div>
          ))}
          {currentLine && (
            <div className="whitespace-pre-wrap break-all">
              <span className="text-gray-500">{currentLine[0]}</span>{' '}
              <span className={currentLine[2]}>{currentLine[1].slice(0, charIndex)}</span>
              <span className="animate-pulse text-gray-400">▌</span>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  )
}
