'use client'

import { motion } from 'framer-motion'
import TypeWriter from './TypeWriter'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="text-center max-w-4xl mx-auto z-10"
      >
        <motion.div variants={item} className="mb-6">
          <span className="text-python-yellow font-mono text-sm tracking-widest uppercase">
            {'>>> import kleia'}
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 font-mono"
        >
          <span className="text-python-blue">kleia</span>
          <span className="text-python-yellow">.py</span>
        </motion.h1>

        <motion.div
          variants={item}
          className="text-xl md:text-2xl text-gray-300 mb-8 font-mono h-10"
        >
          <TypeWriter
            texts={[
              'Learning Python, one bug at a time 🐍',
              'Forensics enthusiast on picoCTF 🔍',
              'Building in public, failing forward 💻',
            ]}
            speed={80}
            deleteSpeed={40}
            pauseTime={2500}
          />
        </motion.div>

        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="https://facebook.com/kleia.py"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-python-blue hover:bg-python-blue/80 text-white rounded-lg font-mono font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-python-blue/25"
          >
            Follow on Facebook
          </a>
          <a
            href="#writeups"
            className="px-8 py-3 border-2 border-python-yellow text-python-yellow hover:bg-python-yellow hover:text-python-dark rounded-lg font-mono font-medium transition-all duration-300 hover:scale-105"
          >
            See my CTF writeups
          </a>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-16 text-gray-500 font-mono text-sm"
        >
          <span className="text-python-yellow">$</span> python3 --version
          <br />
          <span className="text-gray-400">Python 3.12.0 — always learning</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
