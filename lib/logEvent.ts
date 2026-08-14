import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export function extractClientIp(headersList: Headers): string | null {
  const vercelIp = headersList.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = headersList.get('x-real-ip')
  if (realIp) return realIp.split(',')[0].trim()

  const cfIp = headersList.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  return null
}

export async function logEvent({
  endpoint,
  status,
  durationMs,
  errorMessage,
  userId,
}: {
  endpoint: string
  status: 'success' | 'error'
  durationMs: number
  errorMessage?: string
  userId?: string
}) {
  try {
    const headersList = await headers()
    const clientIp = extractClientIp(headersList)
    const supabase = await createClient()
    await supabase.from('events_log').insert({
      endpoint,
      status,
      duration_ms: durationMs,
      error_message: errorMessage ?? null,
      user_id: userId ?? null,
      client_ip: clientIp,
    })
  } catch {
    // Logging must never break the request — fire and forget
  }
}