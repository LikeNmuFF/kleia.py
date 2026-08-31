'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSafeErrorMessage } from '@/lib/errorHandler'
import { logEvent } from '@/lib/logEvent'
import type {
  WebinarProviderType,
  WebinarSkillCategory,
  WebinarVerificationMode,
} from '@/lib/webinars/types'

const PROVIDERS = new Set<WebinarProviderType>(['internal', 'dict', 'school', 'partner', 'other'])
const MODES = new Set<WebinarVerificationMode>(['internal_attendance', 'external_certificate', 'resource_only'])
const CATEGORIES = new Set<WebinarSkillCategory>(['learn', 'ctf', 'regexGolf', 'dailyCipher', 'career', 'other'])

type Supabase = Awaited<ReturnType<typeof createClient>>

async function getCurrentUserAndRole(supabase: Supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { user, role: profile?.role ?? null }
}

function isStaffRole(role: string | null) {
  return role === 'admin' || role === 'faculty'
}

async function canManageWebinar(supabase: Supabase, webinarId: string, userId: string, role: string | null) {
  if (role === 'admin') return true
  if (role !== 'faculty') return false

  const { data } = await supabase
    .from('webinars')
    .select('creator_id')
    .eq('id', webinarId)
    .maybeSingle()

  return data?.creator_id === userId
}

function normalizeUrl(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function getWebinars() {
  const supabase = await createClient()
  const { user, role } = await getCurrentUserAndRole(supabase)
  if (!user) return { webinars: [], role: null }

  const { data: webinars, error } = await supabase
    .from('webinars')
    .select('*')
    .order('starts_at', { ascending: true })

  if (error || !webinars) return { webinars: [], role: null }

  const ids = webinars.map((webinar: { id: string }) => webinar.id)
  const [registrationsResult, myRegistrationsResult] = await Promise.all([
    ids.length
      ? supabase.from('webinar_registrations').select('webinar_id').in('webinar_id', ids).neq('status', 'cancelled')
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from('webinar_registrations').select('*').in('webinar_id', ids).eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const counts = new Map<string, number>()
  for (const row of registrationsResult.data || []) {
    counts.set(row.webinar_id, (counts.get(row.webinar_id) || 0) + 1)
  }

  const myRegistrations = new Map((myRegistrationsResult.data || []).map((row: any) => [row.webinar_id, row]))

  return {
    webinars: webinars.map((webinar: any) => ({
      ...webinar,
      registration_count: counts.get(webinar.id) || 0,
      my_registration: myRegistrations.get(webinar.id) || null,
    })),
    role,
  }
}

export async function getWebinarDetails(webinarId: string) {
  const supabase = await createClient()
  const { user, role } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }

  const { data: webinar, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', webinarId)
    .maybeSingle()

  if (error || !webinar) return { error: 'Webinar not found' }

  const canManage = await canManageWebinar(supabase, webinarId, user.id, role)

  const [registrationResult, registrationsResult, attendanceResult] = await Promise.all([
    supabase.from('webinar_registrations').select('*').eq('webinar_id', webinarId).eq('user_id', user.id).maybeSingle(),
    canManage
      ? supabase
          .from('webinar_registrations')
          .select('*, profiles:user_id(username, avatar_url)')
          .eq('webinar_id', webinarId)
          .order('registered_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    canManage
      ? supabase.from('webinar_attendance').select('*').eq('webinar_id', webinarId)
      : Promise.resolve({ data: [] }),
  ])

  return {
    webinar,
    myRegistration: registrationResult.data || null,
    registrations: registrationsResult.data || [],
    attendance: attendanceResult.data || [],
    canManage,
  }
}

export async function createWebinar(data: {
  title: string
  description?: string
  provider_name?: string
  provider_type: WebinarProviderType
  verification_mode: WebinarVerificationMode
  external_url?: string
  thumbnail_url?: string
  capacity?: number | null
  min_attendance_minutes?: number
  starts_at: string
  ends_at?: string
  skill_category: WebinarSkillCategory
}) {
  const start = Date.now()
  const supabase = await createClient()
  const { user, role } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }
  if (!isStaffRole(role)) return { error: 'Faculty or admin access required' }

  const title = data.title.trim()
  const description = data.description?.trim() || ''
  const providerName = data.provider_name?.trim() || providerLabel(data.provider_type)
  if (title.length < 3 || title.length > 160) return { error: 'Title must be 3 to 160 characters' }
  if (description.length < 10 || description.length > 4000) return { error: 'Description must be 10 to 4000 characters' }
  if (providerName.length < 2 || providerName.length > 120) return { error: 'Provider name must be 2 to 120 characters' }
  if (!PROVIDERS.has(data.provider_type)) return { error: 'Invalid provider type' }
  if (!MODES.has(data.verification_mode)) return { error: 'Invalid verification mode' }
  if (!CATEGORIES.has(data.skill_category)) return { error: 'Invalid skill category' }

  const startsAt = new Date(data.starts_at)
  if (Number.isNaN(startsAt.getTime())) return { error: 'Invalid start time' }

  const endsAt = data.ends_at ? new Date(data.ends_at) : null
  if (endsAt && Number.isNaN(endsAt.getTime())) return { error: 'Invalid end time' }
  if (!endsAt) return { error: 'End time is required' }
  if (endsAt && endsAt <= startsAt) return { error: 'End time must be after start time' }

  const externalUrl = normalizeUrl(data.external_url)
  if (data.external_url?.trim() && !externalUrl) return { error: 'Use a valid http or https link' }

  const thumbnailUrl = normalizeUrl(data.thumbnail_url)
  if (data.thumbnail_url?.trim() && !thumbnailUrl) return { error: 'Use a valid http or https thumbnail link' }

  const { data: webinar, error } = await supabase
    .from('webinars')
    .insert({
      creator_id: user.id,
      title,
      description,
      provider_name: providerName,
      provider_type: data.provider_type,
      verification_mode: data.verification_mode,
      external_url: externalUrl,
      thumbnail_url: thumbnailUrl,
      capacity: data.capacity || null,
      min_attendance_minutes: data.min_attendance_minutes ?? 30,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      skill_category: data.skill_category,
    })
    .select('id')
    .single()

  if (error || !webinar) {
    await logEvent({ endpoint: 'webinars.createWebinar', status: 'error', durationMs: Date.now() - start, errorMessage: error?.message || 'Insert failed', userId: user.id })
    return { error: getSafeErrorMessage(error, 'Failed to create webinar') }
  }

  await logEvent({ endpoint: 'webinars.createWebinar', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/webinars')
  return { success: true, webinarId: webinar.id }
}

function providerLabel(providerType: WebinarProviderType) {
  if (providerType === 'dict') return 'DICT'
  if (providerType === 'school') return 'School'
  if (providerType === 'partner') return 'Partner'
  if (providerType === 'other') return 'External provider'
  return 'Kleia'
}

export async function registerForWebinar(webinarId: string) {
  const supabase = await createClient()
  const { user } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase.from('webinar_registrations').upsert({
    webinar_id: webinarId,
    user_id: user.id,
    status: 'registered',
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: getSafeErrorMessage(error, 'Failed to register') }
  revalidatePath('/webinars')
  revalidatePath(`/webinars/${webinarId}`)
  return { success: true }
}

export async function cancelWebinarRegistration(webinarId: string) {
  const supabase = await createClient()
  const { user } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('webinar_registrations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('webinar_id', webinarId)
    .eq('user_id', user.id)

  if (error) return { error: getSafeErrorMessage(error, 'Failed to cancel registration') }
  revalidatePath('/webinars')
  revalidatePath(`/webinars/${webinarId}`)
  return { success: true }
}

export async function recordWebinarAttendance(webinarId: string, userId: string, durationMinutes: number) {
  const supabase = await createClient()
  const { user, role } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }
  if (!(await canManageWebinar(supabase, webinarId, user.id, role))) return { error: 'Faculty or admin access required' }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 0 || durationMinutes > 1440) return { error: 'Invalid attendance minutes' }

  const now = new Date()
  const joinedAt = new Date(now.getTime() - durationMinutes * 60 * 1000)
  const { error } = await supabase.from('webinar_attendance').insert({
    webinar_id: webinarId,
    user_id: userId,
    recorded_by: user.id,
    joined_at: joinedAt.toISOString(),
    left_at: now.toISOString(),
    duration_minutes: durationMinutes,
  })

  if (error) return { error: getSafeErrorMessage(error, 'Failed to record attendance') }
  revalidatePath(`/webinars/${webinarId}`)
  return { success: true }
}

export async function verifyExternalCompletion(webinarId: string, userId: string, externalCompletionUrl?: string) {
  const supabase = await createClient()
  const { user, role } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }
  if (!(await canManageWebinar(supabase, webinarId, user.id, role))) return { error: 'Faculty or admin access required' }

  const externalUrl = normalizeUrl(externalCompletionUrl)
  if (externalCompletionUrl?.trim() && !externalUrl) return { error: 'Use a valid http or https completion link' }

  const { error } = await supabase
    .from('webinar_registrations')
    .update({
      status: 'completed',
      external_completion_url: externalUrl,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('webinar_id', webinarId)
    .eq('user_id', userId)

  if (error) return { error: getSafeErrorMessage(error, 'Failed to verify completion') }
  revalidatePath(`/webinars/${webinarId}`)
  return { success: true }
}

export async function deleteWebinar(webinarId: string) {
  const start = Date.now()
  const supabase = await createClient()
  const { user, role } = await getCurrentUserAndRole(supabase)
  if (!user) return { error: 'Not logged in' }
  if (!(await canManageWebinar(supabase, webinarId, user.id, role))) return { error: 'Faculty or admin access required' }

  const { error } = await supabase.from('webinars').delete().eq('id', webinarId)

  if (error) {
    await logEvent({ endpoint: 'webinars.deleteWebinar', status: 'error', durationMs: Date.now() - start, errorMessage: error.message, userId: user.id })
    return { error: getSafeErrorMessage(error, 'Failed to delete webinar') }
  }

  await logEvent({ endpoint: 'webinars.deleteWebinar', status: 'success', durationMs: Date.now() - start, userId: user.id })
  revalidatePath('/webinars')
  return { success: true }
}
