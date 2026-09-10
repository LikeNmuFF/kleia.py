import { createClient } from '@/lib/supabase/server'

export const isPracticeId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function practiceCaller(adminOnly = false) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not logged in')
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profileError) throw new Error('Could not verify access')
  const isAdmin = profile?.role === 'admin'
  if (adminOnly && !isAdmin) throw new Error('Only admins can manage Labs')
  return { supabase, user, isAdmin }
}

export async function canAccessPracticeRoom(supabase: Awaited<ReturnType<typeof createClient>>, roomId: string) {
  if (!isPracticeId(roomId)) return false
  const { data, error } = await supabase.rpc('practice_can_access', { p_room_id: roomId })
  if (error) throw new Error('Could not verify lab access')
  return data === true
}

export function practiceError(error: unknown, fallback = 'Could not complete the request. Please try again.') {
  const message = error instanceof Error ? error.message : ''
  return { error: ['Not logged in', 'Only admins can manage Labs', 'Could not verify access', 'Could not verify lab access'].includes(message) ? message : fallback }
}
