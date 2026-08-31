'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquareHeart, Star } from 'lucide-react'
import type { LandingFeedback } from './useLandingData'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`}
        />
      ))}
    </div>
  )
}

export default function FeedbackHighlights({
  feedback,
  loading,
}: {
  feedback: LandingFeedback[]
  loading: boolean
}) {
  const averageRating = feedback.length > 0
    ? feedback.reduce((total, item) => total + item.rating, 0) / feedback.length
    : 0

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Built with learner feedback
          </h2>
          <p className="text-gray-500 max-w-xl">
            Public app feedback appears here so new learners can see what the community thinks.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          {feedback.length > 0 && (
            <>
              <Stars rating={Math.round(averageRating)} />
              <p className="text-sm text-gray-500">
                {averageRating.toFixed(1)} average from recent feedback
              </p>
            </>
          )}
          <Link
            href="/feedback"
            className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-gray-200 transition-all hover:bg-white/5 hover:text-white"
          >
            Share feedback
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : feedback.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <p className="text-gray-400">
            No public app feedback yet. Be the first to rate the experience.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {feedback.slice(0, 3).map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
            >
              <Stars rating={item.rating} />
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-500">
                {item.message}
              </p>
              <p className="mt-5 text-xs font-medium text-gray-400">
                {item.display_name || 'Kleia learner'}
              </p>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  )
}
