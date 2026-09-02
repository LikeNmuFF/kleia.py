'use server'

import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

const OTP_EXPIRED_ERROR_CODE = 'otp_expired'

export async function confirmEmail(formData: FormData) {
  const tokenHash = formData.get('token_hash') as string | null
  const type = formData.get('type') as EmailOtpType | null
  const nextParam = formData.get('next') as string | null
  const nextPath = nextParam?.startsWith('/') && !nextParam.includes('://') ? nextParam : '/feed'

  if (!tokenHash || !type) {
    redirect('/login?error=auth_failed')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (!error) {
    redirect(nextPath)
  }

  if (error.code === OTP_EXPIRED_ERROR_CODE) {
    redirect('/login?error=verification_link_expired')
  }

  redirect('/login?error=auth_failed')
}
