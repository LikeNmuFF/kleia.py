'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getAuthErrorMessage } from '@/lib/auth/errors'
import { buildAuthCallbackUrl } from '@/lib/auth/redirect-url'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !email.includes('@')) {
    redirect('/signup?error=' + encodeURIComponent('Please enter a valid email'))
  }

  if (!password || password.length < 8) {
    redirect('/signup?error=' + encodeURIComponent('Password must be at least 8 characters'))
  }

  if (!username || username.length < 3) {
    redirect('/signup?error=' + encodeURIComponent('Username must be at least 3 characters'))
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    redirect('/signup?error=' + encodeURIComponent('Username can only contain letters, numbers, hyphens, and underscores'))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(),
      data: { username },
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(getAuthErrorMessage(error)))
  }

  if (data?.user?.identities?.length === 0) {
    redirect('/signup?error=' + encodeURIComponent('An account with this email already exists'))
  }

  const requiresConfirmation = !data?.session
  if (requiresConfirmation) {
    redirect('/verify?email=' + encodeURIComponent(email))
  }

  redirect('/feed')
}
