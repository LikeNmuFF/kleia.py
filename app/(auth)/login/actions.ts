'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { buildAuthCallbackUrl } from '@/lib/auth/redirect-url'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Email and password are required'))
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message = error.message === 'Invalid login credentials'
      ? 'Invalid email or password'
      : error.message === 'Email not confirmed'
        ? 'Please confirm your email before signing in'
        : error.message
    redirect('/login?error=' + encodeURIComponent(message))
  }

  redirect('/feed')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildAuthCallbackUrl(),
    },
  })

  if (error) throw error
  redirect(data.url)
}

export async function signInWithGitHub() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: buildAuthCallbackUrl(),
    },
  })

  if (error) throw error
  redirect(data.url)
}
