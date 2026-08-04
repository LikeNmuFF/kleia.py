import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeasonBySlug, getSeasonChallenges, getSeasonLeaderboard, isSeasonParticipant } from '@/app/actions/seasons'
import SeasonDetailClient from './SeasonDetailClient'

export default async function SeasonDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const season = await getSeasonBySlug(params.slug)
  if (!season) notFound()

  const [challenges, leaderboard, isParticipant] = await Promise.all([
    getSeasonChallenges(season.id),
    getSeasonLeaderboard(season.id),
    user ? isSeasonParticipant(season.id, user.id) : false,
  ])

  return (
    <SeasonDetailClient
      season={season}
      challenges={challenges}
      leaderboard={leaderboard}
      isParticipant={isParticipant}
      userId={user?.id}
    />
  )
}
