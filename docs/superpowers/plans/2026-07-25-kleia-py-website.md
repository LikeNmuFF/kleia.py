# kleia.py Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deploy-ready Next.js 14 personal Python/CTF learning brand site with dark theme, terminal aesthetics, and Framer Motion animations.

**Architecture:** Next.js 14 App Router with TypeScript. Tailwind CSS for utility-first styling. Framer Motion for scroll-triggered reveals, typewriter effects, and micro-interactions. Local JSON for CTF writeup content. Single-page layout with section navigation.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Vercel-ready

---

## File Structure

```
kleia.py/
├── app/
│   ├── layout.tsx          # Root layout with fonts, metadata, dark theme
│   ├── page.tsx            # Main page composing all sections
│   ├── globals.css         # Tailwind directives + custom CSS
│   └── favicon.ico         # Snake/code favicon
├── components/
│   ├── Hero.tsx            # Animated terminal headline + CTA
│   ├── About.tsx           # Bio + skill badges
│   ├── ContentPillars.tsx  # 3 animated cards
│   ├── Writeups.tsx        # CTF writeup card grid with filtering
│   ├── Footer.tsx          # Social links + minimal contact
│   ├── MatrixRain.tsx      # Subtle background code particle effect
│   └── TypeWriter.tsx      # Reusable typewriter text component
├── data/
│   └── writeups.json       # CTF writeup content
├── lib/
│   └── utils.ts            # Helper utilities
├── public/
│   └── favicon.svg         # SVG favicon (snake motif)
├── tailwind.config.ts      # Tailwind config with custom colors
├── tsconfig.json           # TypeScript config
├── next.config.js          # Next.js config
├── postcss.config.js       # PostCSS for Tailwind
├── package.json            # Dependencies
└── .gitignore
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `.gitignore`
- Create: `app/globals.css`
- Create: `app/layout.tsx`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "kleia-py",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.37",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

- [ ] **Step 4: Create postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        python: {
          blue: '#306998',
          yellow: '#FFD43B',
          dark: '#1a1a2e',
          charcoal: '#16213e',
          navy: '#0f3460',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
out/
.env
.env.local
.env.production.local
.env.development.local
.env.test.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

- [ ] **Step 7: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

body {
  background-color: #1a1a2e;
  color: #e2e8f0;
}

::selection {
  background-color: #306998;
  color: #FFD43B;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #16213e;
}

::-webkit-scrollbar-thumb {
  background: #306998;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #FFD43B;
}
```

- [ ] **Step 8: Create app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'kleia.py | Learning Python, one bug at a time',
  description: 'Personal Python and CTF learning journey by a CS student',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Install dependencies and verify dev server**

Run: `npm install`
Run: `npm run dev`
Expected: Dev server starts on http://localhost:3000

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js 14 project with Tailwind and Framer Motion"
```

---

### Task 2: TypeWriter Component

**Files:**
- Create: `components/TypeWriter.tsx`

- [ ] **Step 1: Create TypeWriter component**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface TypeWriterProps {
  texts: string[]
  speed?: number
  deleteSpeed?: number
  pauseTime?: number
  className?: string
}

export default function TypeWriter({
  texts,
  speed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
  className = '',
}: TypeWriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[textIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentText.substring(0, charIndex + 1))
        setCharIndex(charIndex + 1)

        if (charIndex === currentText.length) {
          setTimeout(() => setIsDeleting(true), pauseTime)
        }
      } else {
        setDisplayText(currentText.substring(0, charIndex - 1))
        setCharIndex(charIndex - 1)

        if (charIndex === 0) {
          setIsDeleting(false)
          setTextIndex((textIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex, texts, speed, deleteSpeed, pauseTime])

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/TypeWriter.tsx
git commit -m "feat: add TypeWriter component"
```

---

### Task 3: MatrixRain Background Component

**Files:**
- Create: `components/MatrixRain.tsx`

- [ ] **Step 1: Create MatrixRain component**

```tsx
'use client'

import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = 'python01{}[]<>/\\;:=+-*&^%$#@!~`|?.,kleia'
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = Array(Math.floor(columns)).fill(1)

    function draw() {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#30699820'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20"
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/MatrixRain.tsx
git commit -m "feat: add MatrixRain canvas background effect"
```

---

### Task 4: Hero Section

**Files:**
- Create: `components/Hero.tsx`

- [ ] **Step 1: Create Hero component**

```tsx
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
              'Debugging my way through CTFs 🔐',
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
```

- [ ] **Step 2: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: add Hero section with typewriter animation"
```

---

### Task 5: About Section

**Files:**
- Create: `components/About.tsx`

- [ ] **Step 1: Create About component**

```tsx
'use client'

import { motion } from 'framer-motion'

const skills = [
  { name: 'Python', level: 70 },
  { name: 'Bash', level: 45 },
  { name: 'CTF Basics', level: 40 },
  { name: 'Linux', level: 55 },
  { name: 'Git', level: 50 },
  { name: 'HTML/CSS', level: 35 },
]

export default function About() {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">
            <span className="text-python-yellow">$</span> cat about.md
          </h2>
          <div className="w-24 h-1 bg-python-blue mb-8" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-gray-300 leading-relaxed mb-4 font-mono text-sm">
              <span className="text-python-yellow">{'>'}</span> CS student
              passionate about cybersecurity and automation.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4 font-mono text-sm">
              <span className="text-python-yellow">{'>'}</span> Currently
              pursuing BaSC in Computer Science while diving deep into Python
              and CTF challenges.
            </p>
            <p className="text-gray-300 leading-relaxed font-mono text-sm">
              <span className="text-python-yellow">{'>'}</span> Building in
              public — documenting every bug, every fix, every &quot;aha!&quot;
              moment along the way.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-mono font-semibold mb-6 text-python-blue">
              {'// skills.map()'}
            </h3>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ x: 5 }}
                  className="group"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-sm text-gray-300 group-hover:text-python-yellow transition-colors">
                      {skill.name}
                    </span>
                    <span className="font-mono text-xs text-python-blue">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="h-2 bg-python-dark rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + 0.1 * index }}
                      className="h-full bg-gradient-to-r from-python-blue to-python-yellow rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/About.tsx
git commit -m "feat: add About section with animated skill bars"
```

---

### Task 6: Content Pillars Section

**Files:**
- Create: `components/ContentPillars.tsx`

- [ ] **Step 1: Create ContentPillars component**

```tsx
'use client'

import { motion } from 'framer-motion'

const pillars = [
  {
    title: 'Python Fundamentals',
    icon: '🐍',
    description:
      'Mastering data structures, algorithms, and Pythonic patterns — one script at a time.',
    color: 'from-python-blue to-blue-600',
    tag: 'def learn():',
  },
  {
    title: 'CTF Attempts',
    icon: '🔐',
    description:
      'Crypto, forensics, web exploitation — documenting every challenge and the lessons hidden in each flag.',
    color: 'from-python-yellow to-amber-600',
    tag: 'def solve():',
  },
  {
    title: 'Learning in Public',
    icon: '📡',
    description:
      'Sharing the journey — bugs, breakthroughs, and everything in between. No filters, just growth.',
    color: 'from-green-500 to-emerald-600',
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
```

- [ ] **Step 2: Commit**

```bash
git add components/ContentPillars.tsx
git commit -m "feat: add Content Pillars section with stagger animation"
```

---

### Task 7: Writeups Data + Component

**Files:**
- Create: `data/writeups.json`
- Create: `components/Writeups.tsx`

- [ ] **Step 1: Create writeups.json**

```json
[
  {
    "id": 1,
    "title": "buffer overflow 1",
    "platform": "picoCTF",
    "category": "binary",
    "difficulty": "easy",
    "excerpt": "Learning to overwrite return addresses and hijack program flow.",
    "date": "2026-07-20",
    "tags": ["binary", "picoCTF", "beginner"]
  },
  {
    "id": 2,
    "title": "caesar cipher",
    "platform": "picoCTF",
    "category": "crypto",
    "difficulty": "easy",
    "excerpt": "Breaking classical ciphers with frequency analysis.",
    "date": "2026-07-18",
    "tags": ["crypto", "picoCTF", "beginner"]
  },
  {
    "id": 3,
    "title": "strings it",
    "platform": "picoCTF",
    "category": "forensics",
    "difficulty": "easy",
    "excerpt": "Using the strings utility to find hidden flags in binaries.",
    "date": "2026-07-15",
    "tags": ["forensics", "picoCTF", "beginner"]
  },
  {
    "id": 4,
    "title": "credstuff",
    "platform": "picoCTF",
    "category": "forensics",
    "difficulty": "easy",
    "excerpt": "Password cracking using leaked credential databases.",
    "date": "2026-07-12",
    "tags": ["forensics", "picoCTF", "beginner"]
  },
  {
    "id": 5,
    "title": "vault-door-training",
    "platform": "picoCTF",
    "category": "reverse",
    "difficulty": "easy",
    "excerpt": "Java reverse engineering — extracting flag from source code.",
    "date": "2026-07-10",
    "tags": ["reverse", "picoCTF", "beginner"]
  },
  {
    "id": 6,
    "title": "Bandit Level 0-5",
    "platform": "OverTheWire",
    "category": "general",
    "difficulty": "easy",
    "excerpt": "Learning Linux command line through SSH-based wargames.",
    "date": "2026-07-08",
    "tags": ["linux", "overthewire", "beginner"]
  }
]
```

- [ ] **Step 2: Create Writeups component**

```tsx
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

export default function Writeups() {
  const [filter, setFilter] = useState('all')
  const [writeups] = useState<Writeup[]>([
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
  ])

  const filtered =
    filter === 'all'
      ? writeups
      : writeups.filter((w) => w.category === filter)

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
```

- [ ] **Step 3: Commit**

```bash
git add data/writeups.json components/Writeups.tsx
git commit -m "feat: add Writeups section with filter animation"
```

---

### Task 8: Footer Component

**Files:**
- Create: `components/Footer.tsx`

- [ ] **Step 1: Create Footer component**

```tsx
'use client'

import { motion } from 'framer-motion'

const socialLinks = [
  {
    name: 'Facebook',
    url: 'https://facebook.com/kleia.py',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    url: 'https://github.com/kleia-py',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-python-blue/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="font-mono text-2xl font-bold mb-4">
            <span className="text-python-blue">kleia</span>
            <span className="text-python-yellow">.py</span>
          </div>
          <p className="text-gray-500 font-mono text-sm mb-8">
            {'# keepshipping # buildinpublic'}
          </p>

          <div className="flex justify-center gap-6 mb-8">
            {socialLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-python-yellow transition-colors duration-300 p-3 rounded-lg bg-python-charcoal/50 hover:bg-python-charcoal border border-python-blue/20 hover:border-python-yellow/40"
                aria-label={link.name}
              >
                {link.icon}
              </motion.a>
            ))}
          </div>

          <p className="text-gray-600 font-mono text-xs">
            © 2026 kleia.py — Built with Next.js + Tailwind + Framer Motion
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat: add Footer with social links and hover animations"
```

---

### Task 9: Compose Page + Navigation

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Create main page**

```tsx
import Hero from '@/components/Hero'
import About from '@/components/About'
import ContentPillars from '@/components/ContentPillars'
import Writeups from '@/components/Writeups'
import Footer from '@/components/Footer'
import MatrixRain from '@/components/MatrixRain'

export default function Home() {
  return (
    <main className="relative">
      <MatrixRain />
      <div className="relative z-10">
        <Hero />
        <About />
        <ContentPillars />
        <Writeups />
        <Footer />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run dev server and verify all sections render**

Run: `npm run dev`
Open: http://localhost:3000
Verify: Hero, About, ContentPillars, Writeups, Footer all visible

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: compose all sections into main page"
```

---

### Task 10: Build Verification + Vercel Readiness

**Files:**
- Modify: `next.config.js` (if needed)

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Test production build locally**

Run: `npm run start`
Open: http://localhost:3000
Verify: All sections render, animations work, responsive on mobile

- [ ] **Step 3: Create favicon.svg**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="15" fill="#1a1a2e"/>
  <text x="50" y="65" font-family="monospace" font-size="32" font-weight="bold" fill="#306998" text-anchor="middle">kleia</text>
  <text x="50" y="85" font-family="monospace" font-size="20" fill="#FFD43B" text-anchor="middle">.py</text>
</svg>
```

- [ ] **Step 4: Update layout metadata for favicon**

In `app/layout.tsx`, add the favicon reference:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'kleia.py | Learning Python, one bug at a time',
  description: 'Personal Python and CTF learning journey by a CS student',
  icons: {
    icon: '/favicon.svg',
  },
}
```

- [ ] **Step 5: Final build + lint**

Run: `npm run lint && npm run build`
Expected: Clean build, zero errors

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add favicon and final Vercel-ready build"
```

---

### Task 11: Git Push + Vercel Deploy Prep

- [ ] **Step 1: Verify git status**

Run: `git status`
Run: `git log --oneline -5`
Expected: All commits present, working tree clean

- [ ] **Step 2: Push to GitHub**

Run: `git push origin main`
Expected: Code pushed to remote

- [ ] **Step 3: Deploy on Vercel**

1. Go to vercel.com → Import Git Repository
2. Select the kleia.py repo
3. Framework: Next.js (auto-detected)
4. Click Deploy
5. Wait for build to complete
6. Visit the deployed URL

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] Landing/Hero with typewriter effect
- [x] Matrix background effect
- [x] CTA buttons (Facebook + Writeups)
- [x] About section with bio + skill badges
- [x] Content pillars (3 animated cards)
- [x] CTF writeups grid with filtering
- [x] Footer with social links
- [x] Dark theme (navy/charcoal + Python blue/yellow)
- [x] Framer Motion animations (scroll reveals, hover, stagger)
- [x] Responsive design
- [x] Deploy-ready for Vercel

**2. Placeholder scan:** No TBD/TODO placeholders found.

**3. Type consistency:** All component props and data structures are consistent across tasks.
