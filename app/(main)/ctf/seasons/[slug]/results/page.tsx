import { notFound, redirect } from 'next/navigation'
import { getSeasonBySlug, getSeasonLeaderboard } from '@/app/actions/seasons'
import { getCompetitionAccess } from '@/app/actions/competition'
import ResultsClient from './ResultsClient'

export default async function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const season = await getSeasonBySlug(slug)
  if (!season) notFound()

  const access = await getCompetitionAccess(season.id)
  if (access.kind === 'none') redirect(`/ctf/seasons/${season.slug}`)

  const leaderboard = await getSeasonLeaderboard(season.id)

  return (
    <ResultsClient
      season={season}
      leaderboard={leaderboard}
      userId={access.kind === 'participant' ? access.userId : undefined}
    />
  )
}
