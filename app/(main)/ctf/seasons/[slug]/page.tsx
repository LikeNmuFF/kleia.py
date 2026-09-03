import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getSeasonBySlug, getSeasonLeaderboard, isSeasonParticipant, getSeasonParticipantCount } from '@/app/actions/seasons'
import { getEffectiveSeasonStatus } from '@/app/actions/competition-status'
import SeasonDetailClient from './SeasonDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const season = await getSeasonBySlug(slug)
  if (!season) return { title: 'Season Not Found' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kleia.site'
  const url = `${siteUrl}/ctf/seasons/${season.slug}`
  const description = season.description || `Join ${season.name} on Kleia — solve CTF challenges and climb the leaderboard.`
  const ogImage = (season as Record<string, unknown>).og_image_url as string || `${siteUrl}/og-image.png`

  return {
    title: `${season.name} | Kleia CTF`,
    description,
    openGraph: {
      title: season.name,
      description,
      url,
      siteName: 'Kleia',
      images: [{ url: ogImage, width: 1200, height: 630, alt: season.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: season.name,
      description,
      images: [ogImage],
    },
  }
}

export default async function SeasonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const season = await getSeasonBySlug(slug)
  if (!season) notFound()

  const status = getEffectiveSeasonStatus(season)

  const [leaderboard, participantInfo, participantCount] = await Promise.all([
    getSeasonLeaderboard(season.id),
    user ? isSeasonParticipant(season.id, user.id) : { joined: false, codename: null },
    getSeasonParticipantCount(season.id),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kleia.site'

  return (
    <SeasonDetailClient
      season={season}
      challenges={[]}
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
