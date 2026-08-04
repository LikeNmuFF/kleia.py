import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getActiveSeason, getPastSeasons } from '@/app/actions/seasons'
import SeasonsClient from './SeasonsClient'

export const metadata: Metadata = {
  title: 'CTF Seasons',
  description: 'Join monthly CTF seasons, compete on seasonal leaderboards, and earn exclusive rewards.',
}

export default async function SeasonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [activeSeason, pastSeasons] = await Promise.all([
    getActiveSeason(),
    getPastSeasons(),
  ])

  return (
    <SeasonsClient
      activeSeason={activeSeason}
      pastSeasons={pastSeasons}
      userId={user?.id}
    />
  )
}
