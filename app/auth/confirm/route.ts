import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

const OTP_EXPIRED_ERROR_CODE = 'otp_expired'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/feed'
  const nextPath = nextParam.startsWith('/') && !nextParam.includes('://') ? nextParam : '/feed'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${nextPath}`)
    }

    if (error.code === OTP_EXPIRED_ERROR_CODE) {
      return NextResponse.redirect(`${origin}/login?error=verification_link_expired`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
