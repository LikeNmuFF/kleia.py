import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeasonBySlug } from '@/app/actions/seasons'
import { getEffectiveSeasonStatus, getSeasonParticipants, getSeasonSpectators } from '@/app/actions/competition'
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

  const [participants, spectators] = await Promise.all([
    getSeasonParticipants(season.id),
    getSeasonSpectators(season.id),
  ])

  return (
    <SeasonAdminClient
      season={season}
      effectiveStatus={getEffectiveSeasonStatus(season)}
      participants={participants}
      spectators={spectators}
    />
  )
}
