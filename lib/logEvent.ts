import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()
    await supabase.from('events_log').insert({
      endpoint,
      status,
      duration_ms: durationMs,
      error_message: errorMessage ?? null,
      user_id: userId ?? null,
    })
  } catch {
    // Logging must never break the request — fire and forget
  }
}
