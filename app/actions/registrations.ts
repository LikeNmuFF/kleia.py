'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { isAdmin } from '@/lib/admin'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/

export type SeasonRegistration = {
  id: string
  email: string
  username: string
  status: 'pending' | 'created' | 'rejected'
  created_user_id: string | null
  created_at: string
}

function validateRegistration(email: string, username: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim()

  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 320) return { error: 'Enter a valid email address.' }
  if (normalizedUsername.length < 3 || normalizedUsername.length > 30 || !USERNAME_PATTERN.test(normalizedUsername)) {
    return { error: 'Username must be 3-30 characters using letters, numbers, underscores, or hyphens.' }
  }

  return { email: normalizedEmail, username: normalizedUsername }
}

export async function submitSeasonRegistration(seasonId: string, email: string, username: string) {
  const values = validateRegistration(email, username)
  if ('error' in values) return values

  const supabase = await createClient()
  const { data: season, error: seasonError } = await supabase
    .from('ctf_seasons')
    .select('id, status, end_date')
    .eq('id', seasonId)
    .maybeSingle()

  if (seasonError || !season) return { error: 'Season not found.' }
  if (season.status === 'ended' || new Date(season.end_date) < new Date()) return { error: 'Registration for this season is closed.' }

  const { error } = await supabase.from('ctf_season_registrations').insert({
    season_id: seasonId,
    email: values.email,
    username: values.username,
  })

  if (error?.code === '23505') return { error: 'This email is already registered for the season.' }
  if (error) return { error: 'Could not submit registration. Please try again.' }

  return { success: true }
}

export async function getSeasonRegistrations(seasonId: string): Promise<SeasonRegistration[]> {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return []

  const { data } = await supabase
    .from('ctf_season_registrations')
    .select('id, email, username, status, created_user_id, created_at')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: true })

  return (data || []) as SeasonRegistration[]
}

export async function createAccountFromRegistration(registrationId: string) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) return { error: 'Only admins can create participant accounts.' }

  const { data: registration, error: registrationError } = await supabase
    .from('ctf_season_registrations')
    .select('id, season_id, email, username, status')
    .eq('id', registrationId)
    .maybeSingle()

  if (registrationError || !registration) return { error: 'Registration not found.' }
  if (registration.status !== 'pending') return { error: 'This registration has already been processed.' }

  const password = randomBytes(18).toString('base64url')
  const service = getServiceClient() as any
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: registration.email,
    password,
    email_confirm: true,
    user_metadata: { username: registration.username },
  })

  if (createError || !created.user) return { error: 'Could not create the participant account. Check whether the email already has an account.' }

  const { error: participantError } = await service
    .from('ctf_season_participants' as any)
    .upsert({ season_id: registration.season_id, user_id: created.user.id, codename: registration.username }, { onConflict: 'season_id,user_id' })

  if (participantError) {
    await service.auth.admin.deleteUser(created.user.id)
    return { error: 'Account creation could not be added to the season. No account was kept.' }
  }

  const { error: updateError } = await service
    .from('ctf_season_registrations' as any)
    .update({ status: 'created', created_user_id: created.user.id })
    .eq('id', registrationId)

  if (updateError) {
    await service.auth.admin.deleteUser(created.user.id)
    return { error: 'Account creation could not be recorded. No account was kept.' }
  }

  revalidatePath('/admin/seasons')
  return { success: true, email: registration.email, username: registration.username, password }
}
