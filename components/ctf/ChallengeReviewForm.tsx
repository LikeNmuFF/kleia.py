'use client'

import { useState, useEffect } from 'react'
import { submitReview, getUserReview } from '@/app/actions/reviews'

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition-transform hover:scale-110"
            style={{
              color: star <= (hover || value) ? '#eab308' : 'var(--text-muted)',
            }}
          >
            {star <= (hover || value) ? '★' : '☆'}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChallengeReviewForm({
  challengeId,
  solved,
}: {
  challengeId: string
  solved: boolean
}) {
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [difficultyRating, setDifficultyRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!solved) {
      setLoading(false)
      return
    }
    getUserReview(challengeId).then((review) => {
      setExistingReview(review)
      if (review) {
        setDifficultyRating(review.difficulty_rating)
        setQualityRating(review.quality_rating)
        setReviewText(review.review_text || '')
      }
      setLoading(false)
    })
  }, [challengeId, solved])

  if (!solved || loading) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (difficultyRating < 1 || qualityRating < 1) {
      setMessage({ text: 'Please select ratings for both difficulty and quality', type: 'error' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const result = await submitReview(challengeId, difficultyRating, qualityRating, reviewText || undefined)

    if (result.success) {
      setMessage({ text: existingReview ? 'Review updated!' : 'Review submitted! +5 XP', type: 'success' })
      setExistingReview({
        difficulty_rating: difficultyRating,
        quality_rating: qualityRating,
        review_text: reviewText || null,
      })
      setIsEditing(false)
    } else {
      setMessage({ text: (result as { error: string }).error || 'Failed to submit review', type: 'error' })
    }

    setSubmitting(false)
  }

  if (existingReview && !isEditing) {
    return (
      <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Your Review</h4>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs px-3 py-1 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)' }}
          >
            Edit
          </button>
        </div>
        <div className="flex gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>Difficulty: {'★'.repeat(existingReview.difficulty_rating)}{'☆'.repeat(5 - existingReview.difficulty_rating)}</span>
          <span>Quality: {'★'.repeat(existingReview.quality_rating)}{'☆'.repeat(5 - existingReview.quality_rating)}</span>
        </div>
        {existingReview.review_text && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{existingReview.review_text}</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg p-4 space-y-4" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h4>

      <div className="flex flex-col sm:flex-row gap-4">
        <StarRating value={difficultyRating} onChange={setDifficultyRating} label="Difficulty" />
        <StarRating value={qualityRating} onChange={setQualityRating} label="Quality" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Review (optional)
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this challenge..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent resize-none"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || difficultyRating < 1 || qualityRating < 1}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50"
        >
          {submitting ? '...' : existingReview ? 'Update Review' : 'Submit Review'}
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false)
              setDifficultyRating(existingReview.difficulty_rating)
              setQualityRating(existingReview.quality_rating)
              setReviewText(existingReview.review_text || '')
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)' }}
          >
            Cancel
          </button>
        )}
      </div>

      {message && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {message.text}
        </div>
      )}
    </form>
  )
}
