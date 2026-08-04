'use client'

import { useState, useEffect } from 'react'
import { getChallengeReviews } from '@/app/actions/reviews'

interface Review {
  id: string
  user_id: string
  username: string
  difficulty_rating: number
  quality_rating: number
  review_text: string | null
  created_at: string
}

export default function ChallengeReviews({ challengeId }: { challengeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChallengeReviews(challengeId).then((data) => {
      setReviews(data)
      setLoading(false)
    })
  }, [challengeId])

  if (loading) return null
  if (reviews.length === 0) return null

  const avgDifficulty = reviews.reduce((sum, r) => sum + r.difficulty_rating, 0) / reviews.length
  const avgQuality = reviews.reduce((sum, r) => sum + r.quality_rating, 0) / reviews.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold" style={{ color: '#eab308' }}>
            {avgDifficulty.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Difficulty</div>
          <div className="text-sm" style={{ color: '#eab308' }}>
            {'★'.repeat(Math.round(avgDifficulty))}{'☆'.repeat(5 - Math.round(avgDifficulty))}
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold" style={{ color: '#eab308' }}>
            {avgQuality.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Quality</div>
          <div className="text-sm" style={{ color: '#eab308' }}>
            {'★'.repeat(Math.round(avgQuality))}{'☆'.repeat(5 - Math.round(avgQuality))}
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {reviews.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {reviews.length === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-lg space-y-2"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {review.username}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-4 text-sm" style={{ color: '#eab308' }}>
              <span>Difficulty: {'★'.repeat(review.difficulty_rating)}{'☆'.repeat(5 - review.difficulty_rating)}</span>
              <span>Quality: {'★'.repeat(review.quality_rating)}{'☆'.repeat(5 - review.quality_rating)}</span>
            </div>
            {review.review_text && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{review.review_text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
