'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { addXp } from './gamification'

export async function submitReview(
  challengeId: string,
  difficultyRating: number,
  qualityRating: number,
  reviewText?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (!Number.isInteger(difficultyRating) || difficultyRating < 1 || difficultyRating > 5) {
    return { error: 'Difficulty rating must be between 1 and 5' }
  }
  if (!Number.isInteger(qualityRating) || qualityRating < 1 || qualityRating > 5) {
    return { error: 'Quality rating must be between 1 and 5' }
  }

  const { data: existing } = await supabase
    .from('challenge_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('challenge_reviews')
      .update({
        difficulty_rating: difficultyRating,
        quality_rating: qualityRating,
        review_text: reviewText?.trim() || null,
      })
      .eq('id', existing.id)

    if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  } else {
    const { error } = await supabase
      .from('challenge_reviews')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        difficulty_rating: difficultyRating,
        quality_rating: qualityRating,
        review_text: reviewText?.trim() || null,
      })

    if (error) return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }

    await addXp(5, 'challenge_review')
  }

  revalidatePath('/ctf')
  revalidatePath(`/ctf/${challengeId}`)
  return { success: true }
}

export async function getChallengeReviews(challengeId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('challenge_reviews')
    .select(`
      id,
      user_id,
      difficulty_rating,
      quality_rating,
      review_text,
      created_at,
      profiles:user_id (username)
    `)
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  return (data || []).map((review) => ({
    ...review,
    username: (review.profiles as any)?.username || 'Anonymous',
  }))
}

export async function getUserReview(challengeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('challenge_reviews')
    .select('id, difficulty_rating, quality_rating, review_text, created_at')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .maybeSingle()

  return data
}
