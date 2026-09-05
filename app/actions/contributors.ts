'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { getSafeErrorMessage } from '@/lib/errorHandler'
import { notifyUser } from './notifications'

export async function requireContributor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/contributor')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'contributor' && profile?.role !== 'admin') redirect('/feed')
  return { supabase, user, role: profile.role as 'contributor' | 'admin' }
}

export async function getSeasonContributors(seasonId: string) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return []
  const { data } = await supabase
    .from('ctf_season_contributors')
    .select('user_id, created_at, profiles:user_id (username, avatar_url)')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: true })
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return { user_id: row.user_id, username: profile?.username ?? 'Unknown', avatar_url: profile?.avatar_url ?? null }
  })
}

export async function addSeasonContributor(seasonId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .ilike('username', username.trim())
    .maybeSingle()
  if (!profile) return { error: 'User not found' }
  if (profile.role !== 'contributor') return { error: 'Assign the Contributor role to this user first' }

  const { error } = await supabase.from('ctf_season_contributors').insert({ season_id: seasonId, user_id: profile.id, added_by: user.id })
  if (error) {
    if (error.message?.includes('duplicate key')) return { error: 'Already invited to this season' }
    return { error: getSafeErrorMessage(error, 'Could not invite contributor') }
  }

  const { data: season } = await supabase.from('ctf_seasons').select('name, slug').eq('id', seasonId).single()
  if (season) {
    await notifyUser({
      recipientId: profile.id,
      actorId: user.id,
      type: 'contributor_invite',
      title: 'Season contributor invitation',
      message: `You can now create challenges for ${season.name}.`,
      href: `/contributor?season=${season.slug}`,
      metadata: { season_id: seasonId },
      dedupeKey: `contributor:${seasonId}`,
    })
    revalidatePath(`/admin/seasons/${season.slug}`)
  }
  revalidatePath('/contributor')
  return { success: true }
}

export async function removeSeasonContributor(seasonId: string, userId: string) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Unauthorized' }
  const { error } = await supabase.from('ctf_season_contributors').delete().eq('season_id', seasonId).eq('user_id', userId)
  if (error) return { error: getSafeErrorMessage(error, 'Could not remove contributor') }
  revalidatePath('/admin')
  revalidatePath('/contributor')
  return { success: true }
}

export async function getContributorWorkspace() {
  const { supabase, user, role } = await requireContributor()
  type WorkspaceSeason = { id: string; name: string; slug: string; status: string; start_date: string; end_date: string }
  let seasons: WorkspaceSeason[] = []
  if (role === 'admin') {
    const { data } = await supabase.from('ctf_seasons').select('id, name, slug, status, start_date, end_date').order('start_date', { ascending: false })
    seasons = (data ?? []) as WorkspaceSeason[]
  } else {
    const { data } = await supabase.from('ctf_season_contributors').select('season_id, ctf_seasons:season_id (id, name, slug, status, start_date, end_date)').eq('user_id', user.id)
    seasons = (data ?? []).flatMap((row) => {
      const season = row.ctf_seasons
      return season ? (Array.isArray(season) ? season : [season]) : []
    }) as WorkspaceSeason[]
  }
  const { data: challenges } = await supabase
    .from('ctf_challenges')
    .select('id, title, description, category, difficulty, points, hint, file_url, link_url, author, status, is_active, season_id, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
  return { seasons, challenges: challenges ?? [], userId: user.id }
}
