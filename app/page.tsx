'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import TypeWriter from '@/components/TypeWriter'
import StatsBar from '@/components/landing/StatsBar'
import StreaksCarousel from '@/components/landing/StreaksCarousel'
import TerminalDemo from '@/components/landing/TerminalDemo'
import { useLandingData } from '@/components/landing/useLandingData'
import SupportButton from '@/components/SupportButton'

const ThreeBackground = dynamic(() => import('@/components/landing/ThreeBackground'), {
  ssr: false,
  loading: () => null,
})

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    title: 'Posts & Feed',
    description: 'Share updates, resources, and discussions with your community.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Real-time Chat',
    description: 'Message friends directly or in groups with instant delivery.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Events',
    description: 'Schedule meetups, workshops, and track RSVPs.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Members',
    description: 'See who\'s in the community and connect with friends.',
    color: 'from-emerald-500 to-teal-600',
  },
]

export default function Home() {
  const { data, loading } = useLandingData()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <ThreeBackground />

      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl"
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 flex justify-between items-center px-6 lg:px-12 py-5 border-b border-white/5"
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight font-logo">kleia</span>
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Beta
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10"
      >
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16 text-center">
          <motion.div variants={item} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Free for everyone
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            Learn Together,
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
              <TypeWriter
                texts={['Grow Together', 'Code Together', 'Compete Together', 'Stay Consistent']}
                className=""
              />
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A community platform for learning and friendship. Share resources,
            track progress, and stay connected — all in one place.
          </motion.p>

           <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link
               href="/signup"
               className="px-8 py-3.5 bg-white text-black rounded-full font-medium text-base hover:bg-gray-200 transition-all hover:scale-105"
             >
               Join the Community
             </Link>
             <Link
               href="/login"
               className="px-8 py-3.5 border border-white/20 rounded-full font-medium text-base text-gray-300 hover:bg-white/5 transition-all"
             >
               Sign In
             </Link>
           </motion.div>
         </section>

        {/* Live Stats */}
        <StatsBar
          memberCount={data?.memberCount ?? 0}
          postCount={data?.postCount ?? 0}
          challengeCount={data?.challengeCount ?? 0}
          onlineCount={data?.onlineCount ?? 0}
          loading={loading}
        />

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> learn together</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built for learners who want more than just a chat app.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-white/90">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Top Streaks */}
        <StreaksCarousel members={data?.topStreaks ?? []} loading={loading} />

        {/* Terminal CTF Demo */}
        <TerminalDemo />

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-600/10 via-cyan-600/10 to-pink-600/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to start learning together?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Join your friends and build something great. It&apos;s free, and always will be.
              </p>
              <Link
                href="/signup"
                className="inline-flex px-8 py-3.5 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all hover:scale-105"
              >
                Get Started — It&apos;s Free
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-logo">kleia</span>
              <span className="text-sm text-gray-500">© 2026 Learn together.</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="mailto:me@kleia.site" className="hover:text-white transition-colors">Contact</a>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <SupportButton />
            </div>
          </div>
        </footer>
      </motion.main>
    </div>
  )
}
