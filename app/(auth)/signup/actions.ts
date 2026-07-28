'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !email.includes('@')) {
    redirect('/signup?error=Please enter a valid email')
  }

  if (!password || password.length < 8) {
    redirect('/signup?error=Password must be at least 8 characters')
  }

  if (!username || username.length < 3) {
    redirect('/signup?error=Username must be at least 3 characters')
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    redirect('/signup?error=Username can only contain letters, numbers, hyphens, and underscores')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) {
    redirect('/signup?error=' + error.message)
  }

  if (data?.user?.identities?.length === 0) {
    redirect('/signup?error=An account with this email already exists')
  }

  const requiresConfirmation = !data?.session
  if (requiresConfirmation) {
    redirect('/verify?email=' + encodeURIComponent(email))
  }

  redirect('/feed')
}
