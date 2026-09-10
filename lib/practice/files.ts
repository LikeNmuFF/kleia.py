import type { SupabaseClient } from '@supabase/supabase-js'
import { getEffectiveSeasonStatus, isChallengePublicAfterSeasons, type SeasonStatus } from '@/app/actions/competition-status'

export type PracticeFile = { id: string; scope_room_id: string; stored_name: string; extension: string; cloudinary_public_id: string }

/** Resolve an attachment only through its private room or recorded public snapshot. */
export async function resolvePracticeFile(client: SupabaseClient, service: SupabaseClient, id: string): Promise<PracticeFile | null> {
  const { data: upload, error } = await service.from('ctf_challenge_uploads')
    .select('id, scope_room_id, stored_name, extension, cloudinary_public_id')
    .eq('id', id).eq('scan_status', 'approved').not('scope_room_id', 'is', null).maybeSingle()
  if (error || !upload?.scope_room_id) return null
  const { data: access, error: accessError } = await client.rpc('practice_can_access', { p_room_id: upload.scope_room_id })
  if (!accessError && access === true) {
    const { data: attached, error: attachedError } = await service.from('practice_challenges').select('id')
      .eq('upload_id', id).eq('room_id', upload.scope_room_id).maybeSingle()
    if (!attachedError && attached) return upload as PracticeFile
  }
  const { data: publications, error: publicationError } = await service.from('practice_publications')
    .select('ctf_challenge_id').eq('upload_id', id)
  if (publicationError) return null
  for (const publication of publications ?? []) {
    if (await isPublicCopy(service, publication.ctf_challenge_id, id)) return upload as PracticeFile
  }
  return null
}

async function isPublicCopy(service: SupabaseClient, challengeId: string, uploadId: string): Promise<boolean> {
  const { data: challenge, error: challengeError } = await service.from('ctf_challenges')
    .select('id, status, is_active, season_id, file_url').eq('id', challengeId).maybeSingle()
  if (challengeError || !challenge || challenge.status !== 'approved' || !challenge.is_active || challenge.file_url !== `/api/practice/files/${uploadId}`) return false
  const statuses: SeasonStatus[] = []
  if (challenge.season_id) {
    const { data: season, error: seasonError } = await service.from('ctf_seasons')
      .select('status, start_date, end_date').eq('id', challenge.season_id).maybeSingle()
    if (seasonError || !season) return false
    statuses.push(getEffectiveSeasonStatus(season))
  }
  const { data: links, error: linksError } = await service.from('ctf_season_challenges')
    .select('seasons:season_id(status, start_date, end_date)').eq('challenge_id', challenge.id)
  if (linksError) return false
  for (const link of links ?? []) {
    const season = Array.isArray(link.seasons) ? link.seasons[0] : link.seasons
    if (!season) return false
    statuses.push(getEffectiveSeasonStatus(season))
  }
  return isChallengePublicAfterSeasons(statuses)
}
