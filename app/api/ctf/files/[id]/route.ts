import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveSeasonStatus, isChallengePublicAfterSeasons, type SeasonStatus } from '@/app/actions/competition-status'
import { getChallengeFileDownloadUrl } from '@/lib/ctf/uploads/cloudinary'
import { getServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

function error(status: number) {
  return NextResponse.json({ error: 'File not found' }, { status })
}

type UploadWithChallenge = {
  id: string
  stored_name: string
  extension: string
  cloudinary_public_id: string
  challenge_id: string | null
  ctf_challenges: {
    id: string
    status: string
    is_active: boolean
    season_id: string | null
  } | Array<{
    id: string
    status: string
    is_active: boolean
    season_id: string | null
  }> | null
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = getServiceClient()
  const { data: upload } = await service
    .from('ctf_challenge_uploads')
    .select('id, stored_name, extension, cloudinary_public_id, challenge_id, ctf_challenges:challenge_id (id, status, is_active, season_id)')
    .eq('id', id)
    .eq('scan_status', 'approved')
    .not('challenge_id', 'is', null)
    .maybeSingle<UploadWithChallenge>()

  if (!upload) return error(404)

  const challenge = Array.isArray(upload.ctf_challenges) ? upload.ctf_challenges[0] : upload.ctf_challenges
  if (!challenge || challenge.status !== 'approved' || !challenge.is_active) return error(404)

  const statuses: SeasonStatus[] = []
  if (challenge.season_id) {
    const { data: season } = await service
      .from('ctf_seasons')
      .select('status, start_date, end_date')
      .eq('id', challenge.season_id)
      .maybeSingle()
    if (season) statuses.push(getEffectiveSeasonStatus(season))
  }

  const { data: seasonLinks } = await service
    .from('ctf_season_challenges')
    .select('seasons:season_id (status, start_date, end_date)')
    .eq('challenge_id', challenge.id)
  for (const link of seasonLinks || []) {
    const season = Array.isArray(link.seasons) ? link.seasons[0] : link.seasons
    if (season) statuses.push(getEffectiveSeasonStatus(season))
  }
  if (!isChallengePublicAfterSeasons(statuses)) return error(404)

  const downloadUrl = await getChallengeFileDownloadUrl(upload.cloudinary_public_id, upload.extension)
  const upstream = await fetch(downloadUrl, { redirect: 'follow' })
  if (!upstream.ok) return error(502)

  const body = await upstream.arrayBuffer()
  return new NextResponse(body, {
    headers: {
      'Content-Disposition': `attachment; filename="${upload.stored_name.replace(/"/g, '')}"`,
      'Content-Type': 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
}
