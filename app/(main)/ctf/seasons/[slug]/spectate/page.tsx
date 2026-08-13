import { notFound, redirect } from 'next/navigation'
import { getSeasonBySlug, getSeasonChallenges, getSeasonLeaderboard } from '@/app/actions/seasons'
import { getCompetitionAccess, getEffectiveSeasonStatus, getRecentSeasonSolves } from '@/app/actions/competition'
import SpectateClient from './SpectateClient'

export default async function SpectatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const season = await getSeasonBySlug(slug)
  if (!season) notFound()

  const access = await getCompetitionAccess(season.id)
  if (access.kind !== 'spectator' && access.kind !== 'admin') {
    redirect(`/ctf/seasons/${season.slug}`)
  }

  const [standings, recentSolves, challenges] = await Promise.all([
    getSeasonLeaderboard(season.id),
    getRecentSeasonSolves(season.id),
    getSeasonChallenges(season.id),
  ])

  return (
    <SpectateClient
      season={season}
      effectiveStatus={getEffectiveSeasonStatus(season)}
      standings={standings}
      recentSolves={recentSolves}
      challengeCount={challenges.length}
    />
  )
}
