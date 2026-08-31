'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile(data: {
  user_id: string
  username?: string
  full_name?: string
  bio?: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== data.user_id) {
    return { error: 'Unauthorized' }
  }

  if (data.username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .neq('id', data.user_id)
      .single()

    if (existing) {
      return { error: 'Username is already taken' }
    }
  }

  const updateData: Record<string, string> = {}
  if (data.username !== undefined) updateData.username = data.username
  if (data.full_name !== undefined) updateData.full_name = data.full_name
  if (data.bio !== undefined) updateData.bio = data.bio
  if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', data.user_id)

  if (error) {
    return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  }

  return { success: true }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: getSafeErrorMessage(error, 'Something went wrong. Please try again.') }
  }

  return { success: true }
}

export async function checkUsernameAvailability(username: string, currentUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { available: false }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', currentUserId)
    .single()

  return { available: !data }
}
