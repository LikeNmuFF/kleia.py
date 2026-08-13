import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeasonBySlug, getSeasonChallenges } from '@/app/actions/seasons'
import { getCompetitionAccess } from '@/app/actions/competition'
import CompetitionClient from './CompetitionClient'

export default async function CompetePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const season = await getSeasonBySlug(slug)
  if (!season) notFound()

  const access = await getCompetitionAccess(season.id)
  if (access.kind === 'none') redirect(`/ctf/seasons/${season.slug}`)
  if (access.kind === 'spectator') redirect(`/ctf/seasons/${season.slug}/spectate`)
  if (access.kind === 'admin') redirect(`/admin/seasons/${season.slug}`)

  if (access.effectiveStatus === 'ended') redirect(`/ctf/seasons/${season.slug}/results`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [challenges, participant] = await Promise.all([
    getSeasonChallenges(season.id),
    user
      ? supabase
          .from('ctf_season_participants')
          .select('total_points, challenges_solved')
          .eq('season_id', season.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <CompetitionClient
      season={season}
      effectiveStatus={access.effectiveStatus}
      challenges={challenges}
      initialTotalPoints={(participant.data as { total_points?: number } | null)?.total_points ?? 0}
      initialChallengesSolved={(participant.data as { challenges_solved?: number } | null)?.challenges_solved ?? 0}
      userId={user?.id || ''}
      codename={access.kind === 'participant' ? access.codename : null}
    />
  )
}
