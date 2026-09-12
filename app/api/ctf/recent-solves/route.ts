import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { checkNamedRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public JSON endpoint backing the live Recent Solves feed (polled by the client). */
export async function GET(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const limited = checkNamedRateLimit('ctf-recent-solves', ip, {
    windowMs: 60 * 1000,
    maxRequests: 30,
  })
  if (!limited.allowed) {
    return rateLimitResponse(limited.retryAfter ?? 60)
  }

  const service = getServiceClient() as any
  const { data } = await service.rpc('get_recent_global_solves')

  return NextResponse.json(
    { solves: data ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}