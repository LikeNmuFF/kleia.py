'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Writeup {
  id: number
  title: string
  platform: string
  category: string
  difficulty: string
  excerpt: string
  date: string
  tags: string[]
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const categories = ['all', 'binary', 'crypto', 'forensics', 'reverse', 'general']

const writeupsData: Writeup[] = [
  {
    id: 1,
    title: 'buffer overflow 1',
    platform: 'picoCTF',
    category: 'binary',
    difficulty: 'easy',
    excerpt: 'Learning to overwrite return addresses and hijack program flow.',
    date: '2026-07-20',
    tags: ['binary', 'picoCTF', 'beginner'],
  },
  {
    id: 2,
    title: 'caesar cipher',
    platform: 'picoCTF',
    category: 'crypto',
    difficulty: 'easy',
    excerpt: 'Breaking classical ciphers with frequency analysis.',
    date: '2026-07-18',
    tags: ['crypto', 'picoCTF', 'beginner'],
  },
  {
    id: 3,
    title: 'strings it',
    platform: 'picoCTF',
    category: 'forensics',
    difficulty: 'easy',
    excerpt: 'Using the strings utility to find hidden flags in binaries.',
    date: '2026-07-15',
    tags: ['forensics', 'picoCTF', 'beginner'],
  },
  {
    id: 4,
    title: 'credstuff',
    platform: 'picoCTF',
    category: 'forensics',
    difficulty: 'easy',
    excerpt: 'Password cracking using leaked credential databases.',
    date: '2026-07-12',
    tags: ['forensics', 'picoCTF', 'beginner'],
  },
  {
    id: 5,
    title: 'vault-door-training',
    platform: 'picoCTF',
    category: 'reverse',
    difficulty: 'easy',
    excerpt: 'Java reverse engineering — extracting flag from source code.',
    date: '2026-07-10',
    tags: ['reverse', 'picoCTF', 'beginner'],
  },
  {
    id: 6,
    title: 'Bandit Level 0-5',
    platform: 'OverTheWire',
    category: 'general',
    difficulty: 'easy',
    excerpt: 'Learning Linux command line through SSH-based wargames.',
    date: '2026-07-08',
    tags: ['linux', 'overthewire', 'beginner'],
  },
]

export default function Writeups() {
  const [filter, setFilter] = useState('all')

  const filtered =
    filter === 'all'
      ? writeupsData
      : writeupsData.filter((w) => w.category === filter)

  return (
    <section id="writeups" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">
            <span className="text-python-yellow">$</span> cat writeups.log
          </h2>
          <p className="text-gray-400 font-mono text-sm">
            {'# my CTF journey, documented'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
                filter === cat
                  ? 'bg-python-blue text-white'
                  : 'bg-python-charcoal text-gray-400 hover:text-python-yellow hover:bg-python-charcoal/80 border border-python-blue/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((writeup) => (
              <motion.article
                key={writeup.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-python-charcoal border border-python-blue/20 rounded-xl p-6 hover:border-python-yellow/40 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-python-blue">
                    {writeup.platform}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded border ${
                      difficultyColors[writeup.difficulty] || difficultyColors.easy
                    }`}
                  >
                    {writeup.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-mono font-semibold text-white mb-2 group-hover:text-python-yellow transition-colors">
                  {writeup.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {writeup.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">
                    {writeup.date}
                  </span>
                  <span className="text-xs text-python-blue font-mono">
                    #{writeup.category}
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
