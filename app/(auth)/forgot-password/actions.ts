'use server'

import { getSafeErrorMessage } from '@/lib/errorHandler'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildAuthCallbackUrl } from '@/lib/auth/redirect-url'

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    redirect('/forgot-password?error=' + encodeURIComponent('Please enter a valid email'))
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallbackUrl('/reset-password'),
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(getSafeErrorMessage(error, 'Something went wrong.')))
  }

  redirect('/forgot-password?sent=true&email=' + encodeURIComponent(email))
}
