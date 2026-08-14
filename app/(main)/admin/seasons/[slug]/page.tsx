import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeasonBySlug } from '@/app/actions/seasons'
import { getSeasonParticipants, getSeasonSpectators } from '@/app/actions/competition'
import { getEffectiveSeasonStatus } from '@/app/actions/competition-status'
import SeasonAdminClient from './SeasonAdminClient'

export default async function SeasonAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/')

  const season = await getSeasonBySlug(slug)
  if (!season) notFound()

  const [participants, spectators, seasonChallenges] = await Promise.all([
    getSeasonParticipants(season.id),
    getSeasonSpectators(season.id),
    supabase
      .from('ctf_season_challenges')
      .select('challenge_id, bonus_points, ctf_challenges:challenge_id (id, title, category, difficulty, points, season_id)')
      .eq('season_id', season.id),
  ])

  const challenges = (seasonChallenges.data || []).map(sc => {
    const ch = Array.isArray(sc.ctf_challenges) ? sc.ctf_challenges[0] : sc.ctf_challenges
    return {
      id: (ch?.id as string) ?? sc.challenge_id,
      title: (ch?.title as string) ?? 'Unknown',
      category: (ch?.category as string) ?? 'misc',
      difficulty: (ch?.difficulty as string) ?? 'easy',
      points: (ch?.points as number) ?? 0,
      bonus_points: sc.bonus_points ?? 0,
      seasonOnly: (ch?.season_id as string | null) === season.id,
    }
  })

  return (
    <SeasonAdminClient
      season={season}
      effectiveStatus={getEffectiveSeasonStatus(season)}
      participants={participants}
      spectators={spectators}
      challenges={challenges}
    />
  )
}
