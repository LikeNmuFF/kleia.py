'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { buildAuthCallbackUrl, getSafeNextPath } from '@/lib/auth/redirect-url'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextPath = getSafeNextPath(formData.get('next'))

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Email and password are required'))
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message = error.message === 'Invalid login credentials'
      ? 'Invalid email or password'
      : error.message === 'Email not confirmed'
        ? 'Please confirm your email before signing in'
        : getSafeErrorMessage(error, 'Unable to sign in. Please try again.')
    redirect('/login?error=' + encodeURIComponent(message))
  }

  redirect(nextPath)
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const nextPath = getSafeNextPath(formData.get('next'))
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildAuthCallbackUrl(nextPath),
    },
  })

  if (error) throw error
  redirect(data.url)
}

export async function signInWithGitHub(formData: FormData) {
  const supabase = await createClient()
  const nextPath = getSafeNextPath(formData.get('next'))
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: buildAuthCallbackUrl(nextPath),
    },
  })

  if (error) throw error
  redirect(data.url)
}
