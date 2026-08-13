import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeasonBySlug, getSeasonChallenges, getSeasonLeaderboard, isSeasonParticipant, getSeasonParticipantCount } from '@/app/actions/seasons'
import { getEffectiveSeasonStatus } from '@/app/actions/competition-status'
import SeasonDetailClient from './SeasonDetailClient'

export default async function SeasonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const season = await getSeasonBySlug(slug)
  if (!season) notFound()

  const status = getEffectiveSeasonStatus(season)

  const [challenges, leaderboard, participantInfo, participantCount] = await Promise.all([
    getSeasonChallenges(season.id),
    getSeasonLeaderboard(season.id),
    user ? isSeasonParticipant(season.id, user.id) : { joined: false, codename: null },
    getSeasonParticipantCount(season.id),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kleia.site'

  return (
    <SeasonDetailClient
      season={season}
      challenges={challenges}
      leaderboard={leaderboard}
      isParticipant={participantInfo.joined}
      userCodename={participantInfo.codename}
      userId={user?.id}
      participantCount={participantCount}
      registrationUrl={`${siteUrl}/ctf/seasons/${season.slug}`}
      status={status}
    />
  )
}
