import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveSeasonStatus } from '@/app/actions/competition-status'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import AIFairPlayBanner from '@/components/ctf/AIFairPlayBanner'
import CTFClient from './CTFClient'

export const metadata: Metadata = {
  title: 'CTF Challenges',
  description: 'Solve capture-the-flag challenges across web, crypto, forensics, binary exploitation, and misc categories. Compete on the leaderboard.',
}

async function getChallengeData(userId?: string) {
  const supabase = await createClient()

  const [{ data: globalChallenges }, { data: exclusiveChallenges }] = await Promise.all([
    supabase
      .from('ctf_challenges')
      .select('id, title, category, difficulty, points, hint, author, created_at')
      .is('season_id', null)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    supabase
      .from('ctf_challenges')
      .select('id, title, category, difficulty, points, hint, author, created_at, seasons:season_id (status, start_date, end_date)')
      .not('season_id', 'is', null)
      .eq('status', 'approved'),
  ])

  const challenges = [...(globalChallenges || [])]
  for (const c of exclusiveChallenges || []) {
    const season = Array.isArray(c.seasons) ? c.seasons[0] : c.seasons
    if (!season || getEffectiveSeasonStatus(season as { status: string; start_date: string; end_date: string }) === 'ended') {
      const { seasons, ...rest } = c
      challenges.push(rest)
    }
  }

  if (!challenges.length) return { challenges: [], solvedIds: [], solvesById: {}, ratingsById: {} }

  let solvedIds: string[] = []
  if (userId) {
    const { data: submissions } = await supabase
      .from('ctf_submissions')
      .select('challenge_id')
      .eq('user_id', userId)
      .eq('is_correct', true)

    if (submissions) {
      solvedIds = submissions.map(s => s.challenge_id)
    }
  }

  const { data: stats } = await supabase
    .from('ctf_challenge_solves')
    .select('challenge_id, solves')

  const solvesById: Record<string, number> = {}
  for (const s of stats ?? []) {
    solvesById[s.challenge_id] = s.solves
  }

  const challengeIds = challenges.map(c => c.id)
  const { data: reviews } = await supabase
    .from('challenge_reviews')
    .select('challenge_id, difficulty_rating, quality_rating')
    .in('challenge_id', challengeIds)

  const ratingsById: Record<string, { avgDifficulty: number; avgQuality: number; reviewCount: number }> = {}
  const grouped: Record<string, number[]> = {}
  const groupedQ: Record<string, number[]> = {}

  for (const r of reviews || []) {
    if (!grouped[r.challenge_id]) grouped[r.challenge_id] = []
    if (!groupedQ[r.challenge_id]) groupedQ[r.challenge_id] = []
    grouped[r.challenge_id].push(r.difficulty_rating)
    groupedQ[r.challenge_id].push(r.quality_rating)
  }

  for (const id of challengeIds) {
    const diffs = grouped[id] || []
    const quals = groupedQ[id] || []
    if (diffs.length > 0) {
      ratingsById[id] = {
        avgDifficulty: diffs.reduce((a, b) => a + b, 0) / diffs.length,
        avgQuality: quals.reduce((a, b) => a + b, 0) / quals.length,
        reviewCount: diffs.length,
      }
    }
  }

  return { challenges, solvedIds, solvesById, ratingsById }
}

export default async function CTFPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { challenges, solvedIds, solvesById, ratingsById } = await getChallengeData(user?.id)

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <AnnouncementBanner />
        <AIFairPlayBanner />
      </div>
      <CTFClient challenges={challenges} solvedIds={solvedIds} solvesById={solvesById} ratingsById={ratingsById} />
    </>
  )
}
