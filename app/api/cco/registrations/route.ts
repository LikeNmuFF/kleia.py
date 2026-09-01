import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { normalizeClubRegistrationInput } from '@/lib/clubs/validation'
import { ensureCcoClub } from '@/lib/clubs/cco'

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = checkNamedRateLimit(`cco-registration:${ip}`, ip, {
    windowMs: 60 * 1000,
    maxRequests: 5,
  })

  if (!allowed && retryAfter) {
    return rateLimitResponse(retryAfter)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const input = normalizeClubRegistrationInput({
    fullName: typeof (body as any)?.fullName === 'string' ? (body as any).fullName : '',
    email: typeof (body as any)?.email === 'string' ? (body as any).email : '',
    course: typeof (body as any)?.course === 'string' ? (body as any).course : '',
    yearLevel: typeof (body as any)?.yearLevel === 'string' ? (body as any).yearLevel : '',
    set: typeof (body as any)?.set === 'string' ? (body as any).set : '',
  })

  if ('error' in input) {
    return NextResponse.json({ error: input.error }, { status: 400 })
  }

  const supabase = getServiceClient() as any
  const { club, error: clubError } = await ensureCcoClub(supabase)

  if (clubError || !club) {
    return NextResponse.json({ error: 'Could not prepare CCO sign-up. Please try again.' }, { status: 500 })
  }

  if (!club.is_recruiting) {
    return NextResponse.json({ error: 'CCO sign-up is closed right now.' }, { status: 409 })
  }

  const { error } = await supabase
    .from('club_registrations')
    .insert({
      club_id: club.id,
      ...input,
      student_id: null,
      phone: null,
      reason: null,
      status: 'pending',
      source: 'qr',
    })

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'You have already signed up for CCO.' }, { status: 409 })
  }

  if (error) {
    return NextResponse.json({ error: 'Could not submit your sign-up.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
