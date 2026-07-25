'use client'

import { motion } from 'framer-motion'

const pillars = [
  {
    title: 'Python Fundamentals',
    icon: '🐍',
    description:
      'Mastering data structures, algorithms, and Pythonic patterns — one script at a time.',
    tag: 'def learn():',
  },
  {
    title: 'CTF Attempts',
    icon: '🔐',
    description:
      'Crypto, forensics, web exploitation — documenting every challenge and the lessons hidden in each flag.',
    tag: 'def solve():',
  },
  {
    title: 'Learning in Public',
    icon: '📡',
    description:
      'Sharing the journey — bugs, breakthroughs, and everything in between. No filters, just growth.',
    tag: 'def share():',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function ContentPillars() {
  return (
    <section id="pillars" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">
            <span className="text-python-yellow">$</span> ls pillars/
          </h2>
          <p className="text-gray-400 font-mono text-sm">
            {'# what I write about'}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-8"
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.title}
              variants={item}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl" />
              <div className="relative bg-python-charcoal border border-python-blue/20 rounded-2xl p-8 hover:border-python-yellow/50 transition-all duration-300 hover:shadow-lg hover:shadow-python-yellow/5">
                <div className="text-4xl mb-4">{pillar.icon}</div>
                <p className="font-mono text-xs text-python-blue mb-2">
                  {pillar.tag}
                </p>
                <h3 className="text-xl font-bold font-mono mb-3 text-white group-hover:text-python-yellow transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
